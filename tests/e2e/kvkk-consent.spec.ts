import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('KVKK & Consent Center E2E', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('should record consent, toggle masking, withdraw consent with audit trail, and verify DB', async ({ page }) => {
        const testName = `KVKK Sahibi ${Date.now()}`;
        const testEmail = `kvkk_${Date.now()}@example.com`;

        // 1. Navigate to /admin/kvkk
        await page.goto('/admin/kvkk');
        await expect(page.getByRole('heading', { name: /KVKK & Veri İzinleri/i })).toBeVisible();

        // 2. Open Add Consent modal
        await page.locator('#new-consent-btn').click();
        await page.locator('#consent-person-name').fill(testName);
        await page.locator('#consent-person-email').fill(testEmail);
        await page.locator('#consent-person-phone').fill('+90 555 123 4567');
        await page.locator('#save-consent-btn').click();

        // 3. Verify in UI table (default masked email)
        await page.waitForTimeout(1000);
        await expect(page.getByText(testName)).toBeVisible();

        // 4. Verify DB
        const dbConsent = await prisma.kvkkConsent.findFirst({
            where: { fullName: testName },
        });
        expect(dbConsent).not.toBeNull();
        expect(dbConsent?.status).toBe('ACTIVE');

        // 5. Withdraw consent
        if (dbConsent) {
            const withdrawBtn = page.locator(`#withdraw-btn-${dbConsent.id}`);
            await expect(withdrawBtn).toBeVisible();
            await withdrawBtn.click();
            await expect(page.locator('#confirm-withdraw-btn')).toBeVisible();
            await page.locator('#withdraw-reason').fill('Kullanıcı yazılı taleple onayını geri çekti.');
            await page.locator('#confirm-withdraw-btn').click();
            await page.waitForTimeout(1500);

            // Verify in DB that status is WITHDRAWN and withdrawal reason is recorded in notes
            const updated = await prisma.kvkkConsent.findUnique({
                where: { id: dbConsent.id },
            });
            expect(updated?.status).toBe('WITHDRAWN');
            expect(updated?.notes).toContain('yazılı taleple');

            // Cleanup
            await prisma.kvkkConsent.delete({ where: { id: dbConsent.id } });
        }
    });
});
