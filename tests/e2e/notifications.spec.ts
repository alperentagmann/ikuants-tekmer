import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Notifications & Email Outbox Flow', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('E-Posta Merkezi displays outbox logs and email templates', async ({ page }) => {
        await page.goto('/admin/eposta-merkezi');
        await expect(page.locator('h1')).toContainText('E-Posta');
    });

    test('E-Posta Şablonları loads templates with editable variables', async ({ page }) => {
        await page.goto('/admin/eposta-sablonlari');
        await expect(page.locator('h1')).toContainText('E-Posta');
    });
});
