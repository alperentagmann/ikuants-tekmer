import { NextRequest, NextResponse } from 'next/server';
import { SpaceReservationService } from '@/lib/services/space-reservation-service';
import { FormSubmissionService, SubmissionError } from '@/lib/services/form-submission-service';
import { checkEndpointRateLimit, getClientIp } from '@/lib/rate-limit';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';
import { prisma } from '@/lib/prisma';

/** Requester details are a Form Center form; scheduling inputs are system fields. */
const RESERVATION_FORM_SLUG = 'rezervasyon-talep-formu';

function fail(message: string, status: number, extra: Record<string, unknown> = {}) {
    return NextResponse.json({ success: false, error: message, message, ...extra }, { status });
}

export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
    const limit = checkEndpointRateLimit(ip, { limit: 5, windowSeconds: 300, keyPrefix: 'public-reservation' });
    if (!limit.isAllowed) return fail(`Çok fazla talep gönderildi. Lütfen ${limit.resetSeconds} saniye sonra tekrar deneyin.`, 429);

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return fail('Geçersiz istek.', 400);
    }

    const spaceId = String(body.spaceId || '');
    const date = String(body.date || '');
    const startTime = String(body.startTime || '');
    const endTime = String(body.endTime || '');
    const participants = Math.max(1, Math.floor(Number(body.participantCount) || 1));
    if (!spaceId || !date || !startTime || !endTime) return fail('Alan, tarih ve saat seçimi zorunludur.', 400);

    // Values for the requester form (Form Center). The legacy flat body is mapped for compatibility.
    const values: Record<string, unknown> = body.values && typeof body.values === 'object'
        ? { ...(body.values as Record<string, unknown>) }
        : {
            requesterName: body.name,
            requesterOrganization: body.company,
            requesterEmail: body.email,
            requesterPhone: body.phone,
            purpose: body.purpose,
            notes: body.notes,
            kvkkConsent: body.kvkkConsent === true,
        };

    try {
        // Check scheduling rules first so no submission is stored for an impossible slot
        const availability = await SpaceReservationService.checkAvailability({ facilityId: spaceId, date, startTime, endTime, participants, publicOnly: true });
        if (!availability.isAvailable) {
            return fail(availability.reasons.join(' '), 409, { availability });
        }

        const facility = await prisma.facility.findUnique({ where: { id: spaceId }, select: { title: true } });
        const submission = await FormSubmissionService.submitPublicForm(
            RESERVATION_FORM_SLUG,
            { ...values, _hp: body._hp ?? body.honeypot, _ts: body._ts },
            {
                ipAddress: ip,
                userAgent: req.headers.get('user-agent') || undefined,
                idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined,
                context: { entityType: 'Facility', entityId: spaceId, label: facility?.title || 'Ortak alan' },
                skipNotifications: true,
            }
        );
        if (submission.duplicate) {
            const existing = await prisma.reservation.findFirst({ where: { submissionId: submission.submissionId } });
            return NextResponse.json({ success: true, duplicate: true, reservationId: existing?.id, message: 'Talebiniz daha önce alınmıştı.' });
        }

        let result;
        try {
            result = await SpaceReservationService.createPublicRequest({
                facilityId: spaceId,
                date,
                startTime,
                endTime,
                participants,
                submission: { id: submission.submissionId, submissionNumber: submission.submissionNumber, applicantName: submission.applicantName, applicantEmail: submission.applicantEmail, values: submission.values },
                ipAddress: ip,
            });
        } catch (error) {
            // Keep data consistent: a submission without its reservation is marked as such
            await prisma.submission.update({ where: { id: submission.submissionId }, data: { status: 'ARCHIVED' } }).catch(() => undefined);
            throw error;
        }

        EmailOutboxService.processPendingEmails(5).catch((err) => console.error('Outbox processing failed:', err));

        return NextResponse.json({
            success: true,
            reference: result.reference,
            reservationId: result.reservation.id,
            spaceName: result.facility.title,
            date,
            time: `${startTime} — ${endTime}`,
            participantCount: participants,
            status: 'PENDING_APPROVAL',
            message: submission.successMessage || 'Talebiniz İKÜANTS TEKMER ekibine iletilmiştir. İnceleme sonrasında e-posta ile bilgilendirileceksiniz.',
        });
    } catch (error) {
        const e = error as { name?: string; message?: string; status?: number; fieldErrors?: Record<string, string>; availability?: unknown };
        if (error instanceof SubmissionError || e.name === 'DomainError') {
            return fail(e.message || 'Talep gönderilemedi.', e.status || 400, { fieldErrors: e.fieldErrors, availability: e.availability });
        }
        console.error('Public reservation failed:', error);
        return fail('Rezervasyon talebi gönderilirken beklenmeyen bir hata oluştu.', 500);
    }
}
