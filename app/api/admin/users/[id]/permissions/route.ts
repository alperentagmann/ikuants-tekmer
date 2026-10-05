import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { PermissionAdminService, type OverrideState } from '@/lib/services/permission-admin-service';
import { hasPermission } from '@/lib/rbac';

type Params = { params: Promise<{ id: string }> };

/** Role permissions and personal overrides of a user. */
export async function GET(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'users');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const [state, catalog] = await Promise.all([PermissionAdminService.userState(id), PermissionAdminService.catalog()]);
        return NextResponse.json({ success: true, ...state, catalog, canManage: auth.user.isSuperAdmin || hasPermission(auth.user, 'manage', 'roles') });
    } catch (error) {
        return errorResponse(error, 'Yetkiler alınamadı');
    }
}

/** Body: { overrides: [{ permissionId, state: 'inherit' | 'grant' | 'deny' }] } */
export async function PUT(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'users');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = (await request.json()) as { overrides?: { permissionId: string; state: OverrideState }[] };
        const state = await PermissionAdminService.setUserOverrides(id, Array.isArray(body.overrides) ? body.overrides : [], auth.user);
        return NextResponse.json({ success: true, ...state });
    } catch (error) {
        return errorResponse(error, 'Yetkiler kaydedilemedi');
    }
}
