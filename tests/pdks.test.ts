/**
 * PDKS: kart UID, giriş-çıkış eşleştirme, süre sınırları, CSV/cihaz içe aktarma (idempotent), KVKK kimlik açma.
 * Test kayıtları "QA" UID önekiyle oluşturulur ve sonunda kimlikleriyle silinir.
 */
import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { normalizeUid, parseDirection, pairSessions, totals, onSite, parseCsv, parseLocalDateTime, isoWeek, type PdksEvent } from '../lib/pdks/calc';
import { PdksService } from '../lib/services/pdks-service';

const RUN = Date.now().toString(36).toUpperCase();
const at = (s: string) => new Date(`${s}+03:00`);
const ev = (uid: string, direction: 'IN' | 'OUT', time: string): PdksEvent => ({ id: `${uid}${time}`, cardUid: uid, holderName: uid, holderType: 'STAFF', entrepreneurId: null, direction, occurredAt: at(time) });

describe('PDKS — saf hesaplar', () => {
    test('UID ve yön normalizasyonu', () => {
        assert.equal(normalizeUid('04:a1:b2-c3'), '04A1B2C3');
        assert.equal(normalizeUid('12'), null);
        assert.equal(parseDirection('GİRİŞ'), 'IN');
        assert.equal(parseDirection('çıkış'), 'OUT');
        assert.equal(parseDirection('yan'), null);
    });

    test('eşleştirme: IN→OUT oturum, çıkışsız giriş ve girişsiz çıkış uyarı olur ve süreye katılmaz', () => {
        const s = pairSessions([
            ev('A', 'IN', '2026-10-05T09:00:00'), ev('A', 'OUT', '2026-10-05T12:30:00'),
            ev('A', 'IN', '2026-10-05T13:00:00'), ev('A', 'IN', '2026-10-05T14:00:00'), ev('A', 'OUT', '2026-10-05T18:00:00'),
            ev('B', 'OUT', '2026-10-05T08:00:00'),
        ]);
        const a = s.filter((x) => x.cardUid === 'A');
        assert.deepStrictEqual(a.map((x) => [x.minutes, x.problem]), [[210, null], [0, 'NO_OUT'], [240, null]]);
        assert.equal(s.find((x) => x.cardUid === 'B')?.problem, 'NO_IN');
    });

    test('toplamlar: günlük 11 sa ve haftalık 45 sa sınırı (sınır dahil aşım değil)', () => {
        const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'];
        const events = days.flatMap((d, i) => [ev('A', 'IN', `${d}T07:00:00`), ev('A', 'OUT', `${d}T${i === 0 ? '18:01' : '18:00'}:00`)]);
        const daily = totals(pairSessions(events), 'daily', { dailyHours: 11, weeklyHours: 45 });
        assert.deepStrictEqual(daily.map((r) => r.overLimit), [true, false, false, false]);
        const weekly = totals(pairSessions(events), 'weekly', { dailyHours: 11, weeklyHours: 43 });
        assert.equal(weekly.length, 1);
        assert.equal(weekly[0].minutes, 44 * 60 + 1);
        assert.equal(weekly[0].overLimit, true);
        assert.equal(isoWeek('2026-10-05'), '2026-W41');
    });

    test('anlık yerleşke: bugün son hareketi giriş olanlar', () => {
        const today = '2026-10-05';
        const here = onSite([ev('A', 'IN', '2026-10-05T09:00:00'), ev('B', 'IN', '2026-10-05T09:00:00'), ev('B', 'OUT', '2026-10-05T10:00:00'), ev('C', 'IN', '2026-10-04T09:00:00')], today);
        assert.deepStrictEqual(here.map((x) => x.cardUid), ['A']);
    });

    test('CSV ve tarih biçimleri', () => {
        assert.deepStrictEqual(parseCsv('﻿kart;yon;tarih\n"04 A1";GİRİŞ;2026-10-05 09:00\n\n'), [['kart', 'yon', 'tarih'], ['04 A1', 'GİRİŞ', '2026-10-05 09:00']]);
        assert.equal(parseLocalDateTime('05.10.2026 09:00')?.toISOString(), '2026-10-05T06:00:00.000Z');
        assert.equal(parseLocalDateTime('2026-10-05T09:00:00+03:00')?.toISOString(), '2026-10-05T06:00:00.000Z');
        assert.equal(parseLocalDateTime('dün'), null);
    });
});

