import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Admin Sidebar 100% Route Coverage & Integrity', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    const routes = [
        '/admin/dashboard',
        '/admin/benim-gunum',
        '/admin/gorusmeler',
        '/admin/finans',
        '/admin/finans/kiralar',
        '/admin/finans/kira-ayarlari',
        '/admin/gorevler',
        '/admin/gorevler/kanban',
        '/admin/takvim',
        '/admin/onaylar',
        '/admin/basvurular',
        '/admin/durumlar',
        '/admin/girisimciler',
        '/admin/mentorler',
        '/admin/rehber',
        '/admin/iletisim',
        '/admin/kvkk',
        '/admin/programlar',
        '/admin/projeler',
        '/admin/faaliyetler',
        '/admin/etkinlikler',
        '/admin/destekler',
        '/admin/hakkimizda',
        '/admin/haberler',
        '/admin/sayfalar',
        '/admin/anasayfa',
        '/admin/form-builder',
        '/admin/medya',
        '/admin/partnerler',
        '/admin/menuler',
        '/admin/raporlar',
        '/admin/raporlar/gunluk',
        '/admin/raporlar/aylik',
        '/admin/raporlar/yillik',
        '/admin/raporlar/ekip',
        '/admin/raporlar/kullanici',
        '/admin/raporlar/sosyal-medya',
        '/admin/raporlar/ozel',
        '/admin/entegrasyonlar/sosyal-medya',
        '/admin/sosyal-medya/gelen-kutusu',
        '/admin/kullanicilar',
        '/admin/roller',
        '/admin/guvenlik',
        '/admin/sistem-durumu',
        '/admin/sistem-sagligi',
        '/admin/ayarlar',
        '/admin/eposta-merkezi',
        '/admin/eposta-sablonlari',
        '/admin/audit-log',
        '/admin/seo-redirects',
        '/admin/terimler',
        '/admin/ozel-alanlar',
    ];

    for (const route of routes) {
        test(`Sidebar Route: ${route} opens with HTTP 200 and no 404 or crash`, async ({ page }) => {
            const pageErrors: string[] = [];
            page.on('pageerror', error => pageErrors.push(error.message));

            const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 });
            expect(response?.status()).toBeLessThan(400);

            // Ensure no 404 page content
            const content = await page.content();
            expect(content).not.toContain('404 - Sayfa Bulunamadı');
            expect(content).not.toContain('This page could not be found');
            expect(pageErrors).toHaveLength(0);
        });
    }
});
