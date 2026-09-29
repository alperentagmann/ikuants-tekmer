import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const { reportTitle, reportType, format, data } = body;

        await logAuditEvent({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            actorName: `${auth.user.name || ''} ${auth.user.surname || ''}`.trim(),
            action: 'EXPORT',
            entityType: 'OperationalReport',
            diff: `REPORT_EXPORTED: "${reportTitle || 'Report'}" in format ${format || 'CSV'}`,
        });

        if (format === 'CSV') {
            let csvContent = 'Kategori,Deger\n';
            if (data && typeof data === 'object') {
                for (const [key, value] of Object.entries(data)) {
                    if (typeof value === 'object') {
                        csvContent += `"${key}","${JSON.stringify(value).replace(/"/g, '""')}"\n`;
                    } else {
                        csvContent += `"${key}","${String(value).replace(/"/g, '""')}"\n`;
                    }
                }
            }

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="ikuants_report_${Date.now()}.csv"`,
                },
            });
        }

        return NextResponse.json({
            success: true,
            format: format || 'JSON',
            exportedAt: new Date().toISOString(),
            reportTitle,
            data,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Export hatası' }, { status: 500 });
    }
}
