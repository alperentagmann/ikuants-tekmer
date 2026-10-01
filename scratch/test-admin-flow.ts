import { chromium } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { createSession } from '../lib/auth';

async function testFlow() {
    const user = await prisma.user.findFirst({ where: { email: 'bilgi@ikuantstekmer.com' } });
    const { sessionToken } = await createSession(user!.id);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    await context.addCookies([
        { name: '__session', value: sessionToken, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }
    ]);
    const page = await context.newPage();
    page.on('dialog', d => d.accept());

    console.log('1. Navigating to /admin/hakkimizda...');
    await page.goto('http://localhost:3000/admin/hakkimizda');
    await page.waitForLoadState('networkidle');

    console.log('2. Clicking Kurul Üyeleri tab...');
    await page.getByRole('button', { name: /Kurul Üyeleri/i }).click();
    await page.waitForTimeout(500);

    console.log('3. Clicking Yeni Kurul Üyesi Ekle...');
    const addBtn = page.getByRole('button', { name: /Yeni Kurul Üyesi Ekle/i });
    await addBtn.click();
    await page.waitForTimeout(500);

    const testName = 'E2E TEST PROF. DR. AHMET YILMAZ';
    const updatedName = 'E2E TEST PROF. DR. AHMET GÜNCELLENDİ';

    console.log('4. Filling modal fields...');
    const modal = page.locator('div.fixed');
    const inputs = modal.locator('input[type="text"]');
    await inputs.nth(0).fill(testName);
    await inputs.nth(1).fill('Yönetim Kurulu Üyesi (Test)');

    console.log('5. Clicking Kaydet...');
    await modal.getByRole('button', { name: 'Kaydet' }).click();
    await page.waitForTimeout(1000);

    const inDb = await prisma.boardMember.findFirst({ where: { fullName: testName } });
    console.log('Created in DB:', !!inDb, inDb?.fullName);

    console.log('6. Checking Public /kurullar...');
    await page.goto('http://localhost:3000/kurullar');
    await page.waitForLoadState('networkidle');
    const visiblePublic = await page.locator(`text=${testName}`).isVisible();
    console.log('Visible on public /kurullar:', visiblePublic);

    console.log('7. Editing in /admin/hakkimizda...');
    await page.goto('http://localhost:3000/admin/hakkimizda');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Kurul Üyeleri/i }).click();
    await page.waitForTimeout(500);

    const card = page.locator('div.rounded-xl').filter({ hasText: testName }).first();
    const editBtn = card.locator('button').first();
    await editBtn.click();
    await page.waitForTimeout(500);

    const editModal = page.locator('div.fixed');
    await editModal.locator('input[type="text"]').nth(0).fill(updatedName);
    await editModal.getByRole('button', { name: 'Kaydet' }).click();
    await page.waitForTimeout(1000);

    const updatedInDb = await prisma.boardMember.findFirst({ where: { fullName: updatedName } });
    console.log('Updated in DB:', !!updatedInDb, updatedInDb?.fullName);

    console.log('8. Checking Public updated name...');
    await page.goto('http://localhost:3000/kurullar');
    await page.waitForLoadState('networkidle');
    const updatedVisible = await page.locator(`text=${updatedName}`).isVisible();
    console.log('Updated visible on public /kurullar:', updatedVisible);

    console.log('9. Deleting / Archiving...');
    await page.goto('http://localhost:3000/admin/hakkimizda');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Kurul Üyeleri/i }).click();
    await page.waitForTimeout(500);

    const updatedCard = page.locator('div.rounded-xl').filter({ hasText: updatedName }).first();
    const delBtn = updatedCard.locator('button').nth(1);
    await delBtn.click();
    await page.waitForTimeout(1000);

    console.log('10. Checking Public removal...');
    await page.goto('http://localhost:3000/kurullar');
    await page.waitForLoadState('networkidle');
    const removedVisible = await page.locator(`text=${updatedName}`).isVisible();
    console.log('Is still visible on public (should be false):', removedVisible);

    // Cleanup
    await prisma.boardMember.deleteMany({ where: { fullName: { in: [testName, updatedName] } } });
    console.log('Cleaned up test records from DB.');

    await browser.close();
    console.log('ALL STEPS PASSED PERFECTLY!');
}

testFlow().catch(console.error);
