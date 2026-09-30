import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { InteractionService } from '@/lib/services/interaction-service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    try {
        let body: any = {};
        try { body = await req.json(); } catch {}
        const activity = await InteractionService.convertToActivity(id, body, auth.user.id);
        return NextResponse.json({ success: true, activity });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
