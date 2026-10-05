import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { EmailOutboxService, escapeHtml } from '@/lib/services/email-outbox-service';
import { AdminAlertService } from '@/lib/services/admin-alert-service';
import { isMachineFacility } from '@/lib/machines';
import { SpaceDomainService, resolveVerifiedCapacity } from '@/lib/services/space-domain-service';

/**
 * Reservations of shared spaces (Facility master + Resource projection).
 * All times are Europe/Istanbul (UTC+03:00, no daylight saving since 2016).
 */
export const ISTANBUL_OFFSET = '+03:00';
const BLOCKING_STATUSES = ['CONFIRMED', 'PENDING_APPROVAL'];

export interface FacilitySettings {
    capacity: number | null;
    floor: string | null;
    squareMeters: number | null;
    status: string;
    reservationEnabled: boolean;
    publicVisible: boolean;
    approvalRequired: boolean;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    openTime: string | null;
    closeTime: string | null;
    workingDays: number[] | null; // 1 = Monday … 7 = Sunday
}

export function parseFacilitySettings(facility: { title: string; featuresJson: string | null }): FacilitySettings {
    let f: Record<string, unknown> = {};
    try {
        f = facility.featuresJson ? JSON.parse(facility.featuresJson) : {};
    } catch {
        f = {};
    }
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
    const time = (v: unknown) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null);
    return {
        capacity: resolveVerifiedCapacity(facility.title, num(f.capacity)),
        floor: typeof f.floor === 'string' && f.floor.trim() ? f.floor : null,
        squareMeters: num(f.squareMeters),
        status: typeof f.status === 'string' ? f.status : 'AVAILABLE',
        reservationEnabled: f.reservationEnabled === true,
        publicVisible: f.publicVisible !== false,
        approvalRequired: f.approvalRequired !== false,
        bufferBeforeMinutes: Math.max(0, num(f.bufferBeforeMinutes) ?? 0),
        bufferAfterMinutes: Math.max(0, num(f.bufferAfterMinutes) ?? 0),
        openTime: time(f.openTime),
        closeTime: time(f.closeTime),
        workingDays: Array.isArray(f.workingDays) ? (f.workingDays as unknown[]).map(Number).filter((d) => d >= 1 && d <= 7) : null,
    };
}

export function toIstanbulDate(date: string, time: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new DomainError('Geçersiz tarih veya saat.');
    const d = new Date(`${date}T${time}:00${ISTANBUL_OFFSET}`);
    if (Number.isNaN(d.getTime())) throw new DomainError('Geçersiz tarih veya saat.');
    return d;
}

export function formatIstanbul(d: Date, opts: Intl.DateTimeFormatOptions): string {
    return d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', ...opts });
}

function istanbulParts(d: Date) {
    const date = formatIstanbul(d, { year: 'numeric', month: '2-digit', day: '2-digit' }).split('.').reverse().join('-');
    const time = formatIstanbul(d, { hour: '2-digit', minute: '2-digit', hour12: false });
    const weekday = new Date(`${date}T12:00:00${ISTANBUL_OFFSET}`).getUTCDay();
    return { date, time, isoWeekday: weekday === 0 ? 7 : weekday };
}

export interface AvailabilityResult {
    isAvailable: boolean;
    reasons: string[];
    capacity: number | null;
    capacityWarning: string | null;
    conflictCount: number;
    alternativeSlots: string[];
    alternativeSpaces: { id: string; title: string; capacity: number | null }[];
}

async function overlapping(resourceId: string, start: Date, end: Date, settings: FacilitySettings, excludeId?: string) {
    // Each booking occupies [start - before, end + after]; two bookings conflict when these windows overlap.
    const margin = (settings.bufferBeforeMinutes + settings.bufferAfterMinutes) * 60000;
    const from = new Date(start.getTime() - margin);
    const to = new Date(end.getTime() + margin);
    return prisma.reservation.count({
        where: {
            resourceId,
            id: excludeId ? { not: excludeId } : undefined,
            status: { in: BLOCKING_STATUSES },
            startTime: { lt: to },
            endTime: { gt: from },
        },
    });
}

