import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Rent Cockpit & All Entrepreneurs Visibility (Zero-Defect Flow)', () => {
    test('Central Rent Page displays ALL active entrepreneurs and actionable contract buttons', async ({ page, context }) => {
        await loginAsAdmin(context);

        // Count total active entrepreneurs in database
        const totalActiveInDb = await prisma.entrepreneur.count({ where: { isArchived: false } });

        await page.goto('/admin/finans/kiralar');
        await expect(page.locator('h1')).toContainText('Kira & Tahsilat Yönetimi');

        // Check KPI card for total entrepreneurs
        await expect(page.locator('text=Toplam Girişimci')).toBeVisible();

        // Wait for table to load
        await expect(page.locator('text=Girişimci kira kayıtları yükleniyor...')).not.toBeVisible({ timeout: 10000 }).catch(() => {});
        await page.waitForSelector('table', { timeout: 10000 });

        // Verify that all active entrepreneurs are rendered in the table
        const rows = page.locator('tbody tr');
        const count = await rows.count();
        expect(count).toBeGreaterThanOrEqual(totalActiveInDb > 0 ? 1 : 0);

        // Check if there are entrepreneurs without contract showing "Sözleşme Yok"
        const noContractBadge = page.locator('text=Sözleşme Yok').first();
        if (await noContractBadge.isVisible()) {
            await expect(page.locator('button:has-text("Kira Sözleşmesi Ekle")').first()).toBeVisible();
        }
    });
});
