import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { hasPermission } from '@/lib/rbac';
import { DomainError } from '@/lib/errors';
import { fieldError, parseOrThrow, type Actor } from '@/lib/validate';
import { revealStoredTcNumber } from '@/lib/security/identity-security';
import { ParameterService } from '@/lib/services/parameter-service';
import { applyList, parseListParams } from '@/lib/list/list-query';
import { exportList, parseExportFormat, type ExportColumn } from '@/lib/list/export';
import {
    normalizeUid, parseDirection, parseCsv, parseLocalDateTime, pairSessions, totals, onSite, istanbulDay, fmtMinutes,
    type Direction, type PdksEvent, type ReportType,
} from '@/lib/pdks/calc';

/**
 * PDKS: RFID kart tanımlama, giriş-çıkış hareketi (manuel / CSV / cihaz), oturum eşleştirme, çalışma süresi raporu.
 * Kimlik numarası kartta tutulmaz; kartın bağlı olduğu Person kaydından maskeli gelir, açılması ayrı izin + denetim ister.
 * Hareket silinmez; hatalı kayıt gerekçeyle geçersiz (void) yapılır.
 */

export const HOLDER_TYPES = ['STAFF', 'MEMBER', 'VISITOR', 'OTHER'] as const;
export const HOLDER_TYPE_LABELS: Record<string, string> = { STAFF: 'TEKMER personeli', MEMBER: 'Girişim çalışanı', VISITOR: 'Ziyaretçi', OTHER: 'Diğer', UNKNOWN: 'Tanımsız kart' };
export const CARD_STATUSES = ['ACTIVE', 'LOST', 'BLOCKED', 'RETURNED'] as const;
export const CARD_STATUS_LABELS: Record<string, string> = { ACTIVE: 'Aktif', LOST: 'Kayıp', BLOCKED: 'Bloke', RETURNED: 'İade edildi' };
export const SOURCE_LABELS: Record<string, string> = { MANUAL: 'Manuel', CSV: 'CSV', DEVICE: 'Cihaz' };
const MAX_CSV_ROWS = 5000;

type UserLike = Parameters<typeof hasPermission>[0];

async function audit(actor: Actor, action: string, entityType: string, entityId: string | null, newValues?: Record<string, unknown>, oldValues?: Record<string, unknown>, isPiiAccess = false) {
    await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action, entityType, entityId, newValues: newValues ?? null, oldValues: oldValues ?? null, isPiiAccess });
}

const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optStr = (max = 2000) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional());
const optUuid = z.preprocess(blankToNull, z.string().uuid('Geçerli bir kayıt seçin').nullable().optional());
const optDate = z.preprocess(blankToNull, z.coerce.date().nullable().optional());
const uid = z.string().transform((v, ctx) => {
    const n = normalizeUid(v);
    if (!n) { ctx.addIssue({ code: 'custom', message: 'Kart UID 4–32 harf/rakam olmalı' }); return z.NEVER; }
    return n;
});

const cardBase = z.object({
    cardUid: uid, label: optStr(60), holderType: z.enum(HOLDER_TYPES), personId: optUuid, entrepreneurId: optUuid,
    holderName: optStr(200), validFrom: optDate, validUntil: optDate, notes: optStr(),
});
const cardUpdate = cardBase.partial().extend({ status: z.enum(CARD_STATUSES).optional() });
const eventSchema = z.object({
    cardId: optUuid, cardUid: z.preprocess(blankToNull, uid.nullable().optional()), direction: z.enum(['IN', 'OUT']),
    occurredAt: z.coerce.date({ message: 'Tarih ve saat gerekli' }), note: optStr(500),
});
const deviceSchema = z.object({
    code: z.string().trim().min(2).max(64).regex(/^[A-Za-z0-9_\-.]+$/, 'Harf, rakam, - _ .'), name: z.string().trim().min(2).max(120),
    buildingId: optUuid, location: optStr(200), direction: z.enum(['IN', 'OUT', 'BOTH']), notes: optStr(),
});

/** Kart sahibinin ekranda görünen adı ve firması (kişi / girişim kaydından). */
async function resolveHolder(v: { holderType: string; personId?: string | null; entrepreneurId?: string | null; holderName?: string | null }) {
    let name = v.holderName ?? null;
    if (v.personId) {
        const p = await prisma.person.findUnique({ where: { id: v.personId }, select: { fullName: true } });
        if (!p) throw fieldError('Form alanlarını kontrol edin.', 400, 'personId', 'Kişi bulunamadı');
        name ||= p.fullName;
    }
    if (v.entrepreneurId) {
        const e = await prisma.entrepreneur.findUnique({ where: { id: v.entrepreneurId }, select: { id: true } });
        if (!e) throw fieldError('Form alanlarını kontrol edin.', 400, 'entrepreneurId', 'Girişim bulunamadı');
    }
    if (v.holderType === 'MEMBER' && !v.entrepreneurId) throw fieldError('Form alanlarını kontrol edin.', 400, 'entrepreneurId', 'Girişim çalışanı için girişim seçin');
    if (!name) throw fieldError('Form alanlarını kontrol edin.', 400, 'holderName', 'Kart sahibinin adını girin veya rehberden kişi seçin');
    return name;
}

