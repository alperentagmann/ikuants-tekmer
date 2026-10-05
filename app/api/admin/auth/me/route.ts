import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentAdminUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isSuperAdmin: user.isSuperAdmin,
                roles: user.userRoles?.map((ur) => ur.role.name) || [],
                permissions: Array.from(new Set([
                    ...(user.userRoles?.flatMap((ur) => ur.role.permissions.map((p) => `${p.permission.action}:${p.permission.resource}`)) || []),
                    ...(user.userPermissions?.filter((up) => up.isGranted).map((up) => `${up.permission.action}:${up.permission.resource}`) || []),
                ])).filter((perm) => !(user.userPermissions || []).some((up) => !up.isGranted && `${up.permission.action}:${up.permission.resource}` === perm)),
            },
        });
    } catch {
        return NextResponse.json({ success: false, message: 'Oturum doğrulanamadı' }, { status: 401 });
    }
}
