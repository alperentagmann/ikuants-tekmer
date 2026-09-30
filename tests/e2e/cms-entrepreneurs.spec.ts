import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';

test.describe('8. GİRİŞİMCİLER — BROWSER & COUNTS ACCEPTANCE', () => {
    test('DB Counts vs API Counts vs Rendered Cards & Turkish Title Verification', async ({ page }) => {
        // 1. DB Counts
        const dbTotal = await prisma.entrepreneur.count();
        const dbPublished = await prisma.entrepreneur.count({
            where: { isPublished: true, isArchived: false },
        });

        // 2. Fetch API count directly
        const apiRes = await page.request.get('/api/public/entrepreneurs');
        const apiData = await apiRes.json();
        const apiCount = apiData.entrepreneurs ? apiData.entrepreneurs.length : apiData.items?.length || 0;

        expect(apiCount).toBe(dbPublished);

        // 3. Open Public /girisimciler in real browser
        await page.goto('/girisimciler');
        await page.waitForLoadState('networkidle');

        // 4. Verify Turkish title is strictly "GİRİŞİMCİLER" (not GIRISIMCILER)
        const headerTitle = page.locator('section#entrepreneurs h2, h2').first();
        await expect(headerTitle).toBeVisible();
        const headerText = await headerTitle.innerText();
        expect(headerText.toUpperCase()).toContain('GİRİŞİMCİLER');
        expect(headerText).not.toContain('GIRISIMCILER');

        // 5. Rendered cards count strictly inside the entrepreneurs section
        const cards = page.locator('section#entrepreneurs div.grid > div');
        const renderedCount = await cards.count();

        console.log(`Entrepreneurs Counts — DB Total: ${dbTotal}, DB Published: ${dbPublished}, API: ${apiCount}, Rendered: ${renderedCount}`);
        expect(dbPublished).toBeGreaterThan(0);
        expect(apiCount).toBe(dbPublished);
        expect(renderedCount).toBe(dbPublished);
    });
});
