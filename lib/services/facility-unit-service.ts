import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { addTimelineEvent } from '@/lib/timeline';
import { hasPermission } from '@/lib/rbac';
import { DomainError } from '@/lib/errors';
import { fieldError, parseOrThrow, type Actor } from '@/lib/validate';
import { ParameterService } from '@/lib/services/parameter-service';
import { applyList, parseListParams, type ListParams } from '@/lib/list/list-query';
import { exportList, parseExportFormat, type ExportColumn } from '@/lib/list/export';
import {
    UNIT_TYPES, UNIT_TYPE_LABELS, UNIT_STATUSES, UNIT_STATUS_LABELS, POLICY_STATE_LABELS,
    policyState, rangesOverlap, displayStatus, hasRoom, occupancy, todayKey, dayKey, type PolicyState,
} from '@/lib/facilities/calc';

/**
 * Alan yönetimi: bina → kat → bağımsız bölüm, firma–bölüm tahsisi ve poliçeler.
 * Tahsis = mevcut SpaceAssignment kaydı (unitId ile). Kira = mevcut RentContract (unitId ile).
 * "Dolu" durumu aktif tahsisten hesaplanır. Kalıcı silme yok: arşivle / geri al (tahsiste İptal).
 */

export const FACILITY_KINDS = ['buildings', 'floors', 'units', 'assignments', 'policies', 'leased'] as const;
export type FacilityKind = (typeof FACILITY_KINDS)[number];
export type WritableKind = Exclude<FacilityKind, 'leased'>;

export function parseKind(v: string, writable = false): FacilityKind {
    if (!(FACILITY_KINDS as readonly string[]).includes(v) || (writable && v === 'leased')) throw new DomainError('Bulunamadı.', 404);
    return v as FacilityKind;
}

type UserLike = Parameters<typeof hasPermission>[0];
const canSeeRent = (user: UserLike) => hasPermission(user, 'view', 'rent');

// ─── Tahsis durumu ───────────────────────────────────────────────────────────

export type AssignmentState = 'ACTIVE' | 'UPCOMING' | 'ENDED' | 'CANCELLED';
export const ASSIGNMENT_STATE_LABELS: Record<AssignmentState, string> = { ACTIVE: 'Aktif', UPCOMING: 'Başlamadı', ENDED: 'Sona erdi', CANCELLED: 'İptal (arşiv)' };

/** SpaceAssignment yaşam döngüsü (PLANNED/ACTIVE/ENDED/CANCELLED) + tarihlerden bugünkü durum. */
export function assignmentState(status: string, start: Date | null, end: Date | null, today: string): AssignmentState {
    if (status === 'CANCELLED') return 'CANCELLED';
    if (status === 'ENDED') return 'ENDED';
    if (!start || dayKey(start, true) > today) return 'UPCOMING';
    if (end && dayKey(end, true) < today) return 'ENDED';
    return 'ACTIVE';
}
const LIVE = ['PLANNED', 'ACTIVE'];
const statusFor = (start: Date, today: string) => (dayKey(start, true) <= today ? 'ACTIVE' : 'PLANNED');

// ─── Doğrulama şemaları (alan izin listesi) ──────────────────────────────────

// Boş metin = alanı temizle (null); alan hiç gönderilmezse değişmez.
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optStr = (max = 2000) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional());
const optNum = (schema: z.ZodNumber) => z.preprocess(blankToNull, z.coerce.number().pipe(schema).nullable().optional());
const nullableDate = z.preprocess(blankToNull, z.coerce.date().nullable().optional());
const uuid = z.string().uuid('Geçerli bir kayıt seçin');
const optUuid = z.preprocess(blankToNull, uuid.nullable().optional());
const urlOrPath = z.preprocess(blankToNull, z.string().trim().max(1000).refine((s) => /^https?:\/\//i.test(s) || s.startsWith('/'), 'http(s):// ile veya / ile başlamalı').nullable().optional());
const area = z.number().finite().min(0).max(1e7);

const buildingSchema = z.object({ name: z.string().trim().min(2, 'En az 2 karakter').max(200), address: optStr(500), totalArea: optNum(area), leasableArea: optNum(area), notes: optStr() });
const floorSchema = z.object({ buildingId: uuid, name: z.string().trim().min(1, 'Kat adı gerekli').max(100), sortOrder: z.coerce.number().int().min(-50).max(500), planImageUrl: urlOrPath, notes: optStr() });
const unitSchema = z.object({
    floorId: uuid, code: z.string().trim().min(1, 'Kod gerekli').max(40), unitType: z.enum(UNIT_TYPES),
    area: z.coerce.number().pipe(area.refine((n) => n > 0, 'm² sıfırdan büyük olmalı')), capacity: optNum(z.number().int().min(0).max(10000)),
    status: z.enum(UNIT_STATUSES), notes: optStr(),
    maxTenants: z.coerce.number().int().min(1, 'En az 1').max(50),
});
const assignmentSchema = z.object({
    unitId: uuid, entrepreneurId: optUuid, organizationId: optUuid, rentContractId: optUuid, unitLabel: optStr(60),
    startDate: z.coerce.date({ message: 'Başlangıç tarihi gerekli' }), endDate: nullableDate, notes: optStr(),
});
const policySchema = z.object({
    buildingId: optUuid, unitId: optUuid, policyType: z.string().trim().min(1, 'Poliçe türü seçin').max(64), coverage: optStr(),
    insurer: z.string().trim().min(2, 'Sigorta şirketi gerekli').max(200), policyNo: z.string().trim().min(1, 'Poliçe no gerekli').max(100),
    startDate: z.coerce.date({ message: 'Başlangıç tarihi gerekli' }), endDate: z.coerce.date({ message: 'Bitiş tarihi gerekli' }),
    premium: optNum(z.number().finite().min(0).max(1e12)), currency: z.string().trim().length(3), documentUrl: urlOrPath, notes: optStr(),
});

const bulkSchema = z.object({
    floorId: uuid,
    prefix: z.string().trim().min(1, 'Önek gerekli').max(20),
    startNo: z.coerce.number().int().min(0).max(9999),
    count: z.coerce.number().int().min(1, 'En az 1').max(200, 'En fazla 200'),
    digits: z.coerce.number().int().min(1).max(4).default(2),
    unitType: z.enum(UNIT_TYPES),
    area: z.coerce.number().pipe(area.refine((n) => n > 0, 'm² sıfırdan büyük olmalı')),
    capacity: optNum(z.number().int().min(0).max(10000)),
    maxTenants: z.coerce.number().int().min(1).max(50).default(1),
});

// Varsayılanlar yalnız oluşturmada: Zod 4'te .partial() varsayılanı yine uygular (gönderilmeyen alan değişmemeli).
const SCHEMAS = {
    buildings: buildingSchema,
    floors: floorSchema.extend({ sortOrder: floorSchema.shape.sortOrder.default(0) }),
    units: unitSchema.extend({ status: unitSchema.shape.status.default('AVAILABLE'), maxTenants: unitSchema.shape.maxTenants.default(1) }),
    assignments: assignmentSchema,
    policies: policySchema.extend({ currency: policySchema.shape.currency.default('TRY') }),
} as const;
const UPDATE_SCHEMAS = {
    buildings: buildingSchema.partial(),
    floors: floorSchema.omit({ buildingId: true }).partial(), // kat başka binaya taşınmaz
    units: unitSchema.partial(),
    assignments: assignmentSchema.partial(),
    policies: policySchema.partial(),
} as const;

const ENTITY: Record<WritableKind, { model: string; label: string }> = {
    buildings: { model: 'Building', label: 'Bina' },
    floors: { model: 'Floor', label: 'Kat' },
    units: { model: 'SpaceUnit', label: 'Bağımsız bölüm' },
    assignments: { model: 'SpaceAssignment', label: 'Tahsis' },
    policies: { model: 'InsurancePolicy', label: 'Poliçe' },
};

// Prisma delegeleri ortak arayüze sahip değil; yalnız aşağıdaki çağrılar kullanılır.
type Delegate = { findUnique: (a: unknown) => Promise<any>; updateMany: (a: unknown) => Promise<{ count: number }>; update: (a: unknown) => Promise<any>; create: (a: unknown) => Promise<any> };
const delegate = (kind: WritableKind): Delegate =>
    ({ buildings: prisma.building, floors: prisma.floor, units: prisma.spaceUnit, assignments: prisma.spaceAssignment, policies: prisma.insurancePolicy } as unknown as Record<WritableKind, Delegate>)[kind];

async function audit(actor: Actor, action: string, entityType: string, entityId: string, newValues?: Record<string, unknown>, oldValues?: Record<string, unknown>) {
    await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action, entityType, entityId, newValues: newValues ?? null, oldValues: oldValues ?? null });
}

