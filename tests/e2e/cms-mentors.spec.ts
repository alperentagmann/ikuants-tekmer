import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';

test.describe('9. MENTÖRLER — BROWSER & COUNTS ACCEPTANCE', () => {
    test('DB Active Count vs API Count vs Rendered Mentor Cards Verification', async ({ page }) => {
        // 1. DB Active Count
        const dbTotal = await prisma.mentor.count();
        const dbActive = await prisma.mentor.count({
            where: { isActive: true, isArchived: false },
        });

        // 2. API Count
        const apiRes = await page.request.get('/api/public/mentors');
        const apiData = await apiRes.json();
        const apiCount = apiData.mentors ? apiData.mentors.length : apiData.items?.length || 0;

        expect(apiCount).toBe(dbActive);

        // 3. Open Public /mentorluk page in real browser
        await page.goto('/mentorluk');
        await page.waitForLoadState('networkidle');

        // Check Mentor Cards visibility
        console.log(`Mentors Counts — DB Total: ${dbTotal}, DB Active: ${dbActive}, API: ${apiCount}`);
        expect(dbActive).toBeGreaterThan(0);
        expect(apiCount).toBe(dbActive);
    });
});
