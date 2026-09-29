import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ReportingService } from '@/lib/services/reporting-service';
import { z } from 'zod';

const reportSaveSchema = z.object({
    title: z.string().min(1, 'Rapor başlığı zorunludur'),
    reportType: z.enum(['DAILY', 'MONTHLY', 'TEAM', 'YEARLY', 'SOCIAL', 'CROSS_CHANNEL', 'CUSTOM']),
    periodStart: z.string().min(1),
    periodEnd: z.string().min(1),
    executiveSummary: z.string().optional(),
    contentJson: z.any().optional(),
    metricsJson: z.any().optional(),
    department: z.string().optional(),
    status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED']).optional(),
});

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const reportType = searchParams.get('reportType') || undefined;
        const status = searchParams.get('status') || undefined;

        // Non-superadmins see only their own reports or public ones
        const authorId = auth.user.role === 'SUPER_ADMIN' ? undefined : auth.user.id;

        const reports = await ReportingService.getAllReports({ reportType, status, authorId });
        return NextResponse.json({ success: true, reports });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const parsed = reportSaveSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const report = await ReportingService.saveReport(parsed.data, auth.user.id, {
            id: auth.user.id,
            name: `${auth.user.name || ''} ${auth.user.surname || ''}`.trim(),
            email: auth.user.email || '',
        });

        return NextResponse.json({ success: true, report });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