// ─── Satır modelleri (hesaplanan alanlarla) ─────────────────────────────────

async function loadUnits(includeArchived: boolean) {
    return prisma.spaceUnit.findMany({
        where: includeArchived ? {} : { isArchived: false },
        include: {
            floor: { select: { id: true, name: true, sortOrder: true, isArchived: true, building: { select: { id: true, name: true, isArchived: true } } } },
            spaceAssignments: { where: { status: { in: LIVE } }, select: { id: true, status: true, startDate: true, endDate: true, unitLabel: true, entrepreneur: { select: { id: true, name: true } }, organization: { select: { id: true, name: true } } } },
        },
    });
}

function unitRow(u: Awaited<ReturnType<typeof loadUnits>>[number], today: string) {
    const active = u.spaceAssignments.filter((a) => assignmentState(a.status, a.startDate, a.endDate, today) === 'ACTIVE');
    const firms = active.map((a) => a.entrepreneur ? { id: a.entrepreneur.id, name: a.entrepreneur.name, kind: 'entrepreneur' as const, label: a.unitLabel } : a.organization ? { id: a.organization.id, name: a.organization.name, kind: 'organization' as const, label: a.unitLabel } : null).filter(Boolean) as { id: string; name: string; kind: 'entrepreneur' | 'organization'; label: string | null }[];
    const ds = displayStatus(u.status, active.length, u.maxTenants, u.unitType);
    return {
        id: u.id, code: u.code, unitType: u.unitType, unitTypeLabel: UNIT_TYPE_LABELS[u.unitType] ?? u.unitType,
        area: u.area, capacity: u.capacity, status: u.status, notes: u.notes, isArchived: u.isArchived, updatedAt: u.updatedAt,
        floorId: u.floor.id, floorName: u.floor.name, floorSort: u.floor.sortOrder, buildingId: u.floor.building.id, buildingName: u.floor.building.name,
        displayStatus: ds, displayStatusLabel: ds === 'PARTIAL' && u.unitType !== 'COMMON' ? `Paylaşımlı — ${active.length}/${u.maxTenants}` : UNIT_STATUS_LABELS[ds],
        maxTenants: u.maxTenants, tenants: active.length, freeSlots: u.unitType === 'COMMON' ? null : Math.max(0, u.maxTenants - active.length),
        currentFirm: firms[0] ?? null, firms, firmCount: firms.length, firmNames: firms.map((f) => (f.label ? `${f.name} (${f.label})` : f.name)).join(', '),
        currentAssignmentEnd: active[0]?.endDate ?? null,
    };
}
export type UnitRow = ReturnType<typeof unitRow>;
const occOf = (rows: UnitRow[]) => occupancy(rows.map((u) => ({ unitType: u.unitType, area: u.area, occupied: u.tenants > 0 })));

async function buildingRows(p: ListParams, today: string) {
    const [buildings, units] = await Promise.all([
        prisma.building.findMany({ where: p.includeArchived ? {} : { isArchived: false }, include: { floors: { where: { isArchived: false }, select: { id: true } } } }),
        loadUnits(false),
    ]);
    const rows = units.map((u) => unitRow(u, today));
    return buildings.map((b) => {
        const mine = rows.filter((u) => u.buildingId === b.id);
        return { id: b.id, name: b.name, address: b.address, totalArea: b.totalArea, leasableArea: b.leasableArea, notes: b.notes, isArchived: b.isArchived, updatedAt: b.updatedAt, floorCount: b.floors.length, unitCount: mine.length, occupancy: occOf(mine) };
    });
}

async function floorRows(p: ListParams, today: string) {
    const [floors, units] = await Promise.all([
        prisma.floor.findMany({ where: { ...(p.includeArchived ? {} : { isArchived: false }), ...(p.filters.buildingId ? { buildingId: p.filters.buildingId } : {}) }, include: { building: { select: { id: true, name: true } } } }),
        loadUnits(false),
    ]);
    const rows = units.map((u) => unitRow(u, today));
    return floors.map((f) => {
        const mine = rows.filter((u) => u.floorId === f.id);
        return { id: f.id, name: f.name, sortOrder: f.sortOrder, planImageUrl: f.planImageUrl, notes: f.notes, isArchived: f.isArchived, updatedAt: f.updatedAt, buildingId: f.building.id, buildingName: f.building.name, unitCount: mine.length, occupancy: occOf(mine) };
    });
}

async function unitRows(p: ListParams, today: string) {
    const f = p.filters;
    return (await loadUnits(p.includeArchived))
        .map((u) => unitRow(u, today))
        .filter((u) => (!f.buildingId || u.buildingId === f.buildingId) && (!f.floorId || u.floorId === f.floorId) && (!f.unitType || u.unitType === f.unitType) && (!f.status || u.displayStatus === f.status || (f.status === 'HAS_ROOM' && u.unitType !== 'COMMON' && u.status === 'AVAILABLE' && (u.freeSlots ?? 0) > 0)));
}

