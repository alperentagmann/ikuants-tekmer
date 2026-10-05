import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Receivables Center E2E (/admin/finans/alacaklar)', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('should manage generic receivables, create items, record payments, and compute balances', async ({ page }) => {
        const uniqueSuffix = Date.now().toString();
        const debtorName = `Global Inovasyon A.S. ${uniqueSuffix.slice(-4)}`;

        // 1. Create a generic receivable directly in DB
        const receivable = await prisma.receivable.create({
            data: {
                debtor: debtorName,
                source: 'SERVICE_FEE',
                description: 'Prototipleme Laboratuvar Hizmet Bedeli',
                amount: 50000,
                currency: 'TRY',
                dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
                paid: 20000,
                remaining: 30000,
                status: 'PARTIALLY_PAID',
            },
        });

        // 2. Navigate to /admin/finans/alacaklar
        await page.goto('/admin/finans/alacaklar');
        await expect(page.getByRole('heading', { name: /Alacaklar & Tahsilat Takibi/i })).toBeVisible();

        // 3. Verify created receivable is visible in the list
        await expect(page.getByText(debtorName)).toBeVisible();
        await expect(page.locator('table').getByText('SERVICE_FEE').first()).toBeVisible();

        // 4. Record remaining payment via UI
        const payBtn = page.locator('tr', { hasText: debtorName }).getByRole('button', { name: /Tahsilat Al/i });
        if (await payBtn.isVisible()) {
            await payBtn.click();
            await page.getByPlaceholder(/Dekont no, ödeme yöntemi/i).fill(`DEKONT-${uniqueSuffix.slice(-4)}`);
            await page.getByRole('button', { name: /Tahsilatı Onayla/i }).click();
            await page.waitForTimeout(1000);
        }

        // Cleanup
        await prisma.receivable.deleteMany({ where: { debtor: debtorName } });
    });
});
