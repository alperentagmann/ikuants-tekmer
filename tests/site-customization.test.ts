/**
 * Homepage layout validation, program themes / apply links, facility gallery parsing
 * and form placements. Records use the "qa-sc-" marker and are removed by exact id.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { DEFAULT_LAYOUT, sanitizeLayout, themeVariables } from '../lib/homepage-layout';
import { resolveProgramTheme, sanitizeProgramTheme } from '../lib/program-theme';
import { parseGallery, serializeGallery, spaceGroupKey } from '../lib/facility-media';
import { ProgramService } from '../lib/services/program-service';
import { FormPlacementService } from '../lib/services/form-placement-service';

const RUN = `qa-sc-${Date.now().toString(36)}`;
const created = { placements: [] as string[] };

describe('Site customization', () => {
    let actor: { id: string; name: string; email: string };
    before(async () => {
        const u = await prisma.user.findFirst({ where: { isActive: true }, select: { id: true, name: true, email: true } });
        assert.ok(u);
        actor = u;
    });
    after(async () => {
        await prisma.auditLog.deleteMany({ where: { entityType: 'FormPlacement', entityId: { in: created.placements } } });
        await prisma.formPlacement.deleteMany({ where: { id: { in: created.placements } } });
        await prisma.$disconnect();
    });

    test('default homepage layout is the original design plus latest news, without theme overrides', () => {
        assert.deepEqual(DEFAULT_LAYOUT.blocks.map((b) => b.type), ['hero', 'differences', 'news']);
        assert.deepEqual(themeVariables(DEFAULT_LAYOUT.theme), {});
    });

    test('layout sanitizer drops unknown blocks, unsafe links and duplicate single blocks', () => {
        const l = sanitizeLayout({
            theme: { preset: 'corporate', primary: 'red', fontStyle: 'modern' },
            blocks: [
                { id: 'a', type: 'hero' },
                { id: 'b', type: 'hero' },
                { id: 'c', type: 'script', config: { html: '<script>' } },
                { id: 'd', type: 'banner', config: { title: 'X', buttonLink: 'javascript:alert(1)', imageUrl: '/uploads/a.jpg' } },
                { id: 'e', type: 'stats', config: { items: [{ value: '120+', label: 'Girişim' }, { value: '', label: '' }] } },
            ],
        });
        assert.deepEqual(l.blocks.map((b) => b.type), ['hero', 'banner', 'stats']);
        assert.equal(l.blocks[1].config.buttonLink, '');
        assert.equal(l.blocks[1].config.imageUrl, '/uploads/a.jpg');
        assert.equal((l.blocks[2].config.items as unknown[]).length, 1);
        assert.equal(l.theme.primary, null, 'invalid color rejected');
        assert.equal(themeVariables(l.theme)['--primary'], '#1e3a8a', 'preset color applied');
        assert.ok(themeVariables(l.theme)['--font-orbitron']);
    });

    test('program theme falls back to legacy gradient and validates colors', () => {
        assert.equal(resolveProgramTheme({ colorCode: 'from-orange-500 to-red-600' }).primary, '#f97316');
        const stored = JSON.parse(sanitizeProgramTheme({ primary: '#123456', secondary: 'nope', buttonStyle: 'solid' }) as string);
        assert.equal(stored.primary, '#123456');
        assert.notEqual(stored.secondary, 'nope');
        assert.equal(stored.buttonStyle, 'solid');
    });

    test('program apply link comes from the open campaign, never the TEKMER form', async () => {
        const programs = await ProgramService.getPublicPrograms();
        for (const p of programs) {
            assert.notEqual((p as { applyUrl: string | null }).applyUrl, '/basvuru', `${(p as { name: string }).name} must not link to the TEKMER form`);
        }
        const withCampaign = await prisma.program.findFirst({ where: { campaigns: { some: { status: 'OPEN', formId: { not: null } } } }, include: { campaigns: { where: { status: 'OPEN' }, include: { form: true } } } });
        if (withCampaign) {
            const p = (await ProgramService.getProgramBySlug(withCampaign.slug)) as { applyUrl: string; applyOpen: boolean };
            assert.equal(p.applyOpen, true);
            assert.equal(p.applyUrl, withCampaign.campaigns[0].form?.publicPath || `/formlar/${withCampaign.campaigns[0].form?.slug}`);
        }
    });

    test('facility gallery round-trips and spaces are grouped by kind', () => {
        const json = serializeGallery([{ url: '/a.jpg', caption: 'Reji' }, '/b.jpg', { url: '' }, 42]);
        assert.deepEqual(parseGallery(json), [{ url: '/a.jpg', caption: 'Reji' }, { url: '/b.jpg', caption: null }]);
        assert.equal(spaceGroupKey('STUDIO'), 'studios');
        assert.equal(spaceGroupKey('OPEN_MEETING_TABLE'), 'meeting');
        assert.equal(spaceGroupKey('UNKNOWN'), 'work');
    });

    test('form placements: program page placement is listed for that program only', async () => {
        const form = await prisma.form.findFirst({ where: { isPublished: true, isArchived: false } });
        const program = await prisma.program.findFirst({ where: { isArchived: false } });
        assert.ok(form && program);
        const p = await FormPlacementService.create(form.id, { targetType: 'PROGRAM_PAGE', targetId: program.id, title: `${RUN} başlık` }, actor);
        created.placements.push(p.id);
        await assert.rejects(() => FormPlacementService.create(form.id, { targetType: 'PROGRAM_PAGE', targetId: program.id }, actor), /zaten/);
        await assert.rejects(() => FormPlacementService.create(form.id, { targetType: 'PROGRAM_PAGE' }, actor), /program/i);
        const forProgram = await FormPlacementService.forTarget('PROGRAM_PAGE', program.id);
        assert.ok(forProgram.some((x) => x.id === p.id && x.title === `${RUN} başlık`));
        await FormPlacementService.update(p.id, { isActive: false }, actor);
        assert.ok(!(await FormPlacementService.forTarget('PROGRAM_PAGE', program.id)).some((x) => x.id === p.id), 'inactive placement hidden');
    });
});
