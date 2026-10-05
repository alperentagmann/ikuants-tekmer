import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse, DomainError } from '@/lib/api-guard';
import { TodoService, TODO_CATEGORIES, type TodoInput } from '@/lib/services/todo-service';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'dashboard');
    if (auth.error) return auth.error;
    try {
        const todos = await TodoService.list(auth.user.id, { includeDone: request.nextUrl.searchParams.get('all') === '1' });
        return NextResponse.json({ success: true, todos, categories: TODO_CATEGORIES });
    } catch (error) {
        return errorResponse(error, 'Yapılacaklar alınamadı');
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'dashboard');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as TodoInput & { action?: string; id?: string; orderedIds?: string[] };
        if (body.action === 'reorder') {
            await TodoService.reorder(auth.user.id, Array.isArray(body.orderedIds) ? body.orderedIds.map(String) : []);
            return NextResponse.json({ success: true });
        }
        if (body.action === 'toggle') return NextResponse.json({ success: true, ...(await TodoService.toggle(String(body.id), auth.user.id)) });
        if (body.action === 'convert') return NextResponse.json({ success: true, task: await TodoService.convertToTask(String(body.id), auth.actor) });
        if (body.action === 'update') return NextResponse.json({ success: true, todo: await TodoService.update(String(body.id), auth.user.id, body) });
        if (body.action && body.action !== 'create') throw new DomainError('Geçersiz işlem.');
        return NextResponse.json({ success: true, todo: await TodoService.create(auth.user.id, body) });
    } catch (error) {
        return errorResponse(error, 'Yapılacak kaydedilemedi');
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'dashboard');
    if (auth.error) return auth.error;
    try {
        await TodoService.remove(request.nextUrl.searchParams.get('id') || '', auth.user.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Yapılacak silinemedi');
    }
}
