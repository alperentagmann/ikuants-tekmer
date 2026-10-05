import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { listParams, withApiKey } from '@/lib/public-api';

/** Applications (number, type, status, campaign, dates). No applicant identity data. */
export async function GET(request: NextRequest) {
    return withApiKey(request, 'applications:read', async () => {
        const { since, limit } = listParams(request);
        const rows = await prisma.application.findMany({
            where: since ? { updatedAt: { gte: since } } : {},
            orderBy: { updatedAt: 'desc' },
            take: limit,
            select: { id: true, applicationNumber: true, applicationType: true, status: true, createdAt: true, updatedAt: true, campaign: { select: { name: true, slug: true } } },
        });
        return NextResponse.json({ success: true, data: rows });
    });
}
