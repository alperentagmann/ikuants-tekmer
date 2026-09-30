import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';

test.describe('7. SSS — FAQ E2E CRUD', () => {
    const TEST_QUESTION = 'E2E Test: TEKMER Ön Kuluçka Başvurusu Nasıl Yapılır?';
    const TEST_ANSWER = 'E2E Test: Başvurular online portal üzerinden 7/24 alınmaktadır.';
    const UPDATED_ANSWER = 'E2E Test: Başvurular online portal üzerinden jüri değerlendirmesi ile alınır.';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await prisma.faqItem.deleteMany({
            where: {
                OR: [
                    { question: { contains: 'E2E Test' } },
                    { question: TEST_QUESTION },
                ],
            },
        });
    });

    test.afterAll(async () => {
        await prisma.faqItem.deleteMany({
            where: {
                OR: [
                    { question: { contains: 'E2E Test' } },
                    { question: TEST_QUESTION },
                ],
            },
        });
    });

    test('FAQ CREATE -> PUBLIC ACCORDION -> EDIT ANSWER -> REFRESH VERIFY -> ARCHIVE Akışı', async ({ page, context }) => {
        // 1. Admin login
        await loginAsAdmin(context);

        // 2. /admin/hakkimizda aç
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');

        // SSS (FAQ) sekmesine tıkla
        await page.getByRole('button', { name: /SSS/i }).click();
        await page.waitForTimeout(500);

        // Yeni Soru Ekle
        await page.getByRole('button', { name: /Yeni Soru Ekle|Yeni SSS Ekle/i }).click();
        await page.waitForTimeout(500);

        // Modal inputlarını doldur
        const modal = page.locator('div.fixed');
        await modal.locator('input[type="text"]').nth(1).fill(TEST_QUESTION);
        await modal.locator('textarea').first().fill(TEST_ANSWER);

        // Kaydet
        await modal.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(1000);

        // 3. DB kontrolü
        const createdInDb = await prisma.faqItem.findFirst({
            where: { question: TEST_QUESTION },
        });
        expect(createdInDb).toBeTruthy();

        // 4. Public /sss sayfasını aç
        await page.goto('/sss');
        await page.waitForLoadState('networkidle');

        // Soru accordion'da görünmeli ve tıklanınca/açılınca cevap görünmeli
        const faqBtn = page.locator(`button:has-text("${TEST_QUESTION}")`).first();
        await expect(faqBtn).toBeVisible();
        if (!(await page.locator(`text=${TEST_ANSWER}`).first().isVisible())) {
            await faqBtn.click();
            await page.waitForTimeout(300);
        }
        await expect(page.locator(`text=${TEST_ANSWER}`).first()).toBeVisible();

        // 5. Cevabı değiştir (Admin'e dön)
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /SSS/i }).click();
        await page.waitForTimeout(500);

        const card = page.locator('div.rounded-xl').filter({ hasText: TEST_QUESTION }).first();
        const editBtn = card.locator('button').first();
        await editBtn.click();
        await page.waitForTimeout(500);

        const editModal = page.locator('div.fixed');
        await editModal.locator('textarea').first().fill(UPDATED_ANSWER);
        await editModal.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(1000);

        // 6. Public'ta refresh sonrası yeni cevabı doğrula
        await page.goto('/sss');
        await page.waitForLoadState('networkidle');
        const refreshedFaqBtn = page.locator(`button:has-text("${TEST_QUESTION}")`).first();
        await expect(refreshedFaqBtn).toBeVisible();
        if (!(await page.locator(`text=${UPDATED_ANSWER}`).first().isVisible())) {
            await refreshedFaqBtn.click();
            await page.waitForTimeout(300);
        }
        await expect(page.locator(`text=${UPDATED_ANSWER}`).first()).toBeVisible();

        // 7. Arşivle
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /SSS/i }).click();
        await page.waitForTimeout(500);

        const updatedCard = page.locator('div.rounded-xl').filter({ hasText: TEST_QUESTION }).first();
        const deleteBtn = updatedCard.locator('button').nth(1);
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        // 8. Public'tan çıkmalı
        await page.goto('/sss');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${TEST_QUESTION}`)).toHaveCount(0);

        // 9. Temizle
        await prisma.faqItem.deleteMany({
            where: { id: createdInDb!.id },
        });
    });
});
