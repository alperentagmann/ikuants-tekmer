import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { hasPermission } from '@/lib/rbac';
import { FacilityUnitService, parseKind, type WritableKind } from '@/lib/services/facility-unit-service';

type P = { params: Promise<{ kind: string; id: string }> };

export async function GET(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'view', 'facilities');
    if (auth.error) return auth.error;
    try {
        const { kind, id } = await params;
        return NextResponse.json({ success: true, item: await FacilityUnitService.get(parseKind(kind, true) as WritableKind, id) });
    } catch (error) {
        return errorResponse(error, 'Kayıt alınamadı');
    }
}

/** Düzenleme (`expectedUpdatedAt` ile), `{ archived }` ile arşivle / geri al, tahsiste `{ end: true }` ile sonlandır. Kalıcı silme yok. */
export async function PATCH(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'update', 'facilities');
    if (auth.error) return auth.error;
    try {
        const { kind, id } = await params;
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        if (typeof body.archived === 'boolean' && !hasPermission(auth.user, 'delete', 'facilities')) {
            return NextResponse.json({ success: false, message: 'Arşivleme yetkiniz yok' }, { status: 403 });
        }
        return NextResponse.json({ success: true, item: await FacilityUnitService.update(parseKind(kind, true) as WritableKind, id, body, auth.user, auth.actor) });
    } catch (error) {
        return errorResponse(error, 'Kayıt güncellenemedi');
    }
}
