import { test, expect } from '@playwright/test';

test.describe('10. MOBILE HERO & RESPONSIVENESS (390px Viewport)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('Mobile Hero: Headline, Description, CTA, Pagination & No Horizontal Overflow', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // 1. Headline visibility
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible();

        // 2. Description visibility
        const description = page.locator('p').first();
        await expect(description).toBeVisible();

        // 3. Primary CTA button visibility & clickability
        const ctaBtn = page.getByRole('link', { name: /HEMEN BAŞVUR/i }).first();
        await expect(ctaBtn).toBeVisible();

        // 4. Counter / Pagination Pill visibility (e.g. 01 / 23)
        const counterPill = page.locator('[data-testid="hero-counter-pill"]').first();
        await expect(counterPill).toBeVisible();

        // 5. No horizontal overflow check
        const isOverflowing = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(isOverflowing).toBe(false);
    });
});
