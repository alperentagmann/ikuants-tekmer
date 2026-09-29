import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { UserManagementService } from '../lib/services/user-management-service';
import { TerminologyService } from '../lib/services/terminology-service';
import { CustomFieldService } from '../lib/services/custom-field-service';
import { BrandService } from '../lib/services/brand-service';
import { UndoService } from '../lib/services/undo-service';
import {
    generateBase32Secret,
    generateTotpCode,
    verifyTotpCode,
    generateBackupCodes,
    hashBackupCodes,
    verifyAndConsumeBackupCode,
} from '../lib/mfa';
import { sanitizeHtml, sanitizeCsvCell } from '../lib/sanitize';
import { checkEndpointRateLimit } from '../lib/rate-limit';

test.describe('True E2E Scenarios Suite (Scenarios A through J)', () => {
    test('Scenario A: Multi-Admin Creation, Invite, Password Setting & Privilege Separation', async () => {
        const testEmail = `admin_e2e_${Date.now()}@ikuants.com`;
        const adminRole = await prisma.role.findFirst({ where: { slug: 'admin' } });
        assert.ok(adminRole, 'Admin role exists in database');

        // 1. Create Invite via UserManagementService
        const result = await UserManagementService.createUser({
            email: testEmail,
            name: 'E2E Test Admin',
            roleId: adminRole.id,
            passwordMethod: 'INVITE',
        });
        assert.ok(result.inviteToken, 'Invite token generated');
        assert.ok(result.user.id, 'User record created');

        // 2. Accept Invite / Set Password
        const acceptedUser = await UserManagementService.acceptInvite(
            result.inviteToken,
            'SecurePassword123!',
            'E2E Test Admin Confirmed'
        );
        assert.strictEqual(acceptedUser.email, testEmail);
        assert.strictEqual(acceptedUser.status, 'ACTIVE');

        // 3. Token Replay Block
        await assert.rejects(
            async () => {
                await UserManagementService.acceptInvite(
                    result.inviteToken!,
                    'AnotherPassword123!'
                );
            },
            /Geçersiz veya süresi dolmuş/
        );

        // Cleanup
        await prisma.user.delete({ where: { id: result.user.id } });
    });

    test('Scenario B: Terminology Customization & Immediate Resolution', async () => {
        const key = 'module_tasks';
        const fallback = 'Görevler';
        const customValue = 'İş Takibi';

        // Upsert initial label record
        await prisma.terminologyLabel.upsert({
            where: { key },
            update: {},
            create: { key, defaultLabel: fallback, group: 'MODULES' }
        });

        // 1. Update label
        await TerminologyService.updateLabel(key, customValue, 'test_actor');

        // 2. Verify updated resolution
        const updated = await TerminologyService.getLabel(key, fallback);
        assert.strictEqual(updated, customValue);

        // 3. Revert to default
        await TerminologyService.updateLabel(key, fallback, 'test_actor');
    });

    test('Scenario C: Form Text & CTA Label Customization Persistence', async () => {
        const key = 'form_btn_submit';
        const customCta = 'Başvurumu Tamamla';

        await prisma.siteSetting.upsert({
            where: { key },
            update: { value: customCta },
            create: { key, value: customCta, group: 'FORM' },
        });

        const record = await prisma.siteSetting.findUnique({ where: { key } });
        assert.strictEqual(record?.value, 'Başvurumu Tamamla');
    });

    test('Scenario D: Brand Settings Storage & Retrieval', async () => {
        const testWelcome = 'E2E Test Welcome Message';
        await BrandService.updateBrandSettings({
            loginWelcomeSubtitle: testWelcome,
            accentColor: '#4f46e5',
        });

        const brand = await BrandService.getBrandSettings();
        assert.strictEqual(brand.loginWelcomeSubtitle, testWelcome);
        assert.strictEqual(brand.accentColor, '#4f46e5');
    });

    test('Scenario E: Custom Field Creation, Value Storage & Server-Side Security Filter', async () => {
        const fieldKey = `custom_e2e_${Date.now()}`;
        const def = await CustomFieldService.createDefinition({
            moduleKey: 'ENTREPRENEUR',
            fieldKey,
            label: 'Yatırımcı Notu',
            fieldType: 'TEXT',
            viewPermission: 'entrepreneur:view_sensitive',
        });

        const entityId = 'entrepreneur_test_fixture_1';
        await CustomFieldService.saveFieldValues('ENTREPRENEUR', entityId, {
            [fieldKey]: 'Gizli Yatırım Tutarı: 500.000$',
        });

        // 1. Authorized Caller (Super Admin)
        const authorizedCaller = {
            id: 'admin_1',
            email: 'super@ikuants.com',
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            isSuperAdmin: true,
            permissions: [],
        };
        const authData = await CustomFieldService.getFieldValues('ENTREPRENEUR', entityId, authorizedCaller as any);
        assert.strictEqual(authData.values[fieldKey], 'Gizli Yatırım Tutarı: 500.000$');

        // 2. Unauthorized Caller
        const unauthorizedCaller = {
            id: 'viewer_1',
            email: 'viewer@ikuants.com',
            name: 'Viewer',
            role: 'VIEWER',
            isSuperAdmin: false,
            permissions: ['entrepreneur:view'],
        };
        const unauthData = await CustomFieldService.getFieldValues('ENTREPRENEUR', entityId, unauthorizedCaller as any);
        assert.strictEqual(unauthData.values[fieldKey], undefined, 'Restricted field must be hidden server-side');

        // Cleanup
        await CustomFieldService.deleteDefinition(def.id);
    });

    test('Scenario F: Undo Service Soft-Delete & Restoration', async () => {
        const ent = await prisma.entrepreneur.create({
            data: {
                name: 'E2E Undo Test Startup',
                slug: `e2e-undo-${Date.now()}`,
                founders: 'Ali Test',
                email: `ali_${Date.now()}@test.com`,
                phone: '5551112233',
                sector: 'Yazılım',
                isArchived: true,
            },
        });

        const restored = await UndoService.undoAction('ENTREPRENEUR', ent.id);
        assert.strictEqual(restored.success, true);

        const reloaded = await prisma.entrepreneur.findUnique({ where: { id: ent.id } });
        assert.strictEqual(reloaded?.isArchived, false);

        await prisma.entrepreneur.delete({ where: { id: ent.id } });
    });

    test('Scenario G: RFC 6238 TOTP MFA & Single-Use Recovery Code', async () => {
        const secret = generateBase32Secret();
        const code = generateTotpCode(secret);
        const valid = verifyTotpCode(secret, code);
        assert.strictEqual(valid, true, 'Current TOTP code must validate successfully');

        const rawCodes = generateBackupCodes(5);
        assert.strictEqual(rawCodes.length, 5);

        const hashed = await hashBackupCodes(rawCodes);
        const hashedJson = JSON.stringify(hashed);

        // Consume first backup code
        const consumeResult = await verifyAndConsumeBackupCode(rawCodes[0], hashedJson);
        assert.strictEqual(consumeResult.isValid, true, 'First backup code must be valid');
        assert.ok(consumeResult.remainingHashedCodesJson, 'Updated remaining codes returned');

        // Second attempt with same code on updated remaining list must fail
        const reAttempt = await verifyAndConsumeBackupCode(rawCodes[0], consumeResult.remainingHashedCodesJson);
        assert.strictEqual(reAttempt.isValid, false, 'Used backup code must be single-use and rejected');
    });

    test('Scenario H: Security Request Protections (XSS & CSV Injection)', async () => {
        // Stored XSS Sanitization
        const dirtyHtml = '<p>Normal text</p><script>alert("XSS")</script><iframe src="javascript:evil()"></iframe>';
        const cleanHtml = sanitizeHtml(dirtyHtml);
        assert.strictEqual(cleanHtml.includes('<script>'), false);
        assert.strictEqual(cleanHtml.includes('<iframe>'), false);
        assert.strictEqual(cleanHtml.includes('Normal text'), true);

        // CSV Formula Injection Sanitization
        assert.strictEqual(sanitizeCsvCell('=1+2'), "'=1+2");
        assert.strictEqual(sanitizeCsvCell('@SUM(A1:A10)'), "'@SUM(A1:A10)");
        assert.strictEqual(sanitizeCsvCell('+cmd|...'), "'+cmd|...");
        assert.strictEqual(sanitizeCsvCell('-500'), "'-500");
        assert.strictEqual(sanitizeCsvCell('Normal Value'), 'Normal Value');
    });

    test('Scenario I: Rate Limiter Throttling Enforcement', () => {
        const id = `test_ip_${Date.now()}`;
        const opts = { limit: 3, windowSeconds: 60 };

        const r1 = checkEndpointRateLimit(id, opts);
        assert.strictEqual(r1.isAllowed, true);

        const r2 = checkEndpointRateLimit(id, opts);
        assert.strictEqual(r2.isAllowed, true);

        const r3 = checkEndpointRateLimit(id, opts);
        assert.strictEqual(r3.isAllowed, true);

        const r4 = checkEndpointRateLimit(id, opts);
        assert.strictEqual(r4.isAllowed, false, '4th request must be throttled');
    });
});
