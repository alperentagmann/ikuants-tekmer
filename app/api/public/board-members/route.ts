import { NextRequest, NextResponse } from 'next/server';
import { BoardService } from '@/lib/services/board-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const boardType = searchParams.get('type') || undefined;

        const members = await BoardService.getPublicBoardMembers(boardType);
        return NextResponse.json({ success: true, members });
    } catch (error: any) {
        return NextResponse.json({ success: false, members: [], error: error.message }, { status: 500 });
    }
}