function ruleViolations(settings: FacilitySettings, start: Date, end: Date, participants: number): string[] {
    const reasons: string[] = [];
    if (!settings.reservationEnabled) reasons.push('Bu alan rezervasyona açık değil.');
    if (settings.status === 'MAINTENANCE') reasons.push('Alan bakımda.');
    if (settings.status === 'CLOSED') reasons.push('Alan kullanıma kapalı.');
    if (end <= start) reasons.push('Bitiş saati başlangıç saatinden sonra olmalıdır.');
    if (start.getTime() < Date.now() - 5 * 60000) reasons.push('Geçmiş bir zaman için rezervasyon yapılamaz.');
    const s = istanbulParts(start);
    const e = istanbulParts(end);
    if (s.date !== e.date) reasons.push('Rezervasyon aynı gün içinde başlayıp bitmelidir.');
    if (settings.workingDays && !settings.workingDays.includes(s.isoWeekday)) reasons.push('Seçilen gün alanın çalışma günleri dışında.');
    if (settings.openTime && s.time < settings.openTime) reasons.push(`Alan ${settings.openTime} saatinde açılır.`);
    if (settings.closeTime && e.time > settings.closeTime) reasons.push(`Alan ${settings.closeTime} saatinde kapanır.`);
    if (settings.capacity !== null && participants > settings.capacity) reasons.push(`Alan kapasitesi ${settings.capacity} kişidir (talep: ${participants}).`);
    return reasons;
}

