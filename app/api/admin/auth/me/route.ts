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
                roles: user.userRoles?.map((ur: any) => ur.role.name) || [],
                permissions: user.userRoles?.flatMap((ur: any) => ur.role.permissions.map((p: any) => `${p.permission.action}:${p.permission.resource}`)) || [],
            },
        });
    } catch {
        return NextResponse.json({ success: false, message: 'Oturum doğrulanamadı' }, { status: 401 });
    }
}
