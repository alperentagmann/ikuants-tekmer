import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ReportingService } from '@/lib/services/reporting-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        const report = await ReportingService.getReportById(id);
        if (!report) {
            return NextResponse.json({ error: 'Rapor bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, report });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        if (body.action === 'APPROVE') {
            if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Yalnızca yöneticiler rapor onaylayabilir' }, { status: 403 });
            }

            const updated = await ReportingService.approveReport(id, auth.user.id, {
                id: auth.user.id,
                name: `${auth.user.name || ''} ${auth.user.surname || ''}`.trim(),
                email: auth.user.email || '',
            });

            return NextResponse.json({ success: true, report: updated });
        }

        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
