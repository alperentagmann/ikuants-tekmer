import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/lib/services/task-service';
import { TaskWorkflowService, type TaskAction } from '@/lib/services/task-workflow-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { WorkOsService } from '@/lib/services/work-os-service';

const RELATION_FIELDS = ['applicationId', 'entrepreneurId', 'programId', 'personId', 'organizationId', 'projectId', 'reservationId', 'rentContractId'] as const;

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const sp = req.nextUrl.searchParams;
        const relationField = RELATION_FIELDS.find((f) => sp.get(f));
        const tasks = await TaskService.getTasks({
            userId: auth.user.id,
            scope: (sp.get('scope') as 'all' | 'assigned' | 'created' | 'today' | 'overdue' | 'completed') || 'all',
            status: sp.get('status') || undefined,
            priority: sp.get('priority') || undefined,
            search: sp.get('search') || undefined,
            teamId: sp.get('teamId') || undefined,
            includeSubtasks: sp.get('includeSubtasks') === '1',
            visibility: TaskWorkflowService.scopeWhere(auth.user),
            relation: relationField ? { field: relationField, id: String(sp.get(relationField)) } : undefined,
        });
        return NextResponse.json({ success: true, tasks });
    } catch (error) {
        return errorResponse(error, 'Görevler yüklenemedi');
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdmin(req, 'create', 'tasks');
    if (auth.error) return auth.error;
    try {
        const body = await req.json();
        if (!body.title?.trim()) return NextResponse.json({ success: false, message: 'Görev başlığı zorunludur' }, { status: 400 });
        const assigneeIds: string[] = Array.isArray(body.assigneeIds) ? body.assigneeIds.map(String) : [];
        TaskWorkflowService.assertCanAssign(auth.user, assigneeIds);
        if (body.parentTaskId) {
            const task = await WorkOsService.addSubtask(String(body.parentTaskId), { title: String(body.title), assigneeIds, dueDate: body.dueDate || null }, auth.user);
            return NextResponse.json({ success: true, task, message: 'Alt görev eklendi.' }, { status: 201 });
        }
        if (body.teamId && !(await prisma.workTeam.findFirst({ where: { id: String(body.teamId), isActive: true } }))) {
            return NextResponse.json({ success: false, message: 'Ekip bulunamadı' }, { status: 400 });
        }

        const relations: Record<string, string | undefined> = {};
        for (const f of [...RELATION_FIELDS, 'mentorId', 'eventId', 'trainingId', 'newsId', 'activityId']) {
            if (body[f]) relations[f] = String(body[f]);
        }
        const task = await TaskService.createTask({
            title: body.title,
            description: body.description,
            priority: body.priority,
            startDate: body.startDate,
            dueDate: body.dueDate,
            estimatedHours: body.estimatedHours,
            tags: body.tags,
            checklistItems: body.checklistItems,
            assigneeIds,
            teamId: body.teamId ? String(body.teamId) : undefined,
            recurrence: typeof body.recurrence === 'string' ? body.recurrence : null,
            watcherIds: Array.isArray(body.watcherIds) ? body.watcherIds.map(String) : undefined,
            createdById: auth.user.id,
            actorName: auth.user.name,
            ...relations,
        });
        await prisma.activityTimeline.create({
            data: { entityType: 'Task', entityId: task.id, title: 'Görev oluşturuldu', eventType: 'STATUS_CHANGE', actorId: auth.user.id, actorName: auth.user.name },
        });
        return NextResponse.json({ success: true, task, message: `"${task.title}" oluşturuldu.`, link: `/admin/gorevler?taskId=${task.id}` }, { status: 201 });
    } catch (error) {
        return errorResponse(error, 'Görev oluşturulamadı');
    }
}

/**
 * Body: { taskId | id, action } | { taskId | id, status } (Kanban) | { taskId, assigneeIds }
 *       | { taskId, checklistItemId, isCompleted } | { taskId, comment } | { taskId, watch, userId? }
 *       | { taskId, settings: { teamId?, recurrence?, startDate?, dueDate?, priority? } }
 */
export async function PUT(req: NextRequest) {
    const auth = await requireAdmin(req, 'edit', 'tasks');
    if (auth.error) return auth.error;
    try {
        const body = await req.json();
        const taskId = String(body.taskId || body.id || '');
        if (!taskId) return NextResponse.json({ success: false, message: 'Görev ID zorunludur' }, { status: 400 });

        const visible = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true } });
        if (!visible || !TaskWorkflowService.canSee(visible, auth.user)) {
            return NextResponse.json({ success: false, message: 'Görev bulunamadı' }, { status: 404 });
        }

        if (body.action) {
            const task = await TaskWorkflowService.transition(taskId, body.action as TaskAction, auth.user, body.comment);
            return NextResponse.json({ success: true, task });
        }
        if (body.status) {
            const task = await TaskWorkflowService.moveToStatus(taskId, String(body.status), auth.user, body.comment);
            return NextResponse.json({ success: true, task });
        }
        if (Array.isArray(body.assigneeIds)) {
            await TaskWorkflowService.reassign(taskId, body.assigneeIds.map(String), auth.user);
            return NextResponse.json({ success: true });
        }
        if (body.checklistItemId !== undefined && body.isCompleted !== undefined) {
            const item = await TaskService.toggleChecklistItem(String(body.checklistItemId), Boolean(body.isCompleted));
            return NextResponse.json({ success: true, item });
        }
        if (body.comment) {
            const comment = await TaskService.addComment(taskId, String(body.comment), { id: auth.user.id, name: auth.user.name });
            await WorkOsService.notifyWatchers(taskId, 'Göreve yorum yazıldı', `${auth.user.name}: ${String(body.comment).slice(0, 140)}`, auth.user.id);
            return NextResponse.json({ success: true, comment });
        }
        if (typeof body.watch === 'boolean') {
            const result = await WorkOsService.setWatch(taskId, body.watch, auth.user, body.userId ? String(body.userId) : undefined);
            return NextResponse.json({ success: true, ...result });
        }
        if (body.settings && typeof body.settings === 'object') {
            const task = await WorkOsService.updateSettings(taskId, body.settings, auth.user);
            return NextResponse.json({ success: true, task });
        }
        return NextResponse.json({ success: false, message: 'Geçersiz güncelleme parametresi' }, { status: 400 });
    } catch (error) {
        return errorResponse(error, 'Görev güncellenemedi');
    }
}
