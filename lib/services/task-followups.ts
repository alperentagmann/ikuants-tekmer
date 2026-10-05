import { prisma } from '@/lib/prisma';
import { DomainError } from '@/lib/errors';

/** Recurrence and watcher helpers used by the task workflow (no imports of other task services). */
export const RECURRENCES: Record<string, string> = {
    DAILY: 'Her gün',
    WEEKDAYS: 'Hafta içi her gün',
    WEEKLY: 'Her hafta',
    MONTHLY: 'Her ay',
    QUARTERLY: 'Her 3 ayda bir',
    YEARLY: 'Her yıl',
};

/** Next due date of a recurring task (keeps the time of day). */
export function nextOccurrence(from: Date, recurrence: string): Date {
    const d = new Date(from);
    switch (recurrence) {
        case 'DAILY':
            d.setDate(d.getDate() + 1);
            break;
        case 'WEEKDAYS':
            do d.setDate(d.getDate() + 1);
            while (d.getDay() === 0 || d.getDay() === 6);
            break;
        case 'WEEKLY':
            d.setDate(d.getDate() + 7);
            break;
        case 'MONTHLY':
            d.setMonth(d.getMonth() + 1);
            break;
        case 'QUARTERLY':
            d.setMonth(d.getMonth() + 3);
            break;
        case 'YEARLY':
            d.setFullYear(d.getFullYear() + 1);
            break;
        default:
            throw new DomainError('Geçersiz tekrar sıklığı.');
    }
    return d;
}

export const TaskFollowups = {
    /** Notifies watchers (except the actor) about something that happened on a task. */
    async notifyWatchers(taskId: string, title: string, message: string, exceptUserId?: string) {
        const watchers = await prisma.taskWatcher.findMany({ where: { taskId }, select: { userId: true } });
        for (const w of watchers) {
            if (w.userId === exceptUserId) continue;
            await prisma.notification.create({ data: { userId: w.userId, title, message, notificationType: 'TASK_ASSIGNED', targetUrl: `/admin/gorevler?taskId=${taskId}` } });
        }
    },

    /**
     * Completing a recurring task creates its next occurrence with the same team, assignees,
     * watchers and a fresh checklist. Recurrence moves to the new task, so reopening and
     * completing the old one again never creates duplicates.
     */
    async spawnNextOccurrence(taskId: string): Promise<string | null> {
        const task = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true, watchers: true, checklistItems: { orderBy: { sortOrder: 'asc' } } } });
        if (!task || !task.recurrence || !task.dueDate) return null;
        const due = nextOccurrence(task.dueDate, task.recurrence);
        const start = task.startDate ? new Date(due.getTime() - (task.dueDate.getTime() - task.startDate.getTime())) : null;
        const next = await prisma.$transaction(async (tx) => {
            await tx.task.update({ where: { id: task.id }, data: { recurrence: null } });
            return tx.task.create({
                data: {
                    title: task.title, description: task.description, priority: task.priority, createdById: task.createdById,
                    startDate: start, dueDate: due, estimatedHours: task.estimatedHours, tags: task.tags, teamId: task.teamId, recurrence: task.recurrence,
                    projectId: task.projectId, programId: task.programId, organizationId: task.organizationId, entrepreneurId: task.entrepreneurId,
                    assignees: { create: task.assignees.map((a) => ({ userId: a.userId })) },
                    watchers: { create: task.watchers.map((w) => ({ userId: w.userId })) },
                    checklistItems: { create: task.checklistItems.map((c, i) => ({ title: c.title, sortOrder: i })) },
                    activitiesLog: { create: { actorId: task.createdById, actorName: 'Sistem', action: 'CREATED', description: 'Tekrarlayan görevin yeni dönemi oluşturuldu.' } },
                },
            });
        });
        return next.id;
    },
};
