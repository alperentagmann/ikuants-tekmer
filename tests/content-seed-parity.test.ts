import { test, describe } from 'node:test';
import assert from 'node:assert';
import { siteContent } from '../data/content';

describe('Content & Database Seed Data Parity', () => {
    test('siteContent has public entrepreneurs defined with complete fields and excludes unpublished entries', () => {
        const { list } = siteContent.entrepreneurs;
        assert.ok(list.length >= 15, `Expected at least 15 public entrepreneurs, got ${list.length}`);

        const hiddenNames = [
            'Aleaza Development Solutions',
            'Ability Pool Blşm. Yaz. Tic. Eğt. Dan. Ve R&G A.Ş.',
            'Kulüpbirliğim Bilişim İletişim ve Danışmanlık Ltd. Şti.',
            'Hazır Cevap Akıllı Teknolojiler Ve Sürdürülebilirlik Ltd. Şti.',
            'Altelca Aviation',
            'M-RADS (Medical Reporting and Detection System)',
            'Elevatora',
        ];

        list.forEach((ent) => {
            assert.ok(ent.name, 'Entrepreneur must have a name');
            assert.ok(ent.type, `Entrepreneur ${ent.name} must have a sector/type`);
            assert.ok(ent.level, `Entrepreneur ${ent.name} must have a stage`);
            assert.ok(!hiddenNames.includes(ent.name), `Hidden company ${ent.name} should not be in public list`);
        });
    });

    test('siteContent supports has 6 core incentives under 5746 law', () => {
        const { features } = siteContent.differences;
        assert.strictEqual(features.length, 6, 'There must be 6 core incentives');

        const titles = features.map((f) => f.title);
        assert.ok(titles.includes('AR-GE VE TASARIM İNDİRİMİ'));
        assert.ok(titles.includes('GELİR VERGİSİ STOPAJI TEŞVİKİ'));
        assert.ok(titles.includes('SİGORTA PRİMİ DESTEĞİ'));
        assert.ok(titles.includes('DAMGA VERGİSİ İSTİSNASI'));
        assert.ok(titles.includes('GÜMRÜK VERGİSİ İSTİSNASI'));
        assert.ok(titles.includes('TEMEL BİLİMLER DESTEĞİ'));
    });

    test('siteContent contact details are formatted and accurate', () => {
        const { info } = siteContent.contact;
        assert.ok(info.address.value.includes('Bakırköy'), 'Address must contain Bakırköy');
        assert.strictEqual(info.email.value, 'info@ikuantstekmer.com');
        assert.strictEqual(info.phone.value, '(0212) 498 41 62');
    });
});
