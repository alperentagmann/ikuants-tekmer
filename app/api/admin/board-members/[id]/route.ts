import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { BoardService } from '@/lib/services/board-service';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const { id } = await props.params;
        const member = await BoardService.getBoardMemberById(id);
        if (!member) return NextResponse.json({ success: false, error: 'Kayıt bulunamadı.' }, { status: 404 });
        return NextResponse.json({ success: true, member });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const { id } = await props.params;
        const body = await request.json();
        const member = await BoardService.updateBoardMember(id, body, auth);
        return NextResponse.json({ success: true, member });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const { id } = await props.params;
        await BoardService.deleteBoardMember(id, auth);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
