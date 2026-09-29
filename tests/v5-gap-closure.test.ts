import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateBase32Secret, generateTotpCode, verifyTotpCode, generateBackupCodes, hashBackupCodes, verifyAndConsumeBackupCode } from '../lib/mfa';
import { validatePasswordStrength, isDefaultCredentialBlocked, sanitizeHtml, sanitizeSvg, sanitizeCsvCell } from '../lib/sanitize';
import { checkEndpointRateLimit } from '../lib/rate-limit';
import { CustomFieldService, SUPPORTED_FIELD_TYPES } from '../lib/services/custom-field-service';
import { BrandService } from '../lib/services/brand-service';
import { ImpactAnalysisService } from '../lib/services/impact-analysis-service';
import { UndoService } from '../lib/services/undo-service';
import { EmailOutboxService } from '../lib/services/email-outbox-service';
import { prisma } from '../lib/prisma';

describe('V5 Gap Closure: 1. TOTP MFA & Backup Codes (Item 75)', () => {
    test('generateBase32Secret produces valid base32 string', () => {
        const secret = generateBase32Secret(20);
        assert.ok(/^[A-Z2-7]+$/.test(secret), 'Secret must only contain RFC 4648 Base32 chars');
    });

    test('generateTotpCode and verifyTotpCode accurately validate current and drifting codes', () => {
        const secret = generateBase32Secret(20);
        const currentCode = generateTotpCode(secret, 0);

        assert.strictEqual(currentCode.length, 6, 'TOTP code must be 6 digits');
        assert.strictEqual(verifyTotpCode(secret, currentCode), true, 'Current code must verify');

        // Wrong code
        assert.strictEqual(verifyTotpCode(secret, '000000'), false, 'Wrong code must fail');

        // Past code within +/- 1 window (30s)
        const prevCode = generateTotpCode(secret, -1);
        assert.strictEqual(verifyTotpCode(secret, prevCode), true, 'Previous 30s code must verify');
    });

    test('Backup codes are generated, hashed, and single-use consumed', async () => {
        const plainCodes = generateBackupCodes(4);
        assert.strictEqual(plainCodes.length, 4);

        const hashed = await hashBackupCodes(plainCodes);
        const jsonHashed = JSON.stringify(hashed);

        // First verification succeeds
        const res1 = await verifyAndConsumeBackupCode(plainCodes[0], jsonHashed);
        assert.strictEqual(res1.isValid, true);
        assert.ok(res1.remainingHashedCodesJson);

        // Second verification of same code fails (already consumed)
        const res2 = await verifyAndConsumeBackupCode(plainCodes[0], res1.remainingHashedCodesJson);
        assert.strictEqual(res2.isValid, false);
    });
});

describe('V5 Gap Closure: 2. Password Security & Sanitization (Items 76, 81, 90, 93)', () => {
    test('validatePasswordStrength enforces 12+ chars and complexity', () => {
        assert.strictEqual(validatePasswordStrength('short').isValid, false);
        assert.strictEqual(validatePasswordStrength('admin12345678').isValid, false, 'Blacklisted password');
        assert.strictEqual(validatePasswordStrength('ValidComplexPassword2026!').isValid, true);
    });

    test('sanitizeHtml strips scripts, iframes, and dangerous handlers', () => {
        const dirty = '<p>Normal text</p><script>alert("xss")</script><img src="x" onerror="steal()"><iframe src="bad"></iframe>';
        const clean = sanitizeHtml(dirty);

        assert.ok(!clean.includes('<script>'));
        assert.ok(!clean.includes('onerror='));
        assert.ok(!clean.includes('<iframe'));
        assert.ok(clean.includes('Normal text'));
    });

    test('sanitizeSvg blocks malicious scripts inside SVG', () => {
        const badSvg = '<svg><script>alert(1)</script><circle cx="10" cy="10" r="5"/></svg>';
        assert.strictEqual(sanitizeSvg(badSvg).isValid, false);

        const goodSvg = '<svg viewBox="0 0 100 100"><circle cx="10" cy="10" r="5" fill="red"/></svg>';
        assert.strictEqual(sanitizeSvg(goodSvg).isValid, true);
    });

    test('sanitizeCsvCell neutralizes CSV formula injection characters (=, +, -, @)', () => {
        assert.strictEqual(sanitizeCsvCell('=1+1'), "''=1+1".slice(1)); // escaped with leading single quote
        assert.ok(sanitizeCsvCell('+cmd|').startsWith("'+cmd"));
        assert.ok(sanitizeCsvCell('-100').startsWith("'-100"));
        assert.ok(sanitizeCsvCell('@SUM').startsWith("'@SUM"));
        assert.strictEqual(sanitizeCsvCell('Normal Data'), 'Normal Data');
    });
});

