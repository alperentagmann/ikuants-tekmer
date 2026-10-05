import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';
import { DomainError } from '@/lib/errors';
import { AutomationService } from '@/lib/services/automation-service';
import { TaskFollowups } from '@/lib/services/task-followups';
import { IntegrationService } from '@/lib/services/integration-service';

/**
 * Task lifecycle: TODO → IN_PROGRESS → IN_REVIEW → DONE (+ CANCELLED).
 * Buttons, Kanban drag & drop and AI actions all go through transition().
 */
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type TaskAction = 'start' | 'pause' | 'submitForReview' | 'approve' | 'returnForRevision' | 'complete' | 'reopen' | 'cancel';

const STATUS_ALIASES: Record<string, TaskStatus> = { REVIEW: 'IN_REVIEW', COMPLETED: 'DONE', OPEN: 'TODO' };

export function normalizeTaskStatus(status: string): TaskStatus {
    const upper = String(status || '').toUpperCase();
    const normalized = STATUS_ALIASES[upper] || upper;
    if (!(TASK_STATUSES as readonly string[]).includes(normalized)) throw new DomainError(`Geçersiz görev durumu: ${status}`);
    return normalized as TaskStatus;
}

const ACTION_RULES: Record<TaskAction, { from: TaskStatus[]; to: TaskStatus; label: string; activity: string }> = {
    start: { from: ['TODO'], to: 'IN_PROGRESS', label: 'Başlatıldı', activity: 'STARTED' },
    pause: { from: ['IN_PROGRESS'], to: 'TODO', label: 'Beklemeye alındı', activity: 'PAUSED' },
    submitForReview: { from: ['TODO', 'IN_PROGRESS'], to: 'IN_REVIEW', label: 'Kontrole gönderildi', activity: 'REVIEW_REQUESTED' },
    approve: { from: ['IN_REVIEW'], to: 'DONE', label: 'Onaylandı ve tamamlandı', activity: 'APPROVED' },
    returnForRevision: { from: ['IN_REVIEW'], to: 'IN_PROGRESS', label: 'Düzeltmeye gönderildi', activity: 'RETURNED' },
    complete: { from: ['TODO', 'IN_PROGRESS'], to: 'DONE', label: 'Tamamlandı', activity: 'COMPLETED' },
    reopen: { from: ['DONE', 'CANCELLED'], to: 'TODO', label: 'Yeniden açıldı', activity: 'REOPENED' },
    cancel: { from: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'], to: 'CANCELLED', label: 'İptal edildi', activity: 'CANCELLED' },
};

/** Maps a target status (e.g. from Kanban drag & drop) to the lifecycle action. */
export function actionForTransition(from: TaskStatus, to: TaskStatus): TaskAction {
    if (from === to) throw new DomainError('Görev zaten bu durumda.');
    if (to === 'IN_PROGRESS') return from === 'IN_REVIEW' ? 'returnForRevision' : from === 'TODO' ? 'start' : 'reopen';
    if (to === 'IN_REVIEW') return 'submitForReview';
    if (to === 'DONE') return from === 'IN_REVIEW' ? 'approve' : 'complete';
    if (to === 'TODO') return from === 'IN_PROGRESS' ? 'pause' : from === 'IN_REVIEW' ? 'returnForRevision' : 'reopen';
    if (to === 'CANCELLED') return 'cancel';
    throw new DomainError('Bu durum geçişi desteklenmiyor.');
}

type Actor = UserWithPermissions & { id: string; name: string; email: string };

async function loadTask(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true } });
    if (!task || task.isArchived) throw new DomainError('Görev bulunamadı.', 404);
    return task;
}

function relation(task: { createdById: string; assignees: { userId: string }[] }, actor: Actor) {
    return {
        isCreator: task.createdById === actor.id,
        isAssignee: task.assignees.some((a) => a.userId === actor.id),
        canApprove: hasPermission(actor, 'approve', 'tasks'),
        canViewAll: hasPermission(actor, 'view_all', 'tasks'),
        canEdit: hasPermission(actor, 'edit', 'tasks'),
    };
}

