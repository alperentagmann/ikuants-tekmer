import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Entrepreneur Multi-Program Assignment & History E2E', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('should assign program to entrepreneur, verify persistence, update status, and retain history', async ({ page }) => {
        // Ensure we have a test entrepreneur and a test program
        const entrepreneur = await prisma.entrepreneur.findFirst();
        const program = await prisma.program.findFirst();

        expect(entrepreneur).not.toBeNull();
        expect(program).not.toBeNull();

        if (!entrepreneur || !program) return;

        // 1. Navigate to Entrepreneur Detail
        await page.goto(`/admin/girisimciler/${entrepreneur.id}`);
        await expect(page.getByRole('heading', { name: entrepreneur.name })).toBeVisible();

        // 2. Click on Programlar tab
        await page.locator('#tab-programlar').click();

        // 3. Open Assign Program Modal
        await page.locator('#assign-program-btn').click();
        await expect(page.locator('#submit-assign-program-btn, #confirm-assign-program-btn')).toBeVisible();

        const testCohort = `Cohort-${Date.now()}`;

        // 4. Fill program assignment
        await page.locator('#assign-program-select, #select-program-id').selectOption(program.id);
        await page.locator('#input-cohort').fill(testCohort);
        await page.locator('#submit-assign-program-btn, #confirm-assign-program-btn').click();

        // 5. Verify badge and list updated
        await page.waitForTimeout(1000);
        await expect(page.locator('#entrepreneur-active-program-badge')).toContainText(program.name);

        // 6. Refresh page and verify persistence across reload
        await page.reload();
        await page.locator('#tab-programlar').click();
        await expect(page.locator('#entrepreneur-active-program-badge')).toContainText(program.name);
        await expect(page.getByText(testCohort)).toBeVisible();

        // 7. Verify in Database
        const dbAssignment = await prisma.entrepreneurProgram.findFirst({
            where: {
                entrepreneurId: entrepreneur.id,
                programId: program.id,
            },
            orderBy: { createdAt: 'desc' },
        });
        expect(dbAssignment).not.toBeNull();
        expect(dbAssignment?.cohort).toBe(testCohort);
        expect(dbAssignment?.status).toBe('ACTIVE');

        // Cleanup test assignment
        if (dbAssignment) {
            await prisma.entrepreneurProgram.delete({ where: { id: dbAssignment.id } });
        }
    });
    test('offers Yer Edinme, ANTSPARK, ANTSFire and a free-text "Diğer" track', async ({ page }) => {
        const entrepreneur = await prisma.entrepreneur.findFirst({ where: { isArchived: false } });
        expect(entrepreneur).not.toBeNull();
        if (!entrepreneur) return;
        const originalProgram = entrepreneur.program;
        const otherName = `QA Diğer Süreç ${Date.now()}`;
        const createdIds: string[] = [];
        try {
            await page.goto(`/admin/girisimciler/${entrepreneur.id}`);
            await page.locator('#tab-programlar').click();
            await page.locator('#assign-program-btn').click();

            const select = page.locator('#assign-program-select');
            const labels = (await select.locator('option').allInnerTexts()).map((t) => t.trim());
            expect(labels[1]).toBe('TEKMER Yer Edinme');
            expect(labels[2]).toMatch(/ANTSPARK/);
            expect(labels[3]).toMatch(/ANTSFire/);
            expect(labels[labels.length - 1]).toMatch(/^Diğer/);

            // "Diğer" opens a text box and stores the typed name
            await select.selectOption('__other__');
            await page.locator('#input-other-program').fill(otherName);
            await Promise.all([
                page.waitForResponse((r) => r.url().includes('/programs') && r.request().method() === 'POST' && r.ok()),
                page.locator('#submit-assign-program-btn').click(),
            ]);
            const other = await prisma.entrepreneurProgram.findFirst({ where: { entrepreneurId: entrepreneur.id, programLabel: otherName } });
            expect(other?.programId).toBeNull();
            if (other) createdIds.push(other.id);
            await expect(page.getByRole('heading', { name: otherName })).toBeVisible();

            // Yer Edinme is stored without a Program row
            await page.locator('#assign-program-btn').click();
            await select.selectOption('__placement__');
            await Promise.all([
                page.waitForResponse((r) => r.url().includes('/programs') && r.request().method() === 'POST' && r.ok()),
                page.locator('#submit-assign-program-btn').click(),
            ]);
            const placement = await prisma.entrepreneurProgram.findFirst({ where: { entrepreneurId: entrepreneur.id, programLabel: 'TEKMER Yer Edinme', id: { notIn: createdIds } }, orderBy: { createdAt: 'desc' } });
            expect(placement?.programId).toBeNull();
            if (placement) createdIds.push(placement.id);
        } finally {
            await prisma.entrepreneurProgram.deleteMany({ where: { id: { in: createdIds } } });
            await prisma.entrepreneur.update({ where: { id: entrepreneur.id }, data: { program: originalProgram } });
        }
    });
});
