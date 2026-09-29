import { test, describe } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { hasPermission, UserWithPermissions } from '../lib/rbac';
import { maskTcNumber } from '../lib/utils';

describe('1. Authentication & Password Security', () => {
    test('bcrypt hashes and verifies password correctly with salt rounds', async () => {
        const plainPassword = 'TestSuperAdmin2026!';
        const hash = await bcrypt.hash(plainPassword, 12);

        assert.ok(hash.startsWith('$2'), 'Hash should be valid bcrypt format');
        const isValid = await bcrypt.compare(plainPassword, hash);
        assert.strictEqual(isValid, true, 'Matching password must verify to true');

        const isWrong = await bcrypt.compare('WrongPassword', hash);
        assert.strictEqual(isWrong, false, 'Non-matching password must verify to false');
    });
});

describe('2. RBAC & Permission Matrix', () => {
    test('Super Admin has wildcard bypass on any resource and action', () => {
        const superAdmin: UserWithPermissions = {
            id: 'sa-1',
            isActive: true,
            isSuperAdmin: true,
        };

        assert.strictEqual(hasPermission(superAdmin, 'view', 'dashboard'), true);
        assert.strictEqual(hasPermission(superAdmin, 'edit', 'applications'), true);
        assert.strictEqual(hasPermission(superAdmin, 'view_sensitive', 'applications'), true);
        assert.strictEqual(hasPermission(superAdmin, 'delete', 'users'), true);
    });

    test('Inactive user is denied all permissions even if Super Admin', () => {
        const inactiveSuperAdmin: UserWithPermissions = {
            id: 'sa-2',
            isActive: false,
            isSuperAdmin: true,
        };

        assert.strictEqual(hasPermission(inactiveSuperAdmin, 'view', 'dashboard'), false);
    });

    test('Role with specific permissions allows authorized resources and denies others', () => {
        const contentEditor: UserWithPermissions = {
            id: 'user-editor',
            isActive: true,
            isSuperAdmin: false,
            userRoles: [
                {
                    role: {
                        slug: 'content-editor',
                        permissions: [
                            { permission: { action: 'view', resource: 'news' } },
                            { permission: { action: 'create', resource: 'news' } },
                            { permission: { action: 'edit', resource: 'news' } },
                        ],
                    },
                },
            ],
        };

        assert.strictEqual(hasPermission(contentEditor, 'view', 'news'), true);
        assert.strictEqual(hasPermission(contentEditor, 'edit', 'news'), true);
        assert.strictEqual(hasPermission(contentEditor, 'delete', 'news'), false);
        assert.strictEqual(hasPermission(contentEditor, 'view', 'applications'), false);
        assert.strictEqual(hasPermission(contentEditor, 'view_sensitive', 'applications'), false);
    });

    test('User explicit permission override takes precedence over role permissions', () => {
        const user: UserWithPermissions = {
            id: 'user-custom',
            isActive: true,
            isSuperAdmin: false,
            userRoles: [
                {
                    role: {
                        slug: 'viewer',
                        permissions: [{ permission: { action: 'view', resource: 'news' } }],
                    },
                },
            ],
            userPermissions: [
                {
                    isGranted: false, // explicitly denied
                    permission: { action: 'view', resource: 'news' },
                },
            ],
        };

        assert.strictEqual(hasPermission(user, 'view', 'news'), false);
    });
});
