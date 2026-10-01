import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';
import { createSession } from '../../lib/auth';

test.describe('Server-Side RBAC & Security Boundary Tests', () => {
    test('Unauthenticated user receives 401 or 403 when calling protected Admin API', async ({ request }) => {
        const res = await request.get('/api/admin/users');
        expect([401, 403]).toContain(res.status());
    });

    test('Unauthenticated user navigating to /admin is redirected to login', async ({ page }) => {
        await page.goto('/admin/kullanicilar', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/admin\/login/);
    });

    test('Non-superadmin cannot assign or escalate to super-admin role', async ({ context }) => {
        // Find or create a standard editor user
        let editorUser = await prisma.user.findFirst({
            where: { email: 'editor.test@ikuantstekmer.com' }
        });

        if (!editorUser) {
            const editorRole = await prisma.role.findFirst({ where: { slug: 'content-editor' } }) ||
                               await prisma.role.findFirst({ where: { slug: { not: 'super-admin' } } });
            
            if (editorRole) {
                editorUser = await prisma.user.create({
                    data: {
                        email: 'editor.test@ikuantstekmer.com',
                        name: 'Test Content Editor',
                        passwordHash: 'dummyhash123',
                        isSuperAdmin: false,
                        isActive: true,
                        status: 'ACTIVE',
                        userRoles: {
                            create: { roleId: editorRole.id }
                        }
                    }
                });
            }
        }

        if (editorUser) {
            const { sessionToken } = await createSession(editorUser.id, '127.0.0.1', 'Playwright RBAC Test');
            await context.addCookies([
                {
                    name: '__session',
                    value: sessionToken,
                    url: 'http://localhost:3000',
                },
            ]);

            // Attempt to access super-admin only endpoints
            const superAdminRole = await prisma.role.findFirst({ where: { slug: 'super-admin' } });
            if (superAdminRole) {
                const res = await context.request.post('/api/admin/users', {
                    data: {
                        email: `escalate.${Date.now()}@ikuantstekmer.com`,
                        name: 'Escalate Attempt',
                        roleId: superAdminRole.id,
                        isSuperAdmin: true,
                        passwordMethod: 'TEMP_PASSWORD',
                        tempPassword: 'Password123!',
                    }
                });

                // Expect 403 Forbidden
                expect(res.status()).toBe(403);
            }
        }
    });

    test('Super Admin has access to all protected core modules', async ({ context, page }) => {
        await loginAsAdmin(context);

        const protectedRoutes = [
            '/admin/dashboard',
            '/admin/kullanicilar',
            '/admin/roller',
            '/admin/guvenlik',
            '/admin/audit-log',
            '/admin/sistem-durumu',
            '/admin/ayarlar',
            '/admin/kvkk',
            '/admin/finans',
        ];

        for (const route of protectedRoutes) {
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            expect(page.url()).toContain(route);
            expect(page.url()).not.toContain('/login');
        }
    });
});
