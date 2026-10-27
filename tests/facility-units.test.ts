/**
 * Alan yönetimi + kira sözleşmesi: bina → kat → bölüm → firma tahsisi → sözleşme → çıktı alanları.
 * Saf hesaplar + veritabanı akışı. Test kayıtları "qa-fac-" işaretiyle oluşturulur ve sonunda kimlikleriyle silinir.
 */
import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { occupancy, rangesOverlap, policyState, displayStatus } from '../lib/facilities/calc';
import { applyList, parseListParams } from '../lib/list/list-query';
import { buildSheet, buildPrintHtml } from '../lib/list/export';
import { FacilityUnitService, assignmentState } from '../lib/services/facility-unit-service';
import { RentContractFormService, fillTemplate, rentTotals } from '../lib/services/rent-contract-form-service';

const RUN = `qa-fac-${Date.now().toString(36)}`;
const d = (s: string) => new Date(`${s}T00:00:00Z`);
const iso = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

describe('Alan yönetimi — saf hesaplar', () => {
    test('doluluk: ortak alan ve arşiv hariç; bölüm sayısı ve m² ayrı', () => {
        const o = occupancy([
            { unitType: 'OFFICE', area: 30, occupied: true },
            { unitType: 'OFFICE', area: 20, occupied: false },
            { unitType: 'WORKSHOP', area: 50, occupied: true },
            { unitType: 'COMMON', area: 200, occupied: true },
            { unitType: 'OFFICE', area: 100, occupied: true, isArchived: true },
        ]);
        assert.deepStrictEqual(o, { rentableUnits: 3, occupiedUnits: 2, byCountPct: 66.7, rentableArea: 100, occupiedArea: 80, byAreaPct: 80 });
    });

    test('tahsis durumu: SpaceAssignment yaşam döngüsü + tarihler', () => {
        assert.equal(assignmentState('ACTIVE', d('2026-01-01'), d('2026-01-31'), '2026-01-31'), 'ACTIVE');
        assert.equal(assignmentState('ACTIVE', d('2026-01-01'), d('2026-01-31'), '2026-02-01'), 'ENDED');
        assert.equal(assignmentState('PLANNED', d('2026-03-01'), null, '2026-02-28'), 'UPCOMING');
        assert.equal(assignmentState('PLANNED', null, null, '2026-02-28'), 'UPCOMING');
        assert.equal(assignmentState('CANCELLED', d('2020-01-01'), null, '2026-02-28'), 'CANCELLED');
    });

    test('çakışma, poliçe durumu, ekran durumu', () => {
        assert.equal(rangesOverlap(d('2026-01-01'), d('2026-01-31'), d('2026-01-31'), null), true);
        assert.equal(rangesOverlap(d('2026-01-01'), d('2026-01-30'), d('2026-01-31'), null), false);
        assert.deepStrictEqual(policyState(d('2026-01-01'), d('2026-02-10'), '2026-01-11', 30), { state: 'EXPIRING', daysLeft: 30 });
        assert.equal(policyState(d('2026-01-01'), d('2026-01-10'), '2026-01-11', 30).state, 'EXPIRED');
        assert.equal(displayStatus('MAINTENANCE', true), 'OCCUPIED');
    });

    test('liste: Türkçe arama, boşlar sonda, izinsiz sıralama yok sayılır', () => {
        const rows = [{ id: '1', name: 'İstanbul Ofis', area: 30 }, { id: '2', name: 'Ankara', area: null }, { id: '3', name: 'izmir', area: 10 }];
        const opts = { search: (r: (typeof rows)[number]) => [r.name], sortValue: (r: (typeof rows)[number], k: string) => (r as Record<string, unknown>)[k] as number | null };
        assert.deepStrictEqual(applyList(rows, parseListParams(new URLSearchParams('q=istanbul')), opts).items.map((r) => r.id), ['1']);
        assert.deepStrictEqual(applyList(rows, parseListParams(new URLSearchParams('sort=area&dir=desc')), opts).items.map((r) => r.id), ['1', '3', '2']);
        assert.equal(parseListParams(new URLSearchParams('sort=password'), { sortable: ['name'] }).sort, null);
    });

    test('dışa aktarma: Excel formül enjeksiyonu temizlenir, PDF sayfası HTML kaçışlı', () => {
        const cols = [{ label: 'Ad', value: (r: { n: string }) => r.n }];
        assert.deepStrictEqual(buildSheet(cols, [{ n: '=HYPERLINK("x")' }]), [{ Ad: `'=HYPERLINK("x")` }]);
        const html = buildPrintHtml('T', cols, [{ n: '<script>alert(1)</script>' }], { generatedBy: null, filters: {} });
        assert.ok(!html.includes('<script>alert(1)</script>'));
    });

    test('kira: KDV ve toplam sunucuda hesaplanır; şablon yer tutucuları dolar, eksik bilgi görünür kalır', () => {
        assert.deepStrictEqual(rentTotals(15000, 20), { vatAmount: 3000, totalMonthlyRent: 18000 });
        assert.equal(fillTemplate('{{firmaUnvani}} aylık {{aylikKira}} {{yok}}', { firmaUnvani: { value: 'ACME A.Ş.' }, aylikKira: { value: '' } }), 'ACME A.Ş. aylık …………… {{yok}}');
    });
});

