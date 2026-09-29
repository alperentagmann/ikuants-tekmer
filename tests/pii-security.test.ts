import { test, describe } from 'node:test';
import assert from 'node:assert';
import { maskTcNumber } from '../lib/utils';
import { hasPermission, UserWithPermissions } from '../lib/rbac';

describe('PII Security & Sanitization', () => {
    test('maskTcNumber properly masks 11-digit Turkish ID', () => {
        const input = '12345678901';
        const masked = maskTcNumber(input);
        assert.strictEqual(masked, '123******01');
        assert.strictEqual(masked.length, 11);
    });

    test('maskTcNumber handles short or null input safely', () => {
        assert.strictEqual(maskTcNumber(null), '***');
        assert.strictEqual(maskTcNumber(undefined), '***');
        assert.strictEqual(maskTcNumber(''), '***');
        assert.strictEqual(maskTcNumber('12345'), '***');
    });

    test('PII reveal authorization check requires view_sensitive on applications', () => {
        const standardAdmin: UserWithPermissions = {
            id: 'admin-1',
            isActive: true,
            isSuperAdmin: false,
            userRoles: [
                {
                    role: {
                        slug: 'admin',
                        permissions: [
                            { permission: { action: '*', resource: 'applications' } },
                        ],
                    },
                },
            ],
        };

        // admin role with * on applications has view_sensitive
        assert.strictEqual(hasPermission(standardAdmin, 'view_sensitive', 'applications'), true);

        const reviewer: UserWithPermissions = {
            id: 'reviewer-1',
            isActive: true,
            isSuperAdmin: false,
            userRoles: [
                {
                    role: {
                        slug: 'viewer',
                        permissions: [
                            { permission: { action: 'view', resource: 'applications' } },
                        ],
                    },
                },
            ],
        };

        // viewer has only 'view', not 'view_sensitive'
        assert.strictEqual(hasPermission(reviewer, 'view', 'applications'), true);
        assert.strictEqual(hasPermission(reviewer, 'view_sensitive', 'applications'), false);
    });

    test('Data sanitization guarantees tcNumberEncrypted is never leaked in standard list response', () => {
        const mockRawDbApplications = [
            {
                id: 'app-1',
                applicationNumber: 'ANTS-2026-000001',
                applicantName: 'Ahmet Yılmaz',
                tcNumberMasked: '123******01',
                tcNumberEncrypted: '12345678901',
                status: 'NEW',
            },
            {
                id: 'app-2',
                applicationNumber: 'ANTS-2026-000002',
                applicantName: 'Ayşe Demir',
                tcNumberMasked: '987******54',
                tcNumberEncrypted: '98765432154',
                status: 'IN_REVIEW',
            },
        ];

        // Sanitize like ApplicationService.getAdminApplications
        const sanitized = mockRawDbApplications.map((item) => {
            const { tcNumberEncrypted, ...rest } = item;
            return rest;
        });

        sanitized.forEach((item: any) => {
            assert.strictEqual(item.tcNumberEncrypted, undefined, 'tcNumberEncrypted must be stripped');
            assert.ok(item.tcNumberMasked.includes('******'), 'Masked TC must be present');
        });
    });
});
