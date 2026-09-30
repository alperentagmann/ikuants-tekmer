import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Project Finance Ledger & Budget vs Actuals E2E', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('should calculate real-time ledger math (budget, received, spent, cash, remaining)', async ({ page }) => {
        const adminUser = await prisma.user.findFirst({ where: { email: 'bilgi@ikuantstekmer.com' } });
        expect(adminUser).not.toBeNull();
        if (!adminUser) return;

        const uniqueProjectTitle = `Test AR-GE Finans ${Date.now()}`;
        const project = await prisma.project.create({
            data: {
                title: uniqueProjectTitle,
                slug: `test-ar-ge-finans-${Date.now()}`,
                code: `PRJ-${Date.now().toString().slice(-4)}`,
                budgetAmount: 1000000,
                currency: 'TRY',
                startDate: new Date(),
                status: 'ACTIVE',
                creator: { connect: { id: adminUser.id } },
            },
        });

        // 1. Navigate to Project Finance Tab
        await page.goto(`/admin/projeler/${project.id}/finans`);
        await expect(page.getByRole('heading', { name: /Finans & Bütçe Yönetimi/i })).toBeVisible();

        // 2. Add Funding Source (600,000 TL awarded)
        await page.locator('#add-funding-btn').click();
        await page.locator('#funding-awarded-amount').fill('600000');
        await page.locator('#save-funding-btn').click();
        await page.waitForTimeout(1000);

        const funding = await prisma.fundingSource.findFirst({
            where: { projectId: project.id },
        });
        expect(funding).not.toBeNull();

        // 3. Add Receipt / Installment (300,000 TL received)
        if (funding) {
            await page.locator(`#add-receipt-btn-${funding.id}`).click();
            await page.locator('#receipt-amount').fill('300000');
            await page.locator('#save-receipt-btn').click();
            await page.waitForTimeout(1000);
        }

        // 4. Add Expense (100,000 TL spent)
        await page.locator('#add-expense-btn').click();
        await page.locator('#expense-amount').fill('100000');
        await page.locator('#expense-vendor').fill('Yazilim Donanim Ltd');
        await page.locator('#expense-desc').fill('Server Lisans Bedeli');
        await page.locator('#save-expense-btn').click();
        await page.waitForTimeout(1500);

        // 5. Verify real-time computed Ledger KPIs on page:
        // Budget = 1,000,000 TL
        // Received = 300,000 TL
        // Spent = 120,000 TL (100,000 + 20% VAT)
        // Cash Available = 300,000 - 120,000 = 180,000 TL
        // Budget Remaining = 1,000,000 - 120,000 = 880,000 TL
        await expect(page.locator('#kpi-total-budget')).toContainText('1.000.000');
        await expect(page.locator('#kpi-total-received')).toContainText('300.000');
        await expect(page.locator('#kpi-total-spent')).toContainText('120.000');
        await expect(page.locator('#kpi-cash-available')).toContainText('180.000');
        await expect(page.locator('#kpi-budget-remaining')).toContainText('880.000');

        // Cleanup
        await prisma.projectExpense.deleteMany({ where: { projectId: project.id } });
        await prisma.fundingReceipt.deleteMany({ where: { fundingSource: { projectId: project.id } } });
        await prisma.fundingSource.deleteMany({ where: { projectId: project.id } });
        await prisma.project.delete({ where: { id: project.id } });
    });
});
