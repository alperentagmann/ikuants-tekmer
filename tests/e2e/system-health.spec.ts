import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('System Health & Infrastructure Verification', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('Health API returns LIVE metrics for database latency and external configurations', async ({ context }) => {
        const res = await context.request.get('/api/admin/system/health');
        expect(res.status()).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.checks.database.status).toBe('ONLINE');
        expect(data.checks.database.latency).toMatch(/\d+ms/);
        expect(data.system.nodeVersion).toBeDefined();
        expect(data.system.memoryUsageMb).toBeGreaterThan(0);
    });

    test('System status page renders real cards and reflects live status', async ({ page }) => {
        await page.goto('/admin/sistem-durumu', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1')).toContainText('Sistem Sağlığı', { timeout: 30000 });

        // Check cards
        await expect(page.locator('text=PostgreSQL Veritabanı')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text=Depolama Servisi')).toBeVisible();
        await expect(page.locator('text=Kimlik & Güvenlik')).toBeVisible();
    });

    test('System health alias (/admin/sistem-sagligi) route works seamlessly', async ({ page }) => {
        await page.goto('/admin/sistem-sagligi', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1')).toContainText('Sistem Sağlığı', { timeout: 30000 });
    });
});
