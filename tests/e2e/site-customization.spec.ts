import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

/**
 * Programs (theme, apply/info buttons), supports → contact prefill, grouped spaces,
 * and the homepage design studio draft/preview flow. The studio test never publishes
 * and removes its own draft; it is skipped if someone already has an unpublished draft.
 */
test.describe('Site customization', () => {
    test('program cards and detail page use the campaign apply link and an info button', async ({ page }) => {
        await page.goto('/programlar', { waitUntil: 'networkidle' });
        const antsfire = page.locator('article', { hasText: 'ANTSFire Kuluçka Programı' }).first();
        await antsfire.scrollIntoViewIfNeeded();
        await expect(antsfire.getByRole('link', { name: /BAŞVUR/i })).toHaveAttribute('href', '/antsfire-basvuru');
        await expect(antsfire.getByRole('link', { name: 'Bilgi Al' })).toHaveAttribute('href', '/programlar/antsfire-kulucka');

        await page.goto('/programlar/antsfire-kulucka', { waitUntil: 'networkidle' });
        await expect(page.getByRole('heading', { level: 1 })).toContainText('ANTSFire');
        await page.getByRole('link', { name: 'Bilgi Al' }).first().click();
        await page.waitForURL(/\/iletisim\?konu=/);
        await expect(page.locator('#iletisim-formu')).toContainText('Bilgi talebi: ANTSFire Kuluçka Programı');
        await expect(page.locator('textarea').first()).toHaveValue(/ANTSFire Kuluçka Programı hakkında detaylı bilgi/);
    });

    test('supports show example scenarios and open a prefilled contact form', async ({ page }) => {
        await page.goto('/destekler', { waitUntil: 'networkidle' });
        await expect(page.getByText('Örnek Senaryo').first()).toBeVisible();
        await page.getByRole('link', { name: /Detaylı bilgi almak için tıklayın/ }).first().click();
        await page.waitForURL(/\/iletisim\?konu=/);
        await expect(page.locator('#iletisim-formu')).toContainText('Bilgi talebi:');
    });

    test('spaces page groups studios and meeting spaces separately', async ({ page }) => {
        await page.goto('/kullanim-alanlari', { waitUntil: 'networkidle' });
        await expect(page.getByRole('heading', { name: 'Stüdyolar' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Toplantı Odaları ve Masaları' })).toBeVisible();
        const studios = page.locator('#alan-studios');
        await studios.scrollIntoViewIfNeeded();
        await expect(studios.getByText('Broadcasting Stüdyosu')).toBeVisible();
        await expect(studios.getByText('Açık Toplantı Masası 1 — 8 Kişilik')).toHaveCount(0);
    });

    test('design studio: autosaved draft, live canvas, reorder, admin-only preview, discard', async ({ page, context }) => {
        const key = 'page_layout_draft:destekler';
        const draft = await prisma.siteSetting.findUnique({ where: { key } });
        test.skip(Boolean(draft), 'An unpublished Destekler draft already exists; not touching it.');
        const marker = `QA Banner ${Date.now()}`;

        await loginAsAdmin(context);
        await page.goto('/admin/tasarim-studyosu?page=destekler', { waitUntil: 'networkidle' });
        await expect(page.getByRole('tab', { name: 'Destekler', selected: true })).toBeVisible();
        const canvas = page.frameLocator('iframe[title="Destekler tasarım tuvali"][data-active="true"]');
        await expect(canvas.locator('[data-studio-block="supportsIntro"]')).toBeVisible();

        // Add a banner, edit it, and let autosave store the draft
        await page.getByRole('button', { name: 'Ekle', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: /Görselli banner/ }).click();
        await page.locator('#cfg-title').fill(marker);
        await expect(page.getByText('Taslak kaydedildi')).toBeVisible({ timeout: 15000 });
        await expect(canvas.getByRole('heading', { name: marker })).toBeVisible({ timeout: 15000 });

        // Reorder: the banner was appended at the end; move it up one place
        await page.getByRole('list', { name: /Sayfa bölümleri/ }).getByRole('listitem').last().getByRole('button', { name: 'Yukarı' }).click();
        await expect(page.getByText('Taslak kaydedildi')).toBeVisible({ timeout: 15000 });
        await expect.poll(async () => {
            const row = await prisma.siteSetting.findUnique({ where: { key } });
            const blocks = (JSON.parse(row?.value || '{}').blocks || []) as { type: string }[];
            return blocks.map((b) => b.type).slice(-2).join(',');
        }, { timeout: 15000 }).toBe('banner,supportsCta');

        // Undo restores the previous order
        await page.getByRole('button', { name: 'Geri al' }).click();
        await expect.poll(async () => {
            const row = await prisma.siteSetting.findUnique({ where: { key } });
            const blocks = (JSON.parse(row?.value || '{}').blocks || []) as { type: string }[];
            return blocks.map((b) => b.type).slice(-1)[0];
        }, { timeout: 15000 }).toBe('banner');

        await page.goto('/destekler?onizleme=1', { waitUntil: 'networkidle' });
        await expect(page.getByText('Taslak önizleme')).toBeVisible();
        const banner = page.getByRole('heading', { name: marker });
        await banner.scrollIntoViewIfNeeded();
        await expect(banner).toBeVisible();

        const anon = await context.browser()!.newContext();
        const publicPage = await anon.newPage();
        await publicPage.goto('http://localhost:3000/destekler?onizleme=1', { waitUntil: 'networkidle' });
        await expect(publicPage.getByText(marker)).toHaveCount(0);
        await anon.close();

        await page.goto('/admin/tasarim-studyosu?page=destekler', { waitUntil: 'networkidle' });
        page.once('dialog', (d) => d.accept());
        await page.getByRole('button', { name: 'Taslağı sil' }).click();
        await expect(page.getByText('Taslak silindi')).toBeVisible();
        expect(await prisma.siteSetting.findUnique({ where: { key } })).toBeNull();
    });

    test('studio canvas is frameable only from the same origin when ?studio=1', async ({ request }) => {
        const normal = await request.get('/destekler');
        expect(normal.headers()['x-frame-options']).toBe('DENY');
        const studio = await request.get('/destekler?onizleme=1&studio=1');
        expect(studio.headers()['x-frame-options']).toBe('SAMEORIGIN');
        expect(studio.headers()['content-security-policy']).toContain("frame-ancestors 'self'");
    });
});