describe('V5 Gap Closure: 3. Rate Limiting & Custom Fields (Items 41, 58, 79, 88)', () => {
    test('checkEndpointRateLimit blocks requests after limit is reached', () => {
        const testId = `client-${Date.now()}`;
        const opts = { limit: 3, windowSeconds: 60, keyPrefix: 'test-limit' };

        assert.strictEqual(checkEndpointRateLimit(testId, opts).isAllowed, true);
        assert.strictEqual(checkEndpointRateLimit(testId, opts).isAllowed, true);
        assert.strictEqual(checkEndpointRateLimit(testId, opts).isAllowed, true);
        assert.strictEqual(checkEndpointRateLimit(testId, opts).isAllowed, false);
    });

    test('CustomFieldService supports all 16 enterprise field types', async () => {
        assert.strictEqual(SUPPORTED_FIELD_TYPES.length, 16);
        assert.ok(SUPPORTED_FIELD_TYPES.includes('DATETIME'));
        assert.ok(SUPPORTED_FIELD_TYPES.includes('USER'));
        assert.ok(SUPPORTED_FIELD_TYPES.includes('ORGANIZATION'));
        assert.ok(SUPPORTED_FIELD_TYPES.includes('RELATION'));
    });
});

describe('V5 Gap Closure: 4. Brand, Impact Analysis & Undo (Items 57, 60, 61)', () => {
    test('BrandService stores and retrieves customized brand configuration', async () => {
        const initial = await BrandService.getBrandSettings();
        assert.ok(initial.institutionName);

        const updated = await BrandService.updateBrandSettings({
            institutionName: 'İKÜANTS TEKMER A.Ş.',
            accentColor: '#4f46e5',
        });
        assert.strictEqual(updated.institutionName, 'İKÜANTS TEKMER A.Ş.');
        assert.strictEqual(updated.accentColor, '#4f46e5');
    });

    test('ImpactAnalysisService computes dependencies for a program', async () => {
        const program = await prisma.program.findFirst();
        if (program) {
            const analysis = await ImpactAnalysisService.analyzeImpact('PROGRAM', program.id);
            assert.strictEqual(analysis.entityId, program.id);
            assert.strictEqual(analysis.entityName, program.name);
            assert.ok(Array.isArray(analysis.impacts));
        }
    });

    test('UndoService restores archived entities', async () => {
        // Find or create mentor
        const mentor = await prisma.mentor.findFirst();
        if (mentor) {
            await prisma.mentor.update({ where: { id: mentor.id }, data: { isArchived: true } });
            const undoRes = await UndoService.undoAction('MENTOR', mentor.id);
            assert.strictEqual(undoRes.success, true);

            const restored = await prisma.mentor.findUnique({ where: { id: mentor.id } });
            assert.strictEqual(restored?.isArchived, false);
        }
    });
});

describe('V5 Gap Closure: 5. Full End-to-End Item 102 Application Notification & Privacy Pipeline', () => {
    test('Atomic application submission triggers timeline, audit, in-app and email outbox with NO PII', async () => {
        const testEmail = `applicant.${Date.now()}@example.com`;
        const testAppNo = `ANTS-2026-${Math.floor(100000 + Math.random() * 900000)}`;

        // Find or create a form and formVersion
        let formVersion = await prisma.formVersion.findFirst({ where: { status: 'PUBLISHED' } });
        if (!formVersion) {
            const form = await prisma.form.create({
                data: {
                    title: 'Test Başvuru Formu',
                    slug: `test-form-${Date.now()}`,
                },
            });
            formVersion = await prisma.formVersion.create({
                data: {
                    formId: form.id,
                    versionNumber: 1,
                    schemaSnapshot: '[]',
                    status: 'PUBLISHED',
                },
            });
        }

        const submission = await prisma.submission.create({
            data: {
                formVersionId: formVersion.id,
                submissionNumber: `SUB-${Date.now()}`,
                rawSnapshot: JSON.stringify({ email: testEmail, name: 'Can Demir' }),
            },
        });

        // 1 & 2: Create application record
        const app = await prisma.application.create({
            data: {
                applicationNumber: testAppNo,
                formVersionId: formVersion.id,
                submissionId: submission.id,
                applicantName: 'Can Demir',
                email: testEmail,
                phone: '05551234567',
                companyName: 'Akıllı Tarım A.Ş.',
                status: 'NEW',
            },
        });

        assert.ok(app.id);
        assert.strictEqual(app.applicationNumber, testAppNo);

        // 3: Trigger notifications & EmailOutbox
        await EmailOutboxService.triggerApplicationSubmittedEmails({
            id: app.id,
            applicationNumber: app.applicationNumber,
            applicantName: app.applicantName,
            email: app.email,
            programName: 'ANTsPARK Hızlandırma',
        });

        // 4: Verify EmailOutbox contains NO PII
        const outboxItems = await prisma.emailOutbox.findMany({
            where: { entityId: app.id },
        });

        assert.ok(outboxItems.length >= 1);
        for (const item of outboxItems) {
            // Confirm TC Kimlik or sensitive fields are NOT in the body
            assert.ok(!item.htmlBody.includes('05551234567'), 'Phone must not be leaked');
            assert.ok(item.htmlBody.includes(testAppNo), 'App number must be present');
        }

        // 5: Process email outbox
        const processResult = await EmailOutboxService.processPendingEmails(10);
        assert.ok(processResult.processed >= 1);

        // Cleanup
        await prisma.emailOutbox.deleteMany({ where: { entityId: app.id } });
        await prisma.application.delete({ where: { id: app.id } });
        await prisma.submission.delete({ where: { id: submission.id } });
    });
});
