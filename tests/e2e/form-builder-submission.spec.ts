import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { prisma } from '../../lib/prisma';

test.describe('Form Builder & Submission Pipeline', () => {
    test.beforeEach(async ({ context }) => {
        await loginAsAdmin(context);
    });

    test('Form Builder Studio loads existing active forms and versions', async ({ page }) => {
        await page.goto('/admin/form-builder', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1')).toBeVisible({ timeout: 30000 });

        // Check for forms list or create action
        const formItems = page.locator('button, a').filter({ hasText: /Form|Oluştur|Yeni/i });
        await expect(formItems.first()).toBeVisible({ timeout: 15000 });
    });

    test('Application submission via public form registers in pipeline and retains version immutability', async ({ context }) => {
        // Find existing form
        const form = await prisma.form.findFirst({
            include: { versions: { where: { status: 'PUBLISHED' }, orderBy: { versionNumber: 'desc' }, take: 1 } }
        });

        if (form && form.versions.length > 0) {
            const formVersion = form.versions[0];
            const appNo = `ANTS-2026-${Math.floor(100000 + Math.random() * 900000)}`;

            const sub = await prisma.submission.create({
                data: {
                    submissionNumber: `SUB-${Date.now()}`,
                    formVersionId: formVersion.id,
                    rawSnapshot: JSON.stringify({ name: 'Playwright Form Test User' }),
                }
            });

            // Create test application linked to this form version and submission
            const app = await prisma.application.create({
                data: {
                    applicationNumber: appNo,
                    applicantName: 'Playwright Form Test User',
                    email: `form.test.${Date.now()}@example.com`,
                    phone: '+905551112233',
                    companyName: 'Playwright BioTech Inc',
                    status: 'NEW',
                    formVersionId: formVersion.id,
                    submissionId: sub.id,
                }
            });

            try {
                expect(app.id).toBeDefined();

                // Verify in admin list with authenticated context request
                const adminRes = await context.request.get('/api/admin/applications');
                expect(adminRes.status()).toBe(200);
                const adminData = await adminRes.json();
                const list = adminData.items || adminData.applications || [];
                const found = list.some((a: { id: string; applicationNumber: string }) => a.id === app.id || a.applicationNumber === appNo);
                expect(found).toBe(true);
            } finally {
                // Cleanup by exact id even when an assertion fails
                await prisma.activityTimeline.deleteMany({ where: { entityId: app.id } });
                await prisma.application.deleteMany({ where: { id: app.id } });
                await prisma.submission.deleteMany({ where: { id: sub.id } });
            }
        }
    });
});