// ─── Olay kaydı (tek giriş noktası: manuel, CSV ve cihaz aynı kuralları kullanır) ─────

type EventInput = { cardUid: string; direction: Direction; occurredAt: Date; source: 'MANUAL' | 'CSV' | 'DEVICE'; deviceId?: string | null; externalId?: string | null; note?: string | null; createdById?: string | null };
type RecordResult = { status: 'created'; id: string } | { status: 'duplicate' } | { status: 'rejected'; reason: string };

async function recordEvent(e: EventInput, opts: { requireKnownCard: boolean }): Promise<RecordResult> {
    if (+e.occurredAt > Date.now() + 5 * 60000) return { status: 'rejected', reason: 'Gelecek zamanlı hareket' };
    const card = await prisma.accessCard.findUnique({ where: { cardUid: e.cardUid } });
    if (!card && opts.requireKnownCard) return { status: 'rejected', reason: 'Kart tanımlı değil' };
    if (card && card.status !== 'ACTIVE' && opts.requireKnownCard) return { status: 'rejected', reason: `Kart ${CARD_STATUS_LABELS[card.status]?.toLowerCase() ?? card.status}` };
    if (e.externalId && (await prisma.accessEvent.findUnique({ where: { externalId: e.externalId } }))) return { status: 'duplicate' };
    try {
        const row = await prisma.accessEvent.create({
            data: {
                cardId: card?.id ?? null, cardUid: e.cardUid, holderName: card?.holderName ?? 'Tanımsız kart', holderType: card?.holderType ?? 'UNKNOWN',
                entrepreneurId: card?.entrepreneurId ?? null, direction: e.direction, occurredAt: e.occurredAt, source: e.source,
                deviceId: e.deviceId ?? null, externalId: e.externalId ?? null, note: e.note ?? (card && card.status !== 'ACTIVE' ? `Kart durumu: ${CARD_STATUS_LABELS[card.status]}` : null), createdById: e.createdById ?? null,
            },
        });
        return { status: 'created', id: row.id };
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return { status: 'duplicate' };
        throw err;
    }
}

