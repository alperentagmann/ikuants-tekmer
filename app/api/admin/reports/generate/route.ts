import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ReportingService } from '@/lib/services/reporting-service';
import { z } from 'zod';

const generateSchema = z.object({
    type: z.enum(['DAILY', 'MONTHLY', 'YEARLY', 'SOCIAL', 'CUSTOM']),
    date: z.string().optional(),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2020).max(2035).optional(),
    customConfig: z.any().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const parsed = generateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        let resultData: any;

        switch (parsed.data.type) {
            case 'DAILY':
                resultData = await ReportingService.generateDailyReportData(
                    auth.user.id,
                    parsed.data.date ? new Date(parsed.data.date) : new Date()
                );
                break;
            case 'MONTHLY':
                resultData = await ReportingService.generateMonthlyUserReportData(
                    auth.user.id,
                    parsed.data.month || currentMonth,
                    parsed.data.year || currentYear
                );
                break;
            case 'YEARLY':
                if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
                    return NextResponse.json({ error: 'Kurumsal yıllık raporu yalnızca Yöneticiler oluşturabilir' }, { status: 403 });
                }
                resultData = await ReportingService.generateYearlyCorporateReportData(parsed.data.year || currentYear);
                break;
            case 'SOCIAL':
                resultData = await ReportingService.generateSocialMediaReportData();
                break;
            case 'CUSTOM':
                resultData = await ReportingService.queryCustomReport(parsed.data.customConfig || { source: 'tasks' });
                break;
            default:
                return NextResponse.json({ error: 'Bilinmeyen rapor türü' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: resultData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
