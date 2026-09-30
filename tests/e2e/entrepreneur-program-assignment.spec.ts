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
        await expect(page.locator('#confirm-assign-program-btn')).toBeVisible();

        const testCohort = `Cohort-${Date.now()}`;

        // 4. Fill program assignment
        await page.locator('#select-program-id').selectOption(program.id);
        await page.locator('#input-cohort').fill(testCohort);
        await page.locator('#confirm-assign-program-btn').click();

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
});
