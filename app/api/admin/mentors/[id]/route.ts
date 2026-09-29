import { NextRequest, NextResponse } from 'next/server';
import { MentorService } from '@/lib/services/mentor-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'mentors')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const mentor = await MentorService.getMentorById(id);
        if (!mentor) return NextResponse.json({ success: false, message: 'Bulunamadı' }, { status: 404 });

        return NextResponse.json({ success: true, mentor });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'edit', 'mentors')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        const mentor = await MentorService.updateMentor(id, body, {
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'delete', 'mentors')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        await MentorService.deleteMentor(id, {
            id: user.id,
            name: user.name,
            email: user.email,
            ip,
            userAgent,
        });

        return NextResponse.json({ success: true, message: 'Mentör arşivlendi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
