/**
 * Alan yönetimi saf hesapları (DB'siz, birim testli).
 * Tarihler gün bazında karşılaştırılır (Europe/Istanbul takvim günü, YYYY-MM-DD).
 */

export const UNIT_TYPES = ['OFFICE', 'WORKSHOP', 'STORAGE', 'COMMON'] as const;
export const UNIT_TYPE_LABELS: Record<string, string> = { OFFICE: 'Ofis', WORKSHOP: 'Atölye', STORAGE: 'Depo', COMMON: 'Ortak alan' };

/** Elle girilen durumlar. "Dolu" saklanmaz; aktif eşleştirmeden hesaplanır. */
export const UNIT_STATUSES = ['AVAILABLE', 'MAINTENANCE', 'RESERVED'] as const;
export const UNIT_STATUS_LABELS: Record<string, string> = { AVAILABLE: 'Boş', OCCUPIED: 'Dolu', MAINTENANCE: 'Bakımda', RESERVED: 'Rezerve' };

export type AssignmentState = 'ACTIVE' | 'UPCOMING' | 'ENDED';
export const ASSIGNMENT_STATE_LABELS: Record<AssignmentState, string> = { ACTIVE: 'Aktif', UPCOMING: 'Başlamadı', ENDED: 'Bitti' };

export type PolicyState = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'UPCOMING';
export const POLICY_STATE_LABELS: Record<PolicyState, string> = { ACTIVE: 'Yürürlükte', EXPIRING: 'Bitişe yaklaşıyor', EXPIRED: 'Süresi doldu', UPCOMING: 'Başlamadı' };

const ISTANBUL = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Tarihin İstanbul takvim günü (YYYY-MM-DD). Saat içermeyen tarih alanları UTC gece yarısı saklanır; onlar için UTC günü kullanılır. */
export function dayKey(d: Date | string, dateOnly = false): string {
    const x = typeof d === 'string' ? new Date(d) : d;
    return dateOnly ? x.toISOString().slice(0, 10) : ISTANBUL.format(x);
}
export const todayKey = (now = new Date()) => dayKey(now);

/** b - a gün farkı (YYYY-MM-DD). */
export function daysBetweenKeys(a: string, b: string): number {
    return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function assignmentState(start: Date, end: Date | null, today: string): AssignmentState {
    if (dayKey(start, true) > today) return 'UPCOMING';
    if (end && dayKey(end, true) < today) return 'ENDED';
    return 'ACTIVE';
}

/** İki gün aralığı çakışıyor mu (uçlar dahil; bitiş boşsa açık uçlu). */
export function rangesOverlap(aStart: Date, aEnd: Date | null, bStart: Date, bEnd: Date | null): boolean {
    const as = dayKey(aStart, true), bs = dayKey(bStart, true);
    const ae = aEnd ? dayKey(aEnd, true) : '9999-12-31';
    const be = bEnd ? dayKey(bEnd, true) : '9999-12-31';
    return as <= be && bs <= ae;
}

export function policyState(start: Date, end: Date, today: string, warnDays: number): { state: PolicyState; daysLeft: number } {
    const daysLeft = daysBetweenKeys(today, dayKey(end, true));
    if (daysLeft < 0) return { state: 'EXPIRED', daysLeft };
    if (dayKey(start, true) > today) return { state: 'UPCOMING', daysLeft };
    return { state: daysLeft <= warnDays ? 'EXPIRING' : 'ACTIVE', daysLeft };
}

/** Bölümün ekranda görünen durumu: aktif eşleştirme varsa "Dolu", yoksa elle girilen durum. */
export function displayStatus(manual: string, hasActiveAssignment: boolean): string {
    return hasActiveAssignment ? 'OCCUPIED' : manual;
}

export type OccupancyInput = { unitType: string; area: number; occupied: boolean; isArchived?: boolean };
export type Occupancy = {
    rentableUnits: number; occupiedUnits: number; byCountPct: number | null;
    rentableArea: number; occupiedArea: number; byAreaPct: number | null;
};

/**
 * Doluluk: ortak alanlar (COMMON) ve arşivlenmiş bölümler hesaba katılmaz.
 * İki ölçü birlikte verilir (bölüm sayısına göre ve m²'ye göre); hangisinin resmi ölçü olduğu kurumdan teyit bekliyor.
 */
export function occupancy(units: OccupancyInput[]): Occupancy {
    const rentable = units.filter((u) => !u.isArchived && u.unitType !== 'COMMON');
    const occ = rentable.filter((u) => u.occupied);
    const r2 = (n: number) => Math.round(n * 100) / 100;
    const rentableArea = r2(rentable.reduce((s, u) => s + u.area, 0));
    const occupiedArea = r2(occ.reduce((s, u) => s + u.area, 0));
    const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
    return {
        rentableUnits: rentable.length, occupiedUnits: occ.length, byCountPct: pct(occ.length, rentable.length),
        rentableArea, occupiedArea, byAreaPct: pct(occupiedArea, rentableArea),
    };
}
