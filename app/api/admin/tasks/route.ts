import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/lib/services/task-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'tasks')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const scope = searchParams.get('scope') as any || 'all';
        const status = searchParams.get('status') || undefined;
        const priority = searchParams.get('priority') || undefined;
        const search = searchParams.get('search') || undefined;

        const tasks = await TaskService.getTasks({
            userId: user.id,
            scope,
            status,
            priority,
            search,
        });

        return NextResponse.json({ success: true, tasks });
    } catch (e: any) {
        console.error('Task GET error:', e);
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'create', 'tasks')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await req.json();
        if (!body.title) {
            return NextResponse.json({ success: false, message: 'Görev başlığı zorunludur' }, { status: 400 });
        }

        const task = await TaskService.createTask({
            ...body,
            createdById: user.id,
            actorName: user.name,
        });

        return NextResponse.json({ success: true, task }, { status: 201 });
    } catch (e: any) {
        console.error('Task POST error:', e);
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'edit', 'tasks')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await req.json();
        const { taskId, status, checklistItemId, isCompleted, comment } = body;

        if (!taskId) {
            return NextResponse.json({ success: false, message: 'Görev ID zorunludur' }, { status: 400 });
        }

        if (status) {
            const updated = await TaskService.updateStatus(taskId, status, { id: user.id, name: user.name });
            return NextResponse.json({ success: true, task: updated });
        }

        if (checklistItemId !== undefined && isCompleted !== undefined) {
            const updated = await TaskService.toggleChecklistItem(checklistItemId, Boolean(isCompleted));
            return NextResponse.json({ success: true, item: updated });
        }

        if (comment) {
            const commentRecord = await TaskService.addComment(taskId, comment, { id: user.id, name: user.name });
            return NextResponse.json({ success: true, comment: commentRecord });
        }

        return NextResponse.json({ success: false, message: 'Geçersiz güncelleme parametresi' }, { status: 400 });
    } catch (e: any) {
        console.error('Task PUT error:', e);
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
