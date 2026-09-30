import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { BoardService } from '@/lib/services/board-service';

export async function GET(request: NextRequest) {
    const auth = await getCurrentAdminUser();
    if (!auth) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const boardType = searchParams.get('type') || undefined;
        const members = await BoardService.getAdminBoardMembers(boardType);
        return NextResponse.json({ success: true, members });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await getCurrentAdminUser();
    if (!auth) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        if (!body.fullName || !body.title) {
            return NextResponse.json({ success: false, error: 'Ad Soyad ve Unvan zorunludur.' }, { status: 400 });
        }

        const member = await BoardService.createBoardMember(body, auth);
        return NextResponse.json({ success: true, member });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await getCurrentAdminUser();
    if (!auth) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        if (Array.isArray(body.orderedIds)) {
            await BoardService.reorderBoardMembers(body.orderedIds, auth);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, error: 'Geçersiz parametre.' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
