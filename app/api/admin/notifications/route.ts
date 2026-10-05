import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notification-service';
import { errorResponse } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    const user = await getCurrentAdminUser();
    if (!user) return NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 });
    try {
        const sp = request.nextUrl.searchParams;
        const [items, unreadCount] = await Promise.all([
            NotificationService.list(user, { unreadOnly: sp.get('unread') === 'true', limit: Number(sp.get('limit') || 20) }),
            NotificationService.unreadCount(user),
        ]);
        return NextResponse.json({ success: true, items, unreadCount });
    } catch (error) {
        return errorResponse(error, 'Bildirimler yüklenemedi');
    }
}

/** Body: { ids: string[] } to mark specific notifications, or { all: true }. */
export async function PATCH(request: NextRequest) {
    const user = await getCurrentAdminUser();
    if (!user) return NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 });
    try {
        const body = await request.json();
        if (body.all === true) {
            const count = await NotificationService.markAllRead(user);
            return NextResponse.json({ success: true, count });
        }
        await NotificationService.markRead(user, Array.isArray(body.ids) ? body.ids.map(String) : []);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Bildirim güncellenemedi');
    }
}
