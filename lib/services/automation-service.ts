import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';

type Actor = UserWithPermissions & { id: string; name: string; email: string };

/**
 * No-code automation rules for tasks ("when … then …"). Rules run inside the task workflow;
 * actions never trigger further rules, so loops are impossible. Every run is logged.
 */
export const AUTOMATION_TRIGGERS = {
    TASK_CREATED: 'Görev oluşturulduğunda',
    TASK_STATUS_CHANGED: 'Görev durumu değiştiğinde',
    TASK_COMPLETED: 'Görev tamamlandığında',
    TASK_OVERDUE: 'Görev gecikmeye düştüğünde',
    TASK_HANDOFF_RETURNED: 'Paslanan görev geri gönderildiğinde',
} as const;
export type AutomationTrigger = keyof typeof AUTOMATION_TRIGGERS;

export const AUTOMATION_ACTIONS = {
    NOTIFY_USER: 'Kişiye bildirim gönder',
    NOTIFY_TEAM_LEAD: 'Ekip liderine bildirim gönder',
    NOTIFY_WATCHERS: 'İzleyicilere bildirim gönder',
    NOTIFY_CREATOR: 'Görevi oluşturana bildirim gönder',
    ADD_WATCHER: 'İzleyici ekle',
    ASSIGN_USER: 'Kişiyi atananlara ekle',
    SET_PRIORITY: 'Önceliği değiştir',
    CREATE_FOLLOW_UP: 'Takip görevi oluştur',
} as const;
export type AutomationActionType = keyof typeof AUTOMATION_ACTIONS;

export interface AutomationConditions {
    teamId?: string | null;
    priority?: string | null;
    toStatus?: string | null;
}
export interface AutomationAction {
    type: AutomationActionType;
    userId?: string | null;
    priority?: string | null;
    title?: string | null;
    dueInDays?: number | null;
    message?: string | null;
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];

export function sanitizeConditions(input: unknown): AutomationConditions {
    const r = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    return {
        teamId: typeof r.teamId === 'string' && r.teamId ? r.teamId : null,
        priority: PRIORITIES.includes(String(r.priority)) ? String(r.priority) : null,
        toStatus: STATUSES.includes(String(r.toStatus)) ? String(r.toStatus) : null,
    };
}

export function sanitizeActions(input: unknown): AutomationAction[] {
    return (Array.isArray(input) ? input : [])
        .slice(0, 10)
        .map((a) => (a && typeof a === 'object' ? (a as Record<string, unknown>) : {}))
        .filter((a) => typeof a.type === 'string' && a.type in AUTOMATION_ACTIONS)
        .map((a) => ({
            type: a.type as AutomationActionType,
            userId: typeof a.userId === 'string' && a.userId ? a.userId : null,
            priority: PRIORITIES.includes(String(a.priority)) ? String(a.priority) : null,
            title: typeof a.title === 'string' && a.title.trim() ? a.title.trim().slice(0, 160) : null,
            dueInDays: Number.isFinite(Number(a.dueInDays)) ? Math.min(365, Math.max(0, Math.round(Number(a.dueInDays)))) : null,
            message: typeof a.message === 'string' && a.message.trim() ? a.message.trim().slice(0, 300) : null,
        }))
        .filter((a) => !['NOTIFY_USER', 'ADD_WATCHER', 'ASSIGN_USER'].includes(a.type) || a.userId)
        .filter((a) => a.type !== 'SET_PRIORITY' || a.priority);
}

function assertManage(actor: Actor) {
    if (!actor.isSuperAdmin && !hasPermission(actor, 'manage', 'automations')) throw new DomainError('Otomasyon yönetimi için automations:manage izni gerekir.', 403);
}

