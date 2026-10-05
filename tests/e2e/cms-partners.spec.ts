import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';
import { clickAndWaitForSave } from './helpers/mutation';

test.describe('3. İŞ BİRLİKLERİ — PARTNER E2E CRUD', () => {
    const TEST_NAME = 'CMS Browser Test Partner';
    const UPDATED_NAME = 'CMS Browser Test Partner Güncellendi';
    const TEST_URL = 'https://example.com';
    const TEST_LOGO = '/images/partner-test.png';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await prisma.partner.deleteMany({
            where: {
                OR: [
                    { name: { contains: 'CMS Browser Test Partner' } },
                    { name: TEST_NAME },
                    { name: UPDATED_NAME },
                ],
            },
        });
    });

    test.afterAll(async () => {
        await prisma.partner.deleteMany({
            where: {
                OR: [
                    { name: { contains: 'CMS Browser Test Partner' } },
                    { name: TEST_NAME },
                    { name: UPDATED_NAME },
                ],
            },
        });
    });

    test('Partner CREATE -> PUBLIC -> EDIT -> PUBLIC -> ARCHIVE -> PUBLIC Akışı', async ({ page, context }) => {
        // 1. Admin login
        await loginAsAdmin(context);

        // 2. /admin/hakkimizda aç
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');

        // İş Birlikleri sekmesine tıkla
        await page.getByRole('button', { name: /İş Birlikleri/i }).click();
        await page.waitForTimeout(500);

        // Yeni Partner Ekle
        await page.getByRole('button', { name: /Yeni Partner Ekle/i }).click();
        await page.waitForTimeout(500);

        // Modal inputlarını doldur: name, logoUrl, description, websiteUrl
        const modal = page.locator('div.fixed');
        const inputs = modal.locator('input[type="text"]');
        await inputs.nth(0).fill(TEST_NAME);
        await inputs.nth(1).fill(TEST_LOGO);
        await modal.locator('textarea').first().fill('E2E Test partner açıklama');
        await inputs.nth(2).fill(TEST_URL);

        // Kaydet
        await clickAndWaitForSave(page, modal.getByRole('button', { name: 'Kaydet' }));
        await page.waitForTimeout(1000);

        // 3. DB doğrula
        const createdInDb = await prisma.partner.findFirst({
            where: { name: TEST_NAME },
        });
        expect(createdInDb).toBeTruthy();

        // 4. Public /isbirliklerimiz sayfasında görünmeli
        await page.goto('/isbirliklerimiz');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${TEST_NAME}`).first()).toBeVisible();

        // 5. İsmini değiştir (Admin'e dön)
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /İş Birlikleri/i }).click();
        await page.waitForTimeout(500);

        const card = page.locator('div.rounded-xl').filter({ hasText: TEST_NAME }).first();
        const editBtn = card.locator('button').first();
        await editBtn.click();
        await page.waitForTimeout(500);

        const editModal = page.locator('div.fixed');
        await editModal.locator('input[type="text"]').nth(0).fill(UPDATED_NAME);
        await clickAndWaitForSave(page, editModal.getByRole('button', { name: 'Kaydet' }));
        await page.waitForTimeout(1000);

        // 6. Public güncellenmeli
        await page.goto('/isbirliklerimiz');
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(UPDATED_NAME, { exact: true }).first()).toBeVisible();
        await expect(page.getByText(TEST_NAME, { exact: true })).toHaveCount(0);

        // 7. Pasif / Arşiv yap
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /İş Birlikleri/i }).click();
        await page.waitForTimeout(500);

        const updatedCard = page.locator('div.rounded-xl').filter({ hasText: UPDATED_NAME }).first();
        const deleteBtn = updatedCard.locator('button').nth(1);
        await clickAndWaitForSave(page, deleteBtn);
        await page.waitForTimeout(1000);

        // 8. Public'tan çıkmalı
        await page.goto('/isbirliklerimiz');
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(UPDATED_NAME, { exact: true })).toHaveCount(0);

        // 9. Temizle
        await prisma.partner.deleteMany({
            where: { id: createdInDb!.id },
        });
    });
});
