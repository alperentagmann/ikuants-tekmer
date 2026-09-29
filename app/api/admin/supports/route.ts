import { NextRequest, NextResponse } from 'next/server';
import { SupportService } from '@/lib/services/support-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
    try {
        const user = await getCurrentAdminUser();
        if (!user) return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });

        const supports = await SupportService.getAdminSupports();
        return NextResponse.json({ success: true, items: supports });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'create', 'settings')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        const support = await SupportService.createSupport(body, {
            id: user.id,
            name: user.name,
            email: user.email,
            ip,
            userAgent,
        });

        return NextResponse.json({ success: true, support });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
