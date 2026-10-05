import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

/**
 * Super admin passes a task to another admin from the task drawer; the receiver sees it in
 * İş Takip Merkezi › Bana paslananlar and accepts it. QA records are removed by exact id.
 */
test.describe('Task handoff between admins', () => {
    const RUN = `qa-handoff-${Date.now().toString(36)}`;
    let taskId: string | null = null;

    test.afterEach(async () => {
        if (!taskId) return;
        const handoffIds = (await prisma.taskHandoff.findMany({ where: { taskId }, select: { id: true } })).map((h) => h.id);
        for (const id of handoffIds) await prisma.notification.deleteMany({ where: { targetUrl: { contains: `handoffId=${id}` } } });
        await prisma.notification.deleteMany({ where: { targetUrl: `/admin/gorevler?taskId=${taskId}` } });
        await prisma.auditLog.deleteMany({ where: { entityId: { in: [taskId, ...handoffIds] } } });
        await prisma.activityTimeline.deleteMany({ where: { entityType: 'Task', entityId: taskId } });
        await prisma.task.deleteMany({ where: { id: taskId } });
        taskId = null;
    });

    test('super admin passes a task, the receiver accepts it', async ({ browser, context, page }) => {
        const sender = await prisma.user.findFirst({ where: { email: 'bilgi@ikuantstekmer.com' }, select: { id: true } });
        const receiver = await prisma.user.findFirst({ where: { isActive: true, email: { not: 'bilgi@ikuantstekmer.com' } }, orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true } });
        test.skip(!sender || !receiver, 'Two active admin users are required.');
        const task = await prisma.task.create({ data: { title: `${RUN} Sözleşme kontrolü`, createdById: sender!.id, assignees: { create: { userId: sender!.id } } } });
        taskId = task.id;

        await loginAsAdmin(context);
        await page.goto(`/admin/gorevler?taskId=${task.id}`, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: 'Pasla' }).first().click();
        const dialog = page.getByRole('dialog', { name: 'Görevi pasla' });
        await dialog.getByPlaceholder('Kişi ara (ad, unvan, birim)').fill(receiver!.name);
        await dialog.getByRole('button', { name: new RegExp(receiver!.name) }).first().click();
        await dialog.getByPlaceholder('Ne yapılması gerektiğini kısaca yazın.').fill(`${RUN} not`);
        await dialog.getByRole('button', { name: 'Pasla' }).click();
        await expect.poll(async () => (await prisma.taskHandoff.findFirst({ where: { taskId: task.id } }))?.status, { timeout: 10000 }).toBe('PENDING');
        const assignees = await prisma.taskAssignee.findMany({ where: { taskId: task.id }, select: { userId: true } });
        expect(assignees.map((a) => a.userId)).toEqual([receiver!.id]);

        const receiverContext = await browser.newContext({ storageState: 'tests/e2e/helpers/consent-state.json' });
        await loginAsAdmin(receiverContext, receiver!.email);
        const receiverPage = await receiverContext.newPage();
        await receiverPage.goto('http://localhost:3000/admin/is-takip?tab=inbox', { waitUntil: 'networkidle' });
        const card = receiverPage.locator('li, article, div').filter({ hasText: `${RUN} Sözleşme kontrolü` }).filter({ has: receiverPage.getByRole('button', { name: 'Kabul et' }) }).last();
        await card.getByRole('button', { name: 'Kabul et' }).click();
        await expect.poll(async () => (await prisma.taskHandoff.findFirst({ where: { taskId: task.id } }))?.status, { timeout: 10000 }).toBe('ACCEPTED');
        await receiverContext.close();
    });
});
