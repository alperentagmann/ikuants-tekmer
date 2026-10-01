import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Zero Unexpected Console & Runtime Errors Audit', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    const keyAdminPages = [
        '/admin/dashboard',
        '/admin/benim-gunum',
        '/admin/finans',
        '/admin/finans/kiralar',
        '/admin/gorevler',
        '/admin/gorevler/kanban',
        '/admin/takvim',
        '/admin/basvurular',
        '/admin/girisimciler',
        '/admin/mentorler',
        '/admin/programlar',
        '/admin/projeler',
        '/admin/kvkk',
        '/admin/raporlar',
        '/admin/kullanicilar',
        '/admin/roller',
        '/admin/guvenlik',
        '/admin/sistem-durumu',
        '/admin/ayarlar',
        '/admin/audit-log',
    ];

    for (const pagePath of keyAdminPages) {
        test(`Page ${pagePath} has zero fatal console errors and zero 5xx network failures`, async ({ page }) => {
            const fatalConsoleErrors: string[] = [];
            const failed5xxRequests: string[] = [];

            page.on('console', msg => {
                if (msg.type() === 'error') {
                    const text = msg.text();
                    // Filter out harmless browser-level warnings or external media 404s if any
                    if (!text.includes('favicon') && !text.includes('chrome-extension')) {
                        fatalConsoleErrors.push(text);
                    }
                }
            });

            page.on('pageerror', err => {
                fatalConsoleErrors.push(`Uncaught Exception: ${err.message}`);
            });

            page.on('response', resp => {
                if (resp.status() >= 500) {
                    failed5xxRequests.push(`${resp.url()} returned ${resp.status()}`);
                }
            });

            await page.goto(pagePath, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(1000);

            expect(failed5xxRequests).toHaveLength(0);
            expect(fatalConsoleErrors).toHaveLength(0);
        });
    }
});