async function assignmentRows(p: ListParams, today: string, user: UserLike) {
    const f = p.filters;
    const rent = canSeeRent(user);
    const rows = await prisma.spaceAssignment.findMany({
        where: {
            unitId: { not: null },
            ...(p.includeArchived ? {} : { status: { not: 'CANCELLED' } }),
            ...(f.entrepreneurId ? { entrepreneurId: f.entrepreneurId } : {}),
            ...(f.buildingId ? { unit: { floor: { buildingId: f.buildingId } } } : {}),
        },
        include: {
            unit: { select: { id: true, code: true, area: true, unitType: true, floor: { select: { name: true, building: { select: { id: true, name: true } } } } } },
            entrepreneur: { select: { id: true, name: true } },
            organization: { select: { id: true, name: true } },
            rentContract: { select: { id: true, contractNo: true, monthlyRent: true, totalMonthlyRent: true, currency: true, endDate: true, status: true } },
        },
    });
    // Sözleşme bağlanmamış tahsisler için firmanın mevcut sözleşmeleri önerilir
    const entIds = [...new Set(rows.filter((a) => !a.rentContractId && a.entrepreneurId).map((a) => a.entrepreneurId!))];
    const candidates = rent && entIds.length
        ? await prisma.rentContract.findMany({ where: { entrepreneurId: { in: entIds }, status: { in: ['ACTIVE', 'WAIVED', 'SUSPENDED'] } }, select: { id: true, contractNo: true, entrepreneurId: true, spaceName: true, unitId: true }, orderBy: { startDate: 'desc' } })
        : [];
    const year = f.year;
    return rows
        .map((a) => {
            const state = assignmentState(a.status, a.startDate, a.endDate, today);
            const firm = a.entrepreneur ?? a.organization;
            const suggestions = a.rentContractId ? [] : candidates.filter((c) => c.entrepreneurId === a.entrepreneurId).sort((x, y) => Number(y.unitId === a.unitId) - Number(x.unitId === a.unitId));
            return {
                id: a.id, unitId: a.unit!.id, unitCode: a.unit!.code, unitLabel: a.unitLabel, unitArea: a.unit!.area, unitTypeLabel: UNIT_TYPE_LABELS[a.unit!.unitType] ?? a.unit!.unitType,
                floorName: a.unit!.floor.name, buildingId: a.unit!.floor.building.id, buildingName: a.unit!.floor.building.name,
                entrepreneurId: a.entrepreneurId, organizationId: a.organizationId, firmName: firm?.name ?? '—', firmHref: a.entrepreneurId ? `/admin/girisimciler/${a.entrepreneurId}` : a.organizationId ? `/admin/rehber/sirket/${a.organizationId}` : null,
                startDate: a.startDate, endDate: a.endDate, status: a.status, state, stateLabel: ASSIGNMENT_STATE_LABELS[state], notes: a.notes,
                isArchived: a.status === 'CANCELLED', updatedAt: a.updatedAt,
                // Kira bilgisi yalnız kira görme yetkisi olana döner
                rentContractId: rent ? a.rentContractId : null,
                contractNo: rent ? a.rentContract?.contractNo ?? null : null,
                contractStatus: rent ? a.rentContract?.status ?? null : null,
                monthlyRent: rent && a.rentContract ? a.rentContract.monthlyRent : null,
                totalMonthlyRent: rent && a.rentContract ? a.rentContract.totalMonthlyRent : null,
                currency: rent ? a.rentContract?.currency ?? null : null,
                contractEnd: rent ? a.rentContract?.endDate ?? null : null,
                hasRentContract: Boolean(a.rentContractId),
                suggestedContracts: rent ? suggestions.map((c) => ({ id: c.id, contractNo: c.contractNo, spaceName: c.spaceName })) : [],
            };
        })
        .filter((a) => (!f.state || a.state === f.state) && (!year || (dayKey(a.startDate ?? new Date(0), true).slice(0, 4) <= year && (!a.endDate || dayKey(a.endDate, true).slice(0, 4) >= year))));
}

async function policyRows(p: ListParams, today: string) {
    const f = p.filters;
    const [warn, types, rows] = await Promise.all([
        ParameterService.getNumber('ALERTS', 'expiry_warning_days'),
        prisma.systemParameter.findMany({ where: { category: 'POLICY_TYPE' }, select: { key: true, label: true } }),
        prisma.insurancePolicy.findMany({
            where: { ...(p.includeArchived ? {} : { isArchived: false }), ...(f.policyType ? { policyType: f.policyType } : {}) },
            include: { building: { select: { id: true, name: true } }, unit: { select: { id: true, code: true, floor: { select: { name: true, building: { select: { id: true, name: true } } } } } } },
        }),
    ]);
    const typeLabel = new Map(types.map((t) => [t.key, t.label]));
    return rows
        .map((r) => {
            const ps = policyState(r.startDate, r.endDate, today, warn.value);
            const bId = r.building?.id ?? r.unit?.floor.building.id ?? null;
            const bName = r.building?.name ?? r.unit?.floor.building.name ?? null;
            return {
                id: r.id, buildingId: r.buildingId, unitId: r.unitId, targetBuildingId: bId, buildingName: bName, unitCode: r.unit?.code ?? null,
                targetLabel: r.unit ? `${bName} · ${r.unit.floor.name} · ${r.unit.code}` : bName ?? '—',
                policyType: r.policyType, policyTypeLabel: typeLabel.get(r.policyType) ?? r.policyType,
                coverage: r.coverage, insurer: r.insurer, policyNo: r.policyNo, startDate: r.startDate, endDate: r.endDate,
                daysLeft: ps.daysLeft, state: ps.state as PolicyState, stateLabel: POLICY_STATE_LABELS[ps.state],
                premium: r.premium, currency: r.currency, documentUrl: r.documentUrl, notes: r.notes, isArchived: r.isArchived, updatedAt: r.updatedAt,
            };
        })
        .filter((r) => (!f.buildingId || r.targetBuildingId === f.buildingId) && (!f.state || r.state === f.state) && (!f.year || dayKey(r.endDate, true).startsWith(f.year)));
}

