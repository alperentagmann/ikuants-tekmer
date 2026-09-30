import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { ReceivableService } from '@/lib/services/receivable-service';
import { z } from 'zod';
import { sanitizeCsvCell } from '@/lib/sanitize';
import { logAuditEvent } from '@/lib/audit';

const receivableCreateSchema = z.object({
    debtor: z.string().min(1, 'Borçlu adı zorunludur'),
    source: z.enum(['RENT', 'PROJECT_PAYMENT', 'SERVICE_FEE', 'SPONSORSHIP', 'EVENT', 'OTHER']).default('OTHER'),
    description: z.string().optional(),
    amount: z.number().positive('Tutar 0\'dan büyük olmalıdır'),
    currency: z.string().default('TRY'),
    dueDate: z.string().min(1, 'Vade tarihi zorunludur'),
    paid: z.number().min(0).optional(),
    exchangeRate: z.number().optional(),
    exchangeRateDate: z.string().optional(),
    sourceCurrency: z.string().optional(),
    targetCurrency: z.string().optional(),
    invoiceNumber: z.string().optional(),
    documentUrl: z.string().optional(),
    notes: z.string().optional(),
    relatedProjectId: z.string().optional(),
    relatedEntrepreneurId: z.string().optional(),
    relatedOrganizationId: z.string().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'view', 'finance')) {
            return NextResponse.json({ success: false, error: 'Alacakları görüntüleme yetkiniz bulunmuyor' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const source = searchParams.get('source') || undefined;
        const status = searchParams.get('status') || undefined;
        const currency = searchParams.get('currency') || undefined;
        const search = searchParams.get('search') || undefined;
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const debtor = searchParams.get('debtor') || undefined;

        const data = await ReceivableService.getReceivables({
            source,
            status,
            currency,
            search,
            startDate,
            endDate,
            debtor,
        });

        return NextResponse.json({ success: true, ...data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Alacaklar yüklenemedi' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const isExport = searchParams.get('export') === 'true';

        if (isExport) {
            if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'export', 'finance') && !hasPermission(auth.user, 'manage', 'finance')) {
                return NextResponse.json({ success: false, error: 'Alacakları dışa aktarma yetkiniz bulunmuyor' }, { status: 403 });
            }

            const body = await req.json();
            const { format = 'CSV', filters } = body;
            const data = await ReceivableService.getReceivables(filters);

            await logAuditEvent({
                actorId: auth.user.id,
                action: 'EXPORT',
                entityType: 'Receivables',
                entityId: `receivables-export-${Date.now()}`,
                newValues: { format, count: data.totalCount, timestamp: new Date().toISOString() },
            });

            if (format === 'CSV' || format === 'EXCEL') {
                const csvRows: string[] = [];
                csvRows.push([
                    sanitizeCsvCell('Borçlu / Muhatap'),
                    sanitizeCsvCell('Kaynak Türü'),
                    sanitizeCsvCell('Açıklama'),
                    sanitizeCsvCell('Toplam Tutar'),
                    sanitizeCsvCell('Tahsil Edilen'),
                    sanitizeCsvCell('Kalan Alacak'),
                    sanitizeCsvCell('Para Birimi'),
                    sanitizeCsvCell('Vade Tarihi'),
                    sanitizeCsvCell('Gecikme (Gün)'),
                    sanitizeCsvCell('Durum'),
                    sanitizeCsvCell('Fatura No'),
                    sanitizeCsvCell('İlgili Proje'),
                    sanitizeCsvCell('İlgili Girişim'),
                ].join(','));

                for (const r of data.receivables) {
                    csvRows.push([
                        sanitizeCsvCell(r.debtor),
                        sanitizeCsvCell(r.source),
                        sanitizeCsvCell(r.description || ''),
                        sanitizeCsvCell(r.amount),
                        sanitizeCsvCell(r.paid),
                        sanitizeCsvCell(r.remaining),
                        sanitizeCsvCell(r.currency),
                        sanitizeCsvCell(new Date(r.dueDate).toLocaleDateString('tr-TR')),
                        sanitizeCsvCell(r.daysOverdue),
                        sanitizeCsvCell(r.status),
                        sanitizeCsvCell(r.invoiceNumber || '-'),
                        sanitizeCsvCell(r.relatedProject?.title || '-'),
                        sanitizeCsvCell(r.relatedEntrepreneur?.name || '-'),
                    ].join(','));
                }

                const csvContent = '\uFEFF' + csvRows.join('\n');
                return new NextResponse(csvContent, {
                    headers: {
                        'Content-Type': 'text/csv; charset=utf-8',
                        'Content-Disposition': `attachment; filename="ikuants_alacaklar_${new Date().toISOString().slice(0, 10)}.csv"`,
                    },
                });
            }

            return NextResponse.json({ success: true, data });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'manage', 'finance') && !hasPermission(auth.user, 'create', 'finance')) {
            return NextResponse.json({ success: false, error: 'Alacak kaydı oluşturma yetkiniz bulunmuyor' }, { status: 403 });
        }

        const body = await req.json();
        const parsed = receivableCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const created = await ReceivableService.createReceivable(parsed.data, auth.user.id);
        return NextResponse.json({ success: true, receivable: created });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Alacak oluşturulamadı' }, { status: 500 });
    }
}
