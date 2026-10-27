import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { addTimelineEvent } from '@/lib/timeline';
import { DomainError } from '@/lib/errors';
import { fieldError, parseOrThrow, type Actor } from '@/lib/validate';
import { ParameterService } from '@/lib/services/parameter-service';
import { UNIT_TYPE_LABELS } from '@/lib/facilities/calc';

/**
 * Kira sözleşmesi: tüm alanlarıyla oluşturma / sürüm kontrollü düzenleme ve yazdırılabilir çıktı.
 * KDV ve toplam tutar sunucuda hesaplanır (istemciden alınmaz). Bağımsız bölüm seçilirse alan adı,
 * m² ve alan türü bölümden doldurulur. Sözleşme metni kurumun kendi şablonundan gelir; metin uydurulmaz.
 */

export const RENT_CONTRACT_STATUSES = ['ACTIVE', 'SUSPENDED', 'WAIVED', 'EXPIRED', 'TERMINATED'] as const;
export const RENT_CONTRACT_STATUS_LABELS: Record<string, string> = { ACTIVE: 'Aktif', SUSPENDED: 'Askıda', WAIVED: 'Kira muaf', EXPIRED: 'Süresi doldu', TERMINATED: 'Feshedildi' };
export const SPACE_TYPES = ['OFFICE', 'SHARED_DESK', 'LAB', 'WORKSHOP', 'VIRTUAL'] as const;
export const SPACE_TYPE_LABELS: Record<string, string> = { OFFICE: 'Ofis', SHARED_DESK: 'Ortak çalışma masası', LAB: 'Laboratuvar', WORKSHOP: 'Atölye', VIRTUAL: 'Sanal ofis' };
const UNIT_TO_SPACE: Record<string, string> = { OFFICE: 'OFFICE', WORKSHOP: 'WORKSHOP', STORAGE: 'OFFICE', COMMON: 'SHARED_DESK' };

const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optStr = (max = 2000) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional());
const optDate = z.preprocess(blankToNull, z.coerce.date().nullable().optional());
const optUuid = z.preprocess(blankToNull, z.string().uuid('Geçerli bir kayıt seçin').nullable().optional());
const money = z.coerce.number().finite().min(0, 'Negatif olamaz').max(1e12);
const bool = z.preprocess((v) => v === true || v === 'true' || v === 'on' || v === 1, z.boolean());

const base = z.object({
    entrepreneurId: z.string().uuid('Girişim seçin'),
    organizationId: optUuid,
    unitId: optUuid,
    spaceName: optStr(200),
    roomDeskNo: optStr(100),
    areaM2: z.preprocess(blankToNull, z.coerce.number().finite().min(0).max(1e7).nullable().optional()),
    spaceType: z.enum(SPACE_TYPES),
    contractNo: z.string().trim().min(1, 'Sözleşme no gerekli').max(64),
    contractDate: z.coerce.date({ message: 'Sözleşme tarihi gerekli' }),
    startDate: z.coerce.date({ message: 'Başlangıç gerekli' }),
    endDate: z.coerce.date({ message: 'Bitiş gerekli' }),
    commercialTitle: optStr(300),
    contactPersonName: optStr(200),
    contactEmail: z.preprocess(blankToNull, z.string().trim().email('Geçerli e-posta girin').nullable().optional()),
    contactPhone: optStr(40),
    monthlyRent: money,
    currency: z.string().trim().length(3),
    vatRate: z.coerce.number().min(0).max(100),
    dueDay: z.coerce.number().int().min(1).max(31),
    depositAmount: money,
    isWaived: bool,
    freePeriodStart: optDate,
    freePeriodEnd: optDate,
    waiverReason: optStr(1000),
    autoRenew: bool,
    renewalNoticeDays: z.coerce.number().int().min(0).max(365),
    status: z.enum(RENT_CONTRACT_STATUSES),
    contractDocUrl: z.preprocess(blankToNull, z.string().trim().max(1000).refine((s) => /^https?:\/\//i.test(s) || s.startsWith('/'), 'http(s):// ile veya / ile başlamalı').nullable().optional()),
    notes: optStr(5000),
});

// Yalnız zorunlu olmayan sayısal ayarlar oluşturmada varsayılan alır; KDV oranı ve tutarlar kullanıcıdan gelir (uydurulmaz).
const createSchema = base.extend({
    spaceType: base.shape.spaceType.default('OFFICE'),
    currency: base.shape.currency.default('TRY'),
    depositAmount: base.shape.depositAmount.default(0),
    isWaived: base.shape.isWaived.default(false),
    autoRenew: base.shape.autoRenew.default(false),
    renewalNoticeDays: base.shape.renewalNoticeDays.default(30),
    status: base.shape.status.default('ACTIVE'),
    contractDate: base.shape.contractDate.default(() => new Date()),
});
const updateSchema = base.omit({ entrepreneurId: true }).partial();

async function audit(actor: Actor, action: string, id: string, newValues: Record<string, unknown>, oldValues?: Record<string, unknown>) {
    await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action, entityType: 'RentContract', entityId: id, newValues, oldValues: oldValues ?? null });
}

