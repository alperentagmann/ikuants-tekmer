import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';

test.describe('2. HAKKIMIZDA — EKİP ÜYESİ E2E CRUD', () => {
    const TEST_NAME = 'E2E TEST EKİP ÜYESİ ALPEREN';
    const UPDATED_NAME = 'E2E TEST EKİP ÜYESİ ALPEREN GÜNCELLENDİ';
    const TEST_TITLE = 'Tekmer Operasyon Uzmanı (Test)';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await prisma.teamMember.deleteMany({
            where: {
                OR: [
                    { fullName: { contains: 'E2E TEST' } },
                    { fullName: TEST_NAME },
                    { fullName: UPDATED_NAME },
                ],
            },
        });
    });

    test.afterAll(async () => {
        await prisma.teamMember.deleteMany({
            where: {
                OR: [
                    { fullName: { contains: 'E2E TEST' } },
                    { fullName: TEST_NAME },
                    { fullName: UPDATED_NAME },
                ],
            },
        });
    });

    test('Ekip Üyesi CREATE -> PUBLIC -> EDIT -> PUBLIC -> ARCHIVE -> PUBLIC Akışı', async ({ page, context }) => {
        // 1. Admin login
        await loginAsAdmin(context);

        // 2. /admin/hakkimizda aç
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');

        // Ekip Üyeleri sekmesine tıkla
        await page.getByRole('button', { name: /Ekip Üyeleri/i }).click();
        await page.waitForTimeout(500);

        // Yeni Ekip Üyesi Ekle
        await page.getByRole('button', { name: /Yeni Ekip Üyesi Ekle/i }).click();
        await page.waitForTimeout(500);

        // Modal inputlarını doldur
        const modal = page.locator('div.fixed');
        const inputs = modal.locator('input[type="text"]');
        await inputs.nth(0).fill(TEST_NAME);
        await inputs.nth(1).fill(TEST_TITLE);

        // Kaydet
        await modal.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(1000);

        // 3. DB doğrulaması
        const createdInDb = await prisma.teamMember.findFirst({
            where: { fullName: TEST_NAME },
        });
        expect(createdInDb).toBeTruthy();

        // 4. /ekibimiz public sayfayı aç
        await page.goto('/ekibimiz');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`h3:text-is("${TEST_NAME}")`).first()).toBeVisible();

        // 5. İsmini değiştir (Admin'e dön)
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /Ekip Üyeleri/i }).click();
        await page.waitForTimeout(500);

        const card = page.locator('div.rounded-xl').filter({ hasText: TEST_NAME }).first();
        const editBtn = card.locator('button').first();
        await editBtn.click();
        await page.waitForTimeout(500);

        const editModal = page.locator('div.fixed');
        await editModal.locator('input[type="text"]').nth(0).fill(UPDATED_NAME);
        await editModal.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(1000);

        // 6. Public'ta değiştiğini doğrula
        await page.goto('/ekibimiz');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`h3:text-is("${UPDATED_NAME}")`).first()).toBeVisible();
        await expect(page.locator(`h3:text-is("${TEST_NAME}")`)).toHaveCount(0);

        // 7. Archive/Pasif yap
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /Ekip Üyeleri/i }).click();
        await page.waitForTimeout(500);

        const updatedCard = page.locator('div.rounded-xl').filter({ hasText: UPDATED_NAME }).first();
        const deleteBtn = updatedCard.locator('button').nth(1);
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        // 8. Public'tan kaybolduğunu doğrula
        await page.goto('/ekibimiz');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`h3:text-is("${UPDATED_NAME}")`)).toHaveCount(0);

        // 9. Temizle
        await prisma.teamMember.deleteMany({
            where: { id: createdInDb!.id },
        });
    });
});