export const TaskWorkflowService = {
    /** Visibility scope: users without task:view_all only see tasks they created or are assigned to. */
    scopeWhere(actor: Actor): Record<string, unknown> {
        if (actor.isSuperAdmin || hasPermission(actor, 'view_all', 'tasks')) return {};
        return { OR: [{ createdById: actor.id }, { assignees: { some: { userId: actor.id } } }] };
    },

    canSee(task: { createdById: string; assignees: { userId: string }[] }, actor: Actor): boolean {
        const r = relation(task, actor);
        return actor.isSuperAdmin || r.canViewAll || r.isCreator || r.isAssignee;
    },

    async transition(taskId: string, action: TaskAction, actor: Actor, comment?: string | null) {
        const rule = ACTION_RULES[action];
        if (!rule) throw new DomainError('Bilinmeyen görev işlemi.');
        const task = await loadTask(taskId);
        const from = normalizeTaskStatus(task.status);
        if (!rule.from.includes(from)) {
            throw new DomainError(`"${rule.label}" işlemi "${from}" durumundaki göreve uygulanamaz.`);
        }

        const r = relation(task, actor);
        const isParticipant = r.isCreator || r.isAssignee || r.canViewAll || actor.isSuperAdmin;
        if (!isParticipant || !r.canEdit) throw new DomainError('Bu görev üzerinde işlem yetkiniz yok.', 403);

        // Approval rules: reviewing requires the approver role or being the task owner.
        if (['approve', 'returnForRevision'].includes(action) && !(r.canApprove || r.isCreator || actor.isSuperAdmin)) {
            throw new DomainError('Kontrol bekleyen görevi yalnız görevi oluşturan veya onay yetkisi olan kişi sonuçlandırabilir.', 403);
        }
        if (action === 'returnForRevision' && !comment?.trim()) {
            throw new DomainError('Düzeltmeye gönderirken açıklama yazın.');
        }
        // Direct completion skips review: allowed for the owner, approvers, or self-assigned tasks.
        const selfTask = r.isCreator && task.assignees.every((a) => a.userId === actor.id);
        if (action === 'complete' && !(r.canApprove || selfTask || actor.isSuperAdmin)) {
            throw new DomainError('Bu görev kontrol gerektiriyor. "Kontrole Gönder" adımını kullanın.', 403);
        }
        if (action === 'cancel' && !(r.isCreator || r.canApprove || actor.isSuperAdmin)) {
            throw new DomainError('Görevi yalnız oluşturan kişi veya onay yetkisi olan kullanıcı iptal edebilir.', 403);
        }

        const updated = await prisma.task.update({
            where: { id: taskId },
            data: {
                status: rule.to,
                completedAt: rule.to === 'DONE' ? new Date() : null,
                activitiesLog: {
                    create: {
                        actorId: actor.id,
                        actorName: actor.name,
                        action: rule.activity,
                        description: `${rule.label}${comment ? `: ${comment}` : ''}`,
                    },
                },
            },
        });

        if (comment?.trim()) {
            await prisma.taskComment.create({ data: { taskId, authorId: actor.id, comment: `[${rule.label}] ${comment.trim()}` } });
        }

        // Notify the other side of the review loop
        const notifyIds = new Set<string>();
        if (action === 'submitForReview' && task.createdById !== actor.id) notifyIds.add(task.createdById);
        if (['approve', 'returnForRevision', 'reopen'].includes(action)) task.assignees.forEach((a) => a.userId !== actor.id && notifyIds.add(a.userId));
        for (const userId of notifyIds) {
            await prisma.notification.create({
                data: {
                    userId,
                    title: `Görev: ${rule.label}`,
                    message: `"${task.title}" — ${actor.name}${comment ? `: ${comment.slice(0, 120)}` : ''}`,
                    notificationType: action === 'submitForReview' ? 'APPROVAL_REQUESTED' : 'TASK_ASSIGNED',
                    targetUrl: `/admin/gorevler?taskId=${taskId}`,
                },
            });
        }

        await prisma.activityTimeline.create({
            data: { entityType: 'Task', entityId: taskId, title: rule.label, description: comment || null, eventType: 'STATUS_CHANGE', actorId: actor.id, actorName: actor.name },
        });
        await logAuditEvent({
            actorId: actor.id,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'UPDATE',
            entityType: 'Task',
            entityId: taskId,
            fieldName: 'status',
            oldValues: { status: from },
            newValues: { status: rule.to, action },
        });

        // Work OS follow-ups: watchers, next occurrence of recurring work, automation rules
        await TaskFollowups.notifyWatchers(taskId, `Görev: ${rule.label}`, `"${task.title}" — ${actor.name}`, actor.id);
        if (rule.to === 'DONE') {
            const nextId = await TaskFollowups.spawnNextOccurrence(taskId);
            if (nextId) await AutomationService.run('TASK_CREATED', nextId, { actorId: actor.id });
        }
        await AutomationService.run('TASK_STATUS_CHANGED', taskId, { toStatus: rule.to, actorId: actor.id });
        if (rule.to === 'DONE') {
            await AutomationService.run('TASK_COMPLETED', taskId, { toStatus: rule.to, actorId: actor.id });
            void IntegrationService.dispatch('task.completed', { taskId, title: task.title, teamId: task.teamId });
        }

        return updated;
    },

    /** Kanban / legacy entry point: target status → lifecycle action. */
    async moveToStatus(taskId: string, status: string, actor: Actor, comment?: string | null) {
        const task = await loadTask(taskId);
        const action = actionForTransition(normalizeTaskStatus(task.status), normalizeTaskStatus(status));
        return TaskWorkflowService.transition(taskId, action, actor, comment);
    },

    /** Assigning work to other people requires task:assign; users may always assign themselves. */
    assertCanAssign(actor: Actor, assigneeIds: string[]) {
        const others = assigneeIds.filter((id) => id !== actor.id);
        if (others.length > 0 && !actor.isSuperAdmin && !hasPermission(actor, 'assign', 'tasks')) {
            throw new DomainError('Başkasına görev atama yetkiniz yok (task:assign).', 403);
        }
    },

    async reassign(taskId: string, assigneeIds: string[], actor: Actor) {
        TaskWorkflowService.assertCanAssign(actor, assigneeIds);
        const task = await loadTask(taskId);
        const before = task.assignees.map((a) => a.userId);
        const added = assigneeIds.filter((id) => !before.includes(id));
        const removed = before.filter((id) => !assigneeIds.includes(id));

        await prisma.$transaction(async (tx) => {
            if (removed.length) await tx.taskAssignee.deleteMany({ where: { taskId, userId: { in: removed } } });
            for (const userId of added) await tx.taskAssignee.create({ data: { taskId, userId } });
            await tx.taskActivity.create({
                data: { taskId, actorId: actor.id, actorName: actor.name, action: before.length ? 'REASSIGNED' : 'ASSIGNED', description: `Atananlar güncellendi (+${added.length} / -${removed.length})` },
            });
        });

        for (const userId of added) {
            if (userId === actor.id) continue;
            await prisma.notification.create({
                data: { userId, title: 'Yeni Görev Atandı', message: `Size "${task.title}" görevi atandı.`, notificationType: 'TASK_ASSIGNED', targetUrl: `/admin/gorevler?taskId=${taskId}` },
            });
        }
        await prisma.activityTimeline.create({
            data: { entityType: 'Task', entityId: taskId, title: before.length ? 'Görev yeniden atandı' : 'Görev atandı', eventType: 'ASSIGNED', actorId: actor.id, actorName: actor.name, metadata: JSON.stringify({ added, removed }) },
        });
        await logAuditEvent({
            actorId: actor.id,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'ASSIGN',
            entityType: 'Task',
            entityId: taskId,
            oldValues: { assignees: before },
            newValues: { assignees: assigneeIds },
        });
    },
};
