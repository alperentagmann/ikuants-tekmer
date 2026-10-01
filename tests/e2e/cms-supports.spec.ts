import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';

test.describe('10. DESTEKLER — SUPPORTS E2E CRUD', () => {
    const TEST_TITLE = 'CMS TEST DESTEĞİ';
    const UPDATED_TITLE = 'CMS TEST DESTEĞİ GÜNCELLENDİ';
    const TEST_DESC = 'KOSGEB ve TÜBİTAK Ar-Ge Hibe Teşvik Destek Programı Test Kaydı';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await prisma.support.deleteMany({
            where: {
                OR: [
                    { title: { contains: 'CMS TEST' } },
                    { title: TEST_TITLE },
                    { title: UPDATED_TITLE },
                ],
            },
        });
    });

    test.afterAll(async () => {
        await prisma.support.deleteMany({
            where: {
                OR: [
                    { title: { contains: 'CMS TEST' } },
                    { title: TEST_TITLE },
                    { title: UPDATED_TITLE },
                ],
            },
        });
    });

    test('Destekler CREATE -> PUBLIC -> EDIT -> PUBLIC -> ARCHIVE -> PUBLIC Akışı', async ({ page, context }) => {
        // 1. Admin login
        await loginAsAdmin(context);

        // 2. /admin/destekler aç
        await page.goto('/admin/destekler');
        await page.waitForLoadState('networkidle');

        // Yeni Destek Ekle butonuna tıkla
        await page.getByRole('button', { name: /Yeni Destek Ekle/i }).click();
        await page.waitForTimeout(500);

        // Formu doldur
        const titleInput = page.locator('input[placeholder*="Örn: GELİR"], input[placeholder*="GELİR"]').first();
        await titleInput.fill(TEST_TITLE);

        const descInput = page.locator('textarea').first();
        await descInput.fill(TEST_DESC);

        // Kaydet
        await page.locator('button:has-text("Kaydet")').click();
        await page.waitForTimeout(1000);

        // 3. DB kontrolü
        const createdInDb = await prisma.support.findFirst({
            where: { title: TEST_TITLE },
        });
        expect(createdInDb).toBeTruthy();

        // 4. Public /destekler sayfasını aç
        await page.goto('/destekler');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`h3:text-is("${TEST_TITLE}")`).first()).toBeVisible();

        // 5. Detayı değiştir (Admin'e dön)
        await page.goto('/admin/destekler');
        await page.waitForLoadState('networkidle');

        const row = page.locator('tr').filter({ hasText: TEST_TITLE }).first();
        const editBtn = row.locator('button[title="Düzenle"]').first();
        await editBtn.click();
        await page.waitForTimeout(500);

        const editTitleInput = page.locator('input[placeholder*="Örn: GELİR"], input[placeholder*="GELİR"]').first();
        await editTitleInput.fill(UPDATED_TITLE);
        
        const [updateResponse] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/api/admin/supports') && r.request().method() === 'PUT'),
            page.locator('button:has-text("Kaydet")').click(),
        ]);
        expect(updateResponse.status()).toBe(200);
        await page.waitForTimeout(500);

        // 6. Public'ta güncellenmeli
        await page.goto('/destekler');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`h3:text-is("${UPDATED_TITLE}")`).first()).toBeVisible();
        await expect(page.locator(`h3:text-is("${TEST_TITLE}")`)).toHaveCount(0);

        // 7. Arşivle / Pasif yap
        await page.goto('/admin/destekler');
        await page.waitForLoadState('networkidle');

        const updatedRow = page.locator('tr').filter({ hasText: UPDATED_TITLE }).first();
        const deleteBtn = updatedRow.locator('button[title*="Sil"], button[title*="Arşivle"]').first();
        await deleteBtn.click();
        await page.waitForTimeout(500);

        // Confirm Dialog Onayla
        const confirmBtn = page.locator('button:has-text("Arşivle"), button:has-text("Sil")').last();
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
        }
        await page.waitForTimeout(1000);

        // 8. Public'tan çıkmalı
        await page.goto('/destekler');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`h3:text-is("${UPDATED_TITLE}")`)).toHaveCount(0);

        // 9. Temizle
        await prisma.support.deleteMany({
            where: { id: createdInDb!.id },
        });
    });
});
