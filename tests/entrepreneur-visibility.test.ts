import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { EntrepreneurService } from '../lib/services/entrepreneur-service';

const HIDDEN_COMPANIES = [
    'Aleaza Development Solutions',
    'Ability Pool Blşm. Yaz. Tic. Eğt. Dan. Ve R&G A.Ş.',
    'Kulüpbirliğim Bilişim İletişim ve Danışmanlık Ltd. Şti.',
    'Hazır Cevap Akıllı Teknolojiler Ve Sürdürülebilirlik Ltd. Şti.',
    'Altelca Aviation',
    'M-RADS (Medical Reporting and Detection System)',
    'Elevatora',
];

describe('Entrepreneur Public Visibility & Management', () => {
    before(async () => {
        for (const name of HIDDEN_COMPANIES) {
            await prisma.entrepreneur.updateMany({
                where: { name: { contains: name.slice(0, 15), mode: 'insensitive' } },
                data: { isPublished: false },
            });
        }
    });

    test('All 7 companies exist in DB and are marked isPublished: false (not hard deleted)', async () => {
        for (const name of HIDDEN_COMPANIES) {
            const found = await prisma.entrepreneur.findFirst({
                where: { name: { contains: name.slice(0, 15), mode: 'insensitive' } },
            });
            assert.ok(found, `Company ${name} must exist in database`);
            assert.strictEqual(found.isPublished, false, `Company ${name} must be unpublished (isPublished = false)`);
        }
    });

    test('getPublicEntrepreneurs excludes all 7 companies from public feed', async () => {
        const publicList = await EntrepreneurService.getPublicEntrepreneurs();
        const publicNames = publicList.map((e) => e.name.toLowerCase());

        for (const name of HIDDEN_COMPANIES) {
            const isIncluded = publicNames.some((p) => p.includes(name.slice(0, 15).toLowerCase()));
            assert.strictEqual(isIncluded, false, `Company ${name} must not be present in public list`);
        }
        assert.ok(publicList.length >= 15, `Expected remaining active companies to be visible, got ${publicList.length}`);
    });

    test('getAdminEntrepreneurs still returns all companies including unpublished ones', async () => {
        const adminResult = await EntrepreneurService.getAdminEntrepreneurs({ limit: 100 });
        const adminNames = adminResult.items.map((e: any) => e.name.toLowerCase());

        for (const name of HIDDEN_COMPANIES) {
            const isIncluded = adminNames.some((p: string) => p.includes(name.slice(0, 15).toLowerCase()));
            assert.ok(isIncluded, `Admin list must retain company ${name}`);
        }
    });

    test('togglePublicVisibility publishes and unpublishes with audit log', async () => {
        const testCompany = await prisma.entrepreneur.findFirst({
            where: { name: { contains: 'Altelca', mode: 'insensitive' } },
        });
        assert.ok(testCompany, 'Target test company found');

        // Toggle to true
        await EntrepreneurService.togglePublicVisibility(testCompany.id, true);
        const published = await EntrepreneurService.getPublicEntrepreneurs();
        assert.ok(
            published.some((e) => e.id === testCompany.id),
            'Company should be visible when toggled to published'
        );

        // Toggle back to false
        await EntrepreneurService.togglePublicVisibility(testCompany.id, false);
        const unpublished = await EntrepreneurService.getPublicEntrepreneurs();
        assert.ok(
            !unpublished.some((e) => e.id === testCompany.id),
            'Company should be hidden when toggled to unpublished'
        );

        // Verify Audit Log entry exists
        const auditLog = await prisma.auditLog.findFirst({
            where: {
                entityType: 'Entrepreneur',
                entityId: testCompany.id,
                diff: { contains: 'ENTREPRENEUR_PUBLIC_VISIBILITY_CHANGED' },
            },
            orderBy: { createdAt: 'desc' },
        });
        assert.ok(auditLog, 'Audit log entry must be generated for visibility change');
        assert.ok(auditLog.diff?.includes('ENTREPRENEUR_PUBLIC_VISIBILITY_CHANGED'));
    });
});
