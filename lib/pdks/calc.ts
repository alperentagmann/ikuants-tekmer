/**
 * PDKS saf hesapları (DB'siz, birim testli): kart UID normalizasyonu, giriş-çıkış eşleştirme,
 * oturum süreleri ve dönem toplamları. Gün sınırı Europe/Istanbul takvimine göredir.
 */

export type Direction = 'IN' | 'OUT';
export type PdksEvent = { id: string; cardUid: string; holderName: string; holderType: string; entrepreneurId: string | null; direction: Direction; occurredAt: Date };

/** RFID UID: ayırıcılar (boşluk, :, -) atılır, büyük harfe çevrilir. 4–32 karakter, yalnız harf/rakam. */
export function normalizeUid(raw: string): string | null {
    const v = String(raw ?? '').replace(/[\s:\-.]/g, '').toUpperCase();
    return /^[0-9A-Z]{4,32}$/.test(v) ? v : null;
}

/** Yön metni: GİRİŞ/GIRIS/IN/I/1 → IN, ÇIKIŞ/CIKIS/OUT/O/0 → OUT. */
export function parseDirection(raw: string): Direction | null {
    const v = String(raw ?? '').trim().toLocaleUpperCase('tr-TR').replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ç/g, 'C');
    if (['IN', 'I', 'GIRIS', '1', 'G'].includes(v)) return 'IN';
    if (['OUT', 'O', 'CIKIS', '0', 'C'].includes(v)) return 'OUT';
    return null;
}

const DAY_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' });
export const istanbulDay = (d: Date) => DAY_FMT.format(d);