function makeReference(): string {
    return `REZ-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export const SpaceReservationService = {
    async listBookableFacilities(publicOnly = true) {
        const facilities = await prisma.facility.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
        return facilities
            .map((f) => ({ facility: f, settings: parseFacilitySettings(f) }))
            .filter(({ settings }) => settings.reservationEnabled && (!publicOnly || settings.publicVisible));
    },

    /**
     * Busy windows of one space on one day for the public timeline. Only times are returned
     * (pending requests and confirmed bookings, including buffers) — never who booked.
     */
    async dayAvailability(params: { facilityId: string; date: string; publicOnly?: boolean }) {
        const facility = await prisma.facility.findUnique({ where: { id: params.facilityId } });
        if (!facility || !facility.isActive) throw new DomainError('Seçilen alan bulunamadı veya kullanıma kapalı.', 404);
        const settings = parseFacilitySettings(facility);
        if (params.publicOnly !== false && !settings.publicVisible) throw new DomainError('Seçilen alan bulunamadı.', 404);
        const open = settings.openTime || '09:00';
        const close = settings.closeTime || '18:00';
        const dayStart = toIstanbulDate(params.date, '00:00');
        const dayEnd = new Date(dayStart.getTime() + 86400000);
        const rows = await prisma.reservation.findMany({
            where: { resourceId: facility.id, status: { in: BLOCKING_STATUSES }, startTime: { lt: dayEnd }, endTime: { gt: dayStart } },
            select: { startTime: true, endTime: true, status: true },
            orderBy: { startTime: 'asc' },
        });
        const before = settings.bufferBeforeMinutes * 60000;
        const after = settings.bufferAfterMinutes * 60000;
        const clamp = (d: Date) => (d < dayStart ? dayStart : d > dayEnd ? dayEnd : d);
        const isoWeekday = istanbulParts(toIstanbulDate(params.date, '12:00')).isoWeekday;
        return {
            date: params.date,
            openTime: open,
            closeTime: close,
            isWorkingDay: !settings.workingDays || settings.workingDays.includes(isoWeekday),
            reservationEnabled: settings.reservationEnabled,
            status: settings.status,
            busy: rows.map((r) => ({
                start: istanbulParts(clamp(new Date(r.startTime.getTime() - before))).time,
                end: clamp(new Date(r.endTime.getTime() + after)).getTime() === dayEnd.getTime() ? '24:00' : istanbulParts(clamp(new Date(r.endTime.getTime() + after))).time,
                pending: r.status === 'PENDING_APPROVAL',
            })),
        };
    },

    async checkAvailability(params: { facilityId: string; date: string; startTime: string; endTime: string; participants?: number; excludeReservationId?: string; publicOnly?: boolean }): Promise<AvailabilityResult> {
        const facility = await prisma.facility.findUnique({ where: { id: params.facilityId } });
        if (!facility || !facility.isActive) throw new DomainError('Seçilen alan bulunamadı veya kullanıma kapalı.', 404);
        const settings = parseFacilitySettings(facility);
        if (params.publicOnly && !settings.publicVisible) throw new DomainError('Seçilen alan bulunamadı.', 404);

        const start = toIstanbulDate(params.date, params.startTime);
        const end = toIstanbulDate(params.date, params.endTime);
        const participants = Math.max(1, Math.floor(params.participants || 1));
        const reasons = ruleViolations(settings, start, end, participants);
        const conflictCount = reasons.length && end <= start ? 0 : await overlapping(facility.id, start, end, settings, params.excludeReservationId);
        if (conflictCount > 0) reasons.push('Seçilen saat aralığında bu alan için başka bir talep veya onaylı rezervasyon var.');

        const alternativeSlots: string[] = [];
        const alternativeSpaces: AvailabilityResult['alternativeSpaces'] = [];
        if (reasons.length > 0 && end > start) {
            // Same duration, later on the same day, in 30-minute steps, within opening hours
            const duration = end.getTime() - start.getTime();
            const dayStart = toIstanbulDate(params.date, settings.openTime || '09:00');
            const dayEnd = toIstanbulDate(params.date, settings.closeTime || '18:00');
            for (let t = dayStart.getTime(); t + duration <= dayEnd.getTime() && alternativeSlots.length < 3; t += 30 * 60000) {
                const s = new Date(t);
                const e = new Date(t + duration);
                if (s.getTime() === start.getTime() || s.getTime() < Date.now()) continue;
                if (ruleViolations(settings, s, e, participants).length) continue;
                if ((await overlapping(facility.id, s, e, settings, params.excludeReservationId)) === 0) {
                    alternativeSlots.push(`${istanbulParts(s).time} — ${istanbulParts(e).time}`);
                }
            }
            // Other bookable spaces free at the requested time with enough known capacity
            const others = await SpaceReservationService.listBookableFacilities(params.publicOnly !== false);
            for (const { facility: other, settings: os } of others) {
                if (other.id === facility.id || alternativeSpaces.length >= 3) continue;
                if (ruleViolations(os, start, end, participants).length) continue;
                const resource = await prisma.resource.findUnique({ where: { id: other.id } });
                if (!resource) continue;
                if ((await overlapping(other.id, start, end, os)) === 0) alternativeSpaces.push({ id: other.id, title: other.title, capacity: os.capacity });
            }
        }

        return {
            isAvailable: reasons.length === 0,
            reasons,
            capacity: settings.capacity,
            capacityWarning: settings.capacity === null ? 'Bu alanın kapasite bilgisi girilmemiş; ekibimiz uygunluğu teyit edecektir.' : null,
            conflictCount,
            alternativeSlots,
            alternativeSpaces,
        };
    },

    /** Public request: validated scheduling + Form Center requester form. No CRM person is created automatically. */
    async createPublicRequest(params: {
        facilityId: string;
        date: string;
        startTime: string;
        endTime: string;
        participants: number;
        submission: { id: string; submissionNumber: string; applicantName: string; applicantEmail: string | null; values: Record<string, unknown> };
        ipAddress?: string;
    }) {
        const availability = await SpaceReservationService.checkAvailability({ ...params, publicOnly: true });
        if (!availability.isAvailable) {
            const err = new DomainError(availability.reasons.join(' '), 409) as DomainError & { availability?: AvailabilityResult };
            err.availability = availability;
            throw err;
        }
        const facility = await prisma.facility.findUniqueOrThrow({ where: { id: params.facilityId } });
        const resource = await SpaceDomainService.ensureReservationResource(facility.id);
        const start = toIstanbulDate(params.date, params.startTime);
        const end = toIstanbulDate(params.date, params.endTime);
        const reference = makeReference();
        const v = params.submission.values;
        const str = (k: string) => (typeof v[k] === 'string' && (v[k] as string).trim() ? (v[k] as string).trim() : null);

        const reservation = await prisma.reservation.create({
            data: {
                resourceId: resource.id,
                userId: null,
                source: 'PUBLIC',
                title: `${reference} · ${params.submission.applicantName} · ${facility.title}`,
                startTime: start,
                endTime: end,
                status: 'PENDING_APPROVAL',
                attendeeCount: params.participants,
                requesterName: params.submission.applicantName,
                requesterEmail: params.submission.applicantEmail,
                requesterPhone: str('requesterPhone') || str('phone'),
                requesterOrganization: str('requesterOrganization') || str('company'),
                purpose: str('purpose'),
                agenda: str('purpose'),
                attendeeNotes: JSON.stringify({ reference, submissionNumber: params.submission.submissionNumber }),
                meetingNotes: str('notes'),
                submissionId: params.submission.id,
            },
        });

        const when = `${formatIstanbul(start, { dateStyle: 'long' })} ${formatIstanbul(start, { hour: '2-digit', minute: '2-digit' })}–${formatIstanbul(end, { hour: '2-digit', minute: '2-digit' })}`;
        const isMachine = isMachineFacility(facility);
        await prisma.notification.create({
            data: {
                title: 'Yeni Rezervasyon Talebi',
                message: `${facility.title} · ${when} · ${params.submission.applicantName} (${reference})`,
                notificationType: 'NEW_RESERVATION',
                targetUrl: `/admin/alanlar?tab=rezervasyonlar&reservationId=${reservation.id}`,
            },
        });

        await AdminAlertService.notify('RESERVATION_NEW', {
            subject: `Yeni rezervasyon talebi — ${facility.title} (${reference})`,
            heading: isMachine ? 'Yeni makine rezervasyon talebi' : 'Yeni rezervasyon talebi',
            rows: [
                ['Referans', reference],
                [isMachine ? 'Makine' : 'Alan', facility.title],
                ['Zaman', when],
                ['Katılımcı', params.participants],
                ['Talep eden', params.submission.applicantName],
            ],
            link: `/admin/alanlar?tab=rezervasyonlar&reservationId=${reservation.id}`,
            entityType: 'RESERVATION',
            entityId: reservation.id,
        });
        if (params.submission.applicantEmail) {
            await EmailOutboxService.enqueueEmail({
                recipientEmail: params.submission.applicantEmail,
                recipientName: params.submission.applicantName,
                subject: `Rezervasyon talebiniz alındı — ${reference}`,
                templateKey: 'RESERVATION_RECEIVED_USER',
                htmlBody: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#333"><h2>Rezervasyon talebiniz alındı</h2>
                    <p>Sayın <strong>${escapeHtml(params.submission.applicantName)}</strong>,</p>
                    <p><strong>${escapeHtml(facility.title)}</strong> için ${escapeHtml(when)} talebiniz alınmıştır ve onay beklemektedir.</p>
                    <p><strong>Referans:</strong> ${escapeHtml(reference)}</p></div>`,
                entityType: 'RESERVATION',
                entityId: reservation.id,
            });
        }

        await logAuditEvent({
            action: 'CREATE',
            entityType: 'Reservation',
            entityId: reservation.id,
            newValues: { reference, facility: facility.title, start: start.toISOString(), end: end.toISOString(), status: 'PENDING_APPROVAL', source: 'PUBLIC' },
            ipAddress: params.ipAddress,
        });

        return { reservation, reference, facility, start, end, when };
    },

    async adminCreate(params: { facilityId: string; date: string; startTime: string; endTime: string; participants: number; title: string; purpose?: string | null; confirm: boolean; personId?: string | null; organizationId?: string | null; notes?: string | null }, actor: { id: string; name: string; email: string }) {
        const availability = await SpaceReservationService.checkAvailability({ ...params, publicOnly: false });
        if (!availability.isAvailable) throw new DomainError(availability.reasons.join(' '), 409);
        const resource = await SpaceDomainService.ensureReservationResource(params.facilityId);
        const reservation = await prisma.reservation.create({
            data: {
                resourceId: resource.id,
                userId: actor.id,
                source: 'ADMIN',
                title: params.title.trim(),
                startTime: toIstanbulDate(params.date, params.startTime),
                endTime: toIstanbulDate(params.date, params.endTime),
                status: params.confirm ? 'CONFIRMED' : 'PENDING_APPROVAL',
                attendeeCount: Math.max(1, params.participants || 1),
                purpose: params.purpose || null,
                agenda: params.purpose || null,
                meetingNotes: params.notes || null,
                personId: params.personId || null,
                organizationId: params.organizationId || null,
                decidedById: params.confirm ? actor.id : null,
                decidedAt: params.confirm ? new Date() : null,
            },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'Reservation', entityId: reservation.id, newValues: { title: reservation.title, status: reservation.status } });
        return reservation;
    },

    /** Admin decisions. Approval re-checks every rule server-side. */
    async decide(
        reservationId: string,
        decision: 'approve' | 'reject' | 'cancel' | 'suggest_time' | 'suggest_space',
        data: { note?: string | null; suggestion?: string | null; alternativeFacilityId?: string | null },
        actor: { id: string; name: string; email: string }
    ) {
        const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, include: { resource: true } });
        if (!reservation) throw new DomainError('Rezervasyon bulunamadı.', 404);
        const facility = await prisma.facility.findUnique({ where: { id: reservation.resourceId } });
        const facilityTitle = facility?.title || reservation.resource.name;
        const reference = (() => {
            try {
                return JSON.parse(reservation.attendeeNotes || '{}').reference || reservation.id.slice(0, 8).toUpperCase();
            } catch {
                return reservation.id.slice(0, 8).toUpperCase();
            }
        })();

        let status = reservation.status;
        let subject = '';
        let body = '';

        if (decision === 'approve') {
            if (reservation.status !== 'PENDING_APPROVAL') throw new DomainError('Yalnız onay bekleyen talepler onaylanabilir.');
            if (facility) {
                const settings = parseFacilitySettings(facility);
                const reasons = ruleViolations({ ...settings, reservationEnabled: true }, reservation.startTime, reservation.endTime, reservation.attendeeCount).filter((r) => !r.startsWith('Geçmiş'));
                if (reservation.startTime.getTime() < Date.now()) reasons.push('Talep edilen zaman geçmiş.');
                const margin = (settings.bufferBeforeMinutes + settings.bufferAfterMinutes) * 60000;
                const conflicts = await prisma.reservation.count({
                    where: { id: { not: reservation.id }, resourceId: reservation.resourceId, status: 'CONFIRMED', startTime: { lt: new Date(reservation.endTime.getTime() + margin) }, endTime: { gt: new Date(reservation.startTime.getTime() - margin) } },
                });
                if (conflicts > 0) reasons.push('Bu saat aralığında onaylanmış başka bir rezervasyon var.');
                if (reasons.length) throw new DomainError(`Onay verilemez: ${reasons.join(' ')}`, 409);
            }
            status = 'CONFIRMED';
            subject = `Rezervasyonunuz onaylandı — ${reference}`;
            body = 'Rezervasyon talebiniz onaylanmıştır.';
        } else if (decision === 'reject' || decision === 'cancel') {
            if (!data.note?.trim()) throw new DomainError('Gerekçe yazın.');
            status = 'CANCELLED';
            subject = decision === 'reject' ? `Rezervasyon talebiniz hakkında — ${reference}` : `Rezervasyonunuz iptal edildi — ${reference}`;
            body = decision === 'reject' ? `Talebiniz uygun bulunmamıştır. Gerekçe: ${data.note}` : `Rezervasyonunuz iptal edilmiştir. Gerekçe: ${data.note}`;
        } else if (decision === 'suggest_time' || decision === 'suggest_space') {
            if (reservation.status !== 'PENDING_APPROVAL') throw new DomainError('Öneri yalnız onay bekleyen talepler için yapılabilir.');
            if (!data.suggestion?.trim()) throw new DomainError('Önerinizi yazın.');
            subject = `Rezervasyon talebiniz için alternatif öneri — ${reference}`;
            body = `${decision === 'suggest_space' ? 'Alternatif alan önerisi' : 'Alternatif zaman önerisi'}: ${data.suggestion}${data.note ? ` — ${data.note}` : ''}`;
        }

        const updated = await prisma.reservation.update({
            where: { id: reservationId },
            data: {
                status,
                decisionNote: data.note || null,
                alternativeJson: decision.startsWith('suggest') ? JSON.stringify({ type: decision, suggestion: data.suggestion, alternativeFacilityId: data.alternativeFacilityId || null, at: new Date().toISOString() }) : reservation.alternativeJson,
                decidedById: actor.id,
                decidedAt: new Date(),
            },
        });

        if (reservation.requesterEmail) {
            const when = `${formatIstanbul(reservation.startTime, { dateStyle: 'long' })} ${formatIstanbul(reservation.startTime, { hour: '2-digit', minute: '2-digit' })}–${formatIstanbul(reservation.endTime, { hour: '2-digit', minute: '2-digit' })}`;
            await EmailOutboxService.enqueueEmail({
                recipientEmail: reservation.requesterEmail,
                recipientName: reservation.requesterName || undefined,
                subject,
                templateKey: `RESERVATION_${decision.toUpperCase()}`,
                htmlBody: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#333"><p>Sayın <strong>${escapeHtml(reservation.requesterName || '')}</strong>,</p>
                    <p><strong>${escapeHtml(facilityTitle)}</strong> · ${escapeHtml(when)}</p><p>${escapeHtml(body)}</p><p>Referans: ${escapeHtml(reference)}</p></div>`,
                entityType: 'RESERVATION',
                entityId: reservation.id,
            });
        }

        await prisma.activityTimeline.create({
            data: { entityType: 'Reservation', entityId: reservation.id, title: { approve: 'Onaylandı', reject: 'Reddedildi', cancel: 'İptal edildi', suggest_time: 'Alternatif zaman önerildi', suggest_space: 'Alternatif alan önerildi' }[decision], description: data.note || data.suggestion || null, eventType: 'STATUS_CHANGE', actorId: actor.id, actorName: actor.name },
        });
        await logAuditEvent({
            actorId: actor.id,
            actorEmail: actor.email,
            actorName: actor.name,
            action: decision.toUpperCase(),
            entityType: 'Reservation',
            entityId: reservation.id,
            oldValues: { status: reservation.status },
            newValues: { status, note: data.note || null, suggestion: data.suggestion || null },
        });
        return updated;
    },

    /** Explicit admin decision to link the requester to CRM (existing person or a new one). */
    async linkRequester(reservationId: string, params: { personId?: string | null; createPerson?: boolean; organizationId?: string | null }, actor: { id: string; name: string; email: string }) {
        const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
        if (!reservation) throw new DomainError('Rezervasyon bulunamadı.', 404);
        let personId = params.personId || null;
        if (!personId && params.createPerson) {
            if (!reservation.requesterName) throw new DomainError('Talep sahibinin adı yok.');
            const parts = reservation.requesterName.trim().split(/\s+/);
            const lastName = parts.length > 1 ? parts.pop()! : '';
            const email = reservation.requesterEmail?.toLowerCase() || null;
            if (email) {
                const existing = await prisma.person.findUnique({ where: { email } });
                if (existing) throw new DomainError(`Bu e-posta ile kayıtlı kişi var: ${existing.fullName}. Mevcut kişiye bağlayın.`, 409);
            }
            const person = await prisma.person.create({
                data: { firstName: parts.join(' ') || reservation.requesterName, lastName, fullName: reservation.requesterName.trim(), email, phone: reservation.requesterPhone, dataSource: 'RESERVATION' },
            });
            personId = person.id;
            await logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', entityType: 'Person', entityId: person.id, diff: `Rezervasyon talebinden kişi oluşturuldu: ${person.fullName}` });
        }
        const updated = await prisma.reservation.update({
            where: { id: reservationId },
            data: { personId: personId ?? undefined, organizationId: params.organizationId === undefined ? undefined : params.organizationId },
        });
        if (reservation.submissionId) {
            await prisma.submission.update({ where: { id: reservation.submissionId }, data: { personId: personId ?? undefined, organizationId: params.organizationId === undefined ? undefined : params.organizationId } });
        }
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'Reservation', entityId: reservationId, newValues: { personId, organizationId: params.organizationId ?? null }, diff: 'Talep sahibi CRM kaydına bağlandı' });
        return updated;
    },

    async list(params: { status?: string; facilityId?: string; from?: Date; to?: Date; search?: string; page?: number; limit?: number }) {
        const where: Record<string, unknown> = {};
        if (params.status && params.status !== 'ALL') where.status = params.status;
        if (params.facilityId) where.resourceId = params.facilityId;
        if (params.from || params.to) where.startTime = { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) };
        if (params.search) {
            where.OR = [
                { title: { contains: params.search, mode: 'insensitive' } },
                { requesterName: { contains: params.search, mode: 'insensitive' } },
                { requesterEmail: { contains: params.search, mode: 'insensitive' } },
                { requesterOrganization: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        const limit = Math.min(200, params.limit || 50);
        const page = Math.max(1, params.page || 1);
        const [items, total] = await Promise.all([
            prisma.reservation.findMany({
                where,
                include: {
                    resource: { select: { id: true, name: true, capacity: true } },
                    user: { select: { id: true, name: true } },
                    person: { select: { id: true, fullName: true } },
                    organization: { select: { id: true, name: true } },
                },
                orderBy: [{ status: 'desc' }, { startTime: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.reservation.count({ where }),
        ]);
        return { items, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
    },
};
