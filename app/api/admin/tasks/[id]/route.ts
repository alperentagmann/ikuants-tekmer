import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

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
            },
        });

        if (!task) {
            return NextResponse.json({ success: false, message: 'Görev bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, task });
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

        await prisma.task.delete({ where: { id } });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'DELETE',
            entityType: 'Task',
            entityId: id,
            diff: `Görev silindi: ${task.title}`,
        });

        return NextResponse.json({ success: true, message: 'Görev silindi' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
