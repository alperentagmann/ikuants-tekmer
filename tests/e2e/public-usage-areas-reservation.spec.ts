import { test, expect, type Page } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';
import { SpaceDomainService } from '../../lib/services/space-domain-service';

/**
 * Public reservation request (Form Center) → admin approval / rejection → outbox email.
 * All records use a per-run QA marker and are removed by exact id.
 */
test.describe('PUBLIC KULLANIM ALANLARI & REZERVASYON INTEGRATION E2E', () => {
    const RUN = `qa-e2e-rez-${Date.now().toString(36)}`;
    const TEST_EMAIL = `${RUN}@example.com`;
    const TEST_NAME = `QA Rezervasyon ${RUN}`;
    const TEST_COMPANY = 'QA Test Kurumu';
    const TEST_DATE = '2027-11-17'; // Wednesday

    const created = { reservations: new Set<string>(), submissions: new Set<string>() };

    test.afterAll(async () => {
        const reservations = await prisma.reservation.findMany({ where: { OR: [{ id: { in: [...created.reservations] } }, { requesterEmail: TEST_EMAIL }] }, select: { id: true, submissionId: true, attendeeNotes: true } });
        const ids = reservations.map((r) => r.id);
        reservations.forEach((r) => r.submissionId && created.submissions.add(r.submissionId));
        const references = reservations.map((r) => {
            try {
                return JSON.parse(r.attendeeNotes || '{}').reference as string | undefined;
            } catch {
                return undefined;
            }
        }).filter((x): x is string => Boolean(x));
        const outbox = await prisma.emailOutbox.findMany({ where: { OR: [{ recipientEmail: TEST_EMAIL }, ...references.map((ref) => ({ subject: { contains: ref } }))] }, select: { id: true } });
        const notifications = references.length ? await prisma.notification.findMany({ where: { OR: references.map((ref) => ({ message: { contains: ref } })) }, select: { id: true } }) : [];
        await prisma.notificationRead.deleteMany({ where: { notificationId: { in: notifications.map((n) => n.id) } } });
        await prisma.notification.deleteMany({ where: { id: { in: notifications.map((n) => n.id) } } });
        await prisma.emailOutbox.deleteMany({ where: { id: { in: outbox.map((o) => o.id) } } });
        await prisma.task.updateMany({ where: { reservationId: { in: ids } }, data: { reservationId: null } });
        await prisma.reservation.deleteMany({ where: { id: { in: ids } } });
        await prisma.submission.deleteMany({ where: { id: { in: [...created.submissions] } } });
        await prisma.$disconnect();
    });

    async function openReservationsTab(page: Page) {
        await page.goto('/admin/alanlar?tab=rezervasyonlar');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }

    test('1. Public /kullanim-alanlari -> Müsaitlik -> Rezervasyon Talebi -> Admin Onayı -> Outbox e-postası', async ({ page, context }) => {
        await page.goto('/kullanim-alanlari');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1', { hasText: 'Kullanım Alanları' })).toBeVisible();
        await expect(page.locator('text=Hemen Müsait Alan Bul')).toBeVisible();
        await expect(page.locator('text=Broadcasting Stüdyosu').first()).toBeVisible();

        const arvrCard = page.locator('div.group').filter({ hasText: 'AR/VR Stüdyosu' }).first();
        await arvrCard.getByRole('button', { name: /Talep Oluştur/i }).click();

        const modal = page.locator('div.fixed');
        await expect(modal.locator('h3', { hasText: 'Ortak Alan Rezervasyon Talebi' })).toBeVisible();

        await modal.locator('input[placeholder*="Ayşe Demir"]').fill(TEST_NAME);
        await modal.locator('input[placeholder*="ABC Teknoloji"]').fill(TEST_COMPANY);
        await modal.locator('input[placeholder*="ayse@example.com"]').fill(TEST_EMAIL);
        await modal.locator('input[placeholder*="0532"]').fill('0532 999 88 77');
        await modal.locator('input[type="date"]').fill(TEST_DATE);
        await modal.locator('input[type="time"]').first().fill('14:00');
        await modal.locator('input[type="time"]').nth(1).fill('16:00');
        await modal.locator('input[type="number"]').fill('6');
        await modal.locator('select').filter({ has: page.locator('option', { hasText: 'Mentörlük Görüşmesi' }) }).selectOption({ label: 'Toplantı' });

        // Live availability check (server-side rules)
        await expect(modal.locator('text=Seçtiğiniz saat aralığında alan müsait')).toBeVisible({ timeout: 10000 });

        const boxes = modal.locator('input[type="checkbox"]');
        for (let i = 0; i < (await boxes.count()); i++) await boxes.nth(i).check();

        // Form Center bot protection requires a minimum fill time
        await page.waitForTimeout(2200);
        const submitResponse = page.waitForResponse((r) => r.url().includes('/api/public/reservations') && !r.url().includes('availability') && r.request().method() === 'POST');
        await modal.getByRole('button', { name: /Rezervasyon Talebini Gönder/i }).click();
        const response = await submitResponse;
        expect(response.status(), await response.text()).toBe(200);

        await expect(page.getByRole('heading', { name: 'Rezervasyon Talebiniz Alındı' })).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text=Onay Bekliyor').first()).toBeVisible();
        const refText = (await page.locator('strong.text-primary').first().textContent()) || '';
        expect(refText).toMatch(/REZ-\d{4}-[A-F0-9]+/);
        // The site-wide success celebration appears above the confirmation; close it first
        const celebration = page.getByTestId('success-celebration');
        await expect(celebration).toBeVisible();
        await celebration.getByRole('button', { name: 'Harika!' }).click();
        await expect(celebration).toBeHidden();
        await page.getByRole('button', { name: 'Tamam' }).click();

        const dbReservation = await prisma.reservation.findFirst({ where: { requesterEmail: TEST_EMAIL } });
        expect(dbReservation).toBeTruthy();
        created.reservations.add(dbReservation!.id);
        expect(dbReservation!.status).toBe('PENDING_APPROVAL');
        expect(dbReservation!.source).toBe('PUBLIC');
        expect(dbReservation!.userId).toBeNull();

        await loginAsAdmin(context);
        await openReservationsTab(page);
        const row = page.locator('div').filter({ hasText: TEST_EMAIL }).filter({ has: page.getByRole('button', { name: 'Onayla' }) }).last();
        await expect(row).toBeVisible();
        await expect(row.locator('text=Onay bekliyor')).toBeVisible();
        await row.getByRole('button', { name: 'Onayla' }).click();

        await expect.poll(async () => (await prisma.reservation.findUnique({ where: { id: dbReservation!.id } }))?.status, { timeout: 10000 }).toBe('CONFIRMED');

        const approvalEmail = await prisma.emailOutbox.findFirst({ where: { recipientEmail: TEST_EMAIL, templateKey: 'RESERVATION_APPROVE' } });
        expect(approvalEmail).toBeTruthy();
        expect(approvalEmail!.subject).toContain('onaylandı');
        // Without an SMTP provider the message must not be marked as sent
        if (!process.env.SMTP_HOST) expect(approvalEmail!.status).not.toBe('SENT');
    });

    test('2. Admin talebi gerekçeyle reddeder -> gerekçeli outbox e-postası', async ({ page, context }) => {
        const facility = await prisma.facility.findFirst({ where: { title: 'Kapalı Toplantı Odası' } });
        expect(facility).toBeTruthy();
        const resource = await SpaceDomainService.ensureReservationResource(facility!.id);

        const reference = `REZ-2027-${RUN.slice(-6).toUpperCase()}`;
        const pending = await prisma.reservation.create({
            data: {
                resourceId: resource.id,
                userId: null,
                source: 'PUBLIC',
                title: `${reference} · ${TEST_NAME} · Kapalı Toplantı Odası`,
                startTime: new Date(`${TEST_DATE}T10:00:00+03:00`),
                endTime: new Date(`${TEST_DATE}T12:00:00+03:00`),
                status: 'PENDING_APPROVAL',
                attendeeCount: 4,
                requesterName: TEST_NAME,
                requesterEmail: TEST_EMAIL,
                purpose: 'QA yatırımcı görüşmesi',
                attendeeNotes: JSON.stringify({ reference }),
            },
        });
        created.reservations.add(pending.id);

        await loginAsAdmin(context);
        await openReservationsTab(page);
        const row = page.locator('div').filter({ hasText: TEST_EMAIL }).filter({ hasText: 'Kapalı Toplantı Odası' }).filter({ has: page.getByRole('button', { name: 'Reddet' }) }).last();
        await expect(row).toBeVisible();
        await row.getByRole('button', { name: 'Reddet' }).click();

        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Talebi reddet')).toBeVisible();
        await dialog.locator('#d-note').fill('Talep edilen saat uygun değildir.');
        await dialog.getByRole('button', { name: 'Gönder' }).click();

        await expect.poll(async () => (await prisma.reservation.findUnique({ where: { id: pending.id } }))?.status, { timeout: 10000 }).toBe('CANCELLED');
        const rejection = await prisma.emailOutbox.findFirst({ where: { recipientEmail: TEST_EMAIL, templateKey: 'RESERVATION_REJECT' } });
        expect(rejection).toBeTruthy();
        expect(rejection!.htmlBody).toContain('Talep edilen saat uygun değildir.');
    });

    test('3. Mobile Viewport (390px): Responsive without Modal Overflow', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/kullanim-alanlari');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1', { hasText: 'Kullanım Alanları' })).toBeVisible();

        const card = page.locator('div.group').first();
        await card.getByRole('button', { name: /Talep Oluştur/i }).click();

        const modal = page.locator('div.fixed').locator('div.relative').first();
        await expect(modal).toBeVisible();
        const box = await modal.boundingBox();
        expect(box).toBeTruthy();
        expect(box!.width).toBeLessThanOrEqual(390);
    });
});
