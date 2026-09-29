import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { UserManagementService } from '@/lib/services/user-management-service';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage_sessions', 'users') && !caller.isSuperAdmin && caller.id !== id)) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
        }

        const sessions = await UserManagementService.getUserSessions(id);
        return NextResponse.json({ success: true, sessions });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage_sessions', 'users') && !caller.isSuperAdmin && caller.id !== id)) {
            return NextResponse.json({ success: false, message: 'Oturum sonlandırma yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (sessionId) {
            await UserManagementService.revokeSession(sessionId, caller.id);
            return NextResponse.json({ success: true, message: 'Oturum başarıyla sonlandırıldı.' });
        } else {
            await UserManagementService.revokeAllUserSessions(id, caller.id);
            return NextResponse.json({ success: true, message: 'Kullanıcının tüm aktif oturumları sonlandırıldı.' });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}
