/**
 * Entegre yerleştirme: paylaşımlı masa / ofis kapasitesi, tek kayıtla firma + şirket + tahsis + sözleşme,
 * sözleşme → tahsis senkronu, bölüm kodu → sözleşme senkronu, 15 gün yenileme uyarısı.
 * Test kayıtları "qa-pl-" işaretiyle oluşturulur ve sonunda kimlikleriyle silinir.
 */
import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { hasRoom } from '../lib/facilities/calc';
import { FacilityUnitService } from '../lib/services/facility-unit-service';
import { PlacementService } from '../lib/services/placement-service';
import { RentContractFormService } from '../lib/services/rent-contract-form-service';
import { RenewalAlertService } from '../lib/services/renewal-alert-service';

const RUN = `qa-pl-${Date.now().toString(36)}`;
const iso = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

describe('Entegre yerleştirme', () => {
    const actor = { id: '', name: 'QA', email: 'qa@example.com' };
    let user: Parameters<typeof PlacementService.place>[1];
    const ids = { building: '', floor: '', desk1: '', office: '', entA: '', entB: '', newEnt: '', org: '' };
    const desks: string[] = [];

    before(async () => {
        const admin = await prisma.user.findFirst({ where: { isSuperAdmin: true }, include: { userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
        assert.ok(admin);
        actor.id = admin!.id;
        user = admin as never;
        ids.building = (await FacilityUnitService.create('buildings', { name: `${RUN} Bina` }, user, actor)).id;
        ids.floor = (await FacilityUnitService.create('floors', { buildingId: ids.building, name: 'Zemin' }, user, actor)).id;
        ids.entA = (await prisma.entrepreneur.create({ data: { name: `${RUN} A`, slug: `${RUN}-a`, sector: 'Test', isPublished: false } })).id;
        ids.entB = (await prisma.entrepreneur.create({ data: { name: `${RUN} B`, slug: `${RUN}-b`, sector: 'Test', isPublished: false } })).id;
    });

    after(async () => {
        const ents = [ids.entA, ids.entB, ids.newEnt].filter(Boolean);
        const contracts = await prisma.rentContract.findMany({ where: { entrepreneurId: { in: ents } }, select: { id: true, contractNo: true } });
        await prisma.notification.deleteMany({ where: { targetUrl: { in: contracts.map((c) => `/admin/finans/kiralar?contract=${c.id}`) } } });
        await prisma.spaceAssignment.deleteMany({ where: { entrepreneurId: { in: ents } } });
        await prisma.rentContractDocument.deleteMany({ where: { contractId: { in: contracts.map((c) => c.id) } } });
        await prisma.rentContract.deleteMany({ where: { id: { in: contracts.map((c) => c.id) } } });
        await prisma.entrepreneurOrganization.deleteMany({ where: { entrepreneurId: { in: ents } } });
        if (ids.org) await prisma.organization.deleteMany({ where: { id: ids.org } });
        await prisma.spaceUnit.deleteMany({ where: { floorId: ids.floor } });
        await prisma.floor.deleteMany({ where: { id: ids.floor } });
        await prisma.building.deleteMany({ where: { id: ids.building } });
        await prisma.activityTimeline.deleteMany({ where: { entityId: { in: ents } } });
        await prisma.entrepreneur.deleteMany({ where: { id: { in: ents } } });
        await prisma.$disconnect();
    });

    test('kapasite kuralı (saf)', () => {
        assert.equal(hasRoom(0, 1, 'DESK'), true);
        assert.equal(hasRoom(1, 1, 'DESK'), false);
        assert.equal(hasRoom(1, 2, 'DESK'), true);
        assert.equal(hasRoom(99, 1, 'COMMON'), true);
    });

    test('toplu masa ekleme: 30 masa, var olan kodlar atlanır', async () => {
        const r1 = await FacilityUnitService.bulkCreateUnits({ floorId: ids.floor, prefix: 'QM-', startNo: 1, count: 30, digits: 2, unitType: 'DESK', area: 4 }, actor);
        assert.equal(r1.created.length, 30);
        assert.equal(r1.created[0], 'QM-01');
        const r2 = await FacilityUnitService.bulkCreateUnits({ floorId: ids.floor, prefix: 'QM-', startNo: 29, count: 4, digits: 2, unitType: 'DESK', area: 4 }, actor);
        assert.deepStrictEqual([r2.created, r2.skipped], [['QM-31', 'QM-32'], ['QM-29', 'QM-30']]);
        const all = await prisma.spaceUnit.findMany({ where: { floorId: ids.floor, code: { in: ['QM-01', 'QM-02', 'QM-03'] } }, orderBy: { code: 'asc' } });
        desks.push(...all.map((u) => u.id));
        ids.desk1 = desks[0];
        ids.office = (await FacilityUnitService.create('units', { floorId: ids.floor, code: 'QO-1', unitType: 'OFFICE', area: 20, maxTenants: 2 }, user, actor)).id;
    });

    test('paylaşım: kapasite 1 olan masa ikinci firmaya verilemez; kapasite 2 olan ofis 2 firmaya verilir, 3. reddedilir; aynı masa no çakışmaz', async () => {
        await FacilityUnitService.create('assignments', { unitId: ids.desk1, entrepreneurId: ids.entA, startDate: iso(-5) }, user, actor);
        await assert.rejects(() => FacilityUnitService.create('assignments', { unitId: ids.desk1, entrepreneurId: ids.entB, startDate: iso(0) }, user, actor), /kapasitesini artırın/);
        await assert.rejects(() => FacilityUnitService.create('assignments', { unitId: ids.desk1, entrepreneurId: ids.entA, startDate: iso(0) }, user, actor), /zaten tahsisli/);
        await FacilityUnitService.update('units', ids.desk1, { maxTenants: 2 }, user, actor);
        await FacilityUnitService.create('assignments', { unitId: ids.desk1, entrepreneurId: ids.entB, startDate: iso(0) }, user, actor);
        await FacilityUnitService.create('assignments', { unitId: ids.office, entrepreneurId: ids.entA, unitLabel: 'Masa 1', startDate: iso(-1) }, user, actor);
        await assert.rejects(() => FacilityUnitService.create('assignments', { unitId: ids.office, entrepreneurId: ids.entB, unitLabel: 'masa 1', startDate: iso(-1) }, user, actor), /numarası/);
        await FacilityUnitService.create('assignments', { unitId: ids.office, entrepreneurId: ids.entB, unitLabel: 'Masa 2', startDate: iso(-1) }, user, actor);
        const list = await FacilityUnitService.list('units', new URLSearchParams(`buildingId=${ids.building}&q=QO-1`), user, actor) as unknown as { items: { displayStatus: string; tenants: number; firmNames: string }[] };
        assert.equal(list.items[0].displayStatus, 'OCCUPIED');
        assert.equal(list.items[0].tenants, 2);
        assert.ok(list.items[0].firmNames.includes('(Masa 2)'));
    });

    test('tek kayıtla yerleştirme: yeni firma + şirket + 2 masa + sözleşme; ön denetim hatasında hiçbir kayıt yazılmaz', async () => {
        const base = {
            newFirm: { name: `${RUN} Yeni Firma`, sector: 'Yazılım', email: 'yeni@example.com' },
            company: { legalName: `${RUN} Yeni Firma A.Ş.`, taxNumber: '1234567890', taxOffice: 'Kadıköy' },
            startDate: iso(-2), endDate: iso(363),
            contract: { contractNo: `${RUN}-S1`, monthlyRent: 5000, vatRate: 20, dueDay: 5, contactPersonName: 'Yetkili' },
        };
        // QM-01 kapasitesi dolu (2/2) → reddedilir, firma oluşmaz
        await assert.rejects(() => PlacementService.place({ ...base, units: [{ unitId: desks[1] }, { unitId: ids.desk1 }] }, user, actor), /2\. bölüm/);
        assert.equal(await prisma.entrepreneur.count({ where: { name: base.newFirm.name } }), 0);
        const r = await PlacementService.place({ ...base, units: [{ unitId: desks[1], unitLabel: 'M-2' }, { unitId: desks[2] }] }, user, actor);
        ids.newEnt = r.entrepreneurId;
        ids.org = r.organizationId!;
        const org = await prisma.organization.findUniqueOrThrow({ where: { id: ids.org } });
        assert.deepStrictEqual([org.legalName, org.taxNumber, org.taxOffice], [`${RUN} Yeni Firma A.Ş.`, '1234567890', 'Kadıköy']);
        const c = await prisma.rentContract.findUniqueOrThrow({ where: { id: r.contractId! } });
        assert.equal(c.organizationId, ids.org);
        assert.equal(c.areaM2, 8);
        assert.equal(c.spaceType, 'SHARED_DESK');
        assert.equal(c.totalMonthlyRent, 6000);
        const links = await prisma.spaceAssignment.findMany({ where: { entrepreneurId: ids.newEnt } });
        assert.equal(links.length, 2);
        assert.ok(links.every((a) => a.rentContractId === c.id && a.status === 'ACTIVE'));
        const ov = await PlacementService.overview(ids.newEnt, user);
        assert.equal(ov.assignments.length, 2);
        assert.equal(ov.contracts?.[0].contractNo, `${RUN}-S1`);
    });

    test('sözleşme → tahsis senkronu: bitiş tarihi yansır; fesihte tahsisler sonlanır', async () => {
        const c = await prisma.rentContract.findFirstOrThrow({ where: { entrepreneurId: ids.newEnt } });
        await RentContractFormService.update(c.id, { endDate: iso(500) }, actor);
        const after1 = await prisma.spaceAssignment.findMany({ where: { rentContractId: c.id } });
        assert.ok(after1.every((a) => a.endDate?.toISOString().slice(0, 10) === iso(500)));
        await RentContractFormService.update(c.id, { status: 'TERMINATED' }, actor);
        const after2 = await prisma.spaceAssignment.findMany({ where: { rentContractId: c.id } });
        assert.ok(after2.every((a) => a.status === 'ENDED'));
    });

    test('bölüm kodu değişince sözleşmenin alan adı da güncellenir', async () => {
        const c = await prisma.rentContract.findFirstOrThrow({ where: { entrepreneurId: ids.newEnt } });
        await FacilityUnitService.update('units', desks[1], { code: 'QM-02B' }, user, actor);
        const c2 = await prisma.rentContract.findUniqueOrThrow({ where: { id: c.id } });
        assert.ok(c2.spaceName.includes('QM-02B') && !c2.spaceName.includes('QM-02 '));
    });

    test('15 gün kala kritik uyarı + bildirim (idempotent)', async () => {
        const c = await RentContractFormService.create({ entrepreneurId: ids.entA, spaceName: 'QA alan', contractNo: `${RUN}-S2`, startDate: iso(-300), endDate: iso(10), monthlyRent: 1, vatRate: 0, dueDay: 1 }, actor);
        const scan = await RenewalAlertService.scan();
        assert.equal(scan.criticalDays >= 1, true);
        assert.ok(scan.critical.some((x) => x.id === c.id && x.daysLeft <= scan.criticalDays));
        await RenewalAlertService.notify();
        await RenewalAlertService.notify();
        assert.equal(await prisma.notification.count({ where: { targetUrl: `/admin/finans/kiralar?contract=${c.id}` } }), 1);
    });
});
