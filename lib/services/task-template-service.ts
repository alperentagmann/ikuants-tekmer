import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';
import { TaskService } from '@/lib/services/task-service';
import { TaskWorkflowService } from '@/lib/services/task-workflow-service';
import { RECURRENCES } from '@/lib/services/task-followups';

type Actor = UserWithPermissions & { id: string; name: string; email: string };

const list = (raw: string | null): string[] => {
    try {
        const v = raw ? JSON.parse(raw) : [];
        return Array.isArray(v) ? v.map(String).filter((s) => s.trim()) : [];
    } catch {
        return [];
    }
};
const cleanList = (v: unknown): string[] => (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : []).map((s) => String(s).trim()).filter((s) => s.length > 0 && s.length <= 200).slice(0, 30);

/**
 * Reusable task templates ("Aylık kira tahakkuku", "Etkinlik hazırlığı", "Yeni girişimci
 * onboarding"…). Creating a task from a template copies the checklist and sub-tasks.
 */
export const TaskTemplateService = {
    async list() {
        const rows = await prisma.taskTemplate.findMany({ where: { isActive: true }, orderBy: [{ usageCount: 'desc' }, { name: 'asc' }], include: { team: { select: { id: true, name: true, color: true } } } });
        return rows.map((t) => ({ ...t, checklist: list(t.checklistJson), subTasks: list(t.subTasksJson) }));
    },

    async save(input: { id?: string; name?: string; description?: string | null; teamId?: string | null; title?: string; body?: string | null; priority?: string; checklist?: unknown; subTasks?: unknown; estimatedHours?: number | null; dueInDays?: number | null; recurrence?: string | null }, actor: Actor) {
        if (!actor.isSuperAdmin && !hasPermission(actor, 'manage', 'automations') && !hasPermission(actor, 'create', 'tasks')) throw new DomainError('Şablon kaydetme yetkiniz yok.', 403);
        const name = (input.name || '').trim();
        const title = (input.title || '').trim();
        if (name.length < 2 || !title) throw new DomainError('Şablon adı ve görev başlığı zorunludur.');
        const data = {
            name, title,
            description: input.description?.trim() || null,
            teamId: input.teamId || null,
            body: input.body?.trim() || null,
            priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(input.priority)) ? String(input.priority) : 'MEDIUM',
            checklistJson: JSON.stringify(cleanList(input.checklist)),
            subTasksJson: JSON.stringify(cleanList(input.subTasks)),
            estimatedHours: input.estimatedHours && input.estimatedHours > 0 ? Math.min(1000, input.estimatedHours) : null,
            dueInDays: input.dueInDays !== null && input.dueInDays !== undefined && Number.isFinite(Number(input.dueInDays)) ? Math.min(365, Math.max(0, Math.round(Number(input.dueInDays)))) : null,
            recurrence: input.recurrence && input.recurrence in RECURRENCES ? input.recurrence : null,
        };
        const row = input.id ? await prisma.taskTemplate.update({ where: { id: input.id }, data }) : await prisma.taskTemplate.create({ data: { ...data, createdById: actor.id } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: input.id ? 'UPDATE' : 'CREATE', entityType: 'TaskTemplate', entityId: row.id, newValues: { name, title } });
        return row;
    },

    async remove(id: string, actor: Actor) {
        if (!actor.isSuperAdmin && !hasPermission(actor, 'manage', 'automations')) throw new DomainError('Şablon silmek için automations:manage izni gerekir.', 403);
        const row = await prisma.taskTemplate.update({ where: { id }, data: { isActive: false } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'ARCHIVE', entityType: 'TaskTemplate', entityId: id, oldValues: { name: row.name } });
    },

    /** Creates a task (with checklist and sub-tasks) from a template. */
    async instantiate(id: string, input: { assigneeIds?: string[]; dueDate?: string | null; teamId?: string | null; title?: string | null }, actor: Actor) {
        const t = await prisma.taskTemplate.findUnique({ where: { id } });
        if (!t || !t.isActive) throw new DomainError('Şablon bulunamadı.', 404);
        const assigneeIds = input.assigneeIds?.length ? input.assigneeIds : [actor.id];
        TaskWorkflowService.assertCanAssign(actor, assigneeIds);
        const due = input.dueDate ? new Date(input.dueDate) : t.dueInDays !== null ? new Date(Date.now() + t.dueInDays * 86400000) : null;
        const task = await TaskService.createTask({
            title: input.title?.trim() || t.title,
            description: t.body || undefined,
            priority: t.priority,
            dueDate: due || undefined,
            estimatedHours: t.estimatedHours || undefined,
            checklistItems: list(t.checklistJson),
            assigneeIds,
            createdById: actor.id,
            actorName: actor.name,
            teamId: input.teamId || t.teamId || undefined,
            recurrence: t.recurrence,
        });
        for (const sub of list(t.subTasksJson)) {
            await TaskService.createTask({ title: sub, createdById: actor.id, actorName: actor.name, assigneeIds, parentTaskId: task.id, teamId: task.teamId || undefined, priority: t.priority, dueDate: due || undefined });
        }
        await prisma.taskTemplate.update({ where: { id }, data: { usageCount: { increment: 1 } } });
        return task;
    },
};
