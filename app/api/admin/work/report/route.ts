import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { logAuditEvent } from '@/lib/audit';
import { sanitizeCsvCell } from '@/lib/sanitize';
import { WorkTrackingService } from '@/lib/services/work-tracking-service';

/** Work report. Without task:view_all only the requester's own figures are returned. */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const sp = request.nextUrl.searchParams;
        const report = await WorkTrackingService.workReport({ from: sp.get('from') || '', to: sp.get('to') || '', userIds: (sp.get('users') || '').split(',').filter(Boolean) }, auth.user);
        if (sp.get('format') === 'csv') {
            const cell = (v: unknown) => `"${String(sanitizeCsvCell(v ?? '')).replace(/"/g, '""')}"`;
            const header = ['Kişi', 'Unvan', 'Tamamlanan', 'Zamanında', 'Zamanında %', 'Açık', 'Geciken', 'Kontrolde', 'Ort. süre (saat)', 'Kayıtlı saat', 'Paslanan', 'Devralınan', 'Geri paslanan', 'Yapılacak', 'Yorum'];
            const rows = report.perUser.map((u) => [u.name, u.title, u.completed, u.completedOnTime, u.onTimeRate ?? '', u.open, u.overdue, u.inReview, u.avgCycleHours ?? '', u.hoursLogged, u.handoffsGiven, u.handoffsReceived, u.handoffsReturned, u.todosCompleted, u.comments].map(cell).join(','));
            await logAuditEvent({ actorId: auth.actor.id, actorEmail: auth.actor.email, actorName: auth.actor.name, action: 'EXPORT', entityType: 'WorkReport', diff: `${report.range.from} – ${report.range.to}` });
            return new NextResponse(`\uFEFF${header.map(cell).join(',')}\n${rows.join('\n')}\n`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="is-takip-raporu-${report.range.from}-${report.range.to}.csv"` } });
        }
        return NextResponse.json({ success: true, report });
    } catch (error) {
        return errorResponse(error, 'Rapor oluşturulamadı');
    }
}
