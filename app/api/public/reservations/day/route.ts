import { NextRequest, NextResponse } from 'next/server';
import { SpaceReservationService } from '@/lib/services/space-reservation-service';
import { enforceRateLimit } from '@/lib/rate-limit';
import { errorResponse } from '@/lib/api-guard';

/** GET ?spaceId&date=YYYY-MM-DD — busy time windows of a space (no requester data). */
export async function GET(request: NextRequest) {
    const limited = enforceRateLimit(request, { limit: 60, windowSeconds: 60, keyPrefix: 'space-day' });
    if (limited) return limited;
    try {
        const sp = request.nextUrl.searchParams;
        const date = sp.get('date') || '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ success: false, message: 'Tarih YYYY-AA-GG biçiminde olmalı' }, { status: 400 });
        const day = await SpaceReservationService.dayAvailability({ facilityId: sp.get('spaceId') || '', date, publicOnly: true });
        return NextResponse.json({ success: true, ...day });
    } catch (error) {
        return errorResponse(error, 'Doluluk bilgisi alınamadı');
    }
}