/** Kiralanan alan bilgileri: bugün aktif tahsisi olan firmalar bazında toplam. */
async function leasedRows(p: ListParams, today: string, user: UserLike) {
    const active = await assignmentRows({ ...p, includeArchived: false, filters: { ...p.filters, state: 'ACTIVE' } }, today, user);
    const rent = canSeeRent(user);
    const byFirm = new Map<string, typeof active>();
    for (const a of active) {
        const key = a.entrepreneurId ?? a.organizationId ?? a.id;
        byFirm.set(key, [...(byFirm.get(key) ?? []), a]);
    }
    return [...byFirm.entries()].map(([key, list]) => {
        const contracts = new Map(list.filter((a) => a.contractNo).map((a) => [a.contractNo!, a]));
        const ends = list.map((a) => a.endDate).filter((d): d is Date => Boolean(d)).sort((x, y) => +x - +y);
        return {
            id: key, entrepreneurId: list[0].entrepreneurId, firmName: list[0].firmName, firmHref: list[0].firmHref,
            units: list.map((a) => `${a.buildingName} / ${a.unitCode}`).join(', '), unitCount: list.length,
            totalArea: Math.round(list.reduce((s, a) => s + a.unitArea, 0) * 100) / 100,
            contracts: [...contracts.keys()].join(', ') || null,
            monthlyRent: rent && contracts.size ? [...contracts.values()].reduce((s, a) => s + (a.monthlyRent ?? 0), 0) : null,
            withoutContract: list.filter((a) => !a.hasRentContract).length,
            nearestEnd: ends[0] ?? null,
        };
    });
}

// ─── Liste yapılandırması ────────────────────────────────────────────────────

type AnyRow = Record<string, any>;
type ListConfig = {
    title: string; entityType: string; filterKeys: string[];
    search: (r: AnyRow) => Array<string | null | undefined>;
    defaultSort: { key: string; dir: 'asc' | 'desc' };
    columns: (rent: boolean) => (ExportColumn<AnyRow> & { key: string })[];
    rows: (p: ListParams, today: string, user: UserLike) => Promise<AnyRow[]>;
};

const fmtD = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleDateString('tr-TR', { timeZone: 'UTC' }) : '');
const pct = (n: number | null) => (n === null ? '' : `%${n}`);

const CONFIG: Record<FacilityKind, ListConfig> = {
    buildings: {
        title: 'Alan - Bina Detay', entityType: 'Building', filterKeys: [],
        search: (r) => [r.name, r.address], defaultSort: { key: 'name', dir: 'asc' },
        columns: () => [
            { key: 'name', label: 'Bina / alan', value: (r) => r.name },
            { key: 'address', label: 'Adres', value: (r) => r.address },
            { key: 'totalArea', label: 'Toplam m²', value: (r) => r.totalArea },
            { key: 'leasableArea', label: 'Kiralanabilir m²', value: (r) => r.leasableArea },
            { key: 'floorCount', label: 'Kat', value: (r) => r.floorCount },
            { key: 'unitCount', label: 'Bölüm', value: (r) => r.unitCount },
            { key: 'byCountPct', label: 'Doluluk (bölüm)', value: (r) => pct(r.occupancy.byCountPct) },
            { key: 'byAreaPct', label: 'Doluluk (m²)', value: (r) => pct(r.occupancy.byAreaPct) },
        ],
        rows: (p, t) => buildingRows(p, t),
    },
    floors: {
        title: 'Bina Kat Bilgileri', entityType: 'Floor', filterKeys: ['buildingId'],
        search: (r) => [r.name, r.buildingName], defaultSort: { key: 'buildingName', dir: 'asc' },
        columns: () => [
            { key: 'buildingName', label: 'Bina', value: (r) => r.buildingName },
            { key: 'name', label: 'Kat', value: (r) => r.name },
            { key: 'sortOrder', label: 'Sıra', value: (r) => r.sortOrder },
            { key: 'unitCount', label: 'Bölüm', value: (r) => r.unitCount },
            { key: 'rentableArea', label: 'Kiralanabilir bölüm m²', value: (r) => r.occupancy.rentableArea },
            { key: 'byAreaPct', label: 'Doluluk (m²)', value: (r) => pct(r.occupancy.byAreaPct) },
            { key: 'planImageUrl', label: 'Kat planı', value: (r) => (r.planImageUrl ? 'Var' : 'Yok') },
        ],
        rows: (p, t) => floorRows(p, t),
    },
    units: {
        title: 'Bina Bağımsız Bölüm Yönetimi', entityType: 'SpaceUnit', filterKeys: ['buildingId', 'floorId', 'unitType', 'status'],
        search: (r) => [r.code, r.buildingName, r.floorName, r.firmNames, r.notes], defaultSort: { key: 'code', dir: 'asc' },
        columns: () => [
            { key: 'buildingName', label: 'Bina', value: (r) => r.buildingName },
            { key: 'floorName', label: 'Kat', value: (r) => r.floorName },
            { key: 'code', label: 'Bölüm kodu', value: (r) => r.code },
            { key: 'unitType', label: 'Tür', value: (r) => r.unitTypeLabel },
            { key: 'area', label: 'm²', value: (r) => r.area },
            { key: 'capacity', label: 'Kapasite', value: (r) => r.capacity },
            { key: 'displayStatus', label: 'Durum', value: (r) => r.displayStatusLabel },
            { key: 'currentFirm', label: 'Firma', value: (r) => r.firmNames },
            { key: 'currentAssignmentEnd', label: 'Tahsis bitişi', value: (r) => fmtD(r.currentAssignmentEnd) },
        ],
        rows: (p, t) => unitRows(p, t),
    },
    assignments: {
        title: 'Firma - Bağımsız Bölüm Eşleştirme', entityType: 'SpaceAssignment', filterKeys: ['buildingId', 'entrepreneurId', 'state', 'year'],
        search: (r) => [r.firmName, r.unitCode, r.buildingName, r.contractNo, r.notes], defaultSort: { key: 'startDate', dir: 'desc' },
        columns: (rent) => [
            { key: 'firmName', label: 'Firma', value: (r) => r.firmName },
            { key: 'buildingName', label: 'Bina', value: (r) => r.buildingName },
            { key: 'floorName', label: 'Kat', value: (r) => r.floorName },
            { key: 'unitCode', label: 'Bölüm', value: (r) => r.unitCode },
            { key: 'unitLabel', label: 'Masa / yer no', value: (r) => r.unitLabel },
            { key: 'unitArea', label: 'm²', value: (r) => r.unitArea },
            { key: 'startDate', label: 'Başlangıç', value: (r) => fmtD(r.startDate) },
            { key: 'endDate', label: 'Bitiş', value: (r) => fmtD(r.endDate) },
            { key: 'state', label: 'Durum', value: (r) => r.stateLabel },
            ...(rent ? [
                { key: 'contractNo', label: 'Kira sözleşmesi', value: (r: AnyRow) => r.contractNo ?? (r.suggestedContracts.length ? `Bağlanmamış (öneri: ${r.suggestedContracts.map((c: { contractNo: string }) => c.contractNo).join(', ')})` : 'Bağlanmamış') },
                { key: 'monthlyRent', label: 'Aylık kira (KDV hariç)', value: (r: AnyRow) => r.monthlyRent },
            ] : []),
        ],
        rows: (p, t, u) => assignmentRows(p, t, u),
    },
    policies: {
        title: 'Tüm Poliçeler', entityType: 'InsurancePolicy', filterKeys: ['buildingId', 'policyType', 'state', 'year'],
        search: (r) => [r.policyNo, r.insurer, r.targetLabel, r.policyTypeLabel, r.coverage], defaultSort: { key: 'endDate', dir: 'asc' },
        columns: () => [
            { key: 'targetLabel', label: 'Bina / bölüm', value: (r) => r.targetLabel },
            { key: 'policyType', label: 'Tür', value: (r) => r.policyTypeLabel },
            { key: 'coverage', label: 'Kapsam', value: (r) => r.coverage },
            { key: 'insurer', label: 'Sigorta şirketi', value: (r) => r.insurer },
            { key: 'policyNo', label: 'Poliçe no', value: (r) => r.policyNo },
            { key: 'startDate', label: 'Başlangıç', value: (r) => fmtD(r.startDate) },
            { key: 'endDate', label: 'Bitiş', value: (r) => fmtD(r.endDate) },
            { key: 'daysLeft', label: 'Kalan gün', value: (r) => r.daysLeft },
            { key: 'state', label: 'Durum', value: (r) => r.stateLabel },
            { key: 'premium', label: 'Prim', value: (r) => r.premium },
        ],
        rows: (p, t) => policyRows(p, t),
    },
    leased: {
        title: 'Kiralanan Alan Bilgileri', entityType: 'SpaceAssignment', filterKeys: ['buildingId'],
        search: (r) => [r.firmName, r.units, r.contracts], defaultSort: { key: 'firmName', dir: 'asc' },
        columns: (rent) => [
            { key: 'firmName', label: 'Firma', value: (r) => r.firmName },
            { key: 'units', label: 'Bölümler', value: (r) => r.units },
            { key: 'unitCount', label: 'Bölüm sayısı', value: (r) => r.unitCount },
            { key: 'totalArea', label: 'Toplam m²', value: (r) => r.totalArea },
            { key: 'nearestEnd', label: 'En yakın bitiş', value: (r) => fmtD(r.nearestEnd) },
            ...(rent ? [
                { key: 'contracts', label: 'Kira sözleşmeleri', value: (r: AnyRow) => r.contracts },
                { key: 'monthlyRent', label: 'Aylık kira toplamı (KDV hariç)', value: (r: AnyRow) => r.monthlyRent },
            ] : []),
        ],
        rows: (p, t, u) => leasedRows(p, t, u),
    },
};