describe('PDKS — veritabanı akışı', () => {
    const actor = { id: '', name: 'QA', email: 'qa@example.com' };
    const uid = `QA${RUN}A`;
    const ids = { card: '', device: '', person: '', ent: '' };
    let admin: Parameters<typeof PdksService.revealIdentity>[1];

    before(async () => {
        const u = await prisma.user.findFirst({ where: { isSuperAdmin: true, isActive: true, email: 'bilgi@ikuantstekmer.com' }, include: { userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
        assert.ok(u);
        actor.id = u!.id;
        admin = u as never;
        ids.ent = (await prisma.entrepreneur.create({ data: { name: `QA PDKS ${RUN}`, slug: `qa-pdks-${RUN.toLowerCase()}`, sector: 'Test', isPublished: false } })).id;
        ids.person = (await prisma.person.create({ data: { firstName: 'QA', lastName: RUN, fullName: `QA ${RUN}`, tcNumberMasked: '12*******90', tcNumberEncrypted: null } })).id;
    });

    after(async () => {
        await prisma.accessEvent.deleteMany({ where: { cardUid: { startsWith: `QA${RUN}` } } });
        await prisma.accessCard.deleteMany({ where: { cardUid: { startsWith: `QA${RUN}` } } });
        await prisma.accessDevice.deleteMany({ where: { code: `QA-${RUN}` } });
        await prisma.person.deleteMany({ where: { id: ids.person } });
        await prisma.entrepreneur.deleteMany({ where: { id: ids.ent } });
        await prisma.$disconnect();
    });

    test('kart tanımlama: UID normalize, girişim çalışanında girişim zorunlu, mükerrer UID 409', async () => {
        await assert.rejects(() => PdksService.createCard({ cardUid: uid, holderType: 'MEMBER', holderName: 'X' }, actor), /kontrol/);
        const c = await PdksService.createCard({ cardUid: uid.toLowerCase(), holderType: 'MEMBER', entrepreneurId: ids.ent, personId: ids.person }, actor);
        ids.card = c.id;
        assert.equal(c.cardUid, uid);
        assert.equal(c.holderName, `QA ${RUN}`); // rehberden
        await assert.rejects(() => PdksService.createCard({ cardUid: uid, holderType: 'STAFF', holderName: 'Y' }, actor), /zaten kayıtlı/);
    });

    test('manuel hareket + aynı kişi/zaman/yön tekrarı reddedilir', async () => {
        await PdksService.createManualEvent({ cardId: ids.card, direction: 'IN', occurredAt: '2026-10-05T09:00:00+03:00' }, actor);
        await assert.rejects(() => PdksService.createManualEvent({ cardId: ids.card, direction: 'IN', occurredAt: '2026-10-05T09:00:00+03:00' }, actor), /zaten kayıtlı/);
        await assert.rejects(() => PdksService.createManualEvent({ cardUid: `QA${RUN}YOK`, direction: 'IN', occurredAt: '2026-10-05T09:00:00+03:00' }, actor), /tanımlı değil/);
    });

    test('CSV içe aktarma idempotent; satır hataları raporlanır', async () => {
        const csv = `kart_uid;yon;tarih_saat\n${uid};ÇIKIŞ;2026-10-05 18:30\n${uid};GİRİŞ;2026-10-05 09:00\n${uid};yan;2026-10-05 10:00\n`;
        const r1 = await PdksService.importCsv(csv, actor);
        assert.deepStrictEqual([r1.created, r1.duplicates, r1.errors.length], [1, 1, 1]);
        const r2 = await PdksService.importCsv(csv, actor);
        assert.deepStrictEqual([r2.created, r2.duplicates], [0, 2]);
    });

    test('cihaz entegrasyonu: tanımlı cihaz şart; eventId tekrarı mükerrer; tanımsız kart görünür kaydedilir', async () => {
        await assert.rejects(() => PdksService.ingestFromDevice({ deviceCode: `QA-${RUN}`, events: [{}] }, 'test'), /tanımlı değil/);
        ids.device = (await PdksService.saveDevice(null, { code: `QA-${RUN}`, name: 'QA turnike', direction: 'BOTH' }, actor)).id;
        const body = { deviceCode: `QA-${RUN}`, events: [{ cardUid: uid, direction: 'IN', occurredAt: '2026-10-06T08:00:00+03:00', eventId: '1' }, { cardUid: `QA${RUN}B`, direction: 'IN', occurredAt: '2026-10-06T08:05:00+03:00', eventId: '2' }, { cardUid: uid, direction: 'X', occurredAt: '2026-10-06T08:00:00+03:00' }] };
        const r = await PdksService.ingestFromDevice(body, 'test');
        assert.deepStrictEqual([r.accepted, r.unknownCards, r.rejected.length], [2, 1, 1]);
        const again = await PdksService.ingestFromDevice(body, 'test');
        assert.deepStrictEqual([again.accepted, again.duplicates], [0, 2]);
        assert.ok((await prisma.accessDevice.findUniqueOrThrow({ where: { id: ids.device } })).lastSeenAt);
    });

    test('raporlar: Firma/Yıl/Ay zorunlu; oturum ve toplam hesaplanır; geçersiz hareket rapordan çıkar', async () => {
        await assert.rejects(() => PdksService.sessions(new URLSearchParams(`scope=${ids.ent}&year=2026`), actor), /Ay/);
        const sp = new URLSearchParams(`scope=${ids.ent}&year=2026&month=10&pageSize=100`);
        const s = await PdksService.sessions(sp, actor) as unknown as { items: { day: string; minutes: number; problem: string | null }[]; warnings: number };
        assert.deepStrictEqual(s.items.filter((x) => x.day === '2026-10-05').map((x) => x.minutes), [570]);
        assert.equal(s.warnings, 1); // 6 Ekim çıkışsız giriş
        const t = await PdksService.totals(new URLSearchParams(`scope=${ids.ent}&year=2026&month=10&type=monthly`), actor) as unknown as { items: { minutes: number }[] };
        assert.equal(t.items[0].minutes, 570);
        const e = await prisma.accessEvent.findFirstOrThrow({ where: { cardUid: uid, direction: 'OUT' } });
        await PdksService.voidEvent(e.id, 'yanlış okuma', actor);
        const s2 = await PdksService.sessions(sp, actor) as unknown as { warnings: number };
        assert.equal(s2.warnings, 2);
    });

    test('KVKK: kimlik no yoksa açılamaz; izin denetlenir', async () => {
        await assert.rejects(() => PdksService.revealIdentity(ids.card, admin, actor), /kimlik numarası yok/);
        await assert.rejects(() => PdksService.revealIdentity(ids.card, { isSuperAdmin: false, userRoles: [] } as never, actor), /yetkiniz yok/);
    });
});
