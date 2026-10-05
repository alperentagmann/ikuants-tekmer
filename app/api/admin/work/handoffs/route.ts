import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse, DomainError } from '@/lib/api-guard';
import { WorkTrackingService } from '@/lib/services/work-tracking-service';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const sp = request.nextUrl.searchParams;
        const box = sp.get('box') === 'outbox' ? 'outbox' : sp.get('box') === 'task' ? 'task' : 'inbox';
        const handoffs = await WorkTrackingService.listHandoffs(auth.user, box, sp.get('taskId') || undefined);
        return NextResponse.json({ success: true, handoffs });
    } catch (error) {
        return errorResponse(error, 'Paslar alınamadı');
    }
}

/** Pass a task to another admin. */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'edit', 'tasks');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { taskId?: string; toUserId?: string; note?: string };
        if (!body.taskId || !body.toUserId) throw new DomainError('Görev ve kişi seçin.');
        const handoff = await WorkTrackingService.handoff(body.taskId, body.toUserId, body.note || null, auth.user);
        return NextResponse.json({ success: true, handoff });
    } catch (error) {
        return errorResponse(error, 'Görev paslanamadı');
    }
}

/** Accept or return a task passed to you. */
export async function PATCH(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { id?: string; decision?: string; note?: string };
        if (!body.id || !['accept', 'return'].includes(String(body.decision))) throw new DomainError('Geçersiz işlem.');
        await WorkTrackingService.respond(body.id, body.decision as 'accept' | 'return', body.note || null, auth.user);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Yanıt kaydedilemedi');
    }
}
