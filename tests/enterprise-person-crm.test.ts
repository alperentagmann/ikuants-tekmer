import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import {
    validateTcChecksum,
    maskTcNumber,
    hashTcNumber,
    encryptTcNumber,
    decryptTcNumber,
} from '../lib/security/identity-security';
import {
    hasPermission,
    canViewSensitiveIdentity,
    canEditSensitiveIdentity,
    canExportSensitiveData,
    UserWithPermissions,
} from '../lib/rbac';
import { PersonService } from '../lib/services/person-service';
import { prisma } from '../lib/prisma';

describe('Enterprise Person & Identity Security Suite', () => {
    const createdPersonIds: string[] = [];
    let validUserId: string;
    let validUserName: string;

    before(async () => {
        const u = await prisma.user.findFirst();
        if (u) {
            validUserId = u.id;
            validUserName = u.name || 'Sistem Admin';
        }
    });

    after(async () => {
        // Clean up test persons created during suite
        if (createdPersonIds.length > 0) {
            await prisma.personOrganizationMembership.deleteMany({
                where: { personId: { in: createdPersonIds } },
            });
            await prisma.mentor.deleteMany({
                where: { personId: { in: createdPersonIds } },
            });
            await prisma.auditLog.deleteMany({
                where: { entityType: 'Person', entityId: { in: createdPersonIds } },
            });
            await prisma.person.deleteMany({
                where: { id: { in: createdPersonIds } },
            });
        }
    });

    describe('1. T.C. Kimlik Algorithmic Checksum Validator', () => {
        test('valid 11-digit checksum succeeds', () => {
            const validTc = '10000000146';
            const res = validateTcChecksum(validTc);
            assert.strictEqual(res.isValid, true);
            assert.ok(res.message.includes('geçerli'));
        });

        test('invalid length or non-numeric fails', () => {
            assert.strictEqual(validateTcChecksum('12345').isValid, false);
            assert.strictEqual(validateTcChecksum('123456789012').isValid, false);
            assert.strictEqual(validateTcChecksum('1000000014a').isValid, false);
            assert.strictEqual(validateTcChecksum('').isValid, false);
        });

        test('first digit 0 fails', () => {
            const zeroStart = '01234567890';
            assert.strictEqual(validateTcChecksum(zeroStart).isValid, false);
        });

        test('invalid 10th or 11th digit fails', () => {
            // Tampered 10th digit
            const tampered10 = '10000000156';
            assert.strictEqual(validateTcChecksum(tampered10).isValid, false);
            // Tampered 11th digit
            const tampered11 = '10000000147';
            assert.strictEqual(validateTcChecksum(tampered11).isValid, false);
        });
    });

    describe('2. Masking & Encryption (AES-256-GCM + Blind Index Hash)', () => {
        const sampleTc = '10000000146';

        test('maskTcNumber returns 12*******90 style masked string', () => {
            const masked = maskTcNumber(sampleTc);
            assert.strictEqual(masked, '10*******46');
            assert.strictEqual(masked.length, 11);
            assert.ok(!masked.includes(sampleTc.slice(2, 9)));
        });

        test('encryptTcNumber & decryptTcNumber roundtrip preserves data', () => {
            const encrypted = encryptTcNumber(sampleTc);
            assert.ok(encrypted);
            assert.ok(encrypted.includes(':'));
            const parts = encrypted.split(':');
            assert.strictEqual(parts.length, 3); // iv:tag:ciphertext

            const decrypted = decryptTcNumber(encrypted);
            assert.strictEqual(decrypted, sampleTc);
        });

        test('decryptTcNumber safely returns null on corrupted payload', () => {
            assert.strictEqual(decryptTcNumber('invalid-payload'), null);
            assert.strictEqual(decryptTcNumber('bad:corrupt:data'), null);
            assert.strictEqual(decryptTcNumber(null), null);
        });

        test('hashTcNumber is deterministic for duplicate index search', () => {
            const hash1 = hashTcNumber(sampleTc);
            const hash2 = hashTcNumber(sampleTc);
            const hash3 = hashTcNumber('10000000147');
            assert.strictEqual(hash1, hash2);
            assert.notStrictEqual(hash1, hash3);
        });
    });

    describe('3. Sensitive Field RBAC Capabilities', () => {
        test('normal Admin cannot view sensitive identity without explicit capability', () => {
            const normalAdmin: UserWithPermissions = {
                id: 'admin-normal',
                isActive: true,
                isSuperAdmin: false,
                userRoles: [
                    {
                        role: {
                            slug: 'admin',
                            permissions: [
                                { permission: { action: '*', resource: 'dashboard' } },
                                { permission: { action: 'view', resource: 'persons' } },
                            ],
                        },
                    },
                ],
            };

            assert.strictEqual(hasPermission(normalAdmin, 'view', 'persons'), true);
            assert.strictEqual(canViewSensitiveIdentity(normalAdmin), false);
            assert.strictEqual(canEditSensitiveIdentity(normalAdmin), false);
            assert.strictEqual(canExportSensitiveData(normalAdmin), false);
        });

        test('Super Admin requires explicit capability for sensitive identity reveal', () => {
            const superAdminWithoutCapability: UserWithPermissions = {
                id: 'super-admin-1',
                isActive: true,
                isSuperAdmin: true,
                userRoles: [
                    {
                        role: {
                            slug: 'super-admin',
                            permissions: [{ permission: { action: '*', resource: '*' } }],
                        },
                    },
                ],
            };

            // General modules allowed for super admin
            assert.strictEqual(hasPermission(superAdminWithoutCapability, 'view', 'persons'), true);
            assert.strictEqual(hasPermission(superAdminWithoutCapability, 'create', 'persons'), true);

            // Sensitive identity reveal strictly requires explicit capability
            assert.strictEqual(canViewSensitiveIdentity(superAdminWithoutCapability), false);
        });

        test('User with explicit person:identity:view capability is authorized', () => {
            const authorizedUser: UserWithPermissions = {
                id: 'auditor-1',
                isActive: true,
                isSuperAdmin: false,
                userPermissions: [
                    {
                        isGranted: true,
                        permission: { action: 'identity_view', resource: 'persons' },
                    },
                ],
            };

            assert.strictEqual(canViewSensitiveIdentity(authorizedUser), true);
            assert.strictEqual(canEditSensitiveIdentity(authorizedUser), false);
        });
    });

    describe('4. PersonService Full Lifecycle & Audit Integrity', () => {
        const testTimestamp = Date.now();
        const validTc = '10000000146';

        test('createPerson stores masked TC and encrypted string, without plaintext column', async () => {
            const created = await PersonService.createPerson({
                firstName: 'TestKurumsal',
                lastName: `Person-${testTimestamp}`,
                salutation: 'Dr.',
                title: 'Kıdemli Yapay Zeka Danışmanı',
                email: `test-person-${testTimestamp}@example.com`,
                workEmail: `work-${testTimestamp}@example.com`,
                phone: '05550001122',
                tcNumber: validTc,
                businessRoles: ['KURUCU', 'SIRKET_PERSONELI'],
                privacy: {
                    informationNoticeProvided: true,
                    informationNoticeVersion: 'v2.0',
                    explicitConsentGiven: true,
                    legalBasis: 'CONSENT',
                    emailPermission: true,
                    smsPermission: true,
                    callPermission: false,
                },
            }, {
                id: validUserId,
                name: validUserName,
            });

            assert.ok(created.id);
            createdPersonIds.push(created.id);

            assert.strictEqual(created.tcNumberMasked, '10*******46');
            // Ensure no raw plaintext is returned or exposed
            assert.strictEqual((created as any).tcNumber, undefined);
            assert.strictEqual((created as any).tcNumberEncrypted, undefined);

            // Verify DB record directly
            const dbRecord = await prisma.person.findUnique({
                where: { id: created.id },
            });
            assert.ok(dbRecord);
            assert.strictEqual(dbRecord.tcNumberMasked, '10*******46');
            assert.ok(dbRecord.tcNumberEncrypted);
            assert.ok(dbRecord.tcNumberHash);
            // Plaintext check: ensure encrypted column does NOT contain raw plaintext
            assert.ok(!dbRecord.tcNumberEncrypted.includes(validTc));
        });

        test('duplicate TC is blocked with informative error', async () => {
            await assert.rejects(
                async () => {
                    await PersonService.createPerson({
                        firstName: 'Mukerrer',
                        lastName: 'Kayit',
                        tcNumber: validTc,
                    });
                },
                /Bu kimlik bilgisiyle eşleşen mevcut bir kişi kaydı bulunuyor/
            );
        });

        test('unauthorized revealIdentity is blocked with 403_FORBIDDEN', async () => {
            const personId = createdPersonIds[0];
            await assert.rejects(
                async () => {
                    await PersonService.revealIdentity(personId, {
                        id: 'unauthorized-user',
                        name: 'Normal Admin',
                        canViewSensitive: false,
                    });
                },
                /403_FORBIDDEN/
            );
        });

        test('authorized revealIdentity decrypts value and creates audit log without plaintext', async () => {
            const personId = createdPersonIds[0];
            const result = await PersonService.revealIdentity(personId, {
                id: validUserId,
                name: validUserName,
                canViewSensitive: true,
            });

            assert.strictEqual(result.tcNumber, validTc);
            assert.strictEqual(result.masked, '10*******46');

            // Verify Audit Log
            const audit = await prisma.auditLog.findFirst({
                where: {
                    entityType: 'Person',
                    entityId: personId,
                    action: 'SENSITIVE_FIELD_VIEWED',
                },
                orderBy: { createdAt: 'desc' },
            });

            assert.ok(audit);
            assert.ok(!audit.diff?.includes(validTc)); // No plaintext in audit log!
        });

        test('revokeConsent sets status to REVOKED, opt-outs communication, and preserves history', async () => {
            const personId = createdPersonIds[0];
            const updated = await PersonService.revokeConsent(personId, 'İlgili kişi pazarlama iznini geri çekti', {
                id: validUserId,
                name: validUserName,
            });

            assert.ok(updated.privacyConsents);
            const privacy = JSON.parse(updated.privacyConsents);
            assert.strictEqual(privacy.status, 'REVOKED');
            assert.strictEqual(privacy.emailPermission, false);
            assert.strictEqual(privacy.smsPermission, false);
            assert.strictEqual(privacy.callPermission, false);
            assert.ok(Array.isArray(privacy.history));
            assert.ok(privacy.history.length >= 2);
            assert.strictEqual(privacy.history[0].action, 'CONSENT_REVOKED');
        });
    });
});
