import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Admin User Management & CRUD Flows', () => {
    const testEmail = `test.user.${Date.now()}@ikuantstekmer.com`;

    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test.afterAll(async () => {
        // Clean up test user
        await prisma.userInvite.deleteMany({ where: { email: testEmail } });
        await prisma.userRole.deleteMany({ where: { user: { email: testEmail } } });
        await prisma.session.deleteMany({ where: { user: { email: testEmail } } });
        await prisma.user.deleteMany({ where: { email: testEmail } });
    });

    test('User management page renders with users and supports search/filter', async ({ page }) => {
        await page.goto('/admin/kullanicilar', { waitUntil: 'domcontentloaded' });

        // Check heading
        await expect(page.locator('h1')).toBeVisible({ timeout: 30000 });

        // Search input
        const searchInput = page.locator('input[placeholder*="ara" i], input[type="search"], input[type="text"]').first();
        await expect(searchInput).toBeVisible();

        // Check user in main list
        const mainUser = page.locator('main').getByText('bilgi@ikuantstekmer.com').first();
        await expect(mainUser).toBeVisible({ timeout: 15000 });
    });

    test('User creation with temporary password and persistence verification', async ({ context }) => {
        // Fetch existing roles
        const roles = await prisma.role.findMany();
        const testRole = roles.find(r => r.slug === 'admin') || roles[0];
        expect(testRole).toBeDefined();

        // 1. Create user via API with authenticated context
        const createRes = await context.request.post('/api/admin/users', {
            data: {
                email: testEmail,
                name: 'Playwright Test Person',
                title: 'Test Specialist',
                department: 'Kalite Güvence',
                roleId: testRole.id,
                passwordMethod: 'TEMP_PASSWORD',
                tempPassword: 'TestPassword123!',
            }
        });

        expect(createRes.status()).toBe(200);
        const createData = await createRes.json();
        expect(createData.success).toBe(true);
        expect(createData.user.email).toBe(testEmail);

        // 2. Verify Persistence in DB
        const createdUser = await prisma.user.findUnique({
            where: { email: testEmail },
            include: { userRoles: { include: { role: true } } },
        });
        expect(createdUser).not.toBeNull();
        expect(createdUser?.name).toBe('Playwright Test Person');
        expect(createdUser?.status).toBe('ACTIVE');

        // 3. Update User (Change name and status)
        const updateRes = await context.request.put(`/api/admin/users/${createdUser?.id}`, {
            data: {
                name: 'Playwright Test Person Updated',
                status: 'DISABLED',
                isActive: false,
            }
        });
        expect(updateRes.status()).toBe(200);

        // 4. Verify Update Persistence
        const updatedUser = await prisma.user.findUnique({ where: { id: createdUser?.id } });
        expect(updatedUser?.name).toBe('Playwright Test Person Updated');
        expect(updatedUser?.isActive).toBe(false);

        // 5. Delete test user
        const deleteRes = await context.request.delete(`/api/admin/users/${createdUser?.id}`);
        expect(deleteRes.status()).toBe(200);

        const afterDelete = await prisma.user.findUnique({ where: { id: createdUser?.id } });
        expect(afterDelete).toBeNull();
    });
});
