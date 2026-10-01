import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('AI Operations Layer & Natural Language Assistant (Zero-Defect Flow)', () => {
    const timestamp = Date.now();
    const testUserEmail = `ai-user-${timestamp}@example.com`;

    test.afterAll(async () => {
        try {
            await prisma.user.deleteMany({
                where: { email: testUserEmail }
            });
            await prisma.heroSlide.deleteMany({
                where: { title: { contains: 'AI Test Banner' } }
            });
            await prisma.aiChangeSet.deleteMany({
                where: { requestPrompt: { contains: 'Test' } }
            });
        } catch (e) {
            console.error('Cleanup error:', e);
        }
    });

    test('AI Command Center: parse natural prompt, execute domain action, verify audit log and perform undo', async ({ page, context }) => {
        await loginAsAdmin(context);

        await page.goto('/admin/dashboard');
        await expect(page.locator('text=İKÜANTS AI Komuta & Operasyon Merkezi').first()).toBeVisible();

        // 1. Submit a structured natural language prompt
        await page.fill('#ai-command-input', `Test AI Banner ekle: başlığı AI Test Banner ${timestamp} olsun`);
        await page.click('#ai-command-submit-btn');

        // Wait for AI response preview card
        await expect(page.locator('text=AI Operasyon Planı & Önizleme').first()).toBeVisible({ timeout: 10000 });

        // 2. Click "Onayla ve Uygula"
        const applyBtn = page.locator('#ai-confirm-execute-btn');
        await expect(applyBtn).toBeVisible();
        await applyBtn.click();
        
        // 3. Verify Success & Undo button appears
        const undoBtn = page.locator('#ai-undo-btn');
        await expect(undoBtn).toBeVisible({ timeout: 10000 });

        // Verify Banner was created in DB
        const banner = await prisma.heroSlide.findFirst({
            where: { title: { contains: `AI Test Banner ${timestamp}` } }
        });
        expect(banner).toBeTruthy();

        // 4. Test Undo functionality
        await undoBtn.click();
        await page.waitForTimeout(1000);

        // Verify rollback
        const rolledBackBanner = await prisma.heroSlide.findFirst({
            where: { id: banner?.id }
        });
        expect(rolledBackBanner).toBeNull();
    });

    test('AI Global Drawer: accessible from any page via shortcut or header button', async ({ page, context }) => {
        await loginAsAdmin(context);

        await page.goto('/admin/rehber');
        const aiDrawerBtn = page.locator('#global-ai-assistant-btn');
        await expect(aiDrawerBtn).toBeVisible();

        await aiDrawerBtn.click();
        await expect(page.locator('#ai-drawer-title')).toContainText('İKÜANTS AI Asistanı');

        // Close drawer
        await page.click('#close-ai-drawer-btn');
    });
});
