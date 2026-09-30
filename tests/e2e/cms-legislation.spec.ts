import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';

test.describe('6. MEVZUAT — LEGISLATION E2E CRUD', () => {
    const TEST_TITLE = 'E2E Test TEKMER Uygulama Esasları Yönetmeliği';
    const TEST_URL = 'https://mevzuat.gov.tr/test-1';
    const UPDATED_URL = 'https://mevzuat.gov.tr/test-2-guncel';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await prisma.legislationDocument.deleteMany({
            where: {
                OR: [
                    { title: { contains: 'E2E Test' } },
                    { title: TEST_TITLE },
                ],
            },
        });
    });

    test.afterAll(async () => {
        await prisma.legislationDocument.deleteMany({
            where: {
                OR: [
                    { title: { contains: 'E2E Test' } },
                    { title: TEST_TITLE },
                ],
            },
        });
    });

    test('Mevzuat CREATE -> PUBLIC LINK -> EDIT URL -> PUBLIC VERIFY -> ARCHIVE Akışı', async ({ page, context }) => {
        // 1. Admin login
        await loginAsAdmin(context);

        // 2. /admin/hakkimizda aç
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');

        // Mevzuat sekmesine tıkla
        await page.getByRole('button', { name: /Mevzuat/i }).click();
        await page.waitForTimeout(500);

        // Yeni Mevzuat Ekle
        await page.getByRole('button', { name: /Yeni Mevzuat Ekle/i }).click();
        await page.waitForTimeout(500);

        // Modal inputlarını doldur: title, description (textarea), externalUrl (input 1)
        const modal = page.locator('div.fixed');
        await modal.locator('input[type="text"]').nth(0).fill(TEST_TITLE);
        await modal.locator('textarea').first().fill('E2E Test Mevzuat Açıklaması');
        await modal.locator('input[type="text"]').nth(1).fill(TEST_URL);

        // Kaydet
        await modal.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(1000);

        // 3. DB kontrolü
        const createdInDb = await prisma.legislationDocument.findFirst({
            where: { title: TEST_TITLE },
        });
        expect(createdInDb).toBeTruthy();
        expect(createdInDb?.externalUrl || createdInDb?.fileUrl).toBe(TEST_URL);

        // 4. Public /mevzuat sayfasını aç
        await page.goto('/mevzuat');
        await page.waitForLoadState('networkidle');
        const docLink = page.locator(`a:has-text("${TEST_TITLE}")`).first();
        await expect(docLink).toBeVisible();
        await expect(docLink).toHaveAttribute('href', TEST_URL);

        // 5. URL'yi değiştir (Admin'e dön)
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /Mevzuat/i }).click();
        await page.waitForTimeout(500);

        const card = page.locator('div.rounded-xl').filter({ hasText: TEST_TITLE }).first();
        const editBtn = card.locator('button').first();
        await editBtn.click();
        await page.waitForTimeout(500);

        const editModal = page.locator('div.fixed');
        await editModal.locator('input[type="text"]').nth(1).fill(UPDATED_URL);
        await editModal.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(1000);

        // 6. Public'ta yeni link doğrulaması
        await page.goto('/mevzuat');
        await page.waitForLoadState('networkidle');
        const updatedDocLink = page.locator(`a:has-text("${TEST_TITLE}")`).first();
        await expect(updatedDocLink).toBeVisible();
        await expect(updatedDocLink).toHaveAttribute('href', UPDATED_URL);

        // 7. Arşivle
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /Mevzuat/i }).click();
        await page.waitForTimeout(500);

        const updatedCard = page.locator('div.rounded-xl').filter({ hasText: TEST_TITLE }).first();
        const deleteBtn = updatedCard.locator('button').nth(1);
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        // 8. Public'tan çıkmalı
        await page.goto('/mevzuat');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${TEST_TITLE}`)).toHaveCount(0);

        // 9. Temizle
        await prisma.legislationDocument.deleteMany({
            where: { id: createdInDb!.id },
        });
    });
});