const round2 = (n: number) => Math.round(n * 100) / 100;
export function rentTotals(monthlyRent: number, vatRate: number) {
    const vatAmount = round2((monthlyRent * vatRate) / 100);
    return { vatAmount, totalMonthlyRent: round2(monthlyRent + vatAmount) };
}

export class RentContractFormService {
    /** Form için tam kayıt + seçim listeleri. */
    static async get(id: string) {
        const c = await prisma.rentContract.findUnique({
            where: { id },
            include: {
                entrepreneur: { select: { id: true, name: true } },
                organization: { select: { id: true, name: true, legalName: true, taxNumber: true, taxOffice: true, address: true } },
                unit: { select: { id: true, code: true, area: true, floor: { select: { name: true, building: { select: { name: true, address: true } } } } } },
                documents: { orderBy: { documentDate: 'desc' } },
                spaceAssignments: { select: { id: true, status: true, unit: { select: { code: true } } } },
            },
        });
        if (!c) throw new DomainError('Kira sözleşmesi bulunamadı.', 404);
        return c;
    }

    /** Yeni sözleşme formunu girişim / bölüm / tahsis bilgisinden önceden doldurur (yalnız kayıtlı bilgi). */
    static async prefill(params: { entrepreneurId?: string | null; unitId?: string | null; assignmentId?: string | null }) {
        let { entrepreneurId, unitId } = params;
        let startDate: Date | null = null, endDate: Date | null = null;
        if (params.assignmentId) {
            const a = await prisma.spaceAssignment.findUnique({ where: { id: params.assignmentId } });
            if (a) { entrepreneurId ??= a.entrepreneurId; unitId ??= a.unitId; startDate = a.startDate; endDate = a.endDate; }
        }
        const [ent, unit, existing] = await Promise.all([
            entrepreneurId ? prisma.entrepreneur.findUnique({ where: { id: entrepreneurId }, select: { id: true, name: true, email: true, phone: true, organizations: { take: 1, select: { organization: { select: { id: true, name: true, legalName: true } } } } } }) : null,
            unitId ? prisma.spaceUnit.findUnique({ where: { id: unitId }, select: { id: true, code: true, area: true, unitType: true, floor: { select: { name: true, building: { select: { name: true } } } } } }) : null,
            prisma.rentContract.count(),
        ]);
        const org = ent?.organizations[0]?.organization ?? null;
        const year = new Date().getFullYear();
        return {
            entrepreneurId: ent?.id ?? '',
            organizationId: org?.id ?? '',
            commercialTitle: org?.legalName ?? org?.name ?? '',
            contactEmail: ent?.email ?? '',
            contactPhone: ent?.phone ?? '',
            unitId: unit?.id ?? '',
            spaceName: unit ? `${unit.floor.building.name} · ${unit.floor.name} · ${unit.code}` : '',
            roomDeskNo: unit?.code ?? '',
            areaM2: unit ? String(unit.area) : '',
            spaceType: unit ? UNIT_TO_SPACE[unit.unitType] ?? 'OFFICE' : 'OFFICE',
            // Öneri: kurum numaralandırma kuralı tanımlanana kadar YIL-sıra; kullanıcı değiştirebilir
            contractNo: `KS-${year}-${String(existing + 1).padStart(4, '0')}`,
            startDate: startDate ? startDate.toISOString().slice(0, 10) : '',
            endDate: endDate ? endDate.toISOString().slice(0, 10) : '',
        };
    }

