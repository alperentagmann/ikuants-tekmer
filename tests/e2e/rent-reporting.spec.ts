import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Rent Reporting & Aging E2E (/admin/raporlar/kira)', () => {
    let createdContractId: string | null = null;

    test.afterEach(async () => {
        // Runs even when an assertion fails, so no test contract is left in the rent lists
        if (!createdContractId) return;
        const contractId = createdContractId;
        createdContractId = null;
        await prisma.rentPayment.deleteMany({ where: { accrual: { contractId } } });
        await prisma.rentAccrual.deleteMany({ where: { contractId } });
        await prisma.rentContract.deleteMany({ where: { id: contractId } });
    });

    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('should display aging matrix, accruals vs collections, and entrepreneur statement ledger', async ({ page }) => {
        const entrepreneur = await prisma.entrepreneur.findFirst();
        expect(entrepreneur).not.toBeNull();
        if (!entrepreneur) return;

        const uniqueSuffix = Date.now().toString();

        // 1. Create a RentContract, overdue accrual, and payment
        const contract = await prisma.rentContract.create({
            data: {
                entrepreneurId: entrepreneur.id,
                spaceName: `Ofis Rapor-${uniqueSuffix.slice(-4)}`,
                contractNo: `KIRA-REP-${uniqueSuffix.slice(-4)}`,
                startDate: new Date(Date.now() - 60 * 24 * 3600 * 1000),
                endDate: new Date(Date.now() + 300 * 24 * 3600 * 1000),
                monthlyRent: 20000,
                currency: 'TRY',
                dueDay: 5,
                status: 'ACTIVE',
            },
        });
        createdContractId = contract.id;

        const accrual = await prisma.rentAccrual.create({
            data: {
                contractId: contract.id,
                entrepreneurId: entrepreneur.id,
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                periodLabel: 'Test Dönemi 2026',
                baseAmount: 20000,
                vatAmount: 4000,
                totalDue: 24000,
                paidAmount: 14000,
                remainingAmount: 10000,
                currency: 'TRY',
                dueDate: new Date(Date.now() - 15 * 24 * 3600 * 1000), // 15 days overdue -> 8-30 Gün bucket
                status: 'PARTIALLY_PAID',
            },
        });

        const payment = await prisma.rentPayment.create({
            data: {
                accrualId: accrual.id,
                entrepreneurId: entrepreneur.id,
                amount: 14000,
                currency: 'TRY',
                paymentDate: new Date(),
                paymentMethod: 'BANK_TRANSFER',
                bankReceiptNo: `DEKONT-${uniqueSuffix.slice(-4)}`,
            },
        });

        // 2. Navigate to /admin/raporlar/kira
        await page.goto('/admin/raporlar/kira');
        await expect(page.getByRole('heading', { name: /Kira Raporu & Borç Yaşlandırma/i })).toBeVisible();

        // 3. Verify KPIs
        await expect(page.getByText(/Aylık Tahakkuk & Tahsilat/i).first()).toBeVisible();
        await expect(page.getByText(/Tahsilat Başarı Oranı/i).first()).toBeVisible();
        await expect(page.getByText(/Kalan & Gecikmiş Alacak/i).first()).toBeVisible();

        // 4. Verify Aging Matrix has segments
        await expect(page.getByText(/Vadesi Gelmemiş/i).first()).toBeVisible();
        await expect(page.getByText(/8–30 Gün/i).first()).toBeVisible();
        await expect(page.getByText(/90\+ Gün/i).first()).toBeVisible();

        // 5. Navigate to Entrepreneur Statement Page
        await page.goto(`/admin/girisimciler/${entrepreneur.id}/finans-kira`);
        await expect(page.getByText(/Kira & Tahsilat Ekstresi/i)).toBeVisible();
        await expect(page.getByText(/Kronolojik Hesap Hareketleri/i)).toBeVisible();
    });
});
