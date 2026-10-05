import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hasPermission } from '@/lib/rbac';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { ReportingService } from '@/lib/services/reporting-service';
import { istanbulNow, istanbulDayRange } from '@/lib/time';

const currentYear = () => istanbulNow().year;

const generateSchema = z.object({
    type: z.enum(['DAILY', 'MONTHLY', 'YEARLY', 'SOCIAL', 'CUSTOM']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).optional(),
    customConfig: z.object({ source: z.enum(['entrepreneurs', 'mentors', 'applications', 'events', 'tasks']), dateFrom: z.string().optional(), dateTo: z.string().optional(), status: z.string().optional(), limit: z.number().int().min(1).max(500).optional() }).optional(),
});

/** Computes report data from live records (nothing is stored until the user saves the report). */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'create', 'reports');
    if (auth.error) return auth.error;
    try {
        const parsed = generateSchema.safeParse(await request.json());
        if (!parsed.success) return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        const d = parsed.data;
        if (d.year && d.year > currentYear()) return NextResponse.json({ success: false, message: 'Gelecek yıl için rapor oluşturulamaz' }, { status: 400 });
        const now = istanbulNow();

        let data: unknown;
        switch (d.type) {
            case 'DAILY':
                data = await ReportingService.generateDailyReportData(auth.user.id, d.date ? istanbulDayRange(d.date).start : new Date());
                break;
            case 'MONTHLY':
                data = await ReportingService.generateMonthlyUserReportData(auth.user.id, d.month || now.month, d.year || now.year);
                break;
            case 'YEARLY':
                // Institution-wide figures: reserved for report approvers
                if (!hasPermission(auth.user, 'approve', 'reports')) return NextResponse.json({ success: false, message: 'Kurumsal yıllık raporu oluşturma yetkiniz yok' }, { status: 403 });
                data = await ReportingService.generateYearlyCorporateReportData(d.year || now.year);
                break;
            case 'SOCIAL':
                data = await ReportingService.generateSocialMediaReportData();
                break;
            case 'CUSTOM':
                data = await ReportingService.queryCustomReport(d.customConfig || { source: 'tasks' });
                break;
        }
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return errorResponse(error, 'Rapor verisi oluşturulamadı');
    }
}