function parse<T>(raw: string | null | undefined, fallback: T): T {
    try {
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

export const AutomationService = {
    async list() {
        const rules = await prisma.automationRule.findMany({ orderBy: { createdAt: 'desc' }, include: { executionLogs: { orderBy: { executedAt: 'desc' }, take: 5 } } });
        return rules
            .filter((r) => r.triggerType in AUTOMATION_TRIGGERS)
            .map((r) => ({
                id: r.id, name: r.name, description: r.description, isActive: r.isActive, trigger: r.triggerType as AutomationTrigger,
                conditions: sanitizeConditions(parse(r.conditions, {})), actions: sanitizeActions(parse(r.actions, [])),
                executionCount: r.executionCount, lastExecutedAt: r.lastExecutedAt,
                recentLogs: r.executionLogs.map((l) => ({ id: l.id, status: l.status, executedAt: l.executedAt, result: l.actionResult, error: l.error })),
            }));
    },

    async save(input: { id?: string; name?: string; description?: string | null; isActive?: boolean; trigger?: string; conditions?: unknown; actions?: unknown }, actor: Actor) {
        assertManage(actor);
        const name = (input.name || '').trim();
        if (name.length < 2) throw new DomainError('Kural adı zorunludur.');
        if (!input.trigger || !(input.trigger in AUTOMATION_TRIGGERS)) throw new DomainError('Geçerli bir tetikleyici seçin.');
        const actions = sanitizeActions(input.actions);
        if (!actions.length) throw new DomainError('En az bir eylem ekleyin.');
        const data = { name, description: input.description?.trim() || null, isActive: input.isActive !== false, triggerType: input.trigger, conditions: JSON.stringify(sanitizeConditions(input.conditions)), actions: JSON.stringify(actions) };
        const rule = input.id ? await prisma.automationRule.update({ where: { id: input.id }, data }) : await prisma.automationRule.create({ data });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: input.id ? 'UPDATE' : 'CREATE', entityType: 'AutomationRule', entityId: rule.id, newValues: data });
        return rule;
    },

    async remove(id: string, actor: Actor) {
        assertManage(actor);
        const rule = await prisma.automationRule.delete({ where: { id } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'DELETE', entityType: 'AutomationRule', entityId: id, oldValues: { name: rule.name } });
    },

    /** Runs matching rules for a task event. Failures are logged and never break the caller. */
    async run(trigger: AutomationTrigger, taskId: string, ctx: { toStatus?: string; actorId?: string } = {}) {
        try {
            const rules = await prisma.automationRule.findMany({ where: { triggerType: trigger, isActive: true } });
            if (!rules.length) return;
            const task = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true, watchers: true } });
            if (!task) return;
            for (const rule of rules) {
                const cond = sanitizeConditions(parse(rule.conditions, {}));
                if (cond.teamId && cond.teamId !== task.teamId) continue;
                if (cond.priority && cond.priority !== task.priority) continue;
                if (cond.toStatus && cond.toStatus !== (ctx.toStatus || task.status)) continue;
                const results: string[] = [];
                let error: string | null = null;
                try {
                    for (const action of sanitizeActions(parse(rule.actions, []))) results.push(await AutomationService.apply(action, task, rule.name));
                } catch (e) {
                    error = e instanceof Error ? e.message : String(e);
                }
                await prisma.automationLog.create({ data: { ruleId: rule.id, triggerEvent: trigger, status: error ? 'FAILED' : 'SUCCESS', payloadJson: JSON.stringify({ taskId, ...ctx }), actionResult: results.join(' · ').slice(0, 1000), error } });
                await prisma.automationRule.update({ where: { id: rule.id }, data: { executionCount: { increment: 1 }, lastExecutedAt: new Date() } });
            }
        } catch (e) {
            console.error('Automation run failed', e);
        }
    },

    async apply(action: AutomationAction, task: { id: string; title: string; teamId: string | null; createdById: string; assignees: { userId: string }[]; watchers: { userId: string }[] }, ruleName: string): Promise<string> {
        const notify = (userId: string) =>
            prisma.notification.create({ data: { userId, title: `Otomasyon: ${ruleName}`, message: action.message || `"${task.title}"`, notificationType: 'TASK_ASSIGNED', targetUrl: `/admin/gorevler?taskId=${task.id}` } });
        switch (action.type) {
            case 'NOTIFY_USER':
                await notify(action.userId as string);
                return 'kişiye bildirildi';
            case 'NOTIFY_CREATOR':
                await notify(task.createdById);
                return 'oluşturana bildirildi';
            case 'NOTIFY_WATCHERS':
                for (const w of task.watchers) await notify(w.userId);
                return `${task.watchers.length} izleyiciye bildirildi`;
            case 'NOTIFY_TEAM_LEAD': {
                if (!task.teamId) return 'ekip yok';
                const team = await prisma.workTeam.findUnique({ where: { id: task.teamId }, select: { leadUserId: true, members: { where: { role: 'LEAD' }, select: { userId: true } } } });
                const leads = new Set([...(team?.leadUserId ? [team.leadUserId] : []), ...(team?.members.map((m) => m.userId) || [])]);
                for (const id of leads) await notify(id);
                return `${leads.size} ekip liderine bildirildi`;
            }
            case 'ADD_WATCHER':
                await prisma.taskWatcher.upsert({ where: { taskId_userId: { taskId: task.id, userId: action.userId as string } }, update: {}, create: { taskId: task.id, userId: action.userId as string } });
                return 'izleyici eklendi';
            case 'ASSIGN_USER':
                if (!task.assignees.some((a) => a.userId === action.userId)) {
                    await prisma.taskAssignee.create({ data: { taskId: task.id, userId: action.userId as string } });
                    await notify(action.userId as string);
                }
                return 'atandı';
            case 'SET_PRIORITY':
                await prisma.task.update({ where: { id: task.id }, data: { priority: action.priority as string } });
                return `öncelik ${action.priority}`;
            case 'CREATE_FOLLOW_UP': {
                const due = action.dueInDays !== null && action.dueInDays !== undefined ? new Date(Date.now() + action.dueInDays * 86400000) : null;
                const assignee = action.userId || task.assignees[0]?.userId || task.createdById;
                const follow = await prisma.task.create({
                    data: {
                        title: action.title || `Takip: ${task.title}`.slice(0, 200),
                        createdById: task.createdById,
                        teamId: task.teamId,
                        dueDate: due,
                        priority: 'MEDIUM',
                        assignees: { create: { userId: assignee } },
                        activitiesLog: { create: { actorId: task.createdById, actorName: 'Otomasyon', action: 'CREATED', description: `"${ruleName}" kuralı takip görevi oluşturdu.` } },
                    },
                });
                await prisma.notification.create({ data: { userId: assignee, title: 'Yeni takip görevi', message: follow.title, notificationType: 'TASK_ASSIGNED', targetUrl: `/admin/gorevler?taskId=${follow.id}` } });
                return 'takip görevi oluşturuldu';
            }
        }
    },
};