describe('Alan yönetimi — veritabanı akışı', () => {
    const ids = { building: '', floor: '', office: '', common: '', ent: '', ent2: '', assignment: '', contract: '' };
    const actor = { id: '', name: 'QA', email: 'qa@example.com' };
    let user: Parameters<typeof FacilityUnitService.list>[2];

    before(async () => {
        const admin = await prisma.user.findFirst({ where: { isSuperAdmin: true }, include: { userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
        assert.ok(admin, 'süper yönetici gerekli');
        actor.id = admin!.id;
        user = admin as never;
        ids.ent = (await prisma.entrepreneur.create({ data: { name: `${RUN} Girişim A`, slug: `${RUN}-a`, sector: 'Test', isPublished: false } })).id;
        ids.ent2 = (await prisma.entrepreneur.create({ data: { name: `${RUN} Girişim B`, slug: `${RUN}-b`, sector: 'Test', isPublished: false } })).id;
    });

    after(async () => {
        await prisma.spaceAssignment.deleteMany({ where: { entrepreneurId: { in: [ids.ent, ids.ent2] } } });
        await prisma.rentContractDocument.deleteMany({ where: { contract: { entrepreneurId: { in: [ids.ent, ids.ent2] } } } });
        await prisma.rentContract.deleteMany({ where: { entrepreneurId: { in: [ids.ent, ids.ent2] } } });
        await prisma.spaceUnit.deleteMany({ where: { floor: { buildingId: ids.building } } });
        await prisma.floor.deleteMany({ where: { buildingId: ids.building } });
        await prisma.building.deleteMany({ where: { id: ids.building } });
        await prisma.activityTimeline.deleteMany({ where: { entityId: { in: [ids.ent, ids.ent2] } } });
        await prisma.entrepreneur.deleteMany({ where: { id: { in: [ids.ent, ids.ent2] } } });
        await prisma.$disconnect();
    });

    test('bina → kat → bölüm; aynı binada mükerrer kod reddedilir; alan izin listesi uygulanır', async () => {
        const b = await FacilityUnitService.create('buildings', { name: `${RUN} Bina`, totalArea: 1000, leasableArea: 800, isArchived: true, createdById: 'hacker' }, user, actor);
        ids.building = b.id;
        assert.equal(b.isArchived, false);
        assert.equal(b.createdById, actor.id);
        await assert.rejects(() => FacilityUnitService.create('buildings', { name: `${RUN} Hatalı`, totalArea: 10, leasableArea: 20 }, user, actor), /kontrol/);
        ids.floor = (await FacilityUnitService.create('floors', { buildingId: ids.building, name: '1. Kat' }, user, actor)).id;
        ids.office = (await FacilityUnitService.create('units', { floorId: ids.floor, code: 'QA-101', unitType: 'OFFICE', area: 40 }, user, actor)).id;
        ids.common = (await FacilityUnitService.create('units', { floorId: ids.floor, code: 'QA-ORTAK', unitType: 'COMMON', area: 60 }, user, actor)).id;
        await assert.rejects(() => FacilityUnitService.create('units', { floorId: ids.floor, code: 'qa-101', unitType: 'OFFICE', area: 5 }, user, actor), /zaten/);
    });

    test('kısmi düzenleme gönderilmeyen alanı değiştirmez; eski sürümle 409', async () => {
        await FacilityUnitService.update('units', ids.common, { status: 'MAINTENANCE' }, user, actor);
        const u = await FacilityUnitService.update('units', ids.common, { notes: 'not' }, user, actor);
        assert.equal(u.status, 'MAINTENANCE');
        await FacilityUnitService.update('units', ids.common, { status: 'AVAILABLE' }, user, actor);
        await assert.rejects(() => FacilityUnitService.update('buildings', ids.building, { address: 'x', expectedUpdatedAt: new Date(0).toISOString() }, user, actor), /değiştirildi/);
    });

    test('tahsis: doluluk hesaplanır, çakışma reddedilir, ortak alan paylaşılır', async () => {
        const a = await FacilityUnitService.create('assignments', { unitId: ids.office, entrepreneurId: ids.ent, startDate: iso(-10) }, user, actor);
        ids.assignment = a.id;
        assert.equal(a.status, 'ACTIVE');
        await assert.rejects(() => FacilityUnitService.create('assignments', { unitId: ids.office, entrepreneurId: ids.ent2, startDate: iso(5) }, user, actor), /eşleştirilmiş/);
        await FacilityUnitService.create('assignments', { unitId: ids.common, entrepreneurId: ids.ent, startDate: iso(-1) }, user, actor);
        await FacilityUnitService.create('assignments', { unitId: ids.common, entrepreneurId: ids.ent2, startDate: iso(-1) }, user, actor);
        const list = await FacilityUnitService.list('buildings', new URLSearchParams(`q=${encodeURIComponent(RUN)}`), user, actor) as { items: { occupancy: { byCountPct: number; rentableArea: number } }[] };
        assert.deepStrictEqual([list.items[0].occupancy.byCountPct, list.items[0].occupancy.rentableArea], [100, 40]);
        await assert.rejects(() => FacilityUnitService.update('units', ids.office, { archived: true }, user, actor), /tahsisi var/);
    });

    test('sözleşme tahsisten oluşturulur: alanlar bölümden dolar, KDV hesaplanır, tahsise ve bölüme bağlanır', async () => {
        const pre = await RentContractFormService.prefill({ assignmentId: ids.assignment });
        assert.equal(pre.entrepreneurId, ids.ent);
        assert.equal(pre.unitId, ids.office);
        assert.ok(pre.spaceName.includes('QA-101'));
        const c = await RentContractFormService.create({ ...pre, contractNo: `${RUN}-K1`, startDate: iso(-10), endDate: iso(355), monthlyRent: 15000, vatRate: 20, dueDay: 5, totalMonthlyRent: 1 }, actor, { assignmentId: ids.assignment });
        ids.contract = c.id;
        assert.equal(c.totalMonthlyRent, 18000); // istemciden gelen toplam yok sayılır
        assert.equal(c.areaM2, 40);
        assert.equal((await prisma.spaceAssignment.findUniqueOrThrow({ where: { id: ids.assignment } })).rentContractId, c.id);
        await assert.rejects(() => RentContractFormService.create({ ...pre, contractNo: `${RUN}-K1`, startDate: iso(0), endDate: iso(10), monthlyRent: 1, vatRate: 0, dueDay: 1 }, actor), /zaten/);
        await assert.rejects(() => RentContractFormService.create({ ...pre, contractNo: `${RUN}-K2`, startDate: iso(0), endDate: iso(10), monthlyRent: 1, vatRate: 0, dueDay: 1, isWaived: true }, actor), /kontrol/);
    });

    test('sözleşme tüm alanlarıyla güncellenir; yalnız gelen alan + türevleri yazılır; çıktı alanları dolu', async () => {
        const before = await prisma.rentContract.findUniqueOrThrow({ where: { id: ids.contract } });
        const up = await RentContractFormService.update(ids.contract, { monthlyRent: 20000, contactPersonName: 'Yetkili QA', expectedUpdatedAt: before.updatedAt.toISOString() }, actor);
        assert.deepStrictEqual([up.monthlyRent, up.vatAmount, up.totalMonthlyRent, up.dueDay, up.contactPersonName], [20000, 4000, 24000, 5, 'Yetkili QA']);
        await assert.rejects(() => RentContractFormService.update(ids.contract, { notes: 'x', expectedUpdatedAt: before.updatedAt.toISOString() }, actor), /değiştirildi/);
        const out = await RentContractFormService.printFields(ids.contract);
        assert.equal(out.fields.bolum.value, 'QA-101');
        assert.equal(out.fields.yetkili.value, 'Yetkili QA');
        assert.ok(out.fields.toplamKira.value.includes('24.000'));
        // Sözleşme bağlanınca "bağlanmamış" sayısına girmez
        const rows = await FacilityUnitService.list('assignments', new URLSearchParams(`entrepreneurId=${ids.ent}`), user, actor) as { items: { unitId: string; contractNo: string | null }[] };
        assert.equal(rows.items.find((r) => r.unitId === ids.office)?.contractNo, `${RUN}-K1`);
    });

    test('sözleşmesi olmayan tahsiste firmanın mevcut sözleşmesi önerilir', async () => {
        const rows = await FacilityUnitService.list('assignments', new URLSearchParams(`entrepreneurId=${ids.ent}`), user, actor) as { items: { unitId: string; suggestedContracts: { id: string }[] }[] };
        const common = rows.items.find((r) => r.unitId === ids.common)!;
        assert.deepStrictEqual(common.suggestedContracts.map((c) => c.id), [ids.contract]);
    });

    test('tahsis sonlandırılır, arşivlenir ve geri alınır (kalıcı silme yok)', async () => {
        const ended = await FacilityUnitService.update('assignments', ids.assignment, { end: true }, user, actor);
        assert.equal(ended.status, 'ENDED');
        const others = await prisma.spaceAssignment.findMany({ where: { unitId: ids.common, entrepreneurId: ids.ent2 } });
        const arch = await FacilityUnitService.update('assignments', others[0].id, { archived: true }, user, actor);
        assert.equal(arch.status, 'CANCELLED');
        const back = await FacilityUnitService.update('assignments', others[0].id, { archived: false }, user, actor);
        assert.equal(back.status, 'ACTIVE');
    });
});
