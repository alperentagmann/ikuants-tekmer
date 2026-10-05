import { test, expect } from '@playwright/test';

type CookieSettings = { enabled: boolean; title: string; acceptText: string; rejectText: string; settingsText: string; version: string };

/** Fresh visitor (no stored consent): banner, persisted choice, reopen from footer, locked credit. */
test.describe('Cookie consent and footer', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('banner appears for a new visitor, the choice persists and can be changed from the footer', async ({ page, request }) => {
        const { settings } = (await (await request.get('/api/public/settings')).json()) as { settings: { cookie: CookieSettings } };
        test.skip(!settings.cookie.enabled, 'Cookie banner is disabled in settings.');

        await page.goto('/', { waitUntil: 'networkidle' });
        const banner = page.getByRole('dialog', { name: settings.cookie.title });
        await expect(banner).toBeVisible();
        await banner.getByRole('button', { name: settings.cookie.rejectText, exact: true }).click();
        await expect(banner).toBeHidden();

        const stored = await page.evaluate(() => localStorage.getItem('ikuants_cookie_consent'));
        expect(JSON.parse(stored || '{}')).toMatchObject({ version: settings.cookie.version, analytics: false, marketing: false });
        expect((await page.context().cookies()).some((c) => c.name === 'ikuants_consent')).toBe(true);

        await page.reload({ waitUntil: 'networkidle' });
        await expect(banner).toBeHidden();

        await page.getByRole('button', { name: 'Çerez tercihleri' }).click();
        await expect(banner).toBeVisible();
        await expect(banner.getByLabel('Analiz çerezleri')).not.toBeChecked();
    });

    test('banner never covers the design studio canvas', async ({ page }) => {
        await page.goto('/?embed=1', { waitUntil: 'networkidle' });
        await expect(page.getByRole('dialog', { name: /çerez/i })).toHaveCount(0);
    });

    test('footer always shows the locked design credit', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        const credit = page.locator('footer [data-credit="locked"]');
        await expect(credit).toHaveText('Design By Alperen Tağman.');
        await expect(page.locator('footer')).toContainText(`Copyright ${new Date().getFullYear()}`);
    });
});
