import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';

test.describe('1. HAKKIMIZDA — KURUL ÜYESİ E2E CRUD', () => {
    const TEST_NAME = 'E2E TEST PROF. DR. AHMET YILMAZ';
    const UPDATED_NAME = 'E2E TEST PROF. DR. AHMET GÜNCELLENDİ';
    const TEST_TITLE = 'Yönetim Kurulu Üyesi (Test)';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await prisma.boardMember.deleteMany({
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
        await prisma.boardMember.deleteMany({
            where: {
                OR: [
                    { fullName: { contains: 'E2E TEST' } },
                    { fullName: TEST_NAME },
                    { fullName: UPDATED_NAME },
                ],
            },
        });
    });

    test('Tam Gerçek Browser CRUD ve Public Yansıma Akışı', async ({ page, context }) => {
        // 1. Super Admin login
        await loginAsAdmin(context);

        // 2. /admin/hakkimizda aç
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');

        // Kurul Üyeleri sekmesine tıkla
        await page.getByRole('button', { name: /Kurul Üyeleri/i }).click();
        await page.waitForTimeout(500);

        // 3. Yeni Kurul Üyesi Ekle butonuna tıkla
        const addBtn = page.getByRole('button', { name: /Yeni Kurul Üyesi Ekle/i });
        await addBtn.click();
        await page.waitForTimeout(500);

        // Modal inputlarını doldur
        const modal = page.locator('div.fixed');
        const inputs = modal.locator('input[type="text"]');
        await inputs.nth(0).fill(TEST_NAME);
        await inputs.nth(1).fill(TEST_TITLE);

        // Kaydet
        await modal.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(1000);

        // 4. DB'de oluştuğunu kontrol et
        const createdInDb = await prisma.boardMember.findFirst({
            where: { fullName: TEST_NAME },
        });
        expect(createdInDb).toBeTruthy();
        expect(createdInDb?.fullName).toBe(TEST_NAME);

        // 5. /kurullar aç
        await page.goto('/kurullar');
        await page.waitForLoadState('networkidle');

        // 6. Public'ta gerçekten göründüğünü doğrula
        await expect(page.locator(`text=${TEST_NAME}`).first()).toBeVisible();

        // 7. İsmini değiştir (Admin'e dön)
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /Kurul Üyeleri/i }).click();
        await page.waitForTimeout(500);

        // Karttaki Düzenle butonuna tıkla
        const card = page.locator('div.rounded-xl').filter({ hasText: TEST_NAME }).first();
        const editBtn = card.locator('button').first();
        await editBtn.click();
        await page.waitForTimeout(500);

        // İsmi güncelle
        const editModal = page.locator('div.fixed');
        await editModal.locator('input[type="text"]').nth(0).fill(UPDATED_NAME);
        await editModal.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(1000);

        // DB'de güncellendiğini kontrol et
        const updatedInDb = await prisma.boardMember.findFirst({
            where: { id: createdInDb!.id },
        });
        expect(updatedInDb?.fullName).toBe(UPDATED_NAME);

        // 8. Public'ta değiştiğini doğrula
        await page.goto('/kurullar');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${UPDATED_NAME}`).first()).toBeVisible();
        await expect(page.locator(`text=${TEST_NAME}`)).toHaveCount(0);

        // 9. Archive/Pasif yap
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /Kurul Üyeleri/i }).click();
        await page.waitForTimeout(500);

        const updatedCard = page.locator('div.rounded-xl').filter({ hasText: UPDATED_NAME }).first();
        const deleteBtn = updatedCard.locator('button').nth(1);
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        // 10. Public'tan kaybolduğunu doğrula
        await page.goto('/kurullar');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${UPDATED_NAME}`)).toHaveCount(0);

        // 11. Test kaydını temizle
        await prisma.boardMember.deleteMany({
            where: { id: createdInDb!.id },
        });
    });
});
