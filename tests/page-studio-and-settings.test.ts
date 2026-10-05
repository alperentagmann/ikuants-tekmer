/**
 * Multi-page design studio layouts, editable page texts, public settings resolution
 * and the locked footer design credit. Pure functions only; no database writes.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { PAGE_DEFS, PAGE_KEYS, blockAllowed, defaultLayout, pageText, sanitizeLayout } from '../lib/homepage-layout';
import { DESIGN_CREDIT, resolvePublicSettings, stripCredit } from '../lib/site-settings';

describe('Page design studio', () => {
    test('every page defaults to its original sections in their original order', () => {
        for (const page of PAGE_KEYS) {
            const layout = defaultLayout(page);
            assert.deepStrictEqual(layout.blocks.map((b) => b.type), PAGE_DEFS[page].defaults);
            assert.strictEqual(layout.theme.preset, 'original');
        }
    });

    test('page-specific sections are allowed only on their own page', () => {
        assert.ok(blockAllowed('spacesList', 'kullanim-alanlari'));
        assert.ok(!blockAllowed('spacesList', 'home'));
        assert.ok(!blockAllowed('hero', 'destekler'));
        assert.ok(blockAllowed('banner', 'programlar'));
        const cleaned = sanitizeLayout({ blocks: [{ id: 'a', type: 'supportsGrid' }, { id: 'b', type: 'hero' }, { id: 'c', type: 'supportsGrid' }, { id: 'd', type: 'banner' }] }, 'destekler');
        assert.deepStrictEqual(cleaned.blocks.map((b) => b.type), ['supportsGrid', 'banner']);
    });

    test('reordered sections keep their order after sanitizing', () => {
        const order = ['spacesFinder', 'spacesIntro', 'spacesList', 'spacesFeatures', 'spacesForms'];
        const cleaned = sanitizeLayout({ blocks: order.map((type) => ({ id: type, type })) }, 'kullanim-alanlari');
        assert.deepStrictEqual(cleaned.blocks.map((b) => b.type), order);
    });

    test('page texts fall back to the original text and drop unsafe links', () => {
        const cleaned = sanitizeLayout({ blocks: [{ id: 'x', type: 'supportsCta', config: { title: '  Yeni başlık ', primaryLink: 'javascript:alert(1)', junk: 'y' } }] }, 'destekler');
        const config = cleaned.blocks[0].config;
        assert.deepStrictEqual(config, { title: 'Yeni başlık' });
        assert.strictEqual(pageText('supportsCta', config, 'title'), 'Yeni başlık');
        assert.strictEqual(pageText('supportsCta', config, 'primaryLink'), '/basvuru');
        assert.strictEqual(pageText('spacesIntro', {}, 'title'), 'Kullanım Alanları & Rezervasyon');
    });
});

describe('Public settings and footer credit', () => {
    test('design credit is stripped from editable copyright text in any spelling', () => {
        assert.strictEqual(stripCredit('Copyright 2026 İKÜANTS TEKMER | Design By Alperen Tağman.'), 'Copyright 2026 İKÜANTS TEKMER');
        assert.strictEqual(stripCredit('© İKÜANTS - designed by alperen tagman'), '© İKÜANTS');
        assert.strictEqual(DESIGN_CREDIT, 'Design By Alperen Tağman');
    });

    test('empty values fall back to defaults and legacy dotted keys still work', () => {
        const s = resolvePublicSettings({ site_email: '', 'contact.phone': '+90 212 000 00 00' });
        assert.strictEqual(s.email, 'bilgi@ikuantstekmer.com');
        assert.strictEqual(s.phone, '+90 212 000 00 00');
        assert.ok(!/alperen/i.test(s.copyright));
    });
});
