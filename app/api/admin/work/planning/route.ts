import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { TaskWorkflowService } from '@/lib/services/task-workflow-service';

const OPEN = ['TODO', 'IN_PROGRESS', 'IN_REVIEW'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Tasks in a date window (calendar / timeline) and open workload per person. Respects task visibility. */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const sp = request.nextUrl.searchParams;
        const fromKey = sp.get('from') || '';
        const toKey = sp.get('to') || '';
        if (!DAY.test(fromKey) || !DAY.test(toKey)) return NextResponse.json({ success: false, message: 'Tarih aralığı YYYY-AA-GG biçiminde olmalı' }, { status: 400 });
        const from = new Date(`${fromKey}T00:00:00+03:00`);
        const to = new Date(`${toKey}T23:59:59+03:00`);
        if (to < from || to.getTime() - from.getTime() > 400 * 86400000) return NextResponse.json({ success: false, message: 'Geçersiz tarih aralığı' }, { status: 400 });
        const teamId = sp.get('teamId') || undefined;
        const userId = sp.get('userId') || undefined;
        const base = {
            isArchived: false,
            ...(teamId ? { teamId } : {}),
            ...(userId ? { assignees: { some: { userId } } } : {}),
            AND: [TaskWorkflowService.scopeWhere(auth.user)],
        };
        const tasks = await prisma.task.findMany({
            where: { ...base, OR: [{ dueDate: { gte: from, lte: to } }, { startDate: { gte: from, lte: to } }, { startDate: { lte: from }, dueDate: { gte: to } }] },
            select: {
                id: true, title: true, status: true, priority: true, startDate: true, dueDate: true, estimatedHours: true, actualHours: true, parentTaskId: true, recurrence: true,
                team: { select: { id: true, name: true, color: true } },
                assignees: { select: { user: { select: { id: true, name: true, avatarUrl: true } } } },
            },
            orderBy: [{ dueDate: 'asc' }],
            take: 1000,
        });
        const open = await prisma.task.findMany({
            where: { ...base, status: { in: OPEN } },
            select: { dueDate: true, estimatedHours: true, priority: true, assignees: { select: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
            take: 5000,
        });
        const now = new Date();
        const load = new Map<string, { userId: string; name: string; avatarUrl: string | null; open: number; overdue: number; urgent: number; estimatedHours: number }>();
        for (const t of open) {
            for (const a of t.assignees) {
                const row = load.get(a.user.id) || { userId: a.user.id, name: a.user.name, avatarUrl: a.user.avatarUrl, open: 0, overdue: 0, urgent: 0, estimatedHours: 0 };
                row.open++;
                if (t.dueDate && t.dueDate < now) row.overdue++;
                if (t.priority === 'URGENT' || t.priority === 'HIGH') row.urgent++;
                row.estimatedHours += t.estimatedHours || 0;
                load.set(a.user.id, row);
            }
        }
        return NextResponse.json({ success: true, tasks, workload: Array.from(load.values()).sort((a, b) => b.open - a.open) });
    } catch (error) {
        return errorResponse(error, 'Planlama verisi alınamadı');
    }
}
