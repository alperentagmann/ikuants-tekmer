import { NextRequest, NextResponse } from 'next/server';
import { SpaceReservationService } from '@/lib/services/space-reservation-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req, 'view', 'reservations');
    if (auth.error) return auth.error;
    try {
        const sp = req.nextUrl.searchParams;
        const from = sp.get('from');
        const to = sp.get('to');
        const result = await SpaceReservationService.list({
            status: sp.get('status') || undefined,
            facilityId: sp.get('facilityId') || undefined,
            search: sp.get('search') || undefined,
            from: from ? new Date(`${from}T00:00:00+03:00`) : undefined,
            to: to ? new Date(`${to}T23:59:59+03:00`) : undefined,
            page: Number(sp.get('page') || 1),
            limit: Number(sp.get('limit') || 50),
        });
        return NextResponse.json({ success: true, reservations: result.items, ...result });
    } catch (error) {
        return errorResponse(error, 'Rezervasyonlar yüklenemedi');
    }
}

/**
 * Actions:
 *   check_availability | create | approve | reject | cancel | suggest_time | suggest_space | link_requester
 */
export async function POST(req: NextRequest) {
    const auth = await requireAdmin(req, 'view', 'reservations');
    if (auth.error) return auth.error;
    try {
        const body = await req.json();
        const action = String(body.action || 'create');

        if (action === 'check_availability') {
            const result = await SpaceReservationService.checkAvailability({
                facilityId: body.spaceId,
                date: body.date,
                startTime: body.startTime,
                endTime: body.endTime,
                participants: Number(body.participantCount || body.attendeeCount || 1),
                excludeReservationId: body.reservationId,
                publicOnly: false,
            });
            return NextResponse.json({ success: true, ...result });
        }

        if (action === 'create') {
            if (!hasPermission(auth.user, 'create', 'reservations')) return NextResponse.json({ success: false, message: 'Rezervasyon oluşturma yetkiniz yok' }, { status: 403 });
            const reservation = await SpaceReservationService.adminCreate(
                {
                    facilityId: body.spaceId,
                    date: body.date,
                    startTime: body.startTime,
                    endTime: body.endTime,
                    participants: Number(body.attendeeCount || body.participantCount || 1),
                    title: body.title || 'Rezervasyon',
                    purpose: body.purpose,
                    notes: body.notes,
                    confirm: body.status === 'CONFIRMED' && hasPermission(auth.user, 'approve', 'reservations'),
                    personId: body.personId,
                    organizationId: body.organizationId,
                },
                auth.user
            );
            return NextResponse.json({ success: true, reservation, message: reservation.status === 'CONFIRMED' ? 'Rezervasyon oluşturuldu ve onaylandı.' : 'Rezervasyon oluşturuldu, onay bekliyor.' });
        }

        if (['approve', 'reject', 'cancel', 'suggest_time', 'suggest_space'].includes(action)) {
            if (!hasPermission(auth.user, 'approve', 'reservations')) return NextResponse.json({ success: false, message: 'Rezervasyon karar yetkiniz yok' }, { status: 403 });
            const reservation = await SpaceReservationService.decide(
                String(body.reservationId),
                action as 'approve' | 'reject' | 'cancel' | 'suggest_time' | 'suggest_space',
                { note: body.note || body.rejectionReason || null, suggestion: body.suggestion || null, alternativeFacilityId: body.alternativeFacilityId || null },
                auth.user
            );
            const messages: Record<string, string> = {
                approve: 'Rezervasyon onaylandı; talep sahibine e-posta kuyruğa alındı.',
                reject: 'Talep reddedildi; gerekçe e-postası kuyruğa alındı.',
                cancel: 'Rezervasyon iptal edildi.',
                suggest_time: 'Alternatif zaman önerisi talep sahibine iletildi.',
                suggest_space: 'Alternatif alan önerisi talep sahibine iletildi.',
            };
            return NextResponse.json({ success: true, reservation, message: messages[action] });
        }

        if (action === 'link_requester') {
            if (!hasPermission(auth.user, 'approve', 'reservations')) return NextResponse.json({ success: false, message: 'Yetkiniz yok' }, { status: 403 });
            const reservation = await SpaceReservationService.linkRequester(String(body.reservationId), { personId: body.personId, createPerson: body.createPerson === true, organizationId: body.organizationId }, auth.user);
            return NextResponse.json({ success: true, reservation, message: 'Talep sahibi CRM kaydına bağlandı.' });
        }

        return NextResponse.json({ success: false, message: 'Bilinmeyen işlem' }, { status: 400 });
    } catch (error) {
        return errorResponse(error, 'Rezervasyon işlemi tamamlanamadı');
    }
}