function monthRange(year: number, month: number) {
    const start = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+03:00`);
    const next = month === 12 ? new Date(`${year + 1}-01-01T00:00:00+03:00`) : new Date(`${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00+03:00`);
    return { start, next };
}

/** Firma*, Yıl*, Ay* zorunlu (kapsam: girişim kimliği, STAFF, VISITOR veya ALL). */
function requireScope(sp: URLSearchParams) {
    const scope = sp.get('scope') ?? '';
    const year = Number(sp.get('year'));
    const month = Number(sp.get('month'));
    const missing = [!scope && 'Firma', !(year >= 2000 && year <= 2100) && 'Yıl', !(month >= 1 && month <= 12) && 'Ay'].filter(Boolean);
    if (missing.length) throw new DomainError(`Sorgu için ${missing.join(', ')} seçin.`, 400);
    const where: Prisma.AccessEventWhereInput = scope === 'ALL' ? {} : scope === 'STAFF' || scope === 'VISITOR' || scope === 'OTHER' || scope === 'UNKNOWN' ? { holderType: scope } : { entrepreneurId: scope };
    return { scope, year, month, where, ...monthRange(year, month) };
}

const toPdks = (e: { id: string; cardUid: string; holderName: string; holderType: string; entrepreneurId: string | null; direction: string; occurredAt: Date }): PdksEvent => ({ ...e, direction: e.direction as Direction });
const fmtDT = (d: Date | null) => (d ? d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' }) : '');

export class PdksService {
    // ─── Kartlar ─────────────────────────────────────────────────────────────

    static async listCards(sp: URLSearchParams, user: UserLike, actor: Actor) {
        const p = parseListParams(sp, { filterKeys: ['status', 'holderType', 'entrepreneurId'], sortable: ['holderName', 'cardUid', 'label', 'holderType', 'status', 'issuedAt', 'lastEventAt', 'entrepreneurName'] });
        const rows = await prisma.accessCard.findMany({
            where: { ...(p.filters.status ? { status: p.filters.status } : p.includeArchived ? {} : { status: { in: ['ACTIVE', 'LOST', 'BLOCKED'] } }), ...(p.filters.holderType ? { holderType: p.filters.holderType } : {}), ...(p.filters.entrepreneurId ? { entrepreneurId: p.filters.entrepreneurId } : {}) },
            include: { person: { select: { id: true, fullName: true, tcNumberMasked: true } }, entrepreneur: { select: { id: true, name: true } }, events: { where: { isVoid: false }, orderBy: { occurredAt: 'desc' }, take: 1, select: { occurredAt: true, direction: true } } },
        });
        const today = istanbulDay(new Date());
        const items = rows.map((c) => ({
            id: c.id, cardUid: c.cardUid, label: c.label, holderType: c.holderType, holderTypeLabel: HOLDER_TYPE_LABELS[c.holderType] ?? c.holderType, holderName: c.holderName,
            personId: c.personId, personName: c.person?.fullName ?? null, identityMasked: c.person?.tcNumberMasked ?? null,
            entrepreneurId: c.entrepreneurId, entrepreneurName: c.entrepreneur?.name ?? null, status: c.status, statusLabel: CARD_STATUS_LABELS[c.status] ?? c.status,
            validFrom: c.validFrom, validUntil: c.validUntil, issuedAt: c.issuedAt, returnedAt: c.returnedAt, notes: c.notes, updatedAt: c.updatedAt,
            isArchived: c.status === 'RETURNED',
            lastEventAt: c.events[0]?.occurredAt ?? null, lastDirection: c.events[0]?.direction ?? null,
            onSite: Boolean(c.events[0] && c.events[0].direction === 'IN' && istanbulDay(c.events[0].occurredAt) === today),
        }));
        const format = parseExportFormat(sp.get('export'));
        const result = applyList(items, p, { search: (r) => [r.holderName, r.cardUid, r.label, r.entrepreneurName, r.personName], sortValue: (r, k) => (r as Record<string, any>)[k], defaultSort: { key: 'holderName', dir: 'asc' }, paginate: !format });
        if (format) {
            if (!hasPermission(user, 'view', 'pdks')) throw new DomainError('Yetkiniz yok.', 403);
            const cols: ExportColumn<(typeof items)[number]>[] = [
                { label: 'Kart sahibi', value: (r) => r.holderName }, { label: 'Tür', value: (r) => r.holderTypeLabel }, { label: 'Firma', value: (r) => r.entrepreneurName },
                { label: 'Kart UID', value: (r) => r.cardUid }, { label: 'Etiket', value: (r) => r.label }, { label: 'Kimlik (maskeli)', value: (r) => r.identityMasked },
                { label: 'Durum', value: (r) => r.statusLabel }, { label: 'Geçerlilik bitişi', value: (r) => fmtDT(r.validUntil) }, { label: 'Son hareket', value: (r) => fmtDT(r.lastEventAt) },
            ];
            return exportList({ format, title: 'PDKS Kartları', entityType: 'AccessCard', columns: cols, rows: result.items, filters: { ...(p.q ? { Arama: p.q } : {}), ...p.filters }, actor: { id: actor.id, name: actor.name ?? null, email: actor.email ?? null } });
        }
        return result;
    }

    static async createCard(input: unknown, actor: Actor) {
        const v = parseOrThrow(cardBase, input);
        const existing = await prisma.accessCard.findUnique({ where: { cardUid: v.cardUid } });
        if (existing) throw fieldError(`Bu kart zaten kayıtlı (${existing.holderName}, ${CARD_STATUS_LABELS[existing.status]}). Yeniden atamak için kart kaydını düzenleyin.`, 409, 'cardUid', 'Kart kayıtlı');
        if (v.validFrom && v.validUntil && v.validUntil < v.validFrom) throw fieldError('Form alanlarını kontrol edin.', 400, 'validUntil', 'Bitiş başlangıçtan önce olamaz');
        const holderName = await resolveHolder(v);
        const card = await prisma.accessCard.create({ data: { ...v, holderName, createdById: actor.id } });
        await audit(actor, 'PDKS_CARD_CREATE', 'AccessCard', card.id, { cardUid: v.cardUid, holderType: v.holderType, holderName, entrepreneurId: v.entrepreneurId ?? null });
        return card;
    }

    /** Düzenleme / yeniden atama / durum değişikliği (kayıp, bloke, iade). Kart silinmez. */
    static async updateCard(id: string, input: Record<string, unknown>, actor: Actor) {
        const before = await prisma.accessCard.findUnique({ where: { id } });
        if (!before) throw new DomainError('Kart bulunamadı.', 404);
        const v = parseOrThrow(cardUpdate, input);
        if (v.cardUid && v.cardUid !== before.cardUid && (await prisma.accessCard.findUnique({ where: { cardUid: v.cardUid } }))) throw fieldError('Bu kart UID başka bir kayıtta.', 409, 'cardUid', 'Kart kayıtlı');
        const merged = { ...before, ...v };
        const holderChanged = ['holderType', 'personId', 'entrepreneurId', 'holderName'].some((k) => k in v);
        const holderName = holderChanged ? await resolveHolder({ ...merged, holderName: 'holderName' in v ? v.holderName : 'personId' in v ? null : before.holderName }) : before.holderName;
        const data = {
            ...v, holderName,
            ...(v.status === 'RETURNED' && before.status !== 'RETURNED' ? { returnedAt: new Date() } : {}),
            ...(v.status === 'ACTIVE' && before.status === 'RETURNED' ? { returnedAt: null, issuedAt: new Date() } : {}),
        };
        const expected = typeof input.expectedUpdatedAt === 'string' ? new Date(input.expectedUpdatedAt) : null;
        const res = await prisma.accessCard.updateMany({ where: { id, ...(expected ? { updatedAt: expected } : {}) }, data });
        if (res.count === 0) throw fieldError('Bu kart siz düzenlerken değiştirildi. Sayfayı yenileyin.', 409, '_conflict', 'updatedAt');
        await audit(actor, v.status && v.status !== before.status ? 'PDKS_CARD_STATUS' : 'PDKS_CARD_UPDATE', 'AccessCard', id, data, Object.fromEntries(Object.keys(data).map((k) => [k, (before as Record<string, unknown>)[k]])));
        return prisma.accessCard.findUniqueOrThrow({ where: { id } });
    }

    /** Maskesiz kimlik no (KVKK): ayrı izin ister, her açılış denetim kaydı (PII_ACCESS) üretir. */
    static async revealIdentity(cardId: string, user: UserLike, actor: Actor) {
        if (!hasPermission(user, 'view_identity', 'pdks')) throw new DomainError('Kimlik numarasını görme yetkiniz yok.', 403);
        const card = await prisma.accessCard.findUnique({ where: { id: cardId }, include: { person: { select: { id: true, tcNumberEncrypted: true } } } });
        if (!card) throw new DomainError('Kart bulunamadı.', 404);
        if (!card.person?.tcNumberEncrypted) throw new DomainError('Bu kart sahibinin kayıtlı kimlik numarası yok.', 404);
        const tc = revealStoredTcNumber(card.person.tcNumberEncrypted);
        await audit(actor, 'PII_ACCESS', 'Person', card.person.id, { field: 'tcNumber', via: 'PDKS', cardId }, undefined, true);
        return { identity: tc };
    }

    // ─── Hareketler ──────────────────────────────────────────────────────────

    static async createManualEvent(input: unknown, actor: Actor) {
        const v = parseOrThrow(eventSchema, input);
        let cardUid = v.cardUid ?? null;
        if (v.cardId) cardUid = (await prisma.accessCard.findUnique({ where: { id: v.cardId }, select: { cardUid: true } }))?.cardUid ?? null;
        if (!cardUid) throw fieldError('Form alanlarını kontrol edin.', 400, 'cardId', 'Kart seçin');
        const r = await recordEvent({ cardUid, direction: v.direction, occurredAt: v.occurredAt, source: 'MANUAL', note: v.note, createdById: actor.id }, { requireKnownCard: true });
        if (r.status === 'duplicate') throw fieldError('Bu kişi için aynı zaman ve yönde hareket zaten kayıtlı.', 409, 'occurredAt', 'Mükerrer hareket');
        if (r.status === 'rejected') throw fieldError(r.reason, 400, 'cardId', r.reason);
        await audit(actor, 'PDKS_EVENT_CREATE', 'AccessEvent', r.id, { cardUid, direction: v.direction, occurredAt: v.occurredAt, source: 'MANUAL' });
        return { id: r.id };
    }

    /** CSV: kart_uid;yon;tarih_saat[;cihaz;olay_id] — başlık satırı otomatik atlanır. İdempotent; satır satır sonuç döner. */
    static async importCsv(text: string, actor: Actor) {
        const rows = parseCsv(text);
        if (!rows.length) throw new DomainError('Dosya boş.', 400);
        const header = rows[0].map((h) => h.trim().toLocaleLowerCase('tr-TR'));
        const hasHeader = header.some((h) => /kart|uid|yon|yön|tarih|direction|time/.test(h));
        const body = hasHeader ? rows.slice(1) : rows;
        if (body.length > MAX_CSV_ROWS) throw new DomainError(`En fazla ${MAX_CSV_ROWS} satır içe aktarılabilir.`, 400);
        const col = (names: string[], fallback: number) => {
            if (!hasHeader) return fallback;
            const i = header.findIndex((h) => names.some((n) => h.includes(n)));
            return i >= 0 ? i : fallback;
        };
        const ci = { uid: col(['kart', 'uid', 'card'], 0), dir: col(['yon', 'yön', 'direction'], 1), at: col(['tarih', 'zaman', 'time', 'date'], 2), device: col(['cihaz', 'device'], 3), ext: col(['olay', 'event'], 4) };
        const devices = new Map((await prisma.accessDevice.findMany({ select: { id: true, code: true } })).map((d) => [d.code, d.id]));
        const report = { created: 0, duplicates: 0, errors: [] as { line: number; reason: string }[] };
        for (let i = 0; i < body.length; i++) {
            const r = body[i];
            const line = i + 1 + (hasHeader ? 1 : 0);
            const cardUid = normalizeUid(r[ci.uid] ?? '');
            const direction = parseDirection(r[ci.dir] ?? '');
            const occurredAt = parseLocalDateTime(r[ci.at] ?? '');
            if (!cardUid || !direction || !occurredAt) { report.errors.push({ line, reason: !cardUid ? 'Kart UID geçersiz' : !direction ? 'Yön GİRİŞ/ÇIKIŞ olmalı' : 'Tarih-saat biçimi YYYY-AA-GG SS:DD olmalı' }); continue; }
            const res = await recordEvent({ cardUid, direction, occurredAt, source: 'CSV', deviceId: devices.get((r[ci.device] ?? '').trim()) ?? null, externalId: (r[ci.ext] ?? '').trim() || null, createdById: actor.id }, { requireKnownCard: true });
            if (res.status === 'created') report.created++;
            else if (res.status === 'duplicate') report.duplicates++;
            else report.errors.push({ line, reason: res.reason });
        }
        await audit(actor, 'PDKS_CSV_IMPORT', 'AccessEvent', null, { rows: body.length, created: report.created, duplicates: report.duplicates, errors: report.errors.length });
        return { ...report, rows: body.length };
    }

    /** Cihaz entegrasyonu (/api/v1/pdks/events). Tanımsız kart da kaydedilir (güvenlik için görünür olsun). */
    static async ingestFromDevice(input: unknown, apiKeyName: string) {
        const body = (input ?? {}) as { deviceCode?: unknown; events?: unknown };
        const code = typeof body.deviceCode === 'string' ? body.deviceCode.trim() : '';
        const device = code ? await prisma.accessDevice.findUnique({ where: { code } }) : null;
        if (!device || !device.isActive) throw new DomainError('Cihaz tanımlı değil veya pasif. PDKS → Cihazlar ekranından kaydedin.', 404);
        const list = Array.isArray(body.events) ? body.events.slice(0, 500) : [];
        if (!list.length) throw new DomainError('events dizisi boş.', 400);
        const result = { accepted: 0, duplicates: 0, unknownCards: 0, rejected: [] as { index: number; reason: string }[] };
        for (let i = 0; i < list.length; i++) {
            const e = (list[i] ?? {}) as Record<string, unknown>;
            const cardUid = normalizeUid(String(e.cardUid ?? ''));
            const direction = device.direction === 'BOTH' ? parseDirection(String(e.direction ?? '')) : (device.direction as Direction);
            const occurredAt = typeof e.occurredAt === 'string' ? parseLocalDateTime(e.occurredAt) : null;
            if (!cardUid || !direction || !occurredAt) { result.rejected.push({ index: i, reason: !cardUid ? 'cardUid' : !direction ? 'direction' : 'occurredAt (ISO 8601, saat dilimiyle)' }); continue; }
            const externalId = e.eventId ? `${device.code}:${String(e.eventId).slice(0, 100)}` : null;
            const known = await prisma.accessCard.count({ where: { cardUid } });
            const r = await recordEvent({ cardUid, direction, occurredAt, source: 'DEVICE', deviceId: device.id, externalId }, { requireKnownCard: false });
            if (r.status === 'created') { result.accepted++; if (!known) result.unknownCards++; }
            else if (r.status === 'duplicate') result.duplicates++;
            else result.rejected.push({ index: i, reason: r.reason });
        }
        await prisma.accessDevice.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
        await logAuditEvent({ actorName: `API: ${apiKeyName}`, action: 'PDKS_DEVICE_INGEST', entityType: 'AccessDevice', entityId: device.id, newValues: { ...result, rejected: result.rejected.length } });
        return result;
    }

    static async voidEvent(id: string, reason: string, actor: Actor) {
        const r = String(reason ?? '').trim();
        if (r.length < 3) throw fieldError('Gerekçe girin.', 400, 'reason', 'En az 3 karakter');
        const ev = await prisma.accessEvent.findUnique({ where: { id } });
        if (!ev) throw new DomainError('Hareket bulunamadı.', 404);
        if (ev.isVoid) throw new DomainError('Hareket zaten geçersiz.', 409);
        await prisma.accessEvent.update({ where: { id }, data: { isVoid: true, voidReason: r } });
        await audit(actor, 'PDKS_EVENT_VOID', 'AccessEvent', id, { isVoid: true, voidReason: r });
        return { ok: true };
    }

    /** PDKS Bilgileri: ham hareket listesi (Firma*, Yıl*, Ay* zorunlu), veritabanında sayfalanır. */
    static async listEvents(sp: URLSearchParams, actor: Actor) {
        const s = requireScope(sp);
        const p = parseListParams(sp, { filterKeys: ['direction', 'source'], sortable: ['occurredAt', 'holderName', 'direction'] });
        const where: Prisma.AccessEventWhereInput = {
            ...s.where, occurredAt: { gte: s.start, lt: s.next },
            ...(p.includeArchived ? {} : { isVoid: false }),
            ...(p.filters.direction ? { direction: p.filters.direction } : {}),
            ...(p.filters.source ? { source: p.filters.source } : {}),
            ...(p.q ? { OR: [{ holderName: { contains: p.q, mode: 'insensitive' } }, { cardUid: { contains: p.q.toUpperCase() } }] } : {}),
        };
        const orderBy: Prisma.AccessEventOrderByWithRelationInput = { [p.sort ?? 'occurredAt']: p.sort ? p.dir : 'desc' };
        const format = parseExportFormat(sp.get('export'));
        const [total, rows] = await Promise.all([
            prisma.accessEvent.count({ where }),
            prisma.accessEvent.findMany({ where, orderBy, skip: format ? 0 : (p.page - 1) * p.pageSize, take: format ? 20000 : p.pageSize, include: { device: { select: { name: true } }, entrepreneur: { select: { name: true } } } }),
        ]);
        const items = rows.map((e) => ({ id: e.id, cardUid: e.cardUid, holderName: e.holderName, holderType: e.holderType, holderTypeLabel: HOLDER_TYPE_LABELS[e.holderType] ?? e.holderType, entrepreneurName: e.entrepreneur?.name ?? null, direction: e.direction, occurredAt: e.occurredAt, source: e.source, sourceLabel: SOURCE_LABELS[e.source] ?? e.source, deviceName: e.device?.name ?? null, note: e.note, isArchived: e.isVoid, voidReason: e.voidReason }));
        if (format) {
            const cols: ExportColumn<(typeof items)[number]>[] = [
                { label: 'Tarih-saat', value: (r) => fmtDT(r.occurredAt) }, { label: 'Kişi', value: (r) => r.holderName }, { label: 'Tür', value: (r) => r.holderTypeLabel }, { label: 'Firma', value: (r) => r.entrepreneurName },
                { label: 'Yön', value: (r) => (r.direction === 'IN' ? 'Giriş' : 'Çıkış') }, { label: 'Kaynak', value: (r) => r.sourceLabel }, { label: 'Cihaz', value: (r) => r.deviceName }, { label: 'Kart UID', value: (r) => r.cardUid }, { label: 'Not', value: (r) => r.voidReason ? `GEÇERSİZ: ${r.voidReason}` : r.note },
            ];
            return exportList({ format, title: 'PDKS Bilgileri', entityType: 'AccessEvent', columns: cols, rows: items, filters: { Kapsam: s.scope, Dönem: `${s.year}-${String(s.month).padStart(2, '0')}`, ...p.filters }, actor: { id: actor.id, name: actor.name ?? null, email: actor.email ?? null } });
        }
        return { items, total, page: p.page, pageSize: p.pageSize, pageCount: Math.max(1, Math.ceil(total / p.pageSize)) };
    }

    private static async scopedEvents(sp: URLSearchParams) {
        const s = requireScope(sp);
        // Ay sınırındaki oturumların eşleşmesi için 1 gün önce / sonrası da okunur; sonuç dönem gününe göre filtrelenir
        const rows = await prisma.accessEvent.findMany({
            where: { ...s.where, isVoid: false, occurredAt: { gte: new Date(+s.start - 86400000), lt: new Date(+s.next + 86400000) } },
            select: { id: true, cardUid: true, holderName: true, holderType: true, entrepreneurId: true, direction: true, occurredAt: true },
        });
        const prefix = `${s.year}-${String(s.month).padStart(2, '0')}`;
        return { s, events: rows.map(toPdks), inPeriod: (day: string) => day.startsWith(prefix) };
    }

    /** PDKS Detay: giriş-çıkış eşleşmeleri ve eşleşmeyen hareket uyarıları. */
    static async sessions(sp: URLSearchParams, actor: Actor) {
        const { s, events, inPeriod } = await this.scopedEvents(sp);
        const p = parseListParams(sp, { filterKeys: ['problem'], sortable: ['holderName', 'day', 'minutes', 'inAt'] });
        const rows = pairSessions(events).filter((x) => inPeriod(x.day)).map((x, i) => ({ id: `${x.cardUid}-${i}`, ...x, holderTypeLabel: HOLDER_TYPE_LABELS[x.holderType] ?? x.holderType, duration: x.problem ? '' : fmtMinutes(x.minutes) }));
        const filtered = p.filters.problem === 'ONLY' ? rows.filter((r) => r.problem) : rows;
        const format = parseExportFormat(sp.get('export'));
        const result = applyList(filtered, p, { search: (r) => [r.holderName, r.cardUid], sortValue: (r, k) => (r as Record<string, any>)[k], defaultSort: { key: 'day', dir: 'asc' }, paginate: !format });
        const warnings = rows.filter((r) => r.problem).length;
        if (format) {
            const cols: ExportColumn<(typeof rows)[number]>[] = [
                { label: 'Gün', value: (r) => r.day }, { label: 'Kişi', value: (r) => r.holderName }, { label: 'Giriş', value: (r) => fmtDT(r.inAt) }, { label: 'Çıkış', value: (r) => fmtDT(r.outAt) },
                { label: 'Süre', value: (r) => r.duration }, { label: 'Uyarı', value: (r) => (r.problem === 'NO_OUT' ? 'Çıkış kaydı yok' : r.problem === 'NO_IN' ? 'Giriş kaydı yok' : '') },
            ];
            return exportList({ format, title: 'PDKS Detay Bilgileri', entityType: 'AccessEvent', columns: cols, rows: result.items, filters: { Kapsam: s.scope, Dönem: `${s.year}-${s.month}` }, actor: { id: actor.id, name: actor.name ?? null, email: actor.email ?? null } });
        }
        return { ...result, warnings };
    }

    /** PDKS Toplam Raporu: günlük / haftalık / aylık toplam süre; sınır aşan satırlar işaretli (sınırlar parametreden). */
    static async totals(sp: URLSearchParams, actor: Actor) {
        const type = (['daily', 'weekly', 'monthly'].includes(sp.get('type') ?? '') ? sp.get('type') : 'daily') as ReportType;
        const { s, events, inPeriod } = await this.scopedEvents(sp);
        const [daily, weekly] = await Promise.all([ParameterService.getNumber('PDKS', 'daily_limit_hours'), ParameterService.getNumber('PDKS', 'weekly_limit_hours')]);
        const p = parseListParams(sp, { filterKeys: ['over'], sortable: ['holderName', 'period', 'minutes', 'sessions', 'warnings'] });
        const rows = totals(pairSessions(events).filter((x) => inPeriod(x.day)), type, { dailyHours: daily.value, weeklyHours: weekly.value })
            .map((r) => ({ id: r.key, ...r, holderTypeLabel: HOLDER_TYPE_LABELS[r.holderType] ?? r.holderType, hours: Math.round((r.minutes / 60) * 100) / 100, duration: fmtMinutes(r.minutes) }));
        const filtered = p.filters.over === 'ONLY' ? rows.filter((r) => r.overLimit) : rows;
        const format = parseExportFormat(sp.get('export'));
        const result = applyList(filtered, p, { search: (r) => [r.holderName, r.cardUid], sortValue: (r, k) => (r as Record<string, any>)[k], defaultSort: { key: 'period', dir: 'asc' }, paginate: !format });
        if (format) {
            const cols: ExportColumn<(typeof rows)[number]>[] = [
                { label: 'Dönem', value: (r) => r.period }, { label: 'Kişi', value: (r) => r.holderName }, { label: 'Tür', value: (r) => r.holderTypeLabel }, { label: 'Toplam saat', value: (r) => r.hours },
                { label: 'Oturum', value: (r) => r.sessions }, { label: 'Uyarı', value: (r) => r.warnings }, { label: 'Sınır aşımı', value: (r) => (r.overLimit ? `Evet (> ${r.limitHours} sa)` : '') },
            ];
            return exportList({ format, title: `PDKS Toplam Raporu (${type === 'daily' ? 'Günlük' : type === 'weekly' ? 'Haftalık' : 'Aylık'})`, entityType: 'AccessEvent', columns: cols, rows: result.items, filters: { Kapsam: s.scope, Dönem: `${s.year}-${s.month}` }, actor: { id: actor.id, name: actor.name ?? null, email: actor.email ?? null } });
        }
        return { ...result, limits: { daily, weekly }, type, overCount: rows.filter((r) => r.overLimit).length };
    }

    /** Anlık yerleşkedeki kişiler (bugün son hareketi giriş olanlar). */
    static async onSiteNow() {
        const today = istanbulDay(new Date());
        const since = new Date(`${today}T00:00:00+03:00`);
        const rows = await prisma.accessEvent.findMany({ where: { isVoid: false, occurredAt: { gte: since } }, select: { id: true, cardUid: true, holderName: true, holderType: true, entrepreneurId: true, direction: true, occurredAt: true, entrepreneur: { select: { name: true } } } });
        const here = onSite(rows.map((r) => ({ ...r, direction: r.direction as Direction })), today);
        const count = (t: string) => here.filter((h) => h.holderType === t).length;
        return {
            total: here.length, staff: count('STAFF'), members: count('MEMBER'), visitors: count('VISITOR'), other: here.length - count('STAFF') - count('MEMBER') - count('VISITOR'),
            entriesToday: rows.filter((r) => r.direction === 'IN').length,
            people: here.sort((a, b) => +b.occurredAt - +a.occurredAt).slice(0, 200).map((h) => ({ cardUid: h.cardUid, holderName: h.holderName, holderType: h.holderType, holderTypeLabel: HOLDER_TYPE_LABELS[h.holderType] ?? h.holderType, entrepreneurName: h.entrepreneur?.name ?? null, since: h.occurredAt })),
        };
    }

    /** Son 30 gün girişim bazında ofis girişi (girişim sağlığı tablosu için). */
    static async entriesByEntrepreneur(days = 30) {
        const since = new Date(Date.now() - days * 86400000);
        const rows = await prisma.accessEvent.groupBy({ by: ['entrepreneurId'], where: { isVoid: false, direction: 'IN', occurredAt: { gte: since }, entrepreneurId: { not: null } }, _count: { _all: true } });
        return new Map(rows.map((r) => [r.entrepreneurId!, r._count._all]));
    }

    /** Günlük giriş sayısı (son N gün) — panel grafiği. */
    static async dailyEntries(days = 14) {
        const since = new Date(Date.now() - days * 86400000);
        const rows = await prisma.accessEvent.findMany({ where: { isVoid: false, direction: 'IN', occurredAt: { gte: since } }, select: { occurredAt: true } });
        const map = new Map<string, number>();
        for (const r of rows) { const d = istanbulDay(r.occurredAt); map.set(d, (map.get(d) ?? 0) + 1); }
        return Array.from({ length: days }, (_, i) => { const d = istanbulDay(new Date(Date.now() - (days - 1 - i) * 86400000)); return { day: d, count: map.get(d) ?? 0 }; });
    }

    // ─── Cihazlar ve seçim listeleri ─────────────────────────────────────────

    static async devices() {
        const rows = await prisma.accessDevice.findMany({ orderBy: { name: 'asc' }, include: { building: { select: { name: true } }, _count: { select: { events: true } } } });
        const keys = await prisma.apiKey.findMany({ where: { revokedAt: null }, select: { scopesJson: true, lastUsedAt: true, expiresAt: true } });
        const pdksKeys = keys.filter((k) => { try { return (JSON.parse(k.scopesJson) as string[]).includes('pdks:write') && (!k.expiresAt || k.expiresAt > new Date()); } catch { return false; } });
        return {
            devices: rows.map((d) => ({ id: d.id, code: d.code, name: d.name, buildingId: d.buildingId, buildingName: d.building?.name ?? null, location: d.location, direction: d.direction, isActive: d.isActive, lastSeenAt: d.lastSeenAt, notes: d.notes, eventCount: d._count.events, updatedAt: d.updatedAt })),
            integration: { activeKeys: pdksKeys.length, lastUsedAt: pdksKeys.map((k) => k.lastUsedAt).filter(Boolean).sort((a, b) => +b! - +a!)[0] ?? null, status: !rows.some((d) => d.isActive) ? 'NO_DEVICE' : !pdksKeys.length ? 'NO_KEY' : rows.some((d) => d.lastSeenAt) ? 'RECEIVING' : 'WAITING' },
        };
    }

    static async saveDevice(id: string | null, input: Record<string, unknown>, actor: Actor) {
        if (id && typeof input.isActive === 'boolean') {
            const d = await prisma.accessDevice.update({ where: { id }, data: { isActive: input.isActive } });
            await audit(actor, input.isActive ? 'RESTORE' : 'ARCHIVE', 'AccessDevice', id, { isActive: input.isActive });
            return d;
        }
        const v = parseOrThrow(id ? deviceSchema.partial() : deviceSchema.extend({ direction: deviceSchema.shape.direction.default('BOTH') }), input);
        if (v.code) {
            const dup = await prisma.accessDevice.findUnique({ where: { code: v.code } });
            if (dup && dup.id !== id) throw fieldError('Bu cihaz kodu kullanılıyor.', 409, 'code', 'Mükerrer kod');
        }
        const d = id ? await prisma.accessDevice.update({ where: { id }, data: v }) : await prisma.accessDevice.create({ data: v as Prisma.AccessDeviceUncheckedCreateInput });
        await audit(actor, id ? 'UPDATE' : 'CREATE', 'AccessDevice', d.id, v);
        return d;
    }

    static async lookups() {
        const [entrepreneurs, persons, buildings, cards] = await Promise.all([
            prisma.entrepreneur.findMany({ where: { isArchived: false }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            prisma.person.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, fullName: true, tcNumberMasked: true }, orderBy: { fullName: 'asc' }, take: 2000 }),
            prisma.building.findMany({ where: { isArchived: false }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            prisma.accessCard.findMany({ where: { status: 'ACTIVE' }, select: { id: true, cardUid: true, holderName: true, label: true }, orderBy: { holderName: 'asc' } }),
        ]);
        return {
            entrepreneurs, buildings, cards: cards.map((c) => ({ id: c.id, label: `${c.holderName} · ${c.label ?? c.cardUid}` })),
            persons: persons.map((p) => ({ id: p.id, label: p.tcNumberMasked ? `${p.fullName} (${p.tcNumberMasked})` : p.fullName })),
            holderTypes: HOLDER_TYPES.map((v) => ({ value: v, label: HOLDER_TYPE_LABELS[v] })),
            cardStatuses: CARD_STATUSES.map((v) => ({ value: v, label: CARD_STATUS_LABELS[v] })),
        };
    }
}
