import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revokeSession, getCurrentAdminUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(process.env.ADMIN_SESSION_COOKIE_NAME || '__session')?.value;
        const user = await getCurrentAdminUser();

        if (token) {
            await revokeSession(token);
        }

        if (user) {
            await logAuditEvent({
                actorId: user.id,
                actorEmail: user.email,
                actorName: user.name,
                action: 'LOGOUT',
                entityType: 'User',
                entityId: user.id,
                diff: 'Admin logged out',
            });
        }

        const response = NextResponse.json({ success: true, message: 'Çıkış yapıldı.' });
        response.cookies.delete(process.env.ADMIN_SESSION_COOKIE_NAME || '__session');
        return response;
    } catch {
        return NextResponse.json({ success: false, message: 'Çıkış yapılamadı.' }, { status: 500 });
    }
}
