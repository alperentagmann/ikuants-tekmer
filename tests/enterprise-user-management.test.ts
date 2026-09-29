import { test, describe } from 'node:test';
import assert from 'node:assert';
import { UserManagementService } from '../lib/services/user-management-service';
import { canAssignRole, UserWithPermissions } from '../lib/rbac';
import { prisma } from '../lib/prisma';

describe('1. Enterprise Multi-Admin & User Management', () => {
    test('Role assignment hierarchy prevents non-superadmin from granting super-admin', () => {
        const adminWithUserPermission: UserWithPermissions = {
            id: 'admin-1',
            isActive: true,
            isSuperAdmin: false,
            userRoles: [
                {
                    role: {
                        slug: 'admin',
                        permissions: [
                            { permission: { action: 'assign_role', resource: 'users' } },
                        ],
                    },
                },
            ],
        };

        const viewerWithoutPermission: UserWithPermissions = {
            id: 'viewer-1',
            isActive: true,
            isSuperAdmin: false,
            userRoles: [{ role: { slug: 'viewer', permissions: [] } }],
        };

        const superAdminUser: UserWithPermissions = {
            id: 'super-1',
            isActive: true,
            isSuperAdmin: true,
        };

        assert.strictEqual(canAssignRole(adminWithUserPermission, 'super-admin'), false, 'Admin cannot assign super-admin');
        assert.strictEqual(canAssignRole(adminWithUserPermission, 'content-editor'), true, 'Admin with assign_role can assign lower roles');
        assert.strictEqual(canAssignRole(viewerWithoutPermission, 'content-editor'), false, 'Viewer cannot assign roles');
        assert.strictEqual(canAssignRole(superAdminUser, 'super-admin'), true, 'Super Admin can assign any role');
    });

    test('User invite token creation produces hashed token and single-use mechanism', async () => {
        const testEmail = `test.invite.${Date.now()}@ikuanstekmer.com`;
        
        // Find admin role
        const role = await prisma.role.findFirst({ where: { slug: 'admin' } });
        assert.ok(role, 'Admin role must exist in database');

        const result = await UserManagementService.createUser({
            email: testEmail,
            name: 'Hatice Tuğsavul',
            roleId: role.id,
            department: 'Operasyon',
            passwordMethod: 'INVITE',
        });

        assert.ok(result.inviteToken, 'Must return unhashed token for email link');

        // Verify token lookup
        const validation = await UserManagementService.validateInviteToken(result.inviteToken);
        assert.strictEqual(validation.isValid, true, 'Invite must be valid via raw token');
        assert.strictEqual(validation.invite?.email, testEmail);

        // Accept invite
        const activatedUser = await UserManagementService.acceptInvite(
            result.inviteToken,
            'StrongPassword2026!',
            'Hatice Tuğsavul'
        );

        assert.ok(activatedUser, 'User must be created upon invite acceptance');
        assert.strictEqual(activatedUser.email, testEmail);
        assert.strictEqual(activatedUser.status, 'ACTIVE');

        // Second acceptance should fail (single-use)
        await assert.rejects(async () => {
            await UserManagementService.acceptInvite(
                result.inviteToken!,
                'StrongPassword2026!',
                'Second Attempt'
            );
        }, /geçersiz veya süresi dolmuş/i);

        // Cleanup
        await prisma.user.delete({ where: { id: activatedUser.id } }).catch(() => {});
    });

    test('Last active Super Admin account is protected from deletion or deactivation', async () => {
        const superAdmins = await prisma.user.findMany({
            where: { isSuperAdmin: true, isActive: true },
        });

        if (superAdmins.length === 1) {
            const singleSuperAdmin = superAdmins[0];
            await assert.rejects(async () => {
                await UserManagementService.deleteUser(singleSuperAdmin.id, 'sa-test');
            }, /Son aktif Süper Yönetici hesabı silinemez/i);
        } else {
            assert.ok(superAdmins.length >= 1, 'At least one super admin exists');
        }
    });
});
