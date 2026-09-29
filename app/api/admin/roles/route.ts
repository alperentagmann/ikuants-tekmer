import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

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
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'manage', 'roles')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const { name, slug, description, permissionIds } = body;

        const role = await prisma.role.create({
            data: {
                name,
                slug,
                description,
                permissions: permissionIds ? {
                    create: permissionIds.map((pid: string) => ({ permissionId: pid })),
                } : undefined,
            },
        });

        await logAuditEvent({
            actorId: user.id,
            actorEmail: user.email,
            actorName: user.name,
            action: 'CREATE',
            entityType: 'Role',
            entityId: role.id,
            diff: `Created role "${role.name}" with ${permissionIds?.length || 0} permissions`,
        });

        return NextResponse.json({ success: true, role });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
