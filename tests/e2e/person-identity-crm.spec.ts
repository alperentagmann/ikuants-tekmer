import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';
import { hashTcNumber, maskTcNumber } from '../../lib/security/identity-security';

test.describe('Enterprise Person CRM & Sensitive Identity Security Flow', () => {
    const timestamp = Date.now();
    const validTc = '10000000146';
    const testEmail = `crm-e2e-${timestamp}@example.com`;
    const testPersonName = `Murat Kurumsal ${timestamp}`;
    const testCompanyName = `Inovasyon Labs ${timestamp} A.Ş.`;

    let createdPersonId: string | null = null;
    let createdOrgId: string | null = null;
    // Identity reveal requires an explicit grant even for super admins; granted for this run only
    let grantedPermissionId: string | null = null;

    test.afterAll(async () => {
        if (grantedPermissionId) await prisma.userPermission.deleteMany({ where: { id: grantedPermissionId } });
        try {
            if (createdPersonId) {
                await prisma.personOrganizationMembership.deleteMany({
                    where: { personId: createdPersonId }
                });
                await prisma.auditLog.deleteMany({
                    where: { entityType: 'Person', entityId: createdPersonId }
                });
                await prisma.person.deleteMany({
                    where: { id: createdPersonId }
                });
            }
            if (createdOrgId) {
                await prisma.organization.deleteMany({
                    where: { id: createdOrgId }
                });
            }
        } catch {
            // cleanup fallback
        }
    });

    test('Full Journey: Person Create -> Masked TC -> Persistence -> Company Link -> Reveal -> Revoke Consent', async ({ page, context }) => {
        await loginAsAdmin(context);

        // 1. Navigate to Rehber
        await page.goto('/admin/rehber');
        await expect(page.locator('h1')).toContainText('Kişi & Kurum Rehberi');

        // 2. Open Person Create Modal
        await page.click('#add-person-btn');
        await expect(page.locator('text=Kurumsal Kişi / Paydaş Kaydı')).toBeVisible();

        // Switch to Full Mode for complete enterprise registration
        await page.click('button:has-text("📋 Kapsamlı Kayıt")');

        // Fill Section 1: Basic & Identity
        await page.fill('#person-first-name', 'Murat Kurumsal');
        await page.fill('#person-last-name', `${timestamp}`);
        await page.fill('#person-title', 'Yapay Zeka Mimarisi Direktörü');
        await page.fill('#person-tc-number', validTc);

        // Verify live checksum validation message
        await expect(page.locator('text=checksum kontrolü geçerli')).toBeVisible();

        // Switch to Section 2: Contact
        await page.click('button:has-text("2. İletişim & Adres")');
        await page.fill('#person-email', testEmail);
        await page.fill('#person-work-email', `work-${testEmail}`);
        await page.fill('#person-phone', '0532 999 8877');

        // Switch to Section 3: Company Link (Create New Organization atomically)
        await page.click('button:has-text("3. Şirket & Görev")');
        await page.click('button:has-text("+ Yeni Kurum Oluştur")');
        await page.fill('input[placeholder="Örn: ABC Teknoloji"]', testCompanyName);
        await page.fill('input[placeholder="Örn: Kıdemli AI Araştırmacısı"]', 'Yapay Zeka Mimarisi Direktörü');

        // Switch to Section 5: KVKK & Consent
        await page.click('button:has-text("5. KVKK & İletişim İzinleri")');
        await expect(page.locator('text=Aydınlatma Metni Sunuldu')).toBeVisible();
        await expect(page.locator('text=E-Posta İletişim İzni')).toBeVisible();

        // Submit form
        await page.click('#submit-person-btn');

        // Wait for save & list refresh
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toContainText(testEmail);

        // 3. Verify Database Persistence & Masking
        const dbPerson = await prisma.person.findFirst({
            where: { email: testEmail },
            include: { memberships: { include: { organization: true } } }
        });
        expect(dbPerson).toBeTruthy();
        createdPersonId = dbPerson!.id;
        createdOrgId = dbPerson!.memberships[0]?.organizationId || null;

        // Verify that plaintext TC is NEVER stored in database column
        expect(dbPerson!.tcNumberMasked).toBe('10*******46');
        expect(dbPerson!.tcNumberEncrypted).toBeTruthy();
        expect(dbPerson!.tcNumberEncrypted).not.toContain(validTc);
        expect(dbPerson!.tcNumberHash).toBe(hashTcNumber(validTc));

        // Verify Organization Link
        expect(dbPerson!.memberships.length).toBeGreaterThan(0);
        expect(dbPerson!.memberships[0].organization.name).toBe(testCompanyName);

        // 4. Verify Masked TC on UI
        await expect(page.locator(`text=10*******46`)).toBeVisible();

        // 5. Reveal without the explicit identity permission is refused
        // Always act on the test person's own card, never on another directory record
        const personCard = page.locator('div').filter({ hasText: testEmail }).filter({ has: page.locator('button:has-text("İzni Geri Çek")') }).last();
        await expect(personCard).toBeVisible();
        const revealBtn = personCard.locator('button:has-text("Göster")');
        await revealBtn.click();
        await expect(page.locator('text=403_FORBIDDEN').first()).toBeVisible();
        await expect(page.locator(`text=${validTc}`)).toHaveCount(0);

        // Grant person:identity:view to the test admin explicitly, then reveal (creates AuditLog)
        const admin = await prisma.user.findFirst({ where: { email: 'bilgi@ikuantstekmer.com' } });
        const identityPermission = await prisma.permission.findFirst({ where: { action: 'identity_view', resource: 'persons' } });
        expect(admin && identityPermission).toBeTruthy();
        const existingGrant = await prisma.userPermission.findUnique({ where: { userId_permissionId: { userId: admin!.id, permissionId: identityPermission!.id } } });
        if (!existingGrant) {
            const grant = await prisma.userPermission.create({ data: { userId: admin!.id, permissionId: identityPermission!.id, isGranted: true } });
            grantedPermissionId = grant.id;
        }
        await revealBtn.click();

        // Expect decrypted TC to appear inline
        await expect(page.locator(`text=${validTc}`)).toBeVisible();

        // Verify Audit Log was created WITHOUT storing plaintext TC
        const auditLog = await prisma.auditLog.findFirst({
            where: {
                entityType: 'Person',
                entityId: createdPersonId!,
                action: 'SENSITIVE_FIELD_VIEWED'
            },
            orderBy: { createdAt: 'desc' }
        });
        expect(auditLog).toBeTruthy();
        expect(auditLog!.diff).not.toContain(validTc);

        // 6. Test Consent Revocation (Opt-out)
        page.on('dialog', async dialog => {
            await dialog.accept();
        });
        const revokeBtn = personCard.locator('button:has-text("İzni Geri Çek")');
        await revokeBtn.click();

        await expect.poll(async () => JSON.parse((await prisma.person.findUnique({ where: { id: createdPersonId! } }))?.privacyConsents || '{}').status, { timeout: 15000 }).toBe('REVOKED');

        // Verify in DB that status is REVOKED and history is preserved
        const revokedPerson = await prisma.person.findUnique({
            where: { id: createdPersonId! }
        });
        expect(revokedPerson!.privacyConsents).toBeTruthy();
        const parsedPrivacy = JSON.parse(revokedPerson!.privacyConsents!);
        expect(parsedPrivacy.status).toBe('REVOKED');
        expect(parsedPrivacy.emailPermission).toBe(false);
        expect(parsedPrivacy.history.length).toBeGreaterThanOrEqual(2);
        expect(parsedPrivacy.history[0].action).toBe('CONSENT_REVOKED');
    });

    test('Duplicate TC Check blocks duplicate Person creation', async ({ page, context }) => {
        await loginAsAdmin(context);

        await page.goto('/admin/rehber');
        await page.click('#add-person-btn');
        await page.click('button:has-text("📋 Kapsamlı Kayıt")');

        await page.fill('#person-first-name', 'Mukerrer');
        await page.fill('#person-last-name', 'Deneme');
        await page.fill('#person-tc-number', validTc);

        // Expect warning banner to appear
        await expect(page.locator('text=Bu kimlik bilgisiyle eşleşen mevcut bir kişi kaydı bulunuyor')).toBeVisible();
    });
});
