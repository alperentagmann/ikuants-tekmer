import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { RentService } from '@/lib/services/rent-service';
import { logAuditEvent } from '@/lib/audit';
import { sanitizeCsvCell } from '@/lib/sanitize';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'view', 'rent') && !hasPermission(auth.user, 'view', 'entrepreneurs')) {
            return NextResponse.json({ success: false, error: 'Kira ekstresini görüntüleme yetkiniz bulunmuyor' }, { status: 403 });
        }

        const { id } = await params;
        const data = await RentService.getEntrepreneurStatement(id);

        const { searchParams } = new URL(req.url);
        const isExport = searchParams.get('export') === 'true';

        if (isExport) {
            if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'export', 'rent')) {
                return NextResponse.json({ success: false, error: 'Ekstre dışa aktarma yetkiniz bulunmuyor' }, { status: 403 });
            }

            await logAuditEvent({
                actorId: auth.user.id,
                action: 'EXPORT',
                entityType: 'EntrepreneurRentStatement',
                entityId: id,
                newValues: { entrepreneur: data.entrepreneur.name, timestamp: new Date().toISOString() },
            });

            const csvRows: string[] = [];
            csvRows.push([
                sanitizeCsvCell('Tarih'),
                sanitizeCsvCell('İşlem Türü'),
                sanitizeCsvCell('Açıklama'),
                sanitizeCsvCell('Referans No'),
                sanitizeCsvCell('Borç Tutarı (Tahakkuk)'),
                sanitizeCsvCell('Alacak Tutarı (Tahsilat)'),
                sanitizeCsvCell('Bakiye'),
                sanitizeCsvCell('Para Birimi'),
                sanitizeCsvCell('Durum'),
            ].join(','));

            for (const item of data.statementItems) {
                csvRows.push([
                    sanitizeCsvCell(new Date(item.date).toLocaleDateString('tr-TR')),
                    sanitizeCsvCell(item.type === 'ACCRUAL' ? 'Tahakkuk' : item.type === 'PAYMENT' ? 'Tahsilat' : 'Muafiyet'),
                    sanitizeCsvCell(item.description),
                    sanitizeCsvCell(item.referenceNo || '-'),
                    sanitizeCsvCell(item.debitAmount),
                    sanitizeCsvCell(item.creditAmount),
                    sanitizeCsvCell(item.balance),
                    sanitizeCsvCell(item.currency),
                    sanitizeCsvCell(item.status),
                ].join(','));
            }

            const csvContent = '\uFEFF' + csvRows.join('\n');
            const safeName = data.entrepreneur.name.replace(/[^a-zA-Z0-9]/g, '_');
            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="ekstre_${safeName}_${new Date().toISOString().slice(0, 10)}.csv"`,
                },
            });
        }

        return NextResponse.json({ success: true, ...data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Ekstre yüklenemedi' }, { status: 500 });
    }
}
