import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { addTimelineEvent } from '@/lib/timeline';
import { hasPermission } from '@/lib/rbac';
import { DomainError } from '@/lib/errors';
import { fieldError, parseOrThrow, type Actor } from '@/lib/validate';
import { readStoredFile, privateFileUrl } from '@/lib/storage';
import { FacilityUnitService, assignmentState } from '@/lib/services/facility-unit-service';
import { RentContractFormService } from '@/lib/services/rent-contract-form-service';
import { UNIT_TYPE_LABELS, todayKey } from '@/lib/facilities/calc';

/**
 * Firma yerleştirme: tek kayıtla girişim + şirket bilgisi + bölüm/masa tahsisleri + kira sözleşmesi + ıslak imzalı belge.
 * Önce tüm kurallar denetlenir; biri geçersizse hiçbir kayıt yazılmaz. Sonra kayıtlar birbirine bağlanır:
 * SpaceAssignment.rentContractId, RentContract.unitId / organizationId, EntrepreneurOrganization.
 * Sonradan sözleşmede yapılan tarih / durum değişiklikleri bağlı tahsislere RentContractFormService üzerinden yansır.
 */

type UserLike = Parameters<typeof hasPermission>[0];
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optStr = (max = 2000) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional());
const optUuid = z.preprocess(blankToNull, z.string().uuid().nullable().optional());

const placementSchema = z.object({
    entrepreneurId: optUuid,
    newFirm: z.object({ name: z.string().trim().min(2, 'Firma adı gerekli').max(200), sector: z.string().trim().min(2, 'Sektör gerekli').max(120), email: optStr(200), phone: optStr(40) }).nullable().optional(),
    organizationId: optUuid,
    company: z.object({ legalName: optStr(300), taxNumber: optStr(20), taxOffice: optStr(120), address: optStr(500) }).optional(),
    units: z.array(z.object({ unitId: z.string().uuid('Bölüm seçin'), unitLabel: optStr(60) })).min(1, 'En az bir masa / ofis seçin').max(30),
    startDate: z.coerce.date({ message: 'Başlangıç tarihi gerekli' }),
    endDate: z.coerce.date({ message: 'Bitiş tarihi gerekli' }),
    contract: z.record(z.string(), z.unknown()).nullable().optional(),
    existingContractId: optUuid,
    signedMediaId: optUuid,
    notes: optStr(),
});

function slugify(s: string) {
    const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
    return s.replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'firma';
}

