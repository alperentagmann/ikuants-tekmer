import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { WorkTrackingService } from '@/lib/services/work-tracking-service';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, users: await WorkTrackingService.passTargets(auth.user, request.nextUrl.searchParams.get('includeSelf') === '1') });
    } catch (error) {
        return errorResponse(error, 'Kullanıcılar alınamadı');
    }
}
