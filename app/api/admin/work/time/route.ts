import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse, DomainError } from '@/lib/api-guard';
import { WorkTrackingService } from '@/lib/services/work-tracking-service';
import { istanbulDayRange, istanbulDayKey } from '@/lib/time';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const sp = request.nextUrl.searchParams;
        const today = istanbulDayKey();
        const from = istanbulDayRange(sp.get('from') || istanbulDayKey(new Date(Date.now() - 6 * 86400000))).start;
        const to = istanbulDayRange(sp.get('to') || today).end;
        const [entries, running] = await Promise.all([WorkTrackingService.listEntries(auth.user.id, from, to), WorkTrackingService.runningTimer(auth.user.id)]);
        return NextResponse.json({ success: true, entries, running });
    } catch (error) {
        return errorResponse(error, 'Süre kayıtları alınamadı');
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { action?: string; taskId?: string; todoId?: string; date?: string; minutes?: number; note?: string };
        if (body.action === 'start') return NextResponse.json({ success: true, entry: await WorkTrackingService.startTimer({ taskId: body.taskId, todoId: body.todoId }, auth.user) });
        if (body.action === 'stop') return NextResponse.json({ success: true, entry: await WorkTrackingService.stopTimer(auth.user, body.note) });
        if (body.action === 'manual') return NextResponse.json({ success: true, entry: await WorkTrackingService.addManualEntry({ taskId: body.taskId, todoId: body.todoId, date: String(body.date || ''), minutes: Number(body.minutes), note: body.note }, auth.user) });
        throw new DomainError('Geçersiz işlem.');
    } catch (error) {
        return errorResponse(error, 'Süre kaydedilemedi');
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        await WorkTrackingService.deleteEntry(request.nextUrl.searchParams.get('id') || '', auth.user);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Kayıt silinemedi');
    }
}
