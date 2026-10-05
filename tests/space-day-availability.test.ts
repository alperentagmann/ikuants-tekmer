/**
 * Public day timeline: returns only time windows (with buffers) and never requester data.
 * The QA reservation uses the "qa-day-" marker and is removed by exact id.
 */
import { test, describe, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { SpaceReservationService } from '../lib/services/space-reservation-service';

const RUN = `qa-day-${Date.now().toString(36)}`;
const created: string[] = [];

describe('Space day availability', () => {
    after(async () => {
        await prisma.reservation.deleteMany({ where: { id: { in: created } } });
        await prisma.$disconnect();
    });

    test('busy windows come back as times only', async (t) => {
        const facility = await prisma.facility.findFirst({ where: { isActive: true, title: 'Kapalı Toplantı Odası' } });
        if (!facility) return t.skip('seeded meeting room not found');
        const date = new Date(Date.now() + 30 * 86400000 + 3 * 3600000).toISOString().slice(0, 10);
        const r = await prisma.reservation.create({
            data: { resourceId: facility.id, title: `${RUN} toplantı`, startTime: new Date(`${date}T10:00:00+03:00`), endTime: new Date(`${date}T11:30:00+03:00`), status: 'PENDING_APPROVAL', requesterName: `${RUN} Gizli Kişi`, requesterEmail: `${RUN}@example.com`, source: 'PUBLIC' },
        });
        created.push(r.id);
        const day = await SpaceReservationService.dayAvailability({ facilityId: facility.id, date, publicOnly: true });
        const hit = day.busy.find((b) => b.start <= '10:00' && b.end >= '11:30');
        assert.ok(hit, 'reservation window is reported');
        assert.equal(hit.pending, true);
        assert.ok(!JSON.stringify(day).includes(RUN), 'no requester or title data leaks');
        assert.match(day.openTime, /^\d{2}:\d{2}$/);
        await assert.rejects(() => SpaceReservationService.dayAvailability({ facilityId: 'yok', date, publicOnly: true }), /bulunamadı/);
    });
});
