import { NextRequest, NextResponse } from 'next/server';
import { EntrepreneurService } from '@/lib/services/entrepreneur-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'entrepreneurs')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const entrepreneur = await EntrepreneurService.getEntrepreneurById(id);
        if (!entrepreneur) return NextResponse.json({ success: false, message: 'Bulunamadı' }, { status: 404 });

        return NextResponse.json({ success: true, entrepreneur });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'edit', 'entrepreneurs')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        const entrepreneur = await EntrepreneurService.updateEntrepreneur(id, body, {
            id: user.id,
            name: user.name,
            email: user.email,
            ip,
            userAgent,
        });

        return NextResponse.json({ success: true, entrepreneur });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'delete', 'entrepreneurs')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        await EntrepreneurService.deleteEntrepreneur(id, {
            id: user.id,
            name: user.name,
            email: user.email,
            ip,
            userAgent,
        });

        return NextResponse.json({ success: true, message: 'Girişimci arşivlendi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
