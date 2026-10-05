import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { AutomationService } from '@/lib/services/automation-service';
import { DomainError } from '@/lib/errors';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';
import { istanbulDayKey, istanbulDayRange } from '@/lib/time';

/**
 * Office work tracking: passing tasks between admins (handoffs), time tracking on tasks and
 * personal to-dos, and the work report (individual or team, any date range).
 */
type Actor = UserWithPermissions & { id: string; name: string; email: string };

const notify = (userId: string, title: string, message: string, targetUrl: string, type = 'TASK_ASSIGNED') =>
    prisma.notification.create({ data: { userId, title, message, targetUrl, notificationType: type } });

async function activeUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, isActive: true } });
    if (!user || !user.isActive) throw new DomainError('Seçilen kullanıcı aktif değil.');
    return user;
}

function minutesBetween(a: Date, b: Date) {
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

async function refreshActualHours(taskId: string) {
    const agg = await prisma.taskTimeEntry.aggregate({ where: { taskId, endedAt: { not: null } }, _sum: { minutes: true } });
    await prisma.task.update({ where: { id: taskId }, data: { actualHours: Math.round(((agg._sum.minutes || 0) / 60) * 100) / 100 } });
}

export const WorkTrackingService = {
    // ------------------------------------------------------------------ handoffs

    /**
     * Passes a task to another admin. Any admin working on the task (creator, assignee) or with
     * view-all rights can pass it; the super admin can pass any task to any admin.
     */
    async handoff(taskId: string, toUserId: string, note: string | null, actor: Actor) {
        if (!hasPermission(actor, 'edit', 'tasks')) throw new DomainError('Görev düzenleme yetkiniz yok.', 403);
        const task = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true } });
        if (!task || task.isArchived) throw new DomainError('Görev bulunamadı.', 404);
        if (['DONE', 'CANCELLED'].includes(task.status)) throw new DomainError('Tamamlanmış veya iptal edilmiş görev paslanamaz.');
        const isAssignee = task.assignees.some((a) => a.userId === actor.id);
        const canPass = actor.isSuperAdmin || isAssignee || task.createdById === actor.id || hasPermission(actor, 'view_all', 'tasks');
        if (!canPass) throw new DomainError('Yalnızca üzerinde çalıştığınız görevleri paslayabilirsiniz.', 403);
        if (toUserId === actor.id) throw new DomainError('Görevi kendinize paslayamazsınız.');
        const receiver = await activeUser(toUserId);
        const pending = await prisma.taskHandoff.findFirst({ where: { taskId, status: 'PENDING' } });
        if (pending) throw new DomainError('Bu görev için yanıt bekleyen bir pas var.', 409);

        const handoff = await prisma.$transaction(async (tx) => {
            // The passer hands over their own assignment; other assignees stay on the task
            if (isAssignee) await tx.taskAssignee.deleteMany({ where: { taskId, userId: actor.id } });
            await tx.taskAssignee.upsert({ where: { taskId_userId: { taskId, userId: toUserId } }, update: {}, create: { taskId, userId: toUserId } });
            await tx.taskActivity.create({ data: { taskId, actorId: actor.id, actorName: actor.name, action: 'HANDOFF', description: `${receiver.name} kişisine paslandı${note ? `: ${note}` : ''}` } });
            return tx.taskHandoff.create({ data: { taskId, fromUserId: actor.id, toUserId, note: note?.trim() || null } });
        });
        await notify(toUserId, 'Size iş paslandı', `${actor.name}: "${task.title}"${note ? ` — ${note.slice(0, 140)}` : ''}`, `/admin/is-takip?tab=inbox&handoffId=${handoff.id}`);
        await prisma.activityTimeline.create({ data: { entityType: 'Task', entityId: taskId, title: 'Görev paslandı', description: `${actor.name} → ${receiver.name}`, eventType: 'ASSIGNED', actorId: actor.id, actorName: actor.name } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'HANDOFF', entityType: 'Task', entityId: taskId, newValues: { from: actor.id, to: toUserId, handoffId: handoff.id } });
        return handoff;
    },

    /** Receiver accepts the task, or returns it to the sender with a note. */
    async respond(handoffId: string, decision: 'accept' | 'return', note: string | null, actor: Actor) {
        const h = await prisma.taskHandoff.findUnique({ where: { id: handoffId }, include: { task: true, fromUser: { select: { name: true } } } });
        if (!h || h.toUserId !== actor.id) throw new DomainError('Pas bulunamadı.', 404);
        if (h.status !== 'PENDING') throw new DomainError('Bu pas zaten yanıtlandı.', 409);
        if (decision === 'return' && !note?.trim()) throw new DomainError('Geri paslarken nedenini yazın.');

        await prisma.$transaction(async (tx) => {
            await tx.taskHandoff.update({ where: { id: handoffId }, data: { status: decision === 'accept' ? 'ACCEPTED' : 'RETURNED', responseNote: note?.trim() || null, respondedAt: new Date() } });
            if (decision === 'return') {
                await tx.taskAssignee.deleteMany({ where: { taskId: h.taskId, userId: actor.id } });
                await tx.taskAssignee.upsert({ where: { taskId_userId: { taskId: h.taskId, userId: h.fromUserId } }, update: {}, create: { taskId: h.taskId, userId: h.fromUserId } });
            }
            await tx.taskActivity.create({ data: { taskId: h.taskId, actorId: actor.id, actorName: actor.name, action: decision === 'accept' ? 'HANDOFF_ACCEPTED' : 'HANDOFF_RETURNED', description: decision === 'accept' ? 'Paslanan görev kabul edildi' : `Görev geri paslandı: ${note}` } });
        });
        await notify(h.fromUserId, decision === 'accept' ? 'Pasınız kabul edildi' : 'Görev size geri paslandı', `${actor.name}: "${h.task.title}"${note ? ` — ${note.slice(0, 140)}` : ''}`, `/admin/gorevler?taskId=${h.taskId}`);
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: decision === 'accept' ? 'HANDOFF_ACCEPT' : 'HANDOFF_RETURN', entityType: 'Task', entityId: h.taskId, newValues: { handoffId, note } });
        if (decision === 'return') await AutomationService.run('TASK_HANDOFF_RETURNED', h.taskId, { actorId: actor.id });
    },

    async listHandoffs(actor: Actor, box: 'inbox' | 'outbox' | 'task', taskId?: string) {
        const where = box === 'inbox' ? { toUserId: actor.id } : box === 'outbox' ? { fromUserId: actor.id } : { taskId };
        return prisma.taskHandoff.findMany({
            where,
            include: { task: { select: { id: true, title: true, status: true, priority: true, dueDate: true } }, fromUser: { select: { id: true, name: true } }, toUser: { select: { id: true, name: true } } },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
            take: 200,
        });
    },

    /** Admins a task can be passed to (everyone active except the actor). */
    async passTargets(actor: Actor, includeSelf = false) {
        const users = await prisma.user.findMany({
            where: { isActive: true, ...(includeSelf ? {} : { id: { not: actor.id } }) },
            select: { id: true, name: true, email: true, title: true, department: true, avatarUrl: true, isSuperAdmin: true, userRoles: { select: { role: { select: { name: true, slug: true } } } } },
            orderBy: { name: 'asc' },
        });
        return users.map((u) => ({ id: u.id, name: u.name, email: u.email, title: u.title, department: u.department, avatarUrl: u.avatarUrl, roles: u.userRoles.map((r) => r.role.name), isSuperAdmin: u.isSuperAdmin }));
    },

    // ------------------------------------------------------------------ time tracking

    async runningTimer(userId: string) {
        return prisma.taskTimeEntry.findFirst({ where: { userId, endedAt: null }, include: { task: { select: { id: true, title: true } }, todo: { select: { id: true, title: true } } } });
    },

    /** Starts a timer; a timer already running for the user is stopped first. */
    async startTimer(target: { taskId?: string | null; todoId?: string | null }, actor: Actor) {
        if (!target.taskId && !target.todoId) throw new DomainError('Görev veya yapılacak seçin.');
        if (target.taskId) {
            const task = await prisma.task.findUnique({ where: { id: target.taskId }, include: { assignees: true } });
            if (!task) throw new DomainError('Görev bulunamadı.', 404);
            const allowed = actor.isSuperAdmin || task.createdById === actor.id || task.assignees.some((a) => a.userId === actor.id) || hasPermission(actor, 'view_all', 'tasks');
            if (!allowed) throw new DomainError('Bu görev için süre tutamazsınız.', 403);
        }
        if (target.todoId) {
            const todo = await prisma.personalTodo.findUnique({ where: { id: target.todoId } });
            if (!todo || todo.userId !== actor.id) throw new DomainError('Yapılacak bulunamadı.', 404);
        }
        await this.stopTimer(actor);
        return prisma.taskTimeEntry.create({ data: { userId: actor.id, taskId: target.taskId || null, todoId: target.todoId || null, startedAt: new Date(), source: 'TIMER' } });
    },

    async stopTimer(actor: Actor, note?: string | null) {
        const running = await prisma.taskTimeEntry.findFirst({ where: { userId: actor.id, endedAt: null } });
        if (!running) return null;
        const endedAt = new Date();
        const entry = await prisma.taskTimeEntry.update({ where: { id: running.id }, data: { endedAt, minutes: minutesBetween(running.startedAt, endedAt), note: note?.trim() || running.note } });
        if (entry.taskId) await refreshActualHours(entry.taskId);
        return entry;
    },

    async addManualEntry(input: { taskId?: string | null; todoId?: string | null; date: string; minutes: number; note?: string | null }, actor: Actor) {
        const minutes = Math.round(Number(input.minutes));
        if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 24 * 60) throw new DomainError('Süre 1 dakika ile 24 saat arasında olmalı.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new DomainError('Geçerli bir tarih seçin.');
        if (!input.taskId && !input.todoId) throw new DomainError('Görev veya yapılacak seçin.');
        const startedAt = new Date(`${input.date}T09:00:00+03:00`);
        const entry = await prisma.taskTimeEntry.create({ data: { userId: actor.id, taskId: input.taskId || null, todoId: input.todoId || null, startedAt, endedAt: new Date(startedAt.getTime() + minutes * 60000), minutes, note: input.note?.trim() || null, source: 'MANUAL' } });
        if (entry.taskId) await refreshActualHours(entry.taskId);
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'TaskTimeEntry', entityId: entry.id, newValues: { minutes, taskId: entry.taskId, todoId: entry.todoId } });
        return entry;
    },

    async deleteEntry(id: string, actor: Actor) {
        const entry = await prisma.taskTimeEntry.findUnique({ where: { id } });
        if (!entry || (entry.userId !== actor.id && !actor.isSuperAdmin)) throw new DomainError('Kayıt bulunamadı.', 404);
        await prisma.taskTimeEntry.delete({ where: { id } });
        if (entry.taskId) await refreshActualHours(entry.taskId);
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'DELETE', entityType: 'TaskTimeEntry', entityId: id, oldValues: { minutes: entry.minutes } });
    },

    async listEntries(userId: string, from: Date, to: Date) {
        return prisma.taskTimeEntry.findMany({
            where: { userId, startedAt: { gte: from, lt: to } },
            include: { task: { select: { id: true, title: true } }, todo: { select: { id: true, title: true } } },
            orderBy: { startedAt: 'desc' },
        });
    },

    // ------------------------------------------------------------------ report

    /**
     * Work report for a date range. Users without task:view_all only get their own figures.
     * Every number is computed from records; nothing is estimated.
     */
    async workReport(params: { from: string; to: string; userIds?: string[] }, actor: Actor) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(params.from) || !/^\d{4}-\d{2}-\d{2}$/.test(params.to) || params.from > params.to) throw new DomainError('Geçerli bir tarih aralığı seçin.');
        const start = istanbulDayRange(params.from).start;
        const end = istanbulDayRange(params.to).end;
        if (end.getTime() - start.getTime() > 400 * 86400000) throw new DomainError('En fazla 400 günlük rapor alınabilir.');
        const canTeam = actor.isSuperAdmin || hasPermission(actor, 'view_all', 'tasks');
        const userIds = canTeam ? (params.userIds?.length ? params.userIds : (await prisma.user.findMany({ where: { isActive: true }, select: { id: true } })).map((u) => u.id)) : [actor.id];
        const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, title: true, department: true } });
        const range = { gte: start, lt: end };

        const [assignedTasks, completedTasks, timeEntries, handoffs, todosDone, comments] = await Promise.all([
            prisma.task.findMany({ where: { isArchived: false, assignees: { some: { userId: { in: userIds } } }, OR: [{ createdAt: range }, { completedAt: range }, { status: { notIn: ['DONE', 'CANCELLED'] } }] }, select: { id: true, title: true, status: true, priority: true, dueDate: true, createdAt: true, completedAt: true, assignees: { select: { userId: true } } } }),
            prisma.task.findMany({ where: { isArchived: false, status: 'DONE', completedAt: range, assignees: { some: { userId: { in: userIds } } } }, select: { id: true, title: true, priority: true, dueDate: true, createdAt: true, completedAt: true, assignees: { select: { userId: true } } } }),
            prisma.taskTimeEntry.findMany({ where: { userId: { in: userIds }, startedAt: range, endedAt: { not: null } }, select: { userId: true, minutes: true, startedAt: true, taskId: true } }),
            prisma.taskHandoff.findMany({ where: { createdAt: range, OR: [{ fromUserId: { in: userIds } }, { toUserId: { in: userIds } }] }, select: { fromUserId: true, toUserId: true, status: true } }),
            prisma.personalTodo.findMany({ where: { userId: { in: userIds }, isCompleted: true, completedAt: range }, select: { userId: true } }),
            prisma.taskComment.findMany({ where: { authorId: { in: userIds }, createdAt: range }, select: { authorId: true } }),
        ]);

        const now = new Date();
        const perUser = users.map((u) => {
            const mine = (t: { assignees: { userId: string }[] }) => t.assignees.some((a) => a.userId === u.id);
            const done = completedTasks.filter(mine);
            const onTime = done.filter((t) => !t.dueDate || (t.completedAt && t.completedAt <= new Date(t.dueDate.getTime() + 86400000)));
            const open = assignedTasks.filter((t) => mine(t) && !['DONE', 'CANCELLED'].includes(t.status));
            const overdue = open.filter((t) => t.dueDate && t.dueDate < now);
            const cycle = done.filter((t) => t.completedAt).map((t) => (t.completedAt!.getTime() - t.createdAt.getTime()) / 3600000);
            const minutes = timeEntries.filter((e) => e.userId === u.id).reduce((s, e) => s + e.minutes, 0);
            return {
                userId: u.id,
                name: u.name,
                title: u.title,
                department: u.department,
                completed: done.length,
                completedOnTime: onTime.length,
                onTimeRate: done.length ? Math.round((onTime.length / done.length) * 100) : null,
                open: open.length,
                overdue: overdue.length,
                inReview: open.filter((t) => t.status === 'IN_REVIEW').length,
                avgCycleHours: cycle.length ? Math.round((cycle.reduce((a, b) => a + b, 0) / cycle.length) * 10) / 10 : null,
                hoursLogged: Math.round((minutes / 60) * 10) / 10,
                handoffsGiven: handoffs.filter((h) => h.fromUserId === u.id).length,
                handoffsReceived: handoffs.filter((h) => h.toUserId === u.id).length,
                handoffsReturned: handoffs.filter((h) => h.toUserId === u.id && h.status === 'RETURNED').length,
                todosCompleted: todosDone.filter((t) => t.userId === u.id).length,
                comments: comments.filter((c) => c.authorId === u.id).length,
            };
        });

        // Daily series (Istanbul days) of completed tasks and logged hours
        const days: { day: string; completed: number; hours: number }[] = [];
        for (let t = start.getTime(); t < end.getTime() && days.length < 400; t += 86400000) {
            const key = istanbulDayKey(new Date(t + 3600000));
            days.push({ day: key, completed: 0, hours: 0 });
        }
        const byDay = new Map(days.map((d) => [d.day, d]));
        for (const t of completedTasks) {
            const d = t.completedAt && byDay.get(istanbulDayKey(t.completedAt));
            if (d) d.completed++;
        }
        for (const e of timeEntries) {
            const d = byDay.get(istanbulDayKey(e.startedAt));
            if (d) d.hours = Math.round((d.hours + e.minutes / 60) * 10) / 10;
        }

        const totals = perUser.reduce(
            (acc, u) => ({ completed: acc.completed + u.completed, onTime: acc.onTime + u.completedOnTime, open: acc.open + u.open, overdue: acc.overdue + u.overdue, hours: Math.round((acc.hours + u.hoursLogged) * 10) / 10, handoffs: acc.handoffs + u.handoffsGiven, todos: acc.todos + u.todosCompleted }),
            { completed: 0, onTime: 0, open: 0, overdue: 0, hours: 0, handoffs: 0, todos: 0 }
        );

        return {
            range: { from: params.from, to: params.to },
            scope: canTeam ? 'team' : 'self',
            totals: { ...totals, onTimeRate: totals.completed ? Math.round((totals.onTime / totals.completed) * 100) : null },
            perUser: perUser.sort((a, b) => b.completed - a.completed || b.hoursLogged - a.hoursLogged),
            days,
            completedTasks: completedTasks
                .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
                .slice(0, 200)
                .map((t) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate, completedAt: t.completedAt, onTime: !t.dueDate || (t.completedAt ? t.completedAt <= new Date(t.dueDate.getTime() + 86400000) : false), assignees: users.filter((u) => t.assignees.some((a) => a.userId === u.id)).map((u) => u.name) })),
            overdueTasks: assignedTasks
                .filter((t) => !['DONE', 'CANCELLED'].includes(t.status) && t.dueDate && t.dueDate < now)
                .map((t) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate, status: t.status, assignees: users.filter((u) => t.assignees.some((a) => a.userId === u.id)).map((u) => u.name) })),
            generatedAt: new Date().toISOString(),
            generatedBy: actor.name,
        };
    },
};
