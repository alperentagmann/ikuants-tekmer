import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { ReceivableService } from '@/lib/services/receivable-service';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'manage', 'finance') && !hasPermission(auth.user, 'update', 'finance')) {
            return NextResponse.json({ success: false, error: 'Alacak güncelleme yetkiniz bulunmuyor' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();

        const updated = await ReceivableService.updateReceivable(id, body, auth.user.id);
        return NextResponse.json({ success: true, receivable: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Alacak güncellenemedi' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'manage', 'finance') && !hasPermission(auth.user, 'delete', 'finance')) {
            return NextResponse.json({ success: false, error: 'Alacak silme yetkiniz bulunmuyor' }, { status: 403 });
        }

        const { id } = await params;
        await ReceivableService.deleteReceivable(id, auth.user.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Alacak silinemedi' }, { status: 500 });
    }
}
