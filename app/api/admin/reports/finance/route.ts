import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { FinanceService } from '@/lib/services/finance-service';
import { logAuditEvent } from '@/lib/audit';
import { sanitizeCsvCell } from '@/lib/sanitize';

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'view', 'finance') && !hasPermission(auth.user, 'view', 'reports')) {
            return NextResponse.json({ success: false, error: 'Bu rapora erişim yetkiniz bulunmuyor' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const projectId = searchParams.get('projectId') || undefined;
        const currency = searchParams.get('currency') || undefined;
        const category = searchParams.get('category') || undefined;

        const data = await FinanceService.getComprehensiveFinanceReport({
            startDate,
            endDate,
            projectId,
            currency,
            category,
        });

        return NextResponse.json({ success: true, ...data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Finans raporu yüklenemedi' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'export', 'finance') && !hasPermission(auth.user, 'manage', 'finance')) {
            return NextResponse.json({ success: false, error: 'Finans raporu dışa aktarma yetkiniz bulunmuyor' }, { status: 403 });
        }

        const body = await req.json();
        const { format = 'CSV', filters, reportType = 'PROJECT_FINANCE' } = body;

        const reportData = await FinanceService.getComprehensiveFinanceReport(filters);

        // Audit Log entry
        await logAuditEvent({
            actorId: auth.user.id,
            action: 'EXPORT',
            entityType: 'FinanceReport',
            entityId: `finance-export-${Date.now()}`,
            newValues: {
                format,
                reportType,
                filters,
                timestamp: new Date().toISOString(),
            },
        });

        if (format === 'CSV' || format === 'EXCEL') {
            const csvRows: string[] = [];

            if (reportType === 'PROJECT_FINANCE' || reportType === 'SUMMARY') {
                csvRows.push([
                    sanitizeCsvCell('Proje Kodu'),
                    sanitizeCsvCell('Proje Adı'),
                    sanitizeCsvCell('Para Birimi'),
                    sanitizeCsvCell('Toplam Bütçe'),
                    sanitizeCsvCell('Gelen Finansman'),
                    sanitizeCsvCell('Beklenen Finansman'),
                    sanitizeCsvCell('Harcanan'),
                    sanitizeCsvCell('Taahhüt'),
                    sanitizeCsvCell('Ödenen'),
                    sanitizeCsvCell('Ödeme Bekleyen'),
                    sanitizeCsvCell('Kalan Bütçe'),
                    sanitizeCsvCell('Kullanılabilir Nakit'),
                    sanitizeCsvCell('Kullanım Oranı (%)'),
                ].join(','));

                for (const p of reportData.projectFinancialSummaries) {
                    csvRows.push([
                        sanitizeCsvCell(p.projectCode),
                        sanitizeCsvCell(p.projectTitle),
                        sanitizeCsvCell(p.currency),
                        sanitizeCsvCell(p.totalBudget),
                        sanitizeCsvCell(p.receivedFunding),
                        sanitizeCsvCell(p.expectedFunding),
                        sanitizeCsvCell(p.spent),
                        sanitizeCsvCell(p.committed),
                        sanitizeCsvCell(p.paid),
                        sanitizeCsvCell(p.pendingPayment),
                        sanitizeCsvCell(p.remainingBudget),
                        sanitizeCsvCell(p.availableCash),
                        sanitizeCsvCell(p.utilizationRate),
                    ].join(','));
                }
            } else if (reportType === 'BUDGET_LINES') {
                csvRows.push([
                    sanitizeCsvCell('Proje Kodu'),
                    sanitizeCsvCell('Proje'),
                    sanitizeCsvCell('Bütçe Kodu'),
                    sanitizeCsvCell('Kalem Adı'),
                    sanitizeCsvCell('Kategori'),
                    sanitizeCsvCell('Tahsis Edilen'),
                    sanitizeCsvCell('Taahhüt'),
                    sanitizeCsvCell('Harcanan'),
                    sanitizeCsvCell('Ödenen'),
                    sanitizeCsvCell('Kalan'),
                    sanitizeCsvCell('Kullanım (%)'),
                    sanitizeCsvCell('Para Birimi'),
                ].join(','));

                for (const p of reportData.projectFinancialSummaries) {
                    for (const bl of p.budgetLines) {
                        csvRows.push([
                            sanitizeCsvCell(p.projectCode),
                            sanitizeCsvCell(p.projectTitle),
                            sanitizeCsvCell(bl.code),
                            sanitizeCsvCell(bl.title),
                            sanitizeCsvCell(bl.categoryLabel),
                            sanitizeCsvCell(bl.allocated),
                            sanitizeCsvCell(bl.committed),
                            sanitizeCsvCell(bl.spent),
                            sanitizeCsvCell(bl.paid),
                            sanitizeCsvCell(bl.remaining),
                            sanitizeCsvCell(bl.utilizationRate),
                            sanitizeCsvCell(bl.currency),
                        ].join(','));
                    }
                }
            }

            const csvContent = '\uFEFF' + csvRows.join('\n');
            const filename = `ikuants_finans_raporu_${new Date().toISOString().slice(0, 10)}.${format === 'EXCEL' ? 'csv' : 'csv'}`;

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: reportData,
            exportedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Dışa aktarma hatası' }, { status: 500 });
    }
}
