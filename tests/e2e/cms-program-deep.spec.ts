import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';

test.describe('11. PROGRAMLAR — FULL CMS & BLOCK BUILDER E2E', () => {
    const TEST_NAME = 'E2E Deep Tech Hızlandırma Programı';
    const UPDATED_NAME = 'E2E Deep Tech Hızlandırma Programı (GÜNCELLENDİ)';
    const TEST_SLUG = 'e2e-deep-tech-hizlandirma';
    const TEST_DESC = 'Kuantum ve Yapay Zekâ alanında derin teknoloji geliştiren ekipler için hızlandırılmış kuluçka programı.';
    const TEST_AUDIENCE = 'Kuantum bilişim, derin öğrenme ve robotik alanındaki kurucu ekipler.';
    const TEST_BENEFIT = '100.000 TL Prototip Hibesi';
    const TEST_FAQ_Q = 'E2E Kuantum laboratuvarına erişim sağlanıyor mu?';
    const TEST_FAQ_A = 'Evet, kabul edilen girişimlere yüksek performanslı hesaplama (HPC) kaynakları sağlanır.';

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await prisma.program.deleteMany({
            where: {
                OR: [
                    { slug: TEST_SLUG },
                    { name: { contains: 'E2E Deep Tech' } },
                ],
            },
        });
    });

    test.afterAll(async () => {
        await prisma.program.deleteMany({
            where: {
                OR: [
                    { slug: TEST_SLUG },
                    { name: { contains: 'E2E Deep Tech' } },
                ],
            },
        });
    });

    test('Program CREATE (Rich, Hero, Audience, Timeline, Benefit, FAQ, CTA) -> PUBLIC DETAIL -> EDIT -> REFRESH VERIFY -> ARCHIVE', async ({ page, context }) => {
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('response', res => {
            if (res.url().includes('/api/admin/programs')) {
                res.text().then(t => console.log('PROGRAMS API RESPONSE:', res.status(), t)).catch(() => {});
            }
        });

        // 1. Admin Login
        await loginAsAdmin(context);

        // 2. /admin/programlar Aç
        await page.goto('/admin/programlar');
        await page.waitForLoadState('networkidle');

        // Yeni Program Ekle butonuna tıkla
        await page.getByRole('button', { name: /Yeni Program Ekle/i }).click();
        await page.waitForTimeout(500);

        // TAB 1: Genel Bilgiler
        const nameInput = page.locator('input[placeholder*="Örn: ANTSPARK"]').first();
        await nameInput.fill(TEST_NAME);

        const slugInput = page.locator('input[placeholder*="antspark-on-kulucka"]').first();
        await slugInput.fill(TEST_SLUG);

        // TAB 2: Hedef Kitle & Şartlar
        await page.getByRole('button', { name: /Hedef Kitle/i }).click();
        await page.waitForTimeout(300);

        const shortDescInput = page.locator('textarea[placeholder*="Kartlarda ve özet"]').first();
        await shortDescInput.fill(TEST_DESC);

        const detailedDescInput = page.locator('textarea[placeholder*="Programın kapsamı"]').first();
        await detailedDescInput.fill(`${TEST_DESC}\n\nDetaylı eğitim ve Ar-Ge laboratuvarı desteği.`);

        const audienceInput = page.locator('textarea[placeholder*="Erken aşama"]').first();
        await audienceInput.fill(TEST_AUDIENCE);

        // TAB 5: Aşamalar & SSS
        await page.getByRole('button', { name: /Aşamalar & SSS/i }).click();
        await page.waitForTimeout(300);

        // Yeni Avantaj Ekle
        await page.getByRole('button', { name: /\+ Avantaj Ekle/i }).click();
        await page.waitForTimeout(200);
        const lastBenTitle = page.locator('input[placeholder*="Avantaj Başlığı"]').last();
        await lastBenTitle.fill(TEST_BENEFIT);

        // Yeni Soru Ekle
        await page.getByRole('button', { name: /\+ Soru Ekle/i }).click();
        await page.waitForTimeout(200);
        const lastFaqQ = page.locator('input[placeholder*="Soru"]').last();
        await lastFaqQ.fill(TEST_FAQ_Q);
        const lastFaqA = page.locator('textarea[placeholder*="Cevap"]').last();
        await lastFaqA.fill(TEST_FAQ_A);

        // Kaydet
        await page.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(2000);

        // 3. DB Kontrolü
        const createdInDb = await prisma.program.findFirst({
            where: { slug: TEST_SLUG },
        });
        expect(createdInDb).toBeTruthy();
        expect(createdInDb?.name).toBe(TEST_NAME);

        // 4. Public Detail Page Aç: /programlar/[slug]
        await page.goto(`/programlar/${TEST_SLUG}`);
        await page.waitForLoadState('networkidle');

        // Bütün alanların browser'da render edildiğini doğrula
        await expect(page.locator(`h1:has-text("${TEST_NAME}")`).first()).toBeVisible();
        await expect(page.locator(`text=${TEST_DESC}`).first()).toBeVisible();
        await expect(page.locator(`text=${TEST_AUDIENCE}`).first()).toBeVisible();
        await expect(page.locator(`text=${TEST_BENEFIT}`).first()).toBeVisible();
        await expect(page.locator(`text=${TEST_FAQ_Q}`).first()).toBeVisible();

        // 5. Bir Alanı Edit Et (Admin'e dön)
        await page.goto('/admin/programlar');
        await page.waitForLoadState('networkidle');

        const row = page.locator('tr', { hasText: TEST_NAME }).first();
        const editBtn = row.locator('button[title="Düzenle"]').first();
        await editBtn.click();
        await page.waitForTimeout(500);

        const editNameInput = page.locator('input[placeholder*="Örn: ANTSPARK"]').first();
        await editNameInput.fill(UPDATED_NAME);
        await page.getByRole('button', { name: 'Kaydet' }).click();
        await page.waitForTimeout(2000);

        // 6. Public'ta Refresh Sonrası Güncellemeyi Doğrula
        await page.goto(`/programlar/${TEST_SLUG}`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`h1:has-text("${UPDATED_NAME}")`).first()).toBeVisible();

        // 7. Arşivle / Sil
        await page.goto('/admin/programlar');
        await page.waitForLoadState('networkidle');

        const updatedRow = page.locator('tr', { hasText: UPDATED_NAME }).first();
        const deleteBtn = updatedRow.locator('button[title*="Sil"], button[title*="Arşivle"]').first();
        await deleteBtn.click();
        await page.waitForTimeout(500);

        const confirmBtn = page.locator('button:has-text("Evet, Arşivle"), button:has-text("Arşivle")').last();
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
            await page.waitForTimeout(1000);
        }

        // 8. Public'tan Kalktığını Doğrula
        await page.goto(`/programlar/${TEST_SLUG}`);
        await page.waitForLoadState('networkidle');
        const notFoundHeading = page.getByRole('heading', { name: /Bulunamadı/i });
        await expect(notFoundHeading.first()).toBeVisible();

        // 9. Temizle
        await prisma.program.deleteMany({
            where: { id: createdInDb!.id },
        });
    });
});
