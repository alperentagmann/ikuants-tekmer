import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';

/** Personal to-dos with checklists, recurrence, estimates, tags and manual ordering. */
export type ChecklistItem = { title: string; done: boolean };
export interface TodoInput {
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    dueTime?: string | null;
    priority?: string;
    category?: string;
    checklist?: ChecklistItem[];
    recurrence?: string | null;
    estimatedMinutes?: number | null;
    tags?: string[];
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const TODO_CATEGORIES = [
    { value: 'GENERAL', label: 'Genel' },
    { value: 'MEETING', label: 'Toplantı' },
    { value: 'CALL', label: 'Arama' },
    { value: 'FOLLOW_UP', label: 'Takip' },
    { value: 'REVIEW', label: 'Kontrol' },
    { value: 'DOCUMENT', label: 'Doküman / Yazışma' },
    { value: 'EVENT', label: 'Etkinlik' },
    { value: 'FINANCE', label: 'Finans' },
];
const RECURRENCES = ['DAILY', 'WEEKDAYS', 'WEEKLY', 'MONTHLY'];

type Actor = { id: string; name: string; email: string };

function parse(todo: { checklistJson: string | null; tags: string | null }) {
    let checklist: ChecklistItem[] = [];
    try {
        checklist = todo.checklistJson ? JSON.parse(todo.checklistJson) : [];
    } catch {
        checklist = [];
    }
    return { checklist, tagList: (todo.tags || '').split(',').map((t) => t.trim()).filter(Boolean) };
}

function data(input: TodoInput) {
    const out: Record<string, unknown> = {};
    if (input.title !== undefined) {
        const t = input.title.trim();
        if (!t) throw new DomainError('Başlık zorunludur.');
        out.title = t.slice(0, 300);
    }
    if (input.description !== undefined) out.description = input.description?.trim() || null;
    if (input.dueDate !== undefined) out.dueDate = input.dueDate ? new Date(`${input.dueDate}T${input.dueTime && /^\d{2}:\d{2}$/.test(input.dueTime) ? input.dueTime : '18:00'}:00+03:00`) : null;
    if (input.dueTime !== undefined) out.dueTime = input.dueTime && /^\d{2}:\d{2}$/.test(input.dueTime) ? input.dueTime : null;
    if (input.priority !== undefined) out.priority = PRIORITIES.includes(input.priority) ? input.priority : 'MEDIUM';
    if (input.category !== undefined) out.category = TODO_CATEGORIES.some((c) => c.value === input.category) ? input.category : 'GENERAL';
    if (input.checklist !== undefined) out.checklistJson = JSON.stringify((input.checklist || []).filter((c) => c.title?.trim()).slice(0, 50).map((c) => ({ title: c.title.trim().slice(0, 200), done: Boolean(c.done) })));
    if (input.recurrence !== undefined) out.recurrence = input.recurrence && RECURRENCES.includes(input.recurrence) ? input.recurrence : null;
    if (input.estimatedMinutes !== undefined) out.estimatedMinutes = input.estimatedMinutes && input.estimatedMinutes > 0 ? Math.min(24 * 60, Math.round(input.estimatedMinutes)) : null;
    if (input.tags !== undefined) out.tags = (input.tags || []).map((t) => t.trim()).filter(Boolean).slice(0, 10).join(',') || null;
    return out;
}

function nextDue(due: Date, recurrence: string): Date {
    const d = new Date(due);
    if (recurrence === 'DAILY') d.setUTCDate(d.getUTCDate() + 1);
    else if (recurrence === 'WEEKLY') d.setUTCDate(d.getUTCDate() + 7);
    else if (recurrence === 'MONTHLY') d.setUTCMonth(d.getUTCMonth() + 1);
    else if (recurrence === 'WEEKDAYS') {
        do d.setUTCDate(d.getUTCDate() + 1);
        while ([0, 6].includes(new Date(d.getTime() + 3 * 3600000).getUTCDay()));
    }
    return d;
}

export const TodoService = {
    async list(userId: string, opts: { includeDone?: boolean } = {}) {
        const rows = await prisma.personalTodo.findMany({
            where: { userId, ...(opts.includeDone ? {} : { OR: [{ isCompleted: false }, { completedAt: { gte: new Date(Date.now() - 14 * 86400000) } }] }) },
            include: { timeEntries: { where: { endedAt: { not: null } }, select: { minutes: true } } },
            orderBy: [{ isCompleted: 'asc' }, { sortOrder: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
            take: 500,
        });
        return rows.map(({ timeEntries, ...t }) => ({ ...t, ...parse(t), minutesLogged: timeEntries.reduce((s, e) => s + e.minutes, 0) }));
    },

    async create(userId: string, input: TodoInput) {
        if (!input.title?.trim()) throw new DomainError('Başlık zorunludur.');
        const max = await prisma.personalTodo.aggregate({ where: { userId, isCompleted: false }, _max: { sortOrder: true } });
        return prisma.personalTodo.create({ data: { userId, title: input.title.trim(), sortOrder: (max._max.sortOrder || 0) + 1, ...data(input) } as never });
    },

    async update(id: string, userId: string, input: TodoInput) {
        const existing = await prisma.personalTodo.findFirst({ where: { id, userId } });
        if (!existing) throw new DomainError('Yapılacak bulunamadı.', 404);
        return prisma.personalTodo.update({ where: { id }, data: data(input) as never });
    },

    /** Completing a recurring to-do creates its next occurrence. */
    async toggle(id: string, userId: string) {
        const existing = await prisma.personalTodo.findFirst({ where: { id, userId } });
        if (!existing) throw new DomainError('Yapılacak bulunamadı.', 404);
        const isCompleted = !existing.isCompleted;
        const updated = await prisma.personalTodo.update({ where: { id }, data: { isCompleted, completedAt: isCompleted ? new Date() : null } });
        let next = null;
        if (isCompleted && existing.recurrence) {
            const base = existing.dueDate || new Date();
            const { checklist } = parse(existing);
            next = await prisma.personalTodo.create({
                data: {
                    userId, title: existing.title, description: existing.description, priority: existing.priority, category: existing.category, dueTime: existing.dueTime,
                    dueDate: nextDue(base, existing.recurrence), recurrence: existing.recurrence, estimatedMinutes: existing.estimatedMinutes, tags: existing.tags,
                    checklistJson: JSON.stringify(checklist.map((c) => ({ ...c, done: false }))), sortOrder: existing.sortOrder,
                },
            });
        }
        return { todo: updated, next };
    },

    async reorder(userId: string, orderedIds: string[]) {
        const owned = await prisma.personalTodo.findMany({ where: { userId, id: { in: orderedIds } }, select: { id: true } });
        const ok = new Set(owned.map((o) => o.id));
        await prisma.$transaction(orderedIds.filter((id) => ok.has(id)).map((id, i) => prisma.personalTodo.update({ where: { id }, data: { sortOrder: i } })));
    },

    async remove(id: string, userId: string) {
        const res = await prisma.personalTodo.deleteMany({ where: { id, userId } });
        if (!res.count) throw new DomainError('Yapılacak bulunamadı.', 404);
    },

    /** Turns a personal to-do into a team task (assigned to the owner), keeping the checklist. */
    async convertToTask(id: string, actor: Actor) {
        const todo = await prisma.personalTodo.findFirst({ where: { id, userId: actor.id } });
        if (!todo) throw new DomainError('Yapılacak bulunamadı.', 404);
        if (todo.convertedTaskId) throw new DomainError('Bu yapılacak zaten göreve dönüştürüldü.', 409);
        const { checklist } = parse(todo);
        const task = await prisma.task.create({
            data: {
                title: todo.title, description: todo.description, priority: todo.priority, dueDate: todo.dueDate, createdById: actor.id,
                estimatedHours: todo.estimatedMinutes ? Math.round((todo.estimatedMinutes / 60) * 100) / 100 : null,
                assignees: { create: { userId: actor.id } },
                checklistItems: { create: checklist.map((c, i) => ({ title: c.title, isCompleted: c.done, sortOrder: i })) },
                activitiesLog: { create: { actorId: actor.id, actorName: actor.name, action: 'CREATED', description: 'Kişisel yapılacaklardan göreve dönüştürüldü' } },
            },
        });
        await prisma.personalTodo.update({ where: { id }, data: { convertedTaskId: task.id } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'Task', entityId: task.id, diff: `Yapılacak göreve dönüştürüldü: ${todo.title}` });
        return task;
    },
};