function sortValue(r: AnyRow, key: string) {
    if (key === 'byCountPct' || key === 'byAreaPct' || key === 'rentableArea') return r.occupancy?.[key];
    if (key === 'currentFirm') return r.firmNames;
    if (key === 'policyType') return r.policyTypeLabel;
    if (key === 'unitType') return r.unitTypeLabel;
    if (key === 'displayStatus') return r.displayStatusLabel;
    if (key === 'state') return r.stateLabel;
    if (key === 'floorName' && 'floorSort' in r) return r.floorSort;
    return r[key];
}

// ─── Servis ──────────────────────────────────────────────────────────────────

export class FacilityUnitService {
    /** Liste (sayfalı) veya `export=xlsx|pdf` ile dosya. */
    static async list(kind: FacilityKind, sp: URLSearchParams, user: UserLike, actor: Actor) {
        const cfg = CONFIG[kind];
        const columns = cfg.columns(canSeeRent(user));
        const p = parseListParams(sp, { filterKeys: cfg.filterKeys, sortable: columns.map((c) => c.key) });
        const format = parseExportFormat(sp.get('export'));
        if (format && !hasPermission(user, 'export', 'facilities')) throw new DomainError('Dışa aktarma yetkiniz yok.', 403);
        const rows = await cfg.rows(p, todayKey(), user);
        const result = applyList(rows, p, { search: cfg.search, sortValue, defaultSort: cfg.defaultSort, paginate: !format });
        if (format) {
            return exportList({
                format, title: cfg.title, entityType: cfg.entityType, columns, rows: result.items,
                filters: { ...(p.q ? { Arama: p.q } : {}), ...p.filters, ...(p.includeArchived ? { Arşiv: 'dahil' } : {}) },
                actor: { id: actor.id, name: actor.name ?? null, email: actor.email ?? null },
            });
        }
        return { ...result, columns: columns.map(({ key, label }) => ({ key, label })) };
    }

