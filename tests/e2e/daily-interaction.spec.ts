import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Daily Interactions & Visitor Logs E2E', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('should create interaction, convert to task, and convert to activity', async ({ page }) => {
        const testPerson = `Ziyaretci ${Date.now()}`;
        const testOrg = `Test Holding ${Date.now()}`;
        const testSubject = 'Yatirim ve Mentorluk Gorusmesi';

        // 1. Navigate to /admin/gorusmeler
        await page.goto('/admin/gorusmeler');
        await expect(page.getByRole('heading', { name: /Günlük Görüşmeler/i })).toBeVisible();

        // 2. Open create modal
        await page.locator('#new-interaction-btn').click();
        await expect(page.locator('#interaction-form')).toBeVisible();

        // 3. Fill form
        await page.locator('#form-person-name').fill(testPerson);
        await page.locator('#form-org-name').fill(testOrg);
        await page.locator('#form-subject').fill(testSubject);
        await page.locator('#form-meeting-notes').fill('Toplantida proje isbirligi ve yatirim olanaklari degerlendirildi.');
        await page.locator('#form-decisions').fill('On protokol imzalanacak');
        await page.locator('#save-interaction-btn').click();

        // 4. Verify in UI table
        await expect(page.getByText(testPerson)).toBeVisible();
        await expect(page.getByText(testOrg)).toBeVisible();

        // 5. Verify in DB
        const dbRecord = await prisma.dailyInteraction.findFirst({
            where: { contactName: testPerson },
        });
        expect(dbRecord).not.toBeNull();
        expect(dbRecord?.subject).toBe(testSubject);

        // 6. Convert to Task
        if (dbRecord) {
            const convertTaskBtn = page.locator(`#convert-task-${dbRecord.id}`);
            await convertTaskBtn.click();
            await page.waitForTimeout(1000);

            // Verify task was created in DB and linked
            const updatedInteraction = await prisma.dailyInteraction.findUnique({
                where: { id: dbRecord.id },
            });
            expect(updatedInteraction?.createdTaskId).not.toBeNull();

            // 7. Convert to Activity
            const convertActivityBtn = page.locator(`#convert-activity-${dbRecord.id}`);
            await convertActivityBtn.click();
            await page.waitForTimeout(1000);

            const finalInteraction = await prisma.dailyInteraction.findUnique({
                where: { id: dbRecord.id },
            });
            expect(finalInteraction?.createdActivityId).not.toBeNull();
        }

        // Cleanup
        if (dbRecord) {
            await prisma.dailyInteraction.delete({ where: { id: dbRecord.id } });
        }
    });
});
