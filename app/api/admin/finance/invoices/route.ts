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

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'view', 'finance')) {
            return NextResponse.json({ success: false, error: 'Faturaları görüntüleme yetkiniz bulunmuyor' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const projectId = searchParams.get('projectId') || undefined;
        const vendorName = searchParams.get('vendorName') || undefined;
        const paymentStatus = searchParams.get('paymentStatus') || undefined;
        const currency = searchParams.get('currency') || undefined;
        const documentStatus = searchParams.get('documentStatus') || undefined;
        const search = searchParams.get('search') || undefined;

        const data = await FinanceService.getInvoiceRegister({
            startDate,
            endDate,
            projectId,
            vendorName,
            paymentStatus,
            currency,
            documentStatus,
            search,
        });

        return NextResponse.json({ success: true, ...data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Fatura kayıtları yüklenemedi' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'export', 'finance') && !hasPermission(auth.user, 'manage', 'finance')) {
            return NextResponse.json({ success: false, error: 'Fatura listesi dışa aktarma yetkiniz bulunmuyor' }, { status: 403 });
        }

        const body = await req.json();
        const { format = 'CSV', filters } = body;

        const data = await FinanceService.getInvoiceRegister(filters);

        // Audit log
        await logAuditEvent({
            actorId: auth.user.id,
            action: 'EXPORT',
            entityType: 'InvoiceRegister',
            entityId: `invoices-export-${Date.now()}`,
            newValues: {
                format,
                filters,
                count: data.totalCount,
                timestamp: new Date().toISOString(),
            },
        });

        if (format === 'CSV' || format === 'EXCEL') {
            const csvRows: string[] = [];
            csvRows.push([
                sanitizeCsvCell('Tedarikçi / Satıcı'),
                sanitizeCsvCell('Fatura No'),
                sanitizeCsvCell('Fatura Tarihi'),
                sanitizeCsvCell('İlgili Proje'),
                sanitizeCsvCell('Finansman Kaynağı'),
                sanitizeCsvCell('Bütçe Kalemi'),
                sanitizeCsvCell('Net Tutar'),
                sanitizeCsvCell('KDV Tutarı'),
                sanitizeCsvCell('Brüt Toplam'),
                sanitizeCsvCell('Para Birimi'),
                sanitizeCsvCell('Ödeme Durumu'),
                sanitizeCsvCell('Ödeme Tarihi'),
                sanitizeCsvCell('Belge Durumu'),
            ].join(','));

            for (const inv of data.invoices) {
                csvRows.push([
                    sanitizeCsvCell(inv.supplier),
                    sanitizeCsvCell(inv.invoiceNo),
                    sanitizeCsvCell(inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('tr-TR') : '-'),
                    sanitizeCsvCell(inv.projectTitle),
                    sanitizeCsvCell(inv.fundingSource),
                    sanitizeCsvCell(inv.budgetLine),
                    sanitizeCsvCell(inv.net),
                    sanitizeCsvCell(inv.VAT),
                    sanitizeCsvCell(inv.gross),
                    sanitizeCsvCell(inv.currency),
                    sanitizeCsvCell(inv.paymentStatus),
                    sanitizeCsvCell(inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString('tr-TR') : '-'),
                    sanitizeCsvCell(inv.documentStatus === 'HAS_DOCUMENT' ? 'Mevcut' : 'Eksik Belge'),
                ].join(','));
            }

            const csvContent = '\uFEFF' + csvRows.join('\n');
            const filename = `ikuants_fatura_kayitlari_${new Date().toISOString().slice(0, 10)}.csv`;

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Fatura dışa aktarma hatası' }, { status: 500 });
    }
}
