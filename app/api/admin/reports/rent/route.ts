import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { RentService } from '@/lib/services/rent-service';
import { logAuditEvent } from '@/lib/audit';
import { sanitizeCsvCell } from '@/lib/sanitize';

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'view', 'rent') && !hasPermission(auth.user, 'view', 'reports')) {
            return NextResponse.json({ success: false, error: 'Bu rapora erişim yetkiniz bulunmuyor' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
        const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;
        const currency = searchParams.get('currency') || undefined;
        const entrepreneurId = searchParams.get('entrepreneurId') || undefined;

        const data = await RentService.getRentReport({
            startDate,
            endDate,
            year,
            month,
            currency,
            entrepreneurId,
        });

        return NextResponse.json({ success: true, ...data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Kira raporu yüklenemedi' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'export', 'rent') && !hasPermission(auth.user, 'manage', 'rent')) {
            return NextResponse.json({ success: false, error: 'Kira raporu dışa aktarma yetkiniz bulunmuyor' }, { status: 403 });
        }

        const body = await req.json();
        const { format = 'CSV', filters, reportType = 'ACCRUALS' } = body;

        const rentReport = await RentService.getRentReport(filters);

        // Audit Log entry
        await logAuditEvent({
            actorId: auth.user.id,
            action: 'EXPORT',
            entityType: 'RentReport',
            entityId: `rent-export-${Date.now()}`,
            newValues: {
                format,
                reportType,
                filters,
                timestamp: new Date().toISOString(),
            },
        });

        if (format === 'CSV' || format === 'EXCEL') {
            const csvRows: string[] = [];

            if (reportType === 'AGING') {
                csvRows.push([
                    sanitizeCsvCell('Yaşlandırma Segmenti'),
                    sanitizeCsvCell('Girişimci Sayısı'),
                    sanitizeCsvCell('Kayıt Sayısı'),
                    sanitizeCsvCell('Para Birimleri & Tutarlar'),
                ].join(','));

                for (const b of rentReport.agingReport) {
                    const amountsStr = Object.entries(b.amountByCurrency)
                        .map(([c, a]) => `${a.toLocaleString('tr-TR')} ${c}`)
                        .join(' | ');

                    csvRows.push([
                        sanitizeCsvCell(b.label),
                        sanitizeCsvCell(b.entrepreneurCount),
                        sanitizeCsvCell(b.itemCount),
                        sanitizeCsvCell(amountsStr || '0 TL'),
                    ].join(','));
                }
            } else {
                // ACCRUALS detail
                csvRows.push([
                    sanitizeCsvCell('Sözleşme No'),
                    sanitizeCsvCell('Girişimci'),
                    sanitizeCsvCell('Ofis / Alan'),
                    sanitizeCsvCell('Dönem'),
                    sanitizeCsvCell('Net Tutar'),
                    sanitizeCsvCell('KDV'),
                    sanitizeCsvCell('Toplam Tahakkuk'),
                    sanitizeCsvCell('Ödenen'),
                    sanitizeCsvCell('Kalan Borç'),
                    sanitizeCsvCell('Para Birimi'),
                    sanitizeCsvCell('Vade Tarihi'),
                    sanitizeCsvCell('Gecikme (Gün)'),
                    sanitizeCsvCell('Durum'),
                ].join(','));

                for (const acc of rentReport.accruals) {
                    csvRows.push([
                        sanitizeCsvCell(acc.contractNo),
                        sanitizeCsvCell(acc.entrepreneurName),
                        sanitizeCsvCell(acc.spaceName),
                        sanitizeCsvCell(acc.periodLabel),
                        sanitizeCsvCell(acc.baseAmount),
                        sanitizeCsvCell(acc.vatAmount),
                        sanitizeCsvCell(acc.totalDue),
                        sanitizeCsvCell(acc.paidAmount),
                        sanitizeCsvCell(acc.remainingAmount),
                        sanitizeCsvCell(acc.currency),
                        sanitizeCsvCell(acc.dueDate ? new Date(acc.dueDate).toLocaleDateString('tr-TR') : '-'),
                        sanitizeCsvCell(acc.daysOverdue),
                        sanitizeCsvCell(acc.status),
                    ].join(','));
                }
            }

            const csvContent = '\uFEFF' + csvRows.join('\n');
            const filename = `ikuants_kira_raporu_${new Date().toISOString().slice(0, 10)}.csv`;

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: rentReport,
            exportedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Kira dışa aktarma hatası' }, { status: 500 });
    }
}
