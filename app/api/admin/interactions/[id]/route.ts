import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { InteractionService } from '@/lib/services/interaction-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    try {
        const item = await InteractionService.getInteractionById(id);
        if (!item) return NextResponse.json({ success: false, error: 'Kayıt bulunamadı' }, { status: 404 });
        return NextResponse.json({ success: true, item });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'update', 'interactions')) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const { id } = await params;
    try {
        const body = await req.json();
        const updated = await InteractionService.updateInteraction(id, body, auth.user.id);
        return NextResponse.json({ success: true, item: updated });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'delete', 'interactions')) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const { id } = await params;
    try {
        await InteractionService.deleteInteraction(id, auth.user.id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
