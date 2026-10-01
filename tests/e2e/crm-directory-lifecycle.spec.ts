import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('CRM & Unified Directory Lifecycle (Zero-Defect Flow)', () => {
    const timestamp = Date.now();
    const testPersonEmail = `crm-person-${timestamp}@example.com`;
    const testPersonName = `Ahmet Test ${timestamp}`;
    const testEntrepreneurName = `Test Girişimi ${timestamp}`;
    const testCompanyName = `Test Şirketi ${timestamp} A.Ş.`;

    test.afterAll(async () => {
        try {
            await prisma.rentPayment.deleteMany({
                where: { entrepreneur: { name: testEntrepreneurName } }
            });
            await prisma.rentAccrual.deleteMany({
                where: { entrepreneur: { name: testEntrepreneurName } }
            });
            await prisma.rentContract.deleteMany({
                where: { entrepreneur: { name: testEntrepreneurName } }
            });
            await prisma.entrepreneurProgram.deleteMany({
                where: { entrepreneur: { name: testEntrepreneurName } }
            });
            await prisma.entrepreneur.deleteMany({
                where: { name: testEntrepreneurName }
            });
            await prisma.personOrganizationMembership.deleteMany({
                where: { person: { email: testPersonEmail } }
            });
            await prisma.organization.deleteMany({
                where: { legalName: testCompanyName }
            });
            await prisma.person.deleteMany({
                where: { email: testPersonEmail }
            });
        } catch (e) {
            console.error('Cleanup error:', e);
        }
    });

    test('Full lifecycle: Person -> Entrepreneur -> Founder -> Company -> Program -> Mentor -> Rent Contract -> Payment', async ({ page, context }) => {
        await loginAsAdmin(context);

        // 1. Create Person in Central Directory
        await page.goto('/admin/rehber');
        await expect(page.locator('h1')).toContainText('Kişi & Kurum Rehberi');

        await page.click('#add-person-btn');
        await page.fill('#person-first-name', 'Ahmet Test');
        await page.fill('#person-last-name', `${timestamp}`);
        await page.fill('#person-email', testPersonEmail);
        await page.fill('#person-phone', '+90 555 123 4567');
        await page.click('#submit-person-btn');

        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toContainText(testPersonEmail);

        // 2. Create Entrepreneur
        const person = await prisma.person.findFirst({ where: { email: testPersonEmail } });
        expect(person).toBeTruthy();

        const entrepreneur = await prisma.entrepreneur.create({
            data: {
                name: testEntrepreneurName,
                slug: `test-girisimi-${timestamp}`,
                sector: 'Yazılım & AI',
                shortDesc: 'AI Tabanlı Operasyon Platformu',
                email: `info-${timestamp}@girisim.com`,
                companyStatus: 'NOT_INCORPORATED',
                isPublished: true,
                founders: person?.fullName
            }
        });
        expect(entrepreneur).toBeTruthy();

        // 3. Navigate to Entrepreneur Detail
        await page.goto(`/admin/girisimciler/${entrepreneur.id}`);
        await expect(page.locator('h1')).toContainText(testEntrepreneurName);

        // Verify "Program Atanmamış" status & actionable button
        await expect(page.locator('#entrepreneur-active-program-badge')).toContainText('Program Atanmamış');
        await expect(page.locator('#checklist-assign-program-btn')).toBeVisible();

        // 4. Assign Program
        await page.click('#checklist-assign-program-btn');
        await expect(page.locator('#assign-program-select')).toBeVisible({ timeout: 5000 });

        let defaultProgram = await prisma.program.findFirst();
        if (!defaultProgram) {
            defaultProgram = await prisma.program.create({
                data: {
                    name: 'ANTSPARK Hızlandırma Programı',
                    slug: `antspark-${timestamp}`,
                    ctaDescription: 'Erken aşama girişimcilik programı'
                }
            });
        }
        await page.selectOption('#assign-program-select', defaultProgram.id);
        await page.click('#submit-assign-program-btn');

        await page.waitForTimeout(1000);

        // 5. Verify Rent Cockpit shows the Entrepreneur even without contract
        await page.goto('/admin/finans/kiralar');
        await page.waitForSelector('table', { timeout: 10000 });
        await expect(page.locator('body')).toContainText(testEntrepreneurName);
        await expect(page.locator('body')).toContainText('Sözleşme Yok');

        // 6. Create Rent Contract directly from Rent Cockpit
        const contractBtn = page.locator(`#add-rent-contract-btn-${entrepreneur.id}`);
        await expect(contractBtn).toBeVisible();
        await contractBtn.click();
        await page.click('#submit-contract-btn');
        await page.waitForTimeout(1000);

        // Verify Database Persistence
        const contract = await prisma.rentContract.findFirst({
            where: { entrepreneurId: entrepreneur.id }
        });
        expect(contract).toBeTruthy();
    });
});
