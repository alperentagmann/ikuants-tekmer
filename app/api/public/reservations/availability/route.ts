import { NextRequest, NextResponse } from 'next/server';
import { SpaceReservationService } from '@/lib/services/space-reservation-service';
import { checkEndpointRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * Public availability check. Never returns who booked a slot, only whether it is free,
 * the known capacity and alternatives.
 */
export async function POST(req: NextRequest) {
    const limit = checkEndpointRateLimit(getClientIp(req), { limit: 60, windowSeconds: 60, keyPrefix: 'public-availability' });
    if (!limit.isAllowed) return NextResponse.json({ success: false, isAvailable: false, message: 'Çok fazla istek. Lütfen biraz bekleyin.' }, { status: 429 });

    try {
        const body = await req.json();
        const { spaceId, date, startTime, endTime, participantCount = 1 } = body;
        if (!spaceId || !date || !startTime || !endTime) {
            return NextResponse.json({ success: false, isAvailable: false, message: 'Müsaitlik kontrolü için alan, tarih ve saatler zorunludur.' }, { status: 400 });
        }
        const result = await SpaceReservationService.checkAvailability({ facilityId: String(spaceId), date: String(date), startTime: String(startTime), endTime: String(endTime), participants: Number(participantCount) || 1, publicOnly: true });
        return NextResponse.json({
            success: true,
            isAvailable: result.isAvailable,
            capacity: result.capacity,
            capacityWarning: result.capacityWarning,
            reasons: result.reasons,
            alternativeSlots: result.alternativeSlots,
            alternativeSpaces: result.alternativeSpaces,
            suggestedAlternativeSpace: result.alternativeSpaces.length ? result.alternativeSpaces.map((s) => s.title).join(', ') : null,
            message: result.isAvailable ? '✓ Seçtiğiniz saat aralığında alan müsait.' : `✕ ${result.reasons.join(' ')}`,
        });
    } catch (error) {
        const e = error as { name?: string; message?: string; status?: number };
        if (e.name === 'DomainError') {
            return NextResponse.json({ success: false, isAvailable: false, message: e.message }, { status: e.status || 400 });
        }
        console.error('Availability check failed:', error);
        return NextResponse.json({ success: false, isAvailable: false, message: 'Müsaitlik kontrolü sırasında bir hata oluştu.' }, { status: 500 });
    }
}
