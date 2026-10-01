import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Admin Dashboard Deep Inspection & Actions', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('Dashboard loads real metrics and widgets with zero NaN/undefined errors', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (!text.includes('favicon') && !text.includes('chrome-extension')) {
                    consoleErrors.push(text);
                }
            }
        });

        await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1')).toContainText('Operasyon & Yönetim Merkezi', { timeout: 30000 });

        // Check key metric cards
        const statsCards = page.locator('main a[href^="/admin/"]');
        await expect(statsCards.first()).toBeVisible({ timeout: 15000 });

        // Ensure no NaN or undefined in visible body text
        const bodyText = await page.innerText('body');
        expect(bodyText).not.toContain('NaN');
        expect(bodyText).not.toContain('undefined');

        // Check shortcuts
        const shortcutLink = page.locator('a[href="/admin/girisimciler?action=create"]');
        await expect(shortcutLink).toBeVisible();

        // Check pipeline breakdown section
        await expect(page.locator('h3:has-text("Başvuru Huni Dağılımı")')).toBeVisible();

        // Check refresh button action
        const refreshBtn = page.locator('button[title="Verileri Yenile"]');
        await expect(refreshBtn).toBeVisible();
        await refreshBtn.click();

        // Verify zero console errors
        expect(consoleErrors).toHaveLength(0);
    });

    test('Drilldown links navigate correctly to respective admin modules', async ({ page }) => {
        await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });

        // Click on Girişimciler stat card
        await page.locator('main a[href="/admin/girisimciler"]').first().click();
        await expect(page).toHaveURL(/\/admin\/girisimciler/);

        // Return to dashboard and click Kiralar
        await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
        await page.locator('main a[href="/admin/finans/kiralar"]').first().click();
        await expect(page).toHaveURL(/\/admin\/finans\/kiralar/);
    });
});
