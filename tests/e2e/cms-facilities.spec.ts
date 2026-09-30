import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';

test.describe('4. KULLANIM ALANLARI — FACILITY E2E CRUD', () => {
    const TEST_TITLE = 'E2E Test Prototipleme Atölyesi';
    const UPDATED_TITLE = 'E2E Test Prototipleme ve XR Laboratuvarı';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await prisma.facility.deleteMany({
            where: {
                OR: [
                    { title: { contains: 'E2E Test' } },
                    { title: TEST_TITLE },
                    { title: UPDATED_TITLE },
                ],
            },
        });
    });

    test.afterAll(async () => {
        await prisma.facility.deleteMany({
            where: {
                OR: [
                    { title: { contains: 'E2E Test' } },
                    { title: TEST_TITLE },
                    { title: UPDATED_TITLE },
                ],
            },
        });
    });

    test('Kullanım Alanı CREATE -> REORDER -> PUBLIC -> ARCHIVE -> PUBLIC Akışı', async ({ page, context }) => {
        // 1. Admin login
        await loginAsAdmin(context);

        // 2. /admin/hakkimizda aç
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');

        // Kullanım Alanları sekmesine tıkla
        await page.getByRole('button', { name: /Kullanım Alanları/i }).click();
        await page.waitForTimeout(500);

        // Yeni Alan Ekle
        await page.getByRole('button', { name: /Yeni Alan \/ Stüdyo Ekle/i }).click();
        await page.waitForTimeout(500);

        // Modal inputlarını doldur
        const modal = page.locator('div.fixed');
        await modal.locator('input[type="text"]').nth(0).fill(TEST_TITLE);
        await modal.locator('textarea').first().fill('E2E Test Prototip ve üretim alanı açıklaması.');

        // Kaydet
        await modal.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(1000);

        // 3. DB kontrolü
        const createdInDb = await prisma.facility.findFirst({
            where: { title: TEST_TITLE },
        });
        expect(createdInDb).toBeTruthy();

        // 4. Public /kullanim-alanlari sayfasını aç
        await page.goto('/kullanim-alanlari');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${TEST_TITLE}`).first()).toBeVisible();

        // 5. Sırasını / İsmini değiştir (Admin'e dön)
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /Kullanım Alanları/i }).click();
        await page.waitForTimeout(500);

        const card = page.locator('div.rounded-xl').filter({ hasText: TEST_TITLE }).first();
        const editBtn = card.locator('button').first();
        await editBtn.click();
        await page.waitForTimeout(500);

        const editModal = page.locator('div.fixed');
        await editModal.locator('input[type="text"]').nth(0).fill(UPDATED_TITLE);
        await editModal.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(1000);

        // 6. Public'ta değiştiğini doğrula
        await page.goto('/kullanim-alanlari');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${UPDATED_TITLE}`).first()).toBeVisible();
        await expect(page.locator(`text=${TEST_TITLE}`)).toHaveCount(0);

        // 7. Arşivle / Pasif yap
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /Kullanım Alanları/i }).click();
        await page.waitForTimeout(500);

        const updatedCard = page.locator('div.rounded-xl').filter({ hasText: UPDATED_TITLE }).first();
        const deleteBtn = updatedCard.locator('button').nth(1);
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        // 8. Public'tan çıkmalı
        await page.goto('/kullanim-alanlari');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${UPDATED_TITLE}`)).toHaveCount(0);

        // 9. Temizle
        await prisma.facility.deleteMany({
            where: { id: createdInDb!.id },
        });
    });
});
