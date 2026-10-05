import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { PermissionAdminService } from '@/lib/services/permission-admin-service';

type Params = { params: Promise<{ id: string }> };

/** Body: { name?, description?, permissionIds? } */
export async function PUT(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'users');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = (await request.json()) as { name?: string; description?: string | null; permissionIds?: string[] };
        const role = await PermissionAdminService.updateRole(id, { name: body.name, description: body.description, permissionIds: Array.isArray(body.permissionIds) ? body.permissionIds.map(String) : undefined }, auth.user);
        return NextResponse.json({ success: true, role });
    } catch (error) {
        return errorResponse(error, 'Rol güncellenemedi');
    }
}

export async function DELETE(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'users');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        await PermissionAdminService.deleteRole(id, auth.user);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Rol silinemedi');
    }
}
