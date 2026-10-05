import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { listParams, withApiKey } from '@/lib/public-api';

/** Sales invoice summaries (number, party name, dates, totals, status). */
export async function GET(request: NextRequest) {
    return withApiKey(request, 'finance:read', async () => {
        const { since, limit } = listParams(request);
        const rows = await prisma.salesInvoice.findMany({
            where: { status: { not: 'DRAFT' }, ...(since ? { updatedAt: { gte: since } } : {}) },
            orderBy: { issueDate: 'desc' },
            take: limit,
            select: { id: true, number: true, issueDate: true, dueDate: true, currency: true, status: true, subtotal: true, vatTotal: true, withholdingTotal: true, grandTotal: true, paidAmount: true, eInvoiceStatus: true, updatedAt: true, party: { select: { name: true, taxNumber: true } } },
        });
        return NextResponse.json({ success: true, data: rows });
    });
}
