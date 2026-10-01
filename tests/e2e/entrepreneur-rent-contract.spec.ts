import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { loginAsAdmin } from './helpers/auth';

test.describe('Entrepreneur Rent Contract, Documents & Accrual Lifecycle E2E', () => {
    const TEST_COMPANY_NAME = 'E2E TEST KIRA YAZILIM A.S.';
    const TEST_CONTRACT_NO = 'KIRA-E2E-8899';
    let testEntrepreneurId = '';

    test.beforeEach(async ({ page, context }) => {
        page.on('dialog', dialog => dialog.accept());
        await loginAsAdmin(context);

        // Cleanup any prior test data
        await prisma.rentContractDocument.deleteMany({
            where: { contract: { contractNo: TEST_CONTRACT_NO } }
        });
        await prisma.rentPayment.deleteMany({
            where: { entrepreneur: { name: TEST_COMPANY_NAME } }
        });
        await prisma.rentAccrual.deleteMany({
            where: { entrepreneur: { name: TEST_COMPANY_NAME } }
        });
        await prisma.rentContract.deleteMany({
            where: { contractNo: TEST_CONTRACT_NO }
        });
        await prisma.entrepreneur.deleteMany({
            where: { name: TEST_COMPANY_NAME }
        });

        // Create a test entrepreneur
        const entrepreneur = await prisma.entrepreneur.create({
            data: {
                name: TEST_COMPANY_NAME,
                slug: `e2e-kira-yazilim-${Date.now()}`,
                shortDesc: 'E2E Test için oluşturulmuş kuluçka girişimci şirketi.',
                sector: 'Yapay Zeka & Fintek',
                incubationType: 'INCUBATION',
                email: 'kira-test@example.com',
                phone: '0555 123 4567',
                isPublished: true,
            }
        });
        testEntrepreneurId = entrepreneur.id;
    });

    test.afterEach(async () => {
        if (testEntrepreneurId) {
            await prisma.rentContractDocument.deleteMany({
                where: { contract: { contractNo: TEST_CONTRACT_NO } }
            });
            await prisma.rentPayment.deleteMany({
                where: { entrepreneurId: testEntrepreneurId }
            });
            await prisma.rentAccrual.deleteMany({
                where: { entrepreneurId: testEntrepreneurId }
            });
            await prisma.rentContract.deleteMany({
                where: { entrepreneurId: testEntrepreneurId }
            });
            await prisma.entrepreneur.deleteMany({
                where: { id: testEntrepreneurId }
            });
        }
    });

    test('should manage entrepreneur rent contract, upload signed documents, generate accrual, handle partial and full payments', async ({ page }) => {

        // 1. Open Entrepreneur Detail Page
        await page.goto(`/admin/girisimciler/${testEntrepreneurId}`);
        await page.waitForLoadState('networkidle');

        // 2. Switch to Finans & Kira Tab
        const financeTab = page.locator('#tab-finans');
        await expect(financeTab).toBeVisible();
        await financeTab.click();

        // 3. Open "+ Kira Sözleşmesi Ekle" Modal
        const addContractBtn = page.locator('#add-rent-contract-btn');
        await expect(addContractBtn).toBeVisible();
        await addContractBtn.click();

        // 4. Fill in Contract Details (20.000 TL net + 20% VAT = 24.000 TL gross)
        await page.fill('#input-commercial-title', TEST_COMPANY_NAME);
        await page.fill('#input-contact-person', 'Kemal Finans Yetkilisi');
        await page.fill('#input-contract-no', TEST_CONTRACT_NO);
        await page.fill('#input-space-name', 'Ofis B-205');
        await page.fill('#input-monthly-rent', '20000');
        await page.fill('#input-start-date', '2026-01-01');
        await page.fill('#input-end-date', '2026-12-31');

        // Submit Contract
        const submitContractBtn = page.locator('#submit-rent-contract-btn');
        await submitContractBtn.click();
        await page.waitForTimeout(1000);

        // Verify contract is visible in UI
        await expect(page.locator(`text=${TEST_CONTRACT_NO}`).first()).toBeVisible();
        await expect(page.locator('text=Ofis B-205').first()).toBeVisible();
        await expect(page.locator('text=24.000 TRY').first()).toBeVisible();

        // 5. Upload a Contract Document (+ Belge Yükle)
        const addDocBtn = page.locator('button:has-text("+ Belge Yükle")').first();
        await expect(addDocBtn).toBeVisible();
        await addDocBtn.click();

        await page.fill('#input-doc-title', '2026 İmzalı Kira Sözleşmesi Aslı');
        await page.fill('#input-doc-file-url', 'https://ikuantstekmer.com/uploads/contracts/2026-kira-imzali.pdf');
        await page.locator('#submit-doc-btn').click();
        await page.waitForTimeout(1000);

        // Verify document is listed
        await expect(page.locator('text=2026 İmzalı Kira Sözleşmesi Aslı').first()).toBeVisible();

        // 6. Generate Accruals via API or UI for this period
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const contractInDb = await prisma.rentContract.findUnique({
            where: { contractNo: TEST_CONTRACT_NO }
        });
        expect(contractInDb).not.toBeNull();

        const accrual = await prisma.rentAccrual.create({
            data: {
                contractId: contractInDb!.id,
                entrepreneurId: testEntrepreneurId,
                year: currentYear,
                month: currentMonth,
                periodLabel: `${currentMonth}/${currentYear}`,
                baseAmount: 20000,
                vatAmount: 4000,
                totalDue: 24000,
                paidAmount: 0,
                remainingAmount: 24000,
                currency: 'TRY',
                dueDate: new Date(currentYear, currentMonth - 1, 5),
                status: 'DUE'
            }
        });

        // 7. Go to Central Rent Management (/admin/finans/kiralar)
        await page.goto('/admin/finans/kiralar');
        await page.waitForLoadState('networkidle');

        // Search for this entrepreneur
        await page.fill('#rent-search', TEST_COMPANY_NAME);
        await page.waitForTimeout(500);

        await expect(page.locator(`text=${TEST_COMPANY_NAME}`).first()).toBeVisible();
        await expect(page.locator('text=24.000 TL').first()).toBeVisible();

        // 8. Record Partial Payment (10.000 TL)
        const recordPayBtn = page.locator(`#record-payment-btn-${accrual.id}`);
        await expect(recordPayBtn).toBeVisible();
        await recordPayBtn.click();

        await page.fill('#payment-amount-input', '10000');
        await page.locator('#confirm-payment-btn').click();
        await page.waitForTimeout(1000);

        // Verify Partial Payment state
        await expect(page.locator('text=10.000 TL').first()).toBeVisible();
        await expect(page.locator('text=14.000 TL').first()).toBeVisible();
        await expect(page.locator('text=Kısmi Ödeme').first()).toBeVisible();

        // 9. Record Remaining Payment (14.000 TL)
        const recordSecondPayBtn = page.locator(`#record-payment-btn-${accrual.id}`);
        await expect(recordSecondPayBtn).toBeVisible();
        await recordSecondPayBtn.click();

        await page.fill('#payment-amount-input', '14000');
        await page.locator('#confirm-payment-btn').click();
        await page.waitForTimeout(1000);

        // Verify Fully Paid state
        await expect(page.locator('text=24.000 TL').first()).toBeVisible();
        await expect(page.locator('text=Ödendi').first()).toBeVisible();

        // 10. Re-verify Entrepreneur Detail Page Summary Card
        await page.goto(`/admin/girisimciler/${testEntrepreneurId}`);
        await page.waitForLoadState('networkidle');

        const financeTabRevisit = page.locator('#tab-finans');
        await expect(financeTabRevisit).toBeVisible();
        await financeTabRevisit.click();
        await page.waitForTimeout(500);

        // Summary Card should indicate "ÖDENDİ"
        await expect(page.locator('text=ÖDENDİ').first()).toBeVisible();
        await expect(page.locator('text=0 TRY').first()).toBeVisible();
    });
});
