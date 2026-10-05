import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { TaskTemplateService } from '@/lib/services/task-template-service';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, templates: await TaskTemplateService.list() });
    } catch (error) {
        return errorResponse(error, 'Şablonlar alınamadı');
    }
}

/** Body: { action: 'save', ...template } | { action: 'use', id, assigneeIds?, dueDate?, teamId?, title? } */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'create', 'tasks');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as Record<string, unknown> & { action?: string; id?: string };
        if (body.action === 'use') {
            const task = await TaskTemplateService.instantiate(
                String(body.id || ''),
                {
                    assigneeIds: Array.isArray(body.assigneeIds) ? body.assigneeIds.map(String) : undefined,
                    dueDate: typeof body.dueDate === 'string' ? body.dueDate : null,
                    teamId: typeof body.teamId === 'string' ? body.teamId : null,
                    title: typeof body.title === 'string' ? body.title : null,
                },
                auth.user
            );
            return NextResponse.json({ success: true, task, link: `/admin/gorevler?taskId=${task.id}` }, { status: 201 });
        }
        const template = await TaskTemplateService.save(body as Parameters<typeof TaskTemplateService.save>[0], auth.user);
        return NextResponse.json({ success: true, template });
    } catch (error) {
        return errorResponse(error, 'Şablon işlemi başarısız');
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        await TaskTemplateService.remove(request.nextUrl.searchParams.get('id') || '', auth.user);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Şablon silinemedi');
    }
}
