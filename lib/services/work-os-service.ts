import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { type UserWithPermissions } from '@/lib/rbac';
import { TaskWorkflowService } from '@/lib/services/task-workflow-service';
import { TaskService } from '@/lib/services/task-service';
import { RECURRENCES, TaskFollowups } from '@/lib/services/task-followups';

export { RECURRENCES, nextOccurrence } from '@/lib/services/task-followups';

type Actor = UserWithPermissions & { id: string; name: string; email: string };

async function visibleTask(taskId: string, actor: Actor) {
    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true, watchers: true, checklistItems: true } });
    if (!task || task.isArchived || !TaskWorkflowService.canSee(task, actor)) throw new DomainError('Görev bulunamadı.', 404);
    return task;
}

/**
 * Work OS helpers on top of tasks: sub-tasks, watchers, team / recurrence settings and the
 * follow-up actions run after a status change.
 */
export const WorkOsService = {
    async addSubtask(parentId: string, input: { title: string; assigneeIds?: string[]; dueDate?: string | null }, actor: Actor) {
        const parent = await visibleTask(parentId, actor);
        if (parent.parentTaskId) throw new DomainError('Alt görevin altına yeni alt görev eklenemez.');
        const title = input.title?.trim();
        if (!title) throw new DomainError('Alt görev başlığı zorunludur.');
        const assigneeIds = input.assigneeIds?.length ? input.assigneeIds : parent.assignees.map((a) => a.userId);
        TaskWorkflowService.assertCanAssign(actor, assigneeIds);
        const task = await TaskService.createTask({ title, createdById: actor.id, actorName: actor.name, assigneeIds, dueDate: input.dueDate || undefined, priority: parent.priority, parentTaskId: parent.id, teamId: parent.teamId || undefined });
        return task;
    },

    async setWatch(taskId: string, watch: boolean, actor: Actor, userId?: string) {
        const task = await visibleTask(taskId, actor);
        const target = userId || actor.id;
        if (target !== actor.id) TaskWorkflowService.assertCanAssign(actor, [target]);
        if (watch) await prisma.taskWatcher.upsert({ where: { taskId_userId: { taskId, userId: target } }, update: {}, create: { taskId, userId: target } });
        else await prisma.taskWatcher.deleteMany({ where: { taskId, userId: target } });
        await prisma.taskActivity.create({ data: { taskId, actorId: actor.id, actorName: actor.name, action: watch ? 'WATCH' : 'UNWATCH', description: watch ? 'İzleyici eklendi' : 'İzleyici çıkarıldı' } });
        return { watching: watch, task: task.id };
    },

    async updateSettings(taskId: string, input: { teamId?: string | null; recurrence?: string | null; startDate?: string | null; dueDate?: string | null; priority?: string }, actor: Actor) {
        const task = await visibleTask(taskId, actor);
        const data: Record<string, unknown> = {};
        if (input.teamId !== undefined) {
            if (input.teamId && !(await prisma.workTeam.findFirst({ where: { id: input.teamId, isActive: true } }))) throw new DomainError('Ekip bulunamadı.');
            data.teamId = input.teamId || null;
        }
        if (input.recurrence !== undefined) data.recurrence = input.recurrence && input.recurrence in RECURRENCES ? input.recurrence : null;
        if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null;
        if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
        if (input.priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(input.priority)) data.priority = input.priority;
        if (data.recurrence && !(data.dueDate || task.dueDate)) throw new DomainError('Tekrarlayan görev için termin tarihi girin.');
        const updated = await prisma.task.update({ where: { id: taskId }, data });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'Task', entityId: taskId, oldValues: { teamId: task.teamId, recurrence: task.recurrence, startDate: task.startDate, dueDate: task.dueDate, priority: task.priority }, newValues: data });
        return updated;
    },

    notifyWatchers: TaskFollowups.notifyWatchers,
};
