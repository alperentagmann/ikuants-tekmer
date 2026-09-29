import { NextRequest, NextResponse } from 'next/server';
import { MentorService } from '@/lib/services/mentor-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'mentors')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const result = await MentorService.getAdminMentors({ search, page, limit });
        return NextResponse.json({ success: true, ...result });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata oluştu' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'create', 'mentors')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        const mentor = await MentorService.createMentor(body, {
            id: user.id,
            name: user.name,
            email: user.email,
            ip,
            userAgent,
        });

        return NextResponse.json({ success: true, mentor });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
