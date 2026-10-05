import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { listParams, withApiKey } from '@/lib/public-api';

/** Reservations (space, time window, status, source). No requester contact data. */
export async function GET(request: NextRequest) {
    return withApiKey(request, 'reservations:read', async () => {
        const { since, limit } = listParams(request);
        const rows = await prisma.reservation.findMany({
            where: since ? { updatedAt: { gte: since } } : {},
            orderBy: { startTime: 'desc' },
            take: limit,
            select: { id: true, title: true, status: true, startTime: true, endTime: true, attendeeCount: true, source: true, updatedAt: true, resource: { select: { name: true, code: true } } },
        });
        return NextResponse.json({ success: true, data: rows });
    });
}