/** ISO hafta anahtarı (YYYY-Www), İstanbul gününe göre. */
export function isoWeek(day: string): string {
    const d = new Date(`${day}T00:00:00Z`);
    const dow = (d.getUTCDay() + 6) % 7; // Pzt=0
    d.setUTCDate(d.getUTCDate() - dow + 3); // haftanın perşembesi
    const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const week = 1 + Math.round(((+d - +firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export type Session = { cardUid: string; holderName: string; holderType: string; entrepreneurId: string | null; day: string; inAt: Date | null; outAt: Date | null; minutes: number; problem: null | 'NO_OUT' | 'NO_IN' };

/**
 * Kart bazında zaman sırasıyla eşleştirme: IN → sonraki OUT bir oturumdur. Ardışık iki IN'de ilki "çıkışsız",
 * IN olmadan OUT "girişsiz" uyarısı olur. Oturum gün aşarsa giriş gününe yazılır. Uyarılı satırlar süreye katılmaz.
 */
export function pairSessions(events: PdksEvent[]): Session[] {
    const byCard = new Map<string, PdksEvent[]>();
    for (const e of events) byCard.set(e.cardUid, [...(byCard.get(e.cardUid) ?? []), e]);
    const out: Session[] = [];
    for (const list of byCard.values()) {
        list.sort((a, b) => +a.occurredAt - +b.occurredAt);
        let open: PdksEvent | null = null;
        const base = (e: PdksEvent) => ({ cardUid: e.cardUid, holderName: e.holderName, holderType: e.holderType, entrepreneurId: e.entrepreneurId });
        for (const e of list) {
            if (e.direction === 'IN') {
                if (open) out.push({ ...base(open), day: istanbulDay(open.occurredAt), inAt: open.occurredAt, outAt: null, minutes: 0, problem: 'NO_OUT' });
                open = e;
            } else if (open) {
                out.push({ ...base(open), day: istanbulDay(open.occurredAt), inAt: open.occurredAt, outAt: e.occurredAt, minutes: Math.round((+e.occurredAt - +open.occurredAt) / 60000), problem: null });
                open = null;
            } else {
                out.push({ ...base(e), day: istanbulDay(e.occurredAt), inAt: null, outAt: e.occurredAt, minutes: 0, problem: 'NO_IN' });
            }
        }
        if (open) out.push({ ...base(open), day: istanbulDay(open.occurredAt), inAt: open.occurredAt, outAt: null, minutes: 0, problem: 'NO_OUT' });
    }
    return out.sort((a, b) => a.holderName.localeCompare(b.holderName, 'tr') || +(a.inAt ?? a.outAt!) - +(b.inAt ?? b.outAt!));
}

export type ReportType = 'daily' | 'weekly' | 'monthly';
export type TotalRow = { key: string; cardUid: string; holderName: string; holderType: string; entrepreneurId: string | null; period: string; minutes: number; sessions: number; warnings: number; overLimit: boolean; limitHours: number | null };

/** Dönem toplamları; günlük raporda günlük sınır, haftalık raporda haftalık sınır aşımı işaretlenir. Aylıkta sınır yok. */
export function totals(sessions: Session[], type: ReportType, limits: { dailyHours: number; weeklyHours: number }): TotalRow[] {
    const periodOf = (day: string) => (type === 'daily' ? day : type === 'weekly' ? isoWeek(day) : day.slice(0, 7));
    const limitHours = type === 'daily' ? limits.dailyHours : type === 'weekly' ? limits.weeklyHours : null;
    const map = new Map<string, TotalRow>();
    for (const s of sessions) {
        const period = periodOf(s.day);
        const key = `${s.cardUid}|${period}`;
        const row = map.get(key) ?? { key, cardUid: s.cardUid, holderName: s.holderName, holderType: s.holderType, entrepreneurId: s.entrepreneurId, period, minutes: 0, sessions: 0, warnings: 0, overLimit: false, limitHours };
        row.minutes += s.minutes;
        if (s.problem) row.warnings += 1;
        else row.sessions += 1;
        map.set(key, row);
    }
    return [...map.values()]
        .map((r) => ({ ...r, overLimit: limitHours !== null && r.minutes > limitHours * 60 }))
        .sort((a, b) => a.period.localeCompare(b.period) || a.holderName.localeCompare(b.holderName, 'tr'));
}

/** Kartın son geçerli hareketi bugün IN ise kişi yerleşkededir. */
export function onSite<T extends { cardUid: string; direction: Direction; occurredAt: Date }>(events: T[], today: string): T[] {
    const last = new Map<string, T>();
    for (const e of events) {
        const prev = last.get(e.cardUid);
        if (!prev || +e.occurredAt > +prev.occurredAt) last.set(e.cardUid, e);
    }
    return [...last.values()].filter((e) => e.direction === 'IN' && istanbulDay(e.occurredAt) === today);
}

/** Basit CSV ayrıştırıcı: ; veya , ayırıcı (ilk satırdan), tırnaklı alanlar, BOM. */
export function parseCsv(text: string): string[][] {
    const src = text.replace(/^\uFEFF/, '');
    const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
    const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
    const rows: string[][] = [];
    let row: string[] = [], cell = '', q = false;
    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (q) {
            if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
            else if (ch === '"') q = false;
            else cell += ch;
        } else if (ch === '"') q = true;
        else if (ch === sep) { row.push(cell); cell = ''; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && src[i + 1] === '\n') i++;
            row.push(cell); cell = '';
            if (row.some((c) => c.trim() !== '')) rows.push(row);
            row = [];
        } else cell += ch;
    }
    row.push(cell);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
    return rows;
}

/** "YYYY-MM-DD HH:mm[:ss]" veya "DD.MM.YYYY HH:mm[:ss]" (İstanbul saati) ya da ISO. */
export function parseLocalDateTime(raw: string): Date | null {
    const v = String(raw ?? '').trim();
    let m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v);
    if (!m) {
        const t = /^(\d{2})\.(\d{2})\.(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v);
        if (t) m = [t[0], t[3], t[2], t[1], t[4], t[5], t[6]] as unknown as RegExpExecArray;
    }
    if (m) {
        const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}+03:00`);
        return Number.isNaN(+d) ? null : d;
    }
    if (/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:?\d{2})$/.test(v)) {
        const d = new Date(v);
        return Number.isNaN(+d) ? null : d;
    }
    return null;
}

export const fmtMinutes = (m: number) => `${Math.floor(m / 60)} sa ${String(m % 60).padStart(2, '0')} dk`;
