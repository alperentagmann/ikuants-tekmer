import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { sanitizeCsvCell } from '@/lib/sanitize';

/** Exports report figures prepared on screen as CSV (formula injection safe) or JSON. */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'export', 'reports');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { reportTitle?: string; format?: string; data?: unknown };
        const { reportTitle, format, data } = body;

        await logAuditEvent({
            actorId: auth.actor.id,
            actorEmail: auth.actor.email,
            actorName: auth.actor.name,
            action: 'EXPORT',
            entityType: 'OperationalReport',
            diff: `REPORT_EXPORTED: "${reportTitle || 'Rapor'}" (${format || 'JSON'})`,
        });

        if (format === 'CSV') {
            const cell = (v: unknown) => `"${String(sanitizeCsvCell(typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? ''))).replace(/"/g, '""')}"`;
            const rows = data && typeof data === 'object' ? Object.entries(data as Record<string, unknown>).map(([k, v]) => `${cell(k)},${cell(v)}`) : [];
            return new NextResponse(`﻿Kategori,Değer\n${rows.join('\n')}\n`, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="ikuants_rapor_${Date.now()}.csv"`,
                },
            });
        }

        return NextResponse.json({ success: true, format: 'JSON', exportedAt: new Date().toISOString(), reportTitle, data });
    } catch (error) {
        return errorResponse(error, 'Dışa aktarma başarısız');
    }
}
