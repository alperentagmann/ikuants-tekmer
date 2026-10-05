import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Daily Interactions & Visitor Logs E2E', () => {
    let createdInteractionId: string | null = null;

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
        createdInteractionId = dbRecord?.id ?? null;
        expect(dbRecord?.subject).toBe(testSubject);

        if (dbRecord) {
            // 6. Convert to Task
            const convertTaskBtn = page.locator(`#convert-task-${dbRecord.id}`);
            await convertTaskBtn.click();
            await expect(page.getByText('yeni görev oluşturuldu')).toBeVisible({ timeout: 15000 });

            // Verify task was created in DB and linked
            const updatedInteraction = await prisma.dailyInteraction.findUnique({
                where: { id: dbRecord.id },
            });
            expect(updatedInteraction?.createdTaskId).not.toBeNull();

            // 7. Convert to Activity
            const convertActivityBtn = page.locator(`#convert-activity-${dbRecord.id}`);
            await convertActivityBtn.click();
            await expect(page.getByText('kurumsal faaliyet kaydı oluşturuldu')).toBeVisible({ timeout: 15000 });

            const finalInteraction = await prisma.dailyInteraction.findUnique({
                where: { id: dbRecord.id },
            });
            expect(finalInteraction?.createdActivityId).not.toBeNull();
        }

    });

    // Cleanup by exact IDs: the interaction and the task / activity converted from it
    test.afterEach(async () => {
        if (!createdInteractionId) return;
        const row = await prisma.dailyInteraction.findUnique({ where: { id: createdInteractionId }, select: { id: true, createdTaskId: true, createdActivityId: true } });
        createdInteractionId = null;
        if (!row) return;
        await prisma.dailyInteraction.delete({ where: { id: row.id } });
        if (row.createdTaskId) await prisma.task.deleteMany({ where: { id: row.createdTaskId } });
        if (row.createdActivityId) await prisma.corporateActivity.deleteMany({ where: { id: row.createdActivityId } });
    });
});
