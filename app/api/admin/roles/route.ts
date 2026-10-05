import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { PermissionAdminService } from '@/lib/services/permission-admin-service';

export async function GET() {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'users')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const roles = await prisma.role.findMany({
            include: {
                permissions: {
                    include: { permission: true },
                },
                _count: { select: { userRoles: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        const allPermissions = await prisma.permission.findMany({
            orderBy: [{ resource: 'asc' }, { action: 'asc' }],
        });

        return NextResponse.json({ success: true, roles, permissions: allPermissions });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'users');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { name?: string; description?: string | null; permissionIds?: string[] };
        const role = await PermissionAdminService.createRole({ name: String(body.name || ''), description: body.description, permissionIds: Array.isArray(body.permissionIds) ? body.permissionIds.map(String) : [] }, auth.user);
        return NextResponse.json({ success: true, role });
    } catch (error) {
        return errorResponse(error, 'Rol oluşturulamadı');
    }
}
