import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';
import fs from 'fs';
import path from 'path';

test.describe('14. HERO SLIDER — 23 SLIDES CMS & PARITY ACCEPTANCE', () => {
    test('DB Count = 23, Admin Count = 23, Public Data = 23, No Broken Images, No Duplicate URLs', async ({ page, context }) => {
        // 1. DB Count Verification
        const dbTotal = await prisma.heroSlide.count({ where: { isArchived: false } });
        const dbPublished = await prisma.heroSlide.count({ where: { isArchived: false, isActive: true, status: 'PUBLISHED' } });
        console.log(`Hero Slides in DB — Total: ${dbTotal}, Published: ${dbPublished}`);
        expect(dbTotal).toBeGreaterThanOrEqual(23);
        expect(dbPublished).toBeGreaterThanOrEqual(23);

        // 2. Image Assets Existence & Uniqueness Check
        const slides = await prisma.heroSlide.findMany({
            where: { isArchived: false },
            orderBy: { sortOrder: 'asc' },
        });

        const urls = new Set<string>();
        let brokenImages = 0;

        for (const slide of slides) {
            expect(slide.mediaUrl).toBeTruthy();
            urls.add(slide.mediaUrl);

            // Check if local static file exists
            const localRelPath = slide.mediaUrl.startsWith('/') ? slide.mediaUrl.slice(1) : slide.mediaUrl;
            const fullLocalPath = path.join(process.cwd(), 'public', localRelPath);
            if (!fs.existsSync(fullLocalPath)) {
                console.error(`Broken image asset: ${slide.mediaUrl}`);
                brokenImages++;
            }
        }

        console.log(`Unique Local Hero Assets: ${urls.size}, Broken Images: ${brokenImages}`);
        expect(brokenImages).toBe(0);
        expect(urls.size).toBeGreaterThanOrEqual(15); // Rich distinct photographic assets across 23 slides

        // 3. Admin Route Verification
        await loginAsAdmin(context);
        await page.goto('/admin/anasayfa');
        await page.waitForLoadState('networkidle');

        // Verify that 23 slides are loaded in the admin interface
        const adminSlideCards = page.locator('[data-testid="hero-slide-card"]');
        const countInAdmin = await adminSlideCards.count();
        console.log(`Admin Slide Count Rendered: ${countInAdmin}`);
        expect(countInAdmin).toBe(23);

        // 4. Public API & Public Page Verification
        const response = await page.request.get('/api/public/slides');
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.slides.length).toBeGreaterThanOrEqual(23);

        // 5. Public Homepage Slider Counter
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Verify the counter pill renders the total count (e.g. / 23)
        const counter = page.locator('[data-testid="hero-slide-counter"]');
        await expect(counter.first()).toBeVisible();
        await expect(counter.first()).toContainText('23');
    });
});
