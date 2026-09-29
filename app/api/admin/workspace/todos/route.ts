import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PersonalWorkspaceService } from '@/lib/services/personal-workspace-service';
import { z } from 'zod';

const todoSchema = z.object({
    title: z.string().min(1, 'Başlık zorunludur'),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    dueTime: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    category: z.string().optional(),
    reminderDate: z.string().optional(),
    reminderChannel: z.enum(['IN_APP', 'EMAIL', 'TEAMS']).optional(),
    relatedEntityType: z.string().optional(),
    relatedEntityId: z.string().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') || undefined;
        const completed = searchParams.has('completed')
            ? searchParams.get('completed') === 'true'
            : undefined;

        const todos = await PersonalWorkspaceService.getTodos(auth.user.id, { completed, category });
        return NextResponse.json({ success: true, todos });
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
        const parsed = todoSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const todo = await PersonalWorkspaceService.createTodo(auth.user.id, parsed.data);
        return NextResponse.json({ success: true, todo });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const { id, action } = body;
        if (!id) return NextResponse.json({ error: 'To-do ID zorunludur' }, { status: 400 });

        if (action === 'CONVERT_TO_TASK') {
            const task = await PersonalWorkspaceService.convertTodoToTask(id, auth.user.id, {
                id: auth.user.id,
                name: `${auth.user.name || ''} ${auth.user.surname || ''}`.trim(),
                email: auth.user.email || '',
            });
            return NextResponse.json({ success: true, task });
        }

        const todo = await PersonalWorkspaceService.toggleTodo(id, auth.user.id);
        return NextResponse.json({ success: true, todo });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'To-do ID zorunludur' }, { status: 400 });

        await PersonalWorkspaceService.deleteTodo(id, auth.user.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