    static async create(input: unknown, actor: Actor, opts: { assignmentId?: string | null } = {}) {
        const v = parseOrThrow(createSchema, input);
        const data = await this.normalize(v, null);
        if (await prisma.rentContract.findUnique({ where: { contractNo: data.contractNo } })) throw fieldError('Bu sözleşme numarası zaten kullanılıyor.', 409, 'contractNo', 'Mükerrer numara');
        const c = await prisma.rentContract.create({ data: { ...data, entrepreneurId: v.entrepreneurId, createdById: actor.id } as never });
        if (data.contractDocUrl) {
            await prisma.rentContractDocument.create({ data: { contractId: c.id, documentType: 'SIGNED_CONTRACT', title: 'İmzalı Kira Sözleşmesi', fileUrl: data.contractDocUrl, documentDate: data.startDate, uploadedById: actor.id } });
        }
        await audit(actor, 'CREATE', c.id, { ...data, entrepreneurId: v.entrepreneurId });
        await addTimelineEvent({ entityType: 'Entrepreneur', entityId: v.entrepreneurId, eventType: 'STATUS_CHANGE', title: `Kira sözleşmesi oluşturuldu: ${c.contractNo}`, actorId: actor.id, actorName: actor.name ?? null });
        // Tahsis ekranından açıldıysa sözleşme o tahsise bağlanır
        if (opts.assignmentId) {
            const a = await prisma.spaceAssignment.findUnique({ where: { id: opts.assignmentId } });
            if (a && !a.rentContractId && (!a.entrepreneurId || a.entrepreneurId === v.entrepreneurId)) {
                await prisma.spaceAssignment.update({ where: { id: a.id }, data: { rentContractId: c.id } });
                await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action: 'UPDATE', entityType: 'SpaceAssignment', entityId: a.id, newValues: { rentContractId: c.id }, oldValues: { rentContractId: null } });
            }
        }
        return c;
    }

    static async update(id: string, input: Record<string, unknown>, actor: Actor) {
        const before = await prisma.rentContract.findUnique({ where: { id } });
        if (!before) throw new DomainError('Kira sözleşmesi bulunamadı.', 404);
        const v = parseOrThrow(updateSchema, input);
        const data = await this.normalize({ ...before, ...v } as never, id, v);
        if (v.contractNo && v.contractNo !== before.contractNo && (await prisma.rentContract.findUnique({ where: { contractNo: v.contractNo } }))) {
            throw fieldError('Bu sözleşme numarası zaten kullanılıyor.', 409, 'contractNo', 'Mükerrer numara');
        }
        const expected = typeof input.expectedUpdatedAt === 'string' ? new Date(input.expectedUpdatedAt) : null;
        if (expected && Number.isNaN(+expected)) throw new DomainError('Geçersiz sürüm bilgisi.', 400);
        const res = await prisma.rentContract.updateMany({ where: { id, ...(expected ? { updatedAt: expected } : {}) }, data: data as never });
        if (res.count === 0) throw fieldError('Bu sözleşme siz düzenlerken başka biri tarafından değiştirildi. Sayfayı yenileyip tekrar deneyin.', 409, '_conflict', 'updatedAt');
        const changed = Object.fromEntries(Object.entries(data).filter(([k, val]) => String(val ?? '') !== String((before as Record<string, unknown>)[k] ?? '')));
        await audit(actor, 'UPDATE', id, changed, Object.fromEntries(Object.keys(changed).map((k) => [k, (before as Record<string, unknown>)[k]])));
        if (changed.status) await addTimelineEvent({ entityType: 'Entrepreneur', entityId: before.entrepreneurId, eventType: 'STATUS_CHANGE', title: `Kira sözleşmesi ${before.contractNo}: ${RENT_CONTRACT_STATUS_LABELS[String(changed.status)] ?? changed.status}`, actorId: actor.id, actorName: actor.name ?? null });
        return prisma.rentContract.findUniqueOrThrow({ where: { id } });
    }

    /** Ortak kurallar + hesaplanan alanlar. `changed` güncellemede gelen alanlardır. */
    private static async normalize(v: z.infer<typeof base>, id: string | null, changed?: Record<string, unknown>) {
        const touched = (k: string) => !changed || k in changed;
        if (v.endDate < v.startDate) throw fieldError('Form alanlarını kontrol edin.', 400, 'endDate', 'Bitiş başlangıçtan önce olamaz');
        if (v.freePeriodStart && v.freePeriodEnd && v.freePeriodEnd < v.freePeriodStart) throw fieldError('Form alanlarını kontrol edin.', 400, 'freePeriodEnd', 'Bitiş başlangıçtan önce olamaz');
        if (v.isWaived && !v.waiverReason) throw fieldError('Form alanlarını kontrol edin.', 400, 'waiverReason', 'Muafiyet gerekçesi girin');
        if (!id || touched('entrepreneurId')) {
            const ent = await prisma.entrepreneur.findUnique({ where: { id: v.entrepreneurId } });
            if (!ent) throw fieldError('Form alanlarını kontrol edin.', 400, 'entrepreneurId', 'Girişim bulunamadı');
        }
        let spaceName = v.spaceName ?? null;
        let areaM2 = v.areaM2 ?? null;
        let spaceType = v.spaceType;
        if (v.unitId && touched('unitId')) {
            const u = await prisma.spaceUnit.findUnique({ where: { id: v.unitId }, include: { floor: { include: { building: true } } } });
            if (!u || u.isArchived) throw fieldError('Form alanlarını kontrol edin.', 400, 'unitId', 'Aktif bir bağımsız bölüm seçin');
            spaceName ||= `${u.floor.building.name} · ${u.floor.name} · ${u.code}`;
            areaM2 ??= u.area;
            if (!changed || !('spaceType' in changed)) spaceType = (UNIT_TO_SPACE[u.unitType] as typeof spaceType) ?? spaceType;
        }
        if (!spaceName) throw fieldError('Form alanlarını kontrol edin.', 400, 'spaceName', 'Alan adı girin veya bağımsız bölüm seçin');
        const { vatAmount, totalMonthlyRent } = rentTotals(v.monthlyRent, v.vatRate);
        const out = {
            organizationId: v.organizationId ?? null, unitId: v.unitId ?? null, spaceName, roomDeskNo: v.roomDeskNo ?? null, areaM2, spaceType,
            contractNo: v.contractNo, contractDate: v.contractDate, startDate: v.startDate, endDate: v.endDate,
            commercialTitle: v.commercialTitle ?? null, contactPersonName: v.contactPersonName ?? null, contactEmail: v.contactEmail ?? null, contactPhone: v.contactPhone ?? null,
            monthlyRent: v.monthlyRent, currency: v.currency, vatRate: v.vatRate, vatAmount, totalMonthlyRent, dueDay: v.dueDay, depositAmount: v.depositAmount,
            isWaived: v.isWaived, freePeriodStart: v.freePeriodStart ?? null, freePeriodEnd: v.freePeriodEnd ?? null, waiverReason: v.waiverReason ?? null,
            autoRenew: v.autoRenew, renewalNoticeDays: v.renewalNoticeDays, status: v.status, contractDocUrl: v.contractDocUrl ?? null, notes: v.notes ?? null,
        };
        // Güncellemede yalnız gönderilen alanlar ve onlardan türeyen hesaplar yazılır
        if (!changed) return out;
        const derived = new Set<string>(Object.keys(changed));
        if ('monthlyRent' in changed || 'vatRate' in changed) { derived.add('vatAmount'); derived.add('totalMonthlyRent'); }
        if ('unitId' in changed) { derived.add('spaceName'); derived.add('areaM2'); derived.add('spaceType'); }
        return Object.fromEntries(Object.entries(out).filter(([k]) => derived.has(k))) as typeof out;
    }

    /** Yazdırılabilir çıktı için alan sözlüğü (şablon yer tutucuları da bu anahtarları kullanır). */
    static async printFields(id: string) {
        const c = await this.get(id);
        const d = (x: Date | null | undefined) => (x ? x.toLocaleDateString('tr-TR', { timeZone: 'UTC' }) : '');
        const m = (n: number | null | undefined) => (n === null || n === undefined ? '' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: c.currency || 'TRY' }).format(n));
        const fields: Record<string, { label: string; value: string }> = {
            sozlesmeNo: { label: 'Sözleşme no', value: c.contractNo },
            sozlesmeTarihi: { label: 'Sözleşme tarihi', value: d(c.contractDate) },
            durum: { label: 'Durum', value: RENT_CONTRACT_STATUS_LABELS[c.status] ?? c.status },
            girisim: { label: 'Girişim', value: c.entrepreneur.name },
            firmaUnvani: { label: 'Ticari unvan', value: c.commercialTitle ?? c.organization?.legalName ?? c.organization?.name ?? '' },
            vergiNo: { label: 'Vergi no', value: c.organization?.taxNumber ?? '' },
            vergiDairesi: { label: 'Vergi dairesi', value: c.organization?.taxOffice ?? '' },
            firmaAdresi: { label: 'Firma adresi', value: c.organization?.address ?? '' },
            yetkili: { label: 'Yetkili / iletişim kişisi', value: c.contactPersonName ?? '' },
            eposta: { label: 'E-posta', value: c.contactEmail ?? '' },
            telefon: { label: 'Telefon', value: c.contactPhone ?? '' },
            bina: { label: 'Bina', value: c.unit?.floor.building.name ?? '' },
            binaAdresi: { label: 'Bina adresi', value: c.unit?.floor.building.address ?? '' },
            kat: { label: 'Kat', value: c.unit?.floor.name ?? '' },
            bolum: { label: 'Bağımsız bölüm', value: c.unit?.code ?? c.roomDeskNo ?? '' },
            alanAdi: { label: 'Kiralanan alan', value: c.spaceName },
            alanTuru: { label: 'Alan türü', value: SPACE_TYPE_LABELS[c.spaceType] ?? (UNIT_TYPE_LABELS[c.spaceType] || c.spaceType) },
            metrekare: { label: 'Alan (m²)', value: c.areaM2 === null ? '' : new Intl.NumberFormat('tr-TR').format(c.areaM2) },
            baslangic: { label: 'Başlangıç', value: d(c.startDate) },
            bitis: { label: 'Bitiş', value: d(c.endDate) },
            aylikKira: { label: 'Aylık kira (KDV hariç)', value: c.isWaived ? 'Muaf' : m(c.monthlyRent) },
            kdvOrani: { label: 'KDV oranı', value: `%${c.vatRate}` },
            kdvTutari: { label: 'KDV tutarı', value: m(c.vatAmount) },
            toplamKira: { label: 'Aylık toplam (KDV dahil)', value: c.isWaived ? 'Muaf' : m(c.totalMonthlyRent) },
            vadeGunu: { label: 'Ödeme günü', value: `Her ayın ${c.dueDay}. günü` },
            depozito: { label: 'Depozito', value: m(c.depositAmount) },
            ucretsizDonem: { label: 'Ücretsiz dönem', value: c.freePeriodStart || c.freePeriodEnd ? `${d(c.freePeriodStart)} – ${d(c.freePeriodEnd)}` : '' },
            muafiyetGerekcesi: { label: 'Muafiyet gerekçesi', value: c.waiverReason ?? '' },
            otomatikYenileme: { label: 'Otomatik yenileme', value: c.autoRenew ? `Evet (${c.renewalNoticeDays} gün önceden bildirim)` : 'Hayır' },
            notlar: { label: 'Notlar', value: c.notes ?? '' },
        };
        const template = await ParameterService.getText('DOCUMENT_TEMPLATES', 'rent_contract_body');
        return { contract: c, fields, template };
    }
}

/** {{alan}} yer tutucularını doldurur; bilinmeyen yer tutucu olduğu gibi kalır (eksik bilgi görünür olsun). */
export function fillTemplate(template: string, fields: Record<string, { value: string }>) {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (all, key: string) => (key in fields ? fields[key].value || '……………' : all));
}
