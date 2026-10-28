import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { FieldValidationError, parseOrThrow, type Actor } from '@/lib/validate';

/**
 * Yönetilebilir sistem parametreleri. Kurumdan teyit edilmemiş seçenek ve eşik değerleri koda gömülmez;
 * yetkili kullanıcı panelden girer. Kayıt silinmez, pasife alınır.
 *
 * Yeni kategori eklemek için PARAMETER_CATEGORIES'e satır eklemek yeterlidir.
 */
export type ParameterKind = 'options' | 'number' | 'text';
export const PARAMETER_CATEGORIES: Record<string, { label: string; kind: ParameterKind; description: string; keys?: { key: string; label: string; unit?: string }[] }> = {
    POLICY_TYPE: { label: 'Poliçe türleri', kind: 'options', description: 'Bina ve bağımsız bölüm poliçelerinde seçilebilecek türler.' },
    ALERTS: {
        label: 'Uyarı süreleri', kind: 'number', description: 'Bitiş tarihi yaklaşan kayıtlar için uyarı eşikleri.',
        keys: [
            { key: 'expiry_warning_days', label: 'Poliçe / kira bitiş uyarısı', unit: 'gün' },
            { key: 'critical_days', label: 'Kritik uyarı (yenileme zorunlu, panelde kırmızı)', unit: 'gün' },
        ],
    },
    DOCUMENT_TEMPLATES: {
        label: 'Belge şablonları', kind: 'text',
        description: 'Kurumun kendi metni. {{alan}} yer tutucuları kayıttaki bilgilerle doldurulur (ör. {{firmaUnvani}}, {{aylikKira}}). Boş bırakılırsa çıktı yalnız bilgi formu olur.',
        keys: [{ key: 'rent_contract_body', label: 'Kira sözleşmesi metni' }],
    },
    MENTORING: {
        label: 'Mentörlük ve girişim sağlığı', kind: 'number',
        description: 'Panelde mentörlük hedefi ve girişim sağlık durumu için eşikler. Tanımlanmayan eşikte durum hesaplanmaz.',
        keys: [
            { key: 'monthly_target_hours', label: 'Aylık mentörlük hedefi', unit: 'saat' },
            { key: 'health_min_entries_30d', label: 'Sağlıklı sayılmak için son 30 gün en az ofis girişi', unit: 'giriş' },
            { key: 'health_min_mentor_hours_30d', label: 'Sağlıklı sayılmak için son 30 gün en az mentörlük', unit: 'saat' },
        ],
    },
    PDKS: {
        label: 'PDKS sınırları', kind: 'number', description: 'Çalışma süresi raporunda kırmızı işaretlenecek sınırlar.',
        keys: [
            { key: 'daily_limit_hours', label: 'Günlük çalışma sınırı', unit: 'saat' },
            { key: 'weekly_limit_hours', label: 'Haftalık çalışma sınırı', unit: 'saat' },
        ],
    },
};

/** Parametre girilmemişse kullanılan geçici değerler — ekranda "varsayılan" olarak işaretlenir. */
// PDKS sınırları görev tanımında verilen değerlerdir (günlük 11, haftalık 45 saat); panelden değiştirilebilir.
const FALLBACKS: Record<string, number> = { 'ALERTS.expiry_warning_days': 30, 'ALERTS.critical_days': 15, 'PDKS.daily_limit_hours': 11, 'PDKS.weekly_limit_hours': 45 };

const keySchema = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_\-]+$/, 'Yalnız harf, rakam, - ve _');
export const parameterSchema = z.object({
    category: z.string().refine((c) => c in PARAMETER_CATEGORIES, 'Bilinmeyen kategori'),
    key: keySchema,
    label: z.string().trim().min(1).max(200),
    value: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().trim().max(50000).optional()), // belge şablonları uzun olabilir
    description: z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(1000).optional()),
    sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
});
// Zod 4'te .partial() varsayılanı uygular; güncellemede gönderilmeyen sıra değişmesin diye varsayılansız
const updateSchema = parameterSchema.omit({ category: true, key: true }).extend({ sortOrder: z.coerce.number().int().min(0).max(100000) }).partial();

function validateValue(category: string, value: string | undefined) {
    if (PARAMETER_CATEGORIES[category]?.kind === 'number') {
        const n = Number(value);
        if (value === undefined || !Number.isFinite(n) || n < 0) throw new FieldValidationError('Form alanlarını kontrol edin.', { value: 'Sıfır veya pozitif bir sayı girin' });
    }
}

