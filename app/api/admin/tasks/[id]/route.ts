import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';
import { TaskWorkflowService } from '@/lib/services/task-workflow-service';
import { getTimelineEvents } from '@/lib/timeline';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'tasks')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
                assignees: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
                checklistItems: { orderBy: { sortOrder: 'asc' } },
                comments: {
                    include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'asc' },
                },
                attachments: true,
                activitiesLog: {
                    orderBy: { createdAt: 'desc' },
                },
                entrepreneur: { select: { id: true, name: true } },
                mentor: { select: { id: true, name: true, surname: true } },
                program: { select: { id: true, name: true } },
                application: { select: { id: true, applicationNumber: true, applicantName: true } },
                person: { select: { id: true, fullName: true } },
                organization: { select: { id: true, name: true } },
                project: { select: { id: true, title: true } },
                team: { select: { id: true, name: true, color: true } },
                parentTask: { select: { id: true, title: true } },
                subTasks: { where: { isArchived: false }, orderBy: { createdAt: 'asc' }, select: { id: true, title: true, status: true, dueDate: true, assignees: { select: { user: { select: { id: true, name: true, avatarUrl: true } } } } } },
                watchers: { select: { user: { select: { id: true, name: true, avatarUrl: true } } } },
                reservation: { select: { id: true, title: true, startTime: true } },
                rentContract: { select: { id: true, contractNo: true } },
            },
        });

        if (!task || task.isArchived || !TaskWorkflowService.canSee(task, user as never)) {
            return NextResponse.json({ success: false, message: 'Görev bulunamadı' }, { status: 404 });
        }

        const timeline = await getTimelineEvents('Task', id);
        return NextResponse.json({ success: true, task, timeline });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'delete', 'tasks')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) {
            return NextResponse.json({ success: false, message: 'Görev bulunamadı' }, { status: 404 });
        }

        // Tasks are archived, not deleted, so history and audit stay intact.
        await prisma.task.update({ where: { id }, data: { isArchived: true } });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'ARCHIVE',
            entityType: 'Task',
            entityId: id,
            diff: `Görev arşivlendi: ${task.title}`,
        });

        return NextResponse.json({ success: true, message: 'Görev arşivlendi' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
