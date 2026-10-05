import { NextRequest, NextResponse } from 'next/server';
import { ProgramService } from '@/lib/services/program-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'programs')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        // Admin screens pass the program id; slugs still work for older links
        const program = (await ProgramService.getProgramById(id)) || (await ProgramService.getProgramBySlug(id));
        if (!program) return NextResponse.json({ success: false, message: 'Bulunamadı' }, { status: 404 });

        return NextResponse.json({ success: true, program });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'edit', 'programs')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        const program = await ProgramService.updateProgram(id, body, {
            id: user.id,
            name: user.name,
            email: user.email,
            ip,
            userAgent,
        });

        return NextResponse.json({ success: true, program });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'delete', 'programs')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        await ProgramService.deleteProgram(id, {
            id: user.id,
            name: user.name,
            email: user.email,
            ip,
            userAgent,
        });

        return NextResponse.json({ success: true, message: 'Program arşivlendi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
