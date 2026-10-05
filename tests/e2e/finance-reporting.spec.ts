import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Finance Reporting Center E2E (/admin/raporlar/finans)', () => {
    let createdProjectId: string | null = null;

    test.afterEach(async () => {
        // Runs even when an assertion fails, so no test project is left in the admin lists
        if (!createdProjectId) return;
        const projectId = createdProjectId;
        createdProjectId = null;
        await prisma.invoiceRecord.deleteMany({ where: { projectId } });
        await prisma.projectExpense.deleteMany({ where: { projectId } });
        await prisma.projectBudgetLine.deleteMany({ where: { projectId } });
        await prisma.fundingReceipt.deleteMany({ where: { fundingSource: { projectId } } });
        await prisma.fundingSource.deleteMany({ where: { projectId } });
        await prisma.project.deleteMany({ where: { id: projectId } });
    });

    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('should render comprehensive finance reports with real DB data, charts, and budget breakdowns', async ({ page }) => {
        const adminUser = await prisma.user.findFirst({ where: { email: 'bilgi@ikuantstekmer.com' } });
        expect(adminUser).not.toBeNull();
        if (!adminUser) return;

        // 1. Create a test project with funding and expenses in DB
        const uniqueSuffix = Date.now().toString();
        const project = await prisma.project.create({
            data: {
                title: `Finans Rapor Test Projesi ${uniqueSuffix}`,
                slug: `finans-rapor-test-${uniqueSuffix}`,
                code: `FRP-${uniqueSuffix.slice(-4)}`,
                budgetAmount: 500000,
                currency: 'TRY',
                startDate: new Date(),
                status: 'ACTIVE',
                createdById: adminUser.id,
            },
        });
        createdProjectId = project.id;

        const funding = await prisma.fundingSource.create({
            data: {
                projectId: project.id,
                organizationName: 'KOSGEB',
                programGrantName: 'TEKMER Destek Programı',
                awardedAmount: 400000,
                currency: 'TRY',
                status: 'ACTIVE',
                receipts: {
                    create: {
                        amount: 250000,
                        currency: 'TRY',
                        expectedDate: new Date(),
                        receivedDate: new Date(),
                        status: 'RECEIVED',
                    },
                },
            },
        });

        const budgetLine = await prisma.projectBudgetLine.create({
            data: {
                projectId: project.id,
                code: '1.1',
                title: 'Yazılım Geliştirme Kalemi',
                category: 'SOFTWARE',
                allocatedAmount: 300000,
                currency: 'TRY',
            },
        });

        const expense = await prisma.projectExpense.create({
            data: {
                projectId: project.id,
                fundingSourceId: funding.id,
                budgetLineId: budgetLine.id,
                category: 'SOFTWARE',
                supplierVendor: `Test Soft Ltd ${uniqueSuffix}`,
                description: 'Bulut Sunucu Altyapı Bedeli',
                amount: 80000,
                vatAmount: 16000,
                totalAmount: 96000,
                currency: 'TRY',
                paymentStatus: 'PAID',
                paymentDate: new Date(),
                invoiceNumber: `FAT-${uniqueSuffix.slice(-4)}`,
                invoiceDate: new Date(),
            },
        });

        // 2. Navigate to /admin/raporlar/finans
        await page.goto('/admin/raporlar/finans');
        await expect(page.getByRole('heading', { name: /Finansal Raporlar & Nakit Akışı/i })).toBeVisible();

        // 3. Verify Executive Summary Cards exist
        await expect(page.getByText(/Toplam Onaylı Bütçe/i).first()).toBeVisible();
        await expect(page.getByText(/Gelen \/ Beklenen Finansman/i).first()).toBeVisible();
        await expect(page.getByText(/Toplam Harcama & Taahhüt/i).first()).toBeVisible();
        await expect(page.getByText(/Kullanılabilir Nakit & Oran/i).first()).toBeVisible();

        // 4. Test Tab Navigation: Project Detail
        await page.getByRole('button', { name: /Proje Finans Detayı/i }).click();
        const projectHeading = page.getByRole('heading', { name: project.title });
        await expect(projectHeading).toBeVisible();

        // Expand project budget lines
        await projectHeading.click();
        await expect(page.getByText(budgetLine.title)).toBeVisible();

        // 5. Test Cash Flow Tab
        await page.getByRole('button', { name: /Aylık Nakit Akışı/i }).click();
        await expect(page.getByText(/Aylık Nakit Akışı Detay Tablosu/i)).toBeVisible();

        // 6. Test Expense Categories Tab
        await page.getByRole('button', { name: /Gider Kategori Dağılımı/i }).click();
        await expect(page.getByText(/Gider Kategorileri & Harcama Kırılımı/i)).toBeVisible();
    });
});
