import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RentService } from '@/lib/services/rent-service';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await context.params;

        const summary = await RentService.getEntrepreneurRentSummary(id);
        return NextResponse.json({ success: true, summary });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Kira özeti yüklenemedi' },
            { status: error.message?.includes('Unauthorized') ? 401 : 500 }
        );
    }
}