export class PlacementService {
    /** Sihirbaz için seçim listeleri: boş yeri olan bölümler, girişimler, şirketler. */
    static async lookups() {
        const today = todayKey();
        const [units, entrepreneurs, organizations] = await Promise.all([
            prisma.spaceUnit.findMany({
                where: { isArchived: false, floor: { isArchived: false, building: { isArchived: false } } },
                include: { floor: { select: { name: true, sortOrder: true, building: { select: { name: true } } } }, spaceAssignments: { where: { status: { in: ['PLANNED', 'ACTIVE'] } }, select: { status: true, startDate: true, endDate: true, unitLabel: true, entrepreneur: { select: { name: true } }, organization: { select: { name: true } } } } },
                orderBy: [{ code: 'asc' }],
            }),
            prisma.entrepreneur.findMany({ where: { isArchived: false }, select: { id: true, name: true, email: true, phone: true, organizations: { where: { isPrimary: true }, take: 1, select: { organization: { select: { id: true, name: true, legalName: true, taxNumber: true, taxOffice: true, address: true } } } } }, orderBy: { name: 'asc' } }),
            prisma.organization.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, name: true, legalName: true, taxNumber: true, taxOffice: true, address: true }, orderBy: { name: 'asc' }, take: 1000 }),
        ]);
        return {
            units: units.map((u) => {
                const live = u.spaceAssignments.filter((a) => assignmentState(a.status, a.startDate, a.endDate, today) !== 'ENDED');
                return {
                    id: u.id, code: u.code, unitType: u.unitType, unitTypeLabel: UNIT_TYPE_LABELS[u.unitType] ?? u.unitType, area: u.area, maxTenants: u.maxTenants, status: u.status,
                    building: u.floor.building.name, floor: u.floor.name,
                    tenants: live.map((a) => ({ name: a.entrepreneur?.name ?? a.organization?.name ?? '—', label: a.unitLabel, endDate: a.endDate })),
                    freeSlots: u.unitType === 'COMMON' ? null : Math.max(0, u.maxTenants - live.length),
                };
            }),
            entrepreneurs: entrepreneurs.map((e) => ({ id: e.id, name: e.name, email: e.email, phone: e.phone, organization: e.organizations[0]?.organization ?? null })),
            organizations,
        };
    }

    static async place(input: unknown, user: UserLike, actor: Actor) {
        if (!hasPermission(user, 'create', 'facilities')) throw new DomainError('Tahsis yetkiniz yok.', 403);
        const v = parseOrThrow(placementSchema, input);
        const wantsContract = Boolean(v.contract) && !v.existingContractId;
        if (wantsContract && !hasPermission(user, 'create', 'rent')) throw new DomainError('Sözleşme oluşturma yetkiniz yok.', 403);
        if (v.existingContractId && !hasPermission(user, 'view', 'rent')) throw new DomainError('Sözleşme bağlama yetkiniz yok.', 403);
        if (!v.entrepreneurId && !v.newFirm) throw fieldError('Form alanlarını kontrol edin.', 400, 'entrepreneurId', 'Firma seçin veya yeni firma girin');
        if (v.endDate < v.startDate) throw fieldError('Form alanlarını kontrol edin.', 400, 'endDate', 'Bitiş başlangıçtan önce olamaz');
        const unitIds = v.units.map((u) => u.unitId);
        if (new Set(unitIds).size !== unitIds.length) throw fieldError('Aynı bölüm iki kez seçilmiş.', 400, 'units', 'Mükerrer bölüm');

        // ── 1) Ön denetim (hiçbir şey yazılmadan) ───────────────────────────
        if (v.entrepreneurId) {
            const e = await prisma.entrepreneur.findUnique({ where: { id: v.entrepreneurId } });
            if (!e || e.isArchived) throw fieldError('Form alanlarını kontrol edin.', 400, 'entrepreneurId', 'Aktif bir girişim seçin');
        } else if (await prisma.entrepreneur.findFirst({ where: { name: { equals: v.newFirm!.name, mode: 'insensitive' } } })) {
            throw fieldError('Bu adla kayıtlı bir girişim var; listeden seçin.', 409, 'newFirm.name', 'Kayıtlı firma');
        }
        if (v.organizationId && !(await prisma.organization.findUnique({ where: { id: v.organizationId } }))) throw fieldError('Şirket bulunamadı.', 400, 'organizationId');
        const probeFirm = v.entrepreneurId ?? null;
        for (const [i, u] of v.units.entries()) {
            try {
                // Yeni firma için kapasite / numara denetimi kurum kimliği olmadan yapılır (firma henüz yok)
                await FacilityUnitService.checkAssignment({ unitId: u.unitId, unitLabel: u.unitLabel, entrepreneurId: probeFirm, organizationId: probeFirm ? null : '00000000-0000-0000-0000-000000000000', startDate: v.startDate, endDate: v.endDate }, user);
            } catch (e) {
                const err = e as Error & { fieldErrors?: Record<string, string> };
                throw fieldError(`${i + 1}. bölüm: ${err.message}`, (e as { status?: number }).status ?? 400, `units.${i}`, err.message);
            }
        }
        let existingContract = null as null | { id: string; entrepreneurId: string };
        if (v.existingContractId) {
            existingContract = await prisma.rentContract.findUnique({ where: { id: v.existingContractId }, select: { id: true, entrepreneurId: true } });
            if (!existingContract || (v.entrepreneurId && existingContract.entrepreneurId !== v.entrepreneurId)) throw fieldError('Sözleşme bu firmaya ait değil.', 400, 'existingContractId');
        }
        if (wantsContract) {
            const no = String((v.contract as Record<string, unknown>).contractNo ?? '').trim();
            if (!no) throw fieldError('Form alanlarını kontrol edin.', 400, 'contract.contractNo', 'Sözleşme no gerekli');
            if (await prisma.rentContract.findUnique({ where: { contractNo: no } })) throw fieldError('Bu sözleşme numarası kullanılıyor.', 409, 'contract.contractNo', 'Mükerrer numara');
        }
        const media = v.signedMediaId ? await prisma.media.findUnique({ where: { id: v.signedMediaId } }) : null;
        if (v.signedMediaId && !media) throw fieldError('Yüklenen belge bulunamadı.', 400, 'signedMediaId');

        // ── 2) Kayıtlar — eşzamanlı bir işlem son boş yeri alırsa bu çağrıda oluşanlar geri alınır ──
        const created = { entrepreneurId: null as string | null, organizationId: null as string | null, contractId: null as string | null, assignments: [] as string[], documents: [] as string[] };
        try {
            let entrepreneurId = v.entrepreneurId ?? null;
            if (!entrepreneurId) {
                const base = slugify(v.newFirm!.name);
                const slug = (await prisma.entrepreneur.findUnique({ where: { slug: base } })) ? `${base}-${Date.now().toString(36)}` : base;
                const e = await prisma.entrepreneur.create({ data: { name: v.newFirm!.name, slug, sector: v.newFirm!.sector, email: v.newFirm!.email ?? null, phone: v.newFirm!.phone ?? null, isPublished: false, status: 'ACTIVE' } });
                entrepreneurId = e.id;
                created.entrepreneurId = e.id;
                await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action: 'CREATE', entityType: 'Entrepreneur', entityId: e.id, newValues: { name: e.name, via: 'placement' } });
            }
            const hadOrg = Boolean(v.organizationId) || Boolean(await prisma.entrepreneurOrganization.findFirst({ where: { entrepreneurId, isPrimary: true } }));
            const organizationId = await this.upsertCompany(entrepreneurId, v.organizationId ?? null, v.company, v.newFirm?.name ?? null, actor);
            if (!hadOrg && organizationId) created.organizationId = organizationId;

            const units = await prisma.spaceUnit.findMany({ where: { id: { in: unitIds } }, include: { floor: { include: { building: true } } } });
            const ordered = v.units.map((u) => ({ ...u, unit: units.find((x) => x.id === u.unitId)! }));
            let contractId = existingContract?.id ?? null;
            if (wantsContract) {
                const c = v.contract as Record<string, unknown>;
                const spaceName = ordered.map((o) => `${o.unit.floor.building.name} · ${o.unit.floor.name} · ${o.unit.code}${o.unitLabel ? ` (${o.unitLabel})` : ''}`).join(', ').slice(0, 200);
                const createdContract = await RentContractFormService.create({
                    ...c, entrepreneurId, organizationId, unitId: ordered[0].unitId, spaceName,
                    areaM2: Math.round(ordered.reduce((s, o) => s + o.unit.area, 0) * 100) / 100,
                    spaceType: ordered.every((o) => o.unit.unitType === 'DESK') ? 'SHARED_DESK' : ordered[0].unit.unitType === 'WORKSHOP' ? 'WORKSHOP' : 'OFFICE',
                    commercialTitle: c.commercialTitle || v.company?.legalName || undefined,
                    startDate: v.startDate, endDate: v.endDate,
                }, actor);
                contractId = createdContract.id;
                created.contractId = createdContract.id;
            }
            const assignmentIds: string[] = [];
            for (const o of ordered) {
                const a = await FacilityUnitService.create('assignments', { unitId: o.unitId, unitLabel: o.unitLabel, entrepreneurId, rentContractId: contractId, startDate: v.startDate, endDate: v.endDate, notes: v.notes }, user, actor);
                assignmentIds.push(a.id);
                created.assignments.push(a.id);
            }
            if (contractId && media) await this.attachSignedDocument(contractId, media.id, actor);
            await addTimelineEvent({ entityType: 'Entrepreneur', entityId: entrepreneurId, eventType: 'ASSIGNED', title: `Yerleştirme: ${ordered.map((o) => o.unit.code + (o.unitLabel ? ` (${o.unitLabel})` : '')).join(', ')}${contractId ? ' · sözleşme bağlandı' : ''}`, actorId: actor.id, actorName: actor.name ?? null });
            return { entrepreneurId, organizationId, contractId, assignmentIds };
        } catch (error) {
            await this.rollback(created, actor);
            throw error;
        }
    }

    /** Yarıda kalan yerleştirmede yalnız bu çağrıda oluşturulan kayıtları kaldırır (önceden var olanlara dokunmaz). */
    private static async rollback(c: { entrepreneurId: string | null; organizationId: string | null; contractId: string | null; assignments: string[] }, actor: Actor) {
        try {
            if (c.assignments.length) await prisma.spaceAssignment.deleteMany({ where: { id: { in: c.assignments } } });
            if (c.contractId) {
                await prisma.rentContractDocument.deleteMany({ where: { contractId: c.contractId } });
                await prisma.rentAccrual.deleteMany({ where: { contractId: c.contractId } });
                await prisma.rentContract.deleteMany({ where: { id: c.contractId } });
            }
            if (c.organizationId) {
                await prisma.entrepreneurOrganization.deleteMany({ where: { organizationId: c.organizationId } });
                await prisma.organization.deleteMany({ where: { id: c.organizationId } });
            }
            if (c.entrepreneurId) {
                await prisma.entrepreneurOrganization.deleteMany({ where: { entrepreneurId: c.entrepreneurId } });
                await prisma.activityTimeline.deleteMany({ where: { entityId: c.entrepreneurId } });
                await prisma.entrepreneur.deleteMany({ where: { id: c.entrepreneurId } });
            }
            await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action: 'ROLLBACK', entityType: 'Placement', entityId: c.entrepreneurId, newValues: c });
        } catch (e) {
            console.error('placement rollback failed', e);
        }
    }

    /** Şirket kaydı: seçilen / girişime bağlı şirket güncellenir, yoksa oluşturulup girişime bağlanır. Boş alanlar mevcut değeri silmez. */
    private static async upsertCompany(entrepreneurId: string, organizationId: string | null, company: { legalName?: string | null; taxNumber?: string | null; taxOffice?: string | null; address?: string | null } | undefined, fallbackName: string | null, actor: Actor) {
        const data = Object.fromEntries(Object.entries(company ?? {}).filter(([, val]) => typeof val === 'string' && val.trim() !== '')) as Record<string, string>;
        let orgId = organizationId;
        if (!orgId) orgId = (await prisma.entrepreneurOrganization.findFirst({ where: { entrepreneurId, isPrimary: true }, select: { organizationId: true } }))?.organizationId ?? null;
        if (!orgId && !Object.keys(data).length) return null;
        if (orgId) {
            if (Object.keys(data).length) {
                const before = await prisma.organization.findUnique({ where: { id: orgId } });
                await prisma.organization.update({ where: { id: orgId }, data });
                await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action: 'UPDATE', entityType: 'Organization', entityId: orgId, newValues: data, oldValues: before ? Object.fromEntries(Object.keys(data).map((k) => [k, (before as Record<string, unknown>)[k]])) : null });
            }
        } else {
            const ent = await prisma.entrepreneur.findUniqueOrThrow({ where: { id: entrepreneurId }, select: { name: true } });
            const org = await prisma.organization.create({ data: { name: fallbackName ?? ent.name, ...data } });
            orgId = org.id;
            await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action: 'CREATE', entityType: 'Organization', entityId: org.id, newValues: { name: org.name, ...data, via: 'placement' } });
        }
        const link = await prisma.entrepreneurOrganization.findFirst({ where: { entrepreneurId, organizationId: orgId } });
        if (!link) await prisma.entrepreneurOrganization.create({ data: { entrepreneurId, organizationId: orgId, isPrimary: !(await prisma.entrepreneurOrganization.count({ where: { entrepreneurId, isPrimary: true } })) } });
        return orgId;
    }

    /** Islak imzalı taranmış sözleşmeyi (önceden yüklenmiş özel medya) sözleşmeye ekler. */
    static async attachSignedDocument(contractId: string, mediaId: string, actor: Actor, opts: { title?: string; documentType?: string; documentDate?: Date } = {}) {
        const [contract, media] = await Promise.all([prisma.rentContract.findUnique({ where: { id: contractId } }), prisma.media.findUnique({ where: { id: mediaId } })]);
        if (!contract) throw new DomainError('Sözleşme bulunamadı.', 404);
        if (!media) throw new DomainError('Belge bulunamadı.', 404);
        await readStoredFile(media).catch(() => { throw new DomainError('Belge dosyası okunamadı; yeniden yükleyin.', 400); });
        const url = media.isPrivate ? privateFileUrl(media.id) : media.publicUrl;
        const last = await prisma.rentContractDocument.findFirst({ where: { contractId, documentType: opts.documentType ?? 'SIGNED_CONTRACT' }, orderBy: { version: 'desc' } });
        const doc = await prisma.rentContractDocument.create({ data: { contractId, documentType: opts.documentType ?? 'SIGNED_CONTRACT', title: opts.title ?? 'Islak imzalı kira sözleşmesi (taranmış)', fileUrl: url, documentDate: opts.documentDate ?? contract.contractDate, version: (last?.version ?? 0) + 1, uploadedById: actor.id } });
        if ((opts.documentType ?? 'SIGNED_CONTRACT') === 'SIGNED_CONTRACT') await prisma.rentContract.update({ where: { id: contractId }, data: { contractDocUrl: url } });
        await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action: 'FILE_UPLOAD', entityType: 'RentContract', entityId: contractId, newValues: { documentId: doc.id, mediaId, version: doc.version } });
        return doc;
    }

    /** Girişim kartı: o firmanın tüm bölüm tahsisleri, sözleşmeleri ve belgeleri tek yerde. */
    static async overview(entrepreneurId: string, user: UserLike) {
        const today = todayKey();
        const rent = hasPermission(user, 'view', 'rent');
        const [assignments, contracts, cards] = await Promise.all([
            prisma.spaceAssignment.findMany({ where: { entrepreneurId, status: { not: 'CANCELLED' } }, orderBy: { startDate: 'desc' }, include: { unit: { include: { floor: { include: { building: true } } } }, facility: { select: { title: true } }, rentContract: { select: { id: true, contractNo: true } } } }),
            rent ? prisma.rentContract.findMany({ where: { entrepreneurId }, orderBy: { startDate: 'desc' }, include: { documents: { orderBy: { uploadedAt: 'desc' } }, organization: { select: { id: true, name: true, legalName: true, taxNumber: true, taxOffice: true } } } }) : Promise.resolve(null),
            hasPermission(user, 'view', 'pdks') ? prisma.accessCard.count({ where: { entrepreneurId, status: 'ACTIVE' } }) : Promise.resolve(null),
        ]);
        return {
            assignments: assignments.map((a) => ({
                id: a.id, state: assignmentState(a.status, a.startDate, a.endDate, today), unitId: a.unitId, unitLabel: a.unitLabel, startDate: a.startDate, endDate: a.endDate,
                place: a.unit ? `${a.unit.floor.building.name} · ${a.unit.floor.name} · ${a.unit.code}` : a.facility?.title ?? '—', unitType: a.unit ? UNIT_TYPE_LABELS[a.unit.unitType] : null, area: a.unit?.area ?? null,
                contract: rent && a.rentContract ? a.rentContract : null, updatedAt: a.updatedAt,
            })),
            contracts: contracts?.map((c) => ({
                id: c.id, contractNo: c.contractNo, status: c.status, startDate: c.startDate, endDate: c.endDate, monthlyRent: c.monthlyRent, totalMonthlyRent: c.totalMonthlyRent, currency: c.currency, isWaived: c.isWaived, spaceName: c.spaceName,
                daysLeft: Math.ceil((+c.endDate - Date.now()) / 86400000), organization: c.organization, signed: c.documents.some((d) => d.documentType === 'SIGNED_CONTRACT'),
                documents: c.documents.map((d) => ({ id: d.id, title: d.title, documentType: d.documentType, fileUrl: d.fileUrl, version: d.version, uploadedAt: d.uploadedAt })),
            })) ?? null,
            activeCards: cards,
        };
    }
}
