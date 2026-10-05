import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { listParams, withApiKey } from '@/lib/public-api';

/** Tasks (title, status, priority, dates, team). */
export async function GET(request: NextRequest) {
    return withApiKey(request, 'tasks:read', async () => {
        const { since, limit } = listParams(request);
        const rows = await prisma.task.findMany({
            where: { isArchived: false, ...(since ? { updatedAt: { gte: since } } : {}) },
            orderBy: { updatedAt: 'desc' },
            take: limit,
            select: { id: true, title: true, status: true, priority: true, startDate: true, dueDate: true, completedAt: true, updatedAt: true, team: { select: { name: true } } },
        });
        return NextResponse.json({ success: true, data: rows });
    });
}
