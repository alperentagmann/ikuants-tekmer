import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import * as path from 'path';
import * as fs from 'fs';

test.describe('16. SCREENSHOT QA & KANIT ÜRETİMİ', () => {
    const screenshotDir = path.resolve(process.cwd(), 'docs/screenshots');

    test.beforeAll(() => {
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }
    });

    test('Tüm Gerekli Ekran Görüntülerini Gerçek Tarayıcı ile Yakala', async ({ page, context }) => {
        // 1. Desktop 1920 Viewport Homepage
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'homepage-1920.png'), fullPage: false });

        // 2. Desktop 1440 Viewport Homepage
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'homepage-1440.png'), fullPage: false });

        // 3. Mobile 390 Viewport Homepage
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'homepage-390.png'), fullPage: false });
        await page.screenshot({ path: path.join(screenshotDir, 'mobile-homepage.png'), fullPage: false });

        // Reset to Standard 1280x800 for other pages
        await page.setViewportSize({ width: 1280, height: 800 });

        // 4. Public Programs Overview (/programlar)
        await page.goto('/programlar');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'programs-public.png'), fullPage: false });

        // 5. Public Dynamic Program Detail (/programlar/antspark-on-kulucka)
        await page.goto('/programlar/antspark-on-kulucka');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'program-detail.png'), fullPage: false });

        // 6. Public Kurullar & Girisimciler & Mentorler
        await page.goto('/kurullar');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'kurullar-public.png'), fullPage: false });

        await page.goto('/girisimciler');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'girisimciler-public.png'), fullPage: false });

        await page.goto('/mentorluk');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'mentorler-public.png'), fullPage: false });

        // 7. Super Admin Login for Admin Pages
        await loginAsAdmin(context);

        // 8. Hero Admin Studio with 23 Slides (/admin/anasayfa)
        await page.goto('/admin/anasayfa');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'hero-admin-23.png'), fullPage: false });

        // 9. Hakkımızda Admin
        await page.goto('/admin/hakkimizda');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'hakkimizda-admin.png'), fullPage: false });

        // 10. Destekler Admin
        await page.goto('/admin/destekler');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'destekler-admin.png'), fullPage: false });

        // 11. Full Program Editor with Block Builder (/admin/programlar)
        await page.goto('/admin/programlar');
        await page.waitForLoadState('networkidle');
        const editBtn = page.locator('button[title="Düzenle"]').first();
        if (await editBtn.isVisible()) {
            await editBtn.click();
            await page.waitForTimeout(500);
        }
        await page.screenshot({ path: path.join(screenshotDir, 'program-editor-full.png'), fullPage: false });
        await page.screenshot({ path: path.join(screenshotDir, 'program-editor.png'), fullPage: false });

        // 12. Benim Günüm (/admin/benim-gunum)
        await page.goto('/admin/benim-gunum');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'benim-gunum.png'), fullPage: false });

        // 13. Günlük Görüşmeler (/admin/gorusmeler)
        await page.goto('/admin/gorusmeler');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'gorusmeler.png'), fullPage: false });

        // 14. KVKK & İzin Yönetim Merkezi (/admin/kvkk)
        await page.goto('/admin/kvkk');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'kvkk-center.png'), fullPage: false });

        // 15. Kira Yönetim Merkezi (/admin/finans/kiralar)
        await page.goto('/admin/finans/kiralar');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(screenshotDir, 'rent-dashboard.png'), fullPage: false });

        // 16. Girişimci Detayı - Programlar & Finans/Kira Tabları
        const testEntrepreneur = await (await import('../../lib/prisma')).prisma.entrepreneur.findFirst();
        if (testEntrepreneur) {
            await page.goto(`/admin/girisimciler/${testEntrepreneur.id}`);
            await page.waitForLoadState('networkidle');

            // Program Tab Screenshot
            const progTab = page.locator('#tab-programlar');
            if (await progTab.isVisible()) {
                await progTab.click();
                await page.waitForTimeout(400);
                await page.screenshot({ path: path.join(screenshotDir, 'entrepreneur-programs.png'), fullPage: false });
            }

            // Finans & Kira Tab Screenshot
            const finTab = page.locator('#tab-finans-kira');
            if (await finTab.isVisible()) {
                await finTab.click();
                await page.waitForTimeout(400);
                await page.screenshot({ path: path.join(screenshotDir, 'entrepreneur-finance-rent.png'), fullPage: false });
            }
        }

        // 17. Proje Finans Ekranı (/admin/projeler/[id]/finans)
        const testProject = await (await import('../../lib/prisma')).prisma.project.findFirst();
        if (testProject) {
            await page.goto(`/admin/projeler/${testProject.id}/finans`);
            await page.waitForLoadState('networkidle');
            await page.screenshot({ path: path.join(screenshotDir, 'project-finance.png'), fullPage: false });
        }
    });
});
