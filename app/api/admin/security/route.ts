import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { SecurityCenterService } from '@/lib/services/security-center-service';

export async function GET(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'view', 'security_center') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const view = searchParams.get('view');

        if (view === 'events') {
            const severity = searchParams.get('severity') || undefined;
            const eventType = searchParams.get('eventType') || undefined;
            const isResolved = searchParams.get('isResolved') !== null ? searchParams.get('isResolved') === 'true' : undefined;
            const page = parseInt(searchParams.get('page') || '1', 10);
            const limit = parseInt(searchParams.get('limit') || '20', 10);

            const events = await SecurityCenterService.getSecurityEvents({
                severity,
                eventType,
                isResolved,
                page,
                limit,
            });

            return NextResponse.json({ success: true, ...events });
        } else {
            const overview = await SecurityCenterService.getSecurityOverview();
            return NextResponse.json({ success: true, overview });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || !caller.isSuperAdmin) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
        }

        const body = await request.json();
        const { eventId } = body;

        if (!eventId) {
            return NextResponse.json({ success: false, message: 'eventId zorunludur.' }, { status: 400 });
        }

        const updated = await SecurityCenterService.resolveEvent(eventId, caller.id);
        return NextResponse.json({ success: true, event: updated, message: 'Olay çözüldü olarak işaretlendi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}
