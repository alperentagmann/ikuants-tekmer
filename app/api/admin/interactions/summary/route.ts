import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { InteractionService } from '@/lib/services/interaction-service';

export async function GET(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date');
        const date = dateStr ? new Date(dateStr) : new Date();

        const summary = await InteractionService.getDailySummary(date);
        return NextResponse.json({ success: true, summary });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