async function audit(actor: Actor, action: string, id: string, newValues: Record<string, unknown>, oldValues?: Record<string, unknown>) {
    await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action, entityType: 'SystemParameter', entityId: id, newValues, oldValues: oldValues ?? null });
}

export class ParameterService {
    static async list(category?: string, includeInactive = false) {
        if (category && !(category in PARAMETER_CATEGORIES)) throw new DomainError('Bilinmeyen kategori.', 400);
        return prisma.systemParameter.findMany({
            where: { ...(category ? { category } : {}), ...(includeInactive ? {} : { isActive: true }) },
            orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
        });
    }

    /** Seçenek listesi (aktif kayıtlar): { value: key, label } */
    static async options(category: string) {
        const rows = await this.list(category);
        return rows.map((r) => ({ value: r.key, label: r.label }));
    }

    /** Sayısal eşik; kayıt yoksa geçici varsayılan döner ve bu durum işaretlenir. */
    static async getNumber(category: string, key: string): Promise<{ value: number; isDefault: boolean }> {
        const row = await prisma.systemParameter.findUnique({ where: { category_key: { category, key } } });
        const n = row?.isActive ? Number(row.value) : NaN;
        if (Number.isFinite(n)) return { value: n, isDefault: false };
        const fb = FALLBACKS[`${category}.${key}`];
        if (fb === undefined) throw new DomainError(`"${category}.${key}" parametresi tanımlı değil.`, 500);
        return { value: fb, isDefault: true };
    }

    /** Sayısal parametre; tanımlı değilse null (varsayılan uydurulmaz). */
    static async getNumberOrNull(category: string, key: string): Promise<number | null> {
        const row = await prisma.systemParameter.findUnique({ where: { category_key: { category, key } } });
        const n = row?.isActive ? Number(row.value) : NaN;
        return Number.isFinite(n) ? n : null;
    }

    /** Metin parametresi (belge şablonu vb.); tanımlı değilse null. */
    static async getText(category: string, key: string): Promise<string | null> {
        const row = await prisma.systemParameter.findUnique({ where: { category_key: { category, key } } });
        return row?.isActive && row.value ? row.value : null;
    }

    static async create(input: unknown, actor: Actor) {
        const v = parseOrThrow(parameterSchema, input);
        const keys = PARAMETER_CATEGORIES[v.category].keys;
        if (keys && !keys.some((k) => k.key === v.key)) throw new FieldValidationError('Form alanlarını kontrol edin.', { key: 'Bu kategoride tanımlı bir anahtar seçin' });
        validateValue(v.category, v.value);
        const dup = await prisma.systemParameter.findUnique({ where: { category_key: { category: v.category, key: v.key } } });
        if (dup) throw new FieldValidationError('Bu anahtar bu kategoride zaten var.', { key: dup.isActive ? 'Mükerrer anahtar' : 'Pasif bir kayıtta kullanılıyor; onu yeniden etkinleştirin' }, 409);
        const row = await prisma.systemParameter.create({ data: { ...v, updatedById: actor.id } });
        await audit(actor, 'PARAMETER_CREATE', row.id, v);
        return row;
    }

    static async update(id: string, input: unknown, expectedUpdatedAt: string | undefined, actor: Actor) {
        const before = await prisma.systemParameter.findUnique({ where: { id } });
        if (!before) throw new DomainError('Parametre bulunamadı.', 404);
        const body = (input ?? {}) as Record<string, unknown>;
        if (typeof body.isActive === 'boolean') {
            const row = await prisma.systemParameter.update({ where: { id }, data: { isActive: body.isActive, updatedById: actor.id } });
            await audit(actor, body.isActive ? 'RESTORE' : 'ARCHIVE', id, { isActive: body.isActive }, { isActive: before.isActive });
            return row;
        }
        const v = parseOrThrow(updateSchema, input);
        if ('value' in v || PARAMETER_CATEGORIES[before.category]?.kind === 'number') validateValue(before.category, v.value ?? before.value ?? undefined);
        const where = expectedUpdatedAt ? { id, updatedAt: new Date(expectedUpdatedAt) } : { id };
        const res = await prisma.systemParameter.updateMany({ where, data: { ...v, updatedById: actor.id } });
        if (res.count === 0) throw new FieldValidationError('Bu kayıt siz düzenlerken değiştirildi. Sayfayı yenileyip tekrar deneyin.', { _conflict: 'updatedAt' }, 409);
        await audit(actor, 'PARAMETER_UPDATE', id, v, { label: before.label, value: before.value, description: before.description, sortOrder: before.sortOrder });
        return prisma.systemParameter.findUniqueOrThrow({ where: { id } });
    }
}
