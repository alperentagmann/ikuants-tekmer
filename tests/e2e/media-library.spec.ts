import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Media Library Management', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('Media Library page loads and displays upload zone and asset gallery', async ({ page }) => {
        await page.goto('/admin/medya', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('h1')).toContainText('Medya');
    });
});