    /** Formlar ve filtreler için seçim listeleri. Kira sözleşmeleri yalnız kira görme yetkisi olana döner. */
    static async lookups(user: UserLike) {
        const rent = canSeeRent(user);
        const [buildings, floors, units, entrepreneurs, organizations, contracts, policyTypes, warn] = await Promise.all([
            prisma.building.findMany({ where: { isArchived: false }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            prisma.floor.findMany({ where: { isArchived: false, building: { isArchived: false } }, select: { id: true, name: true, buildingId: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
            prisma.spaceUnit.findMany({ where: { isArchived: false, floor: { isArchived: false } }, select: { id: true, code: true, unitType: true, area: true, floorId: true, floor: { select: { name: true, buildingId: true, building: { select: { name: true } } } } }, orderBy: { code: 'asc' } }),
            prisma.entrepreneur.findMany({ where: { isArchived: false }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            prisma.organization.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 500 }),
            rent ? prisma.rentContract.findMany({ where: { status: { not: 'TERMINATED' } }, select: { id: true, contractNo: true, spaceName: true, entrepreneurId: true, status: true, unitId: true }, orderBy: { contractNo: 'asc' } }) : Promise.resolve(null),
            ParameterService.options('POLICY_TYPE'),
            ParameterService.getNumber('ALERTS', 'expiry_warning_days'),
        ]);
        return {
            buildings, floors, entrepreneurs, organizations, rentContracts: contracts, policyTypes, expiryWarningDays: warn,
            units: units.map((u) => ({ id: u.id, code: u.code, unitType: u.unitType, area: u.area, floorId: u.floorId, buildingId: u.floor.buildingId, label: `${u.floor.building.name} · ${u.floor.name} · ${u.code}` })),
            unitTypes: UNIT_TYPES.map((v) => ({ value: v, label: UNIT_TYPE_LABELS[v] })),
            unitStatuses: UNIT_STATUSES.map((v) => ({ value: v, label: UNIT_STATUS_LABELS[v] })),
        };
    }

    /** Kurum geneli ve bina bazında doluluk (panel ve alan özeti). */
    static async occupancySummary() {
        const today = todayKey();
        const units = (await loadUnits(false)).filter((u) => !u.floor.isArchived && !u.floor.building.isArchived).map((u) => unitRow(u, today));
        const byBuilding = new Map<string, { id: string; name: string; rows: UnitRow[] }>();
        for (const u of units) {
            const b = byBuilding.get(u.buildingId) ?? { id: u.buildingId, name: u.buildingName, rows: [] };
            b.rows.push(u);
            byBuilding.set(u.buildingId, b);
        }
        return {
            ...occOf(units),
            totalUnits: units.length,
            maintenance: units.filter((u) => u.displayStatus === 'MAINTENANCE').length,
            reserved: units.filter((u) => u.displayStatus === 'RESERVED').length,
            available: units.filter((u) => u.unitType !== 'COMMON' && u.status === 'AVAILABLE' && (u.freeSlots ?? 0) > 0).length,
            desks: { total: units.filter((u) => u.unitType === 'DESK').length, used: units.filter((u) => u.unitType === 'DESK' && u.tenants > 0).length },
            offices: { total: units.filter((u) => u.unitType === 'OFFICE').length, used: units.filter((u) => u.unitType === 'OFFICE' && u.tenants > 0).length },
            buildings: [...byBuilding.values()].map((b) => ({ id: b.id, name: b.name, ...occOf(b.rows) })).sort((a, b) => a.name.localeCompare(b.name, 'tr')),
        };
    }

    /** Bitişi `days` gün içinde olan arşivlenmemiş poliçeler. */
    static async expiringPolicies(days: number) {
        const rows = await policyRows(parseListParams(new URLSearchParams()), todayKey());
        return rows.filter((r) => r.daysLeft >= 0 && r.daysLeft <= days).sort((a, b) => a.daysLeft - b.daysLeft);
    }

    /** Sözleşmesi bağlanmamış aktif tahsis sayısı (panel uyarısı). */
    static async unlinkedActiveAssignments() {
        const today = todayKey();
        const rows = await prisma.spaceAssignment.findMany({ where: { unitId: { not: null }, rentContractId: null, status: { in: LIVE } }, select: { status: true, startDate: true, endDate: true } });
        return rows.filter((a) => assignmentState(a.status, a.startDate, a.endDate, today) === 'ACTIVE').length;
    }

    /**
     * Toplu bölüm ekleme (ör. 30 masa): kod = önek + sıra no (sıfır dolgulu). Binada var olan kodlar atlanır ve raporlanır.
     */
    static async bulkCreateUnits(input: unknown, actor: Actor) {
        const v = parseOrThrow(bulkSchema, input);
        const floor = await prisma.floor.findUnique({ where: { id: v.floorId }, include: { building: true } });
        if (!floor || floor.isArchived || floor.building.isArchived) throw fieldError('Form alanlarını kontrol edin.', 400, 'floorId', 'Aktif bir kat seçin');
        const codes = Array.from({ length: v.count }, (_, i) => `${v.prefix}${String(v.startNo + i).padStart(v.digits, '0')}`);
        const existing = await prisma.spaceUnit.findMany({ where: { floor: { buildingId: floor.buildingId } }, select: { code: true } });
        const taken = new Set(existing.map((e) => e.code.toLocaleLowerCase('tr-TR')));
        const fresh = codes.filter((c) => !taken.has(c.toLocaleLowerCase('tr-TR')));
        if (fresh.length) {
            await prisma.spaceUnit.createMany({ data: fresh.map((code) => ({ floorId: v.floorId, code, unitType: v.unitType, area: v.area, capacity: v.capacity ?? null, maxTenants: v.maxTenants, status: 'AVAILABLE' })) });
        }
        await audit(actor, 'FACILITY_BULK_CREATE', 'SpaceUnit', v.floorId, { ...v, created: fresh.length, skipped: codes.length - fresh.length });
        return { created: fresh, skipped: codes.filter((c) => !fresh.includes(c)) };
    }

    /** Tahsis kurallarını (kapasite, mükerrer firma, masa no, tarih) yazmadan denetler. */
    static async checkAssignment(input: Record<string, unknown>, user: UserLike) {
        const v = parseOrThrow(SCHEMAS.assignments, input) as Record<string, any>;
        await this.validate('assignments', v, null, user);
    }

    static async get(kind: WritableKind, id: string) {
        const row = await delegate(kind).findUnique({ where: { id } });
        if (!row) throw new DomainError(`${ENTITY[kind].label} bulunamadı.`, 404);
        return row;
    }

    static async create(kind: WritableKind, input: unknown, user: UserLike, actor: Actor) {
        const v = parseOrThrow(SCHEMAS[kind], input) as Record<string, any>;
        await this.validate(kind, v, null, user);
        const today = todayKey();
        const data = kind === 'assignments'
            ? { ...v, status: statusFor(v.startDate, today), createdById: actor.id }
            : { ...v, ...(kind === 'floors' || kind === 'units' ? {} : { createdById: actor.id }) };
        const row = await delegate(kind).create({ data });
        await audit(actor, 'FACILITY_CREATE', ENTITY[kind].model, row.id, v);
        if (kind === 'assignments') await this.afterAssignmentChange(row.id, v, actor, 'created');
        return row;
    }

    /**
     * Güncelleme. Gövde `{ archived: boolean }` ise arşivle / geri al; tahsiste `{ end: true }` bugün itibarıyla sonlandırır.
     * `expectedUpdatedAt` verilirse eşzamanlı düzenleme 409 ile reddedilir.
     */
    static async update(kind: WritableKind, id: string, input: Record<string, unknown>, user: UserLike, actor: Actor) {
        const d = delegate(kind);
        const before = await d.findUnique({ where: { id } });
        if (!before) throw new DomainError(`${ENTITY[kind].label} bulunamadı.`, 404);
        const today = todayKey();

        if (typeof input.archived === 'boolean') {
            if (input.archived) await this.assertArchivable(kind, id);
            else await this.assertRestorable(kind, before);
            const data = kind === 'assignments'
                ? { status: input.archived ? 'CANCELLED' : before.startDate ? statusFor(before.startDate, today) : 'PLANNED' }
                : { isArchived: input.archived };
            const row = await d.update({ where: { id }, data });
            await audit(actor, input.archived ? 'ARCHIVE' : 'RESTORE', ENTITY[kind].model, id, data, kind === 'assignments' ? { status: before.status } : { isArchived: before.isArchived });
            return row;
        }

        if (kind === 'assignments' && input.end === true) {
            if (!LIVE.includes(before.status)) throw new DomainError('Yalnız planlanan veya aktif tahsis sonlandırılabilir.', 409);
            const end = new Date(`${today}T00:00:00Z`);
            const row = await d.update({ where: { id }, data: { status: 'ENDED', endDate: before.endDate && before.endDate < end ? before.endDate : end } });
            await audit(actor, 'FACILITY_UPDATE', 'SpaceAssignment', id, { status: 'ENDED', endDate: row.endDate }, { status: before.status, endDate: before.endDate });
            if (before.entrepreneurId) await addTimelineEvent({ entityType: 'Entrepreneur', entityId: before.entrepreneurId, eventType: 'STATUS_CHANGE', title: 'Bağımsız bölüm tahsisi sonlandırıldı', actorId: actor.id, actorName: actor.name ?? null });
            return row;
        }

        const v = parseOrThrow(UPDATE_SCHEMAS[kind], input) as Record<string, any>;
        await this.validate(kind, { ...before, ...v }, id, user, v);
        const expected = typeof input.expectedUpdatedAt === 'string' ? new Date(input.expectedUpdatedAt) : null;
        if (expected && Number.isNaN(+expected)) throw new DomainError('Geçersiz sürüm bilgisi.', 400);
        const data = kind === 'assignments' && LIVE.includes(before.status) && v.startDate ? { ...v, status: statusFor(v.startDate, today) } : v;
        const res = await d.updateMany({ where: { id, ...(expected ? { updatedAt: expected } : {}) }, data });
        if (res.count === 0) throw fieldError('Bu kayıt siz düzenlerken başka biri tarafından değiştirildi. Sayfayı yenileyip tekrar deneyin.', 409, '_conflict', 'updatedAt');
        await audit(actor, 'FACILITY_UPDATE', ENTITY[kind].model, id, v, Object.fromEntries(Object.keys(v).map((k) => [k, before[k]])));
        if (kind === 'assignments' && 'rentContractId' in v && v.rentContractId !== before.rentContractId) await this.afterAssignmentChange(id, { ...before, ...v }, actor, 'contract');
        // Bölüm kodu değişirse otomatik oluşmuş sözleşme alan adlarına da yansır
        if (kind === 'units' && v.code && v.code !== before.code) {
            const linked = await prisma.rentContract.findMany({ where: { unitId: id }, select: { id: true, spaceName: true, roomDeskNo: true } });
            for (const c of linked) {
                if (!c.spaceName.includes(before.code) && c.roomDeskNo !== before.code) continue;
                const data = { spaceName: c.spaceName.split(before.code).join(v.code), ...(c.roomDeskNo === before.code ? { roomDeskNo: v.code } : {}) };
                await prisma.rentContract.update({ where: { id: c.id }, data });
                await audit(actor, 'UPDATE', 'RentContract', c.id, { ...data, via: 'unit-rename' }, { spaceName: c.spaceName });
            }
        }
        return d.findUnique({ where: { id } });
    }

    /** Tahsis sonrası: girişim zaman çizelgesi; bağlanan sözleşmenin bölümü boşsa bölüm sözleşmeye de yazılır. */
    private static async afterAssignmentChange(id: string, v: Record<string, any>, actor: Actor, what: 'created' | 'contract') {
        const unit = await prisma.spaceUnit.findUnique({ where: { id: v.unitId }, select: { code: true, area: true } });
        if (v.entrepreneurId) {
            await addTimelineEvent({
                entityType: 'Entrepreneur', entityId: v.entrepreneurId, eventType: what === 'created' ? 'ASSIGNED' : 'STATUS_CHANGE',
                title: what === 'created' ? `Bağımsız bölüm tahsis edildi: ${unit?.code ?? ''}` : `Bölüm ${unit?.code ?? ''} tahsisine kira sözleşmesi bağlandı`,
                actorId: actor.id, actorName: actor.name ?? null,
            });
        }
        if (v.rentContractId) {
            const c = await prisma.rentContract.findUnique({ where: { id: v.rentContractId }, select: { unitId: true, areaM2: true } });
            if (c && !c.unitId) {
                await prisma.rentContract.update({ where: { id: v.rentContractId }, data: { unitId: v.unitId, ...(c.areaM2 ? {} : { areaM2: unit?.area ?? null }) } });
                await audit(actor, 'UPDATE', 'RentContract', v.rentContractId, { unitId: v.unitId }, { unitId: null });
            }
        }
    }

    // ─── İş kuralları ────────────────────────────────────────────────────────

    private static async validate(kind: WritableKind, merged: Record<string, any>, id: string | null, user: UserLike, changed?: Record<string, any>) {
        const touched = (k: string) => !changed || k in changed;
        if (kind === 'buildings') {
            const t = merged.totalArea ?? null, l = merged.leasableArea ?? null;
            if (t !== null && l !== null && l > t) throw fieldError('Form alanlarını kontrol edin.', 400, 'leasableArea', 'Kiralanabilir alan toplam alandan büyük olamaz');
        }
        if (kind === 'floors' && touched('buildingId')) {
            const b = await prisma.building.findUnique({ where: { id: merged.buildingId } });
            if (!b || b.isArchived) throw fieldError('Form alanlarını kontrol edin.', 400, 'buildingId', 'Aktif bir bina seçin');
        }
        if (kind === 'units' && (touched('floorId') || touched('code'))) {
            const floor = await prisma.floor.findUnique({ where: { id: merged.floorId }, include: { building: true } });
            if (!floor || floor.isArchived || floor.building.isArchived) throw fieldError('Form alanlarını kontrol edin.', 400, 'floorId', 'Aktif bir kat seçin');
            const dup = await prisma.spaceUnit.findFirst({ where: { code: { equals: merged.code, mode: 'insensitive' }, floor: { buildingId: floor.buildingId }, ...(id ? { NOT: { id } } : {}) } });
            if (dup) throw fieldError('Bu bölüm kodu bu binada zaten kullanılıyor.', 409, 'code', dup.isArchived ? 'Arşivdeki bir bölümde kullanılıyor' : 'Mükerrer kod');
        }
        if (kind === 'assignments') {
            const start = new Date(merged.startDate);
            const end = merged.endDate ? new Date(merged.endDate) : null;
            if (end && end < start) throw fieldError('Form alanlarını kontrol edin.', 400, 'endDate', 'Bitiş başlangıçtan önce olamaz');
            if (!merged.entrepreneurId && !merged.organizationId) throw fieldError('Form alanlarını kontrol edin.', 400, 'entrepreneurId', 'Girişim veya kurum seçin');
            const unit = await prisma.spaceUnit.findUnique({ where: { id: merged.unitId }, include: { floor: { include: { building: true } } } });
            if (!unit || unit.isArchived || unit.floor.isArchived || unit.floor.building.isArchived) throw fieldError('Form alanlarını kontrol edin.', 400, 'unitId', 'Aktif bir bölüm seçin');
            if (touched('entrepreneurId') && merged.entrepreneurId) {
                const ent = await prisma.entrepreneur.findUnique({ where: { id: merged.entrepreneurId } });
                if (!ent || ent.isArchived) throw fieldError('Form alanlarını kontrol edin.', 400, 'entrepreneurId', 'Aktif bir girişim seçin');
            }
            if (touched('rentContractId') && merged.rentContractId) {
                if (!canSeeRent(user)) throw new DomainError('Kira sözleşmesi bağlamak için kira görme yetkisi gerekir.', 403);
                const c = await prisma.rentContract.findUnique({ where: { id: merged.rentContractId } });
                if (!c) throw fieldError('Form alanlarını kontrol edin.', 400, 'rentContractId', 'Sözleşme bulunamadı');
                if (merged.entrepreneurId && c.entrepreneurId !== merged.entrepreneurId) throw fieldError('Form alanlarını kontrol edin.', 400, 'rentContractId', 'Sözleşme başka bir girişime ait');
            }
            // Kapasite: aynı dönemde çakışan tahsis sayısı bölüm kapasitesini (maxTenants) aşamaz; ortak alan sınırsız.
            // Aynı firma aynı bölümde aynı dönemde iki kez olamaz; aynı masa / yer numarası iki firmaya verilemez.
            if (merged.status === undefined || LIVE.includes(merged.status)) {
                const others = (await prisma.spaceAssignment.findMany({ where: { unitId: merged.unitId, status: { in: LIVE }, ...(id ? { NOT: { id } } : {}) }, include: { entrepreneur: { select: { name: true } }, organization: { select: { name: true } } } }))
                    .filter((o) => assignmentState(o.status, o.startDate, o.endDate, todayKey()) !== 'ENDED' && rangesOverlap(start, end, o.startDate ?? new Date(0), o.endDate));
                const sameFirm = others.find((o) => (merged.entrepreneurId && o.entrepreneurId === merged.entrepreneurId) || (merged.organizationId && o.organizationId === merged.organizationId));
                if (sameFirm) throw fieldError('Bu firma bu bölümde aynı dönemde zaten tahsisli.', 409, 'unitId', 'Mükerrer tahsis');
                if (!hasRoom(others.length, unit.maxTenants, unit.unitType)) {
                    const names = others.map((o) => o.entrepreneur?.name ?? o.organization?.name ?? 'firma').join(', ');
                    throw fieldError(unit.maxTenants > 1 ? `Bölüm kapasitesi dolu (${unit.maxTenants} firma): ${names}. Kapasiteyi artırın veya başka bölüm seçin.` : `Bu bölüm bu tarihlerde ${names} ile eşleştirilmiş. Paylaşımlı kullanım için bölümün "aynı anda firma" kapasitesini artırın.`, 409, 'startDate', 'Kapasite dolu');
                }
                const label = merged.unitLabel ? String(merged.unitLabel).trim().toLocaleLowerCase('tr-TR') : '';
                if (label && others.some((o) => o.unitLabel && o.unitLabel.trim().toLocaleLowerCase('tr-TR') === label)) {
                    throw fieldError('Bu masa / yer numarası bu bölümde aynı dönemde başka firmaya verilmiş.', 409, 'unitLabel', 'Numara kullanımda');
                }
            }
        }
        if (kind === 'policies') {
            if (!merged.buildingId && !merged.unitId) throw fieldError('Form alanlarını kontrol edin.', 400, 'buildingId', 'Bina veya bağımsız bölüm seçin');
            if (new Date(merged.endDate) < new Date(merged.startDate)) throw fieldError('Form alanlarını kontrol edin.', 400, 'endDate', 'Bitiş başlangıçtan önce olamaz');
            if (touched('policyType')) {
                const t = await prisma.systemParameter.findUnique({ where: { category_key: { category: 'POLICY_TYPE', key: merged.policyType } } });
                if (!t || !t.isActive) throw fieldError('Form alanlarını kontrol edin.', 400, 'policyType', 'Parametrelerde tanımlı aktif bir tür seçin');
            }
            if (touched('buildingId') && merged.buildingId) {
                const b = await prisma.building.findUnique({ where: { id: merged.buildingId } });
                if (!b || b.isArchived) throw fieldError('Form alanlarını kontrol edin.', 400, 'buildingId', 'Aktif bir bina seçin');
            }
            if (touched('unitId') && merged.unitId) {
                const u = await prisma.spaceUnit.findUnique({ where: { id: merged.unitId } });
                if (!u || u.isArchived) throw fieldError('Form alanlarını kontrol edin.', 400, 'unitId', 'Aktif bir bölüm seçin');
            }
            if (touched('insurer') || touched('policyNo')) {
                const dup = await prisma.insurancePolicy.findFirst({ where: { insurer: merged.insurer, policyNo: merged.policyNo, ...(id ? { NOT: { id } } : {}) } });
                if (dup) throw fieldError('Bu sigorta şirketinde bu poliçe numarası zaten kayıtlı.', 409, 'policyNo', 'Mükerrer poliçe');
            }
        }
    }

    private static async assertArchivable(kind: WritableKind, id: string) {
        const today = todayKey();
        if (kind === 'buildings') {
            const n = await prisma.floor.count({ where: { buildingId: id, isArchived: false } });
            if (n) throw new DomainError(`Binada ${n} aktif kat var. Önce katları arşivleyin.`, 409);
        }
        if (kind === 'floors') {
            const n = await prisma.spaceUnit.count({ where: { floorId: id, isArchived: false } });
            if (n) throw new DomainError(`Katta ${n} aktif bölüm var. Önce bölümleri arşivleyin.`, 409);
        }
        if (kind === 'units') {
            const list = await prisma.spaceAssignment.findMany({ where: { unitId: id, status: { in: LIVE } } });
            if (list.some((a) => assignmentState(a.status, a.startDate, a.endDate, today) !== 'ENDED')) throw new DomainError('Bölümün aktif veya başlamamış tahsisi var. Önce tahsisi sonlandırın.', 409);
        }
    }

    private static async assertRestorable(kind: WritableKind, row: Record<string, any>) {
        if (kind === 'floors') {
            const b = await prisma.building.findUnique({ where: { id: row.buildingId } });
            if (b?.isArchived) throw new DomainError('Bağlı bina arşivde. Önce binayı geri alın.', 409);
        }
        if (kind === 'units') {
            const f = await prisma.floor.findUnique({ where: { id: row.floorId } });
            if (f?.isArchived) throw new DomainError('Bağlı kat arşivde. Önce katı geri alın.', 409);
        }
        if (kind === 'assignments') {
            if (row.status !== 'CANCELLED') throw new DomainError('Bu tahsis arşivde değil.', 409);
            const unit = await prisma.spaceUnit.findUnique({ where: { id: row.unitId } });
            if (!unit || unit.isArchived) throw new DomainError('Bağlı bölüm arşivde. Önce bölümü geri alın.', 409);
            const others = await prisma.spaceAssignment.findMany({ where: { unitId: row.unitId, status: { in: LIVE }, NOT: { id: row.id } } });
            const overlapping = others.filter((o) => rangesOverlap(row.startDate ?? new Date(0), row.endDate, o.startDate ?? new Date(0), o.endDate)).length;
            if (!hasRoom(overlapping, unit.maxTenants, unit.unitType)) throw new DomainError('Geri alınamaz: bölümün bu tarihlerdeki kapasitesi dolu.', 409);
        }
    }
}
