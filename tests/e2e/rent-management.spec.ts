import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Rent Management & Partial Payment Accruals E2E', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('should manage rent contracts, generate monthly accruals, handle partial payments, and verify state', async ({ page }) => {
        const entrepreneur = await prisma.entrepreneur.findFirst();
        expect(entrepreneur).not.toBeNull();
        if (!entrepreneur) return;

        // 1. Create a test rent contract for entrepreneur with 15,000 TL rent
        const contract = await prisma.rentContract.create({
            data: {
                entrepreneurId: entrepreneur.id,
                spaceName: 'Ofis Test-B101',
                contractNo: `KIRA-TEST-${Date.now()}`,
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
                monthlyRent: 15000,
                currency: 'TRY',
                dueDay: 5,
                status: 'ACTIVE',
            },
        });

        // 2. Navigate to /admin/finans/kiralar
        await page.goto('/admin/finans/kiralar');
        await expect(page.getByRole('heading', { name: /Kira & Tahsilat/i })).toBeVisible();

        // 3. Generate monthly accruals for this month
        await page.locator('#generate-accruals-btn').click();
        await page.locator('#confirm-generate-accruals-btn').click();
        await page.waitForTimeout(1500);

        // Verify accrual in DB
        const accrual = await prisma.rentAccrual.findFirst({
            where: { contractId: contract.id },
        });
        expect(accrual).not.toBeNull();
        expect(accrual?.totalDue).toBe(18000);

        // 4. Record Partial Payment (10,000 TL out of 18,000 TL)
        if (accrual) {
            await page.reload();
            const recordPaymentBtn = page.locator(`#record-payment-btn-${accrual.id}`);
            await recordPaymentBtn.click();
            await page.locator('#payment-amount-input').fill('10000');
            await page.locator('#confirm-payment-btn').click();
            await page.waitForTimeout(1500);

            // Verify in DB that status is PARTIALLY_PAID, paid = 10,000, remaining = 8,000
            const afterPartial = await prisma.rentAccrual.findUnique({
                where: { id: accrual.id },
            });
            expect(afterPartial?.status).toBe('PARTIALLY_PAID');
            expect(afterPartial?.paidAmount).toBe(10000);
            expect(afterPartial?.remainingAmount).toBe(8000);

            // 5. Pay remaining 8,000 TL
            await page.reload();
            const secondPaymentBtn = page.locator(`#record-payment-btn-${accrual.id}`);
            await secondPaymentBtn.click();
            await page.locator('#payment-amount-input').fill('8000');
            await page.locator('#confirm-payment-btn').click();
            await page.waitForTimeout(1500);

            // Verify in DB that status is PAID, paid = 18,000, remaining = 0
            const afterFull = await prisma.rentAccrual.findUnique({
                where: { id: accrual.id },
            });
            expect(afterFull?.status).toBe('PAID');
            expect(afterFull?.paidAmount).toBe(18000);
            expect(afterFull?.remainingAmount).toBe(0);
        }

        // Cleanup
        if (accrual) {
            await prisma.rentPayment.deleteMany({ where: { accrualId: accrual.id } });
            await prisma.rentAccrual.delete({ where: { id: accrual.id } });
        }
        await prisma.rentContract.delete({ where: { id: contract.id } });
    });
});
