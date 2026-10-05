/**
 * Europe/Istanbul calendar helpers. Turkey has used a fixed UTC+3 offset without DST since 2016,
 * so day and month boundaries can be computed without a timezone database.
 */
export const ISTANBUL_TZ = 'Europe/Istanbul';
const OFFSET = '+03:00';

/** YYYY-MM-DD of the given instant in Istanbul. */
export function istanbulDayKey(d: Date = new Date()): string {
    return d.toLocaleDateString('sv-SE', { timeZone: ISTANBUL_TZ });
}

/** [start, end) instants of an Istanbul calendar day. */
export function istanbulDayRange(day: string): { start: Date; end: Date } {
    const start = new Date(`${day}T00:00:00${OFFSET}`);
    return { start, end: new Date(start.getTime() + 86400000) };
}

/** [start, end) instants of an Istanbul calendar month (month is 1-12). */
export function istanbulMonthRange(year: number, month: number): { start: Date; end: Date } {
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = new Date(`${year}-${pad(month)}-01T00:00:00${OFFSET}`);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    return { start, end: new Date(`${nextYear}-${pad(nextMonth)}-01T00:00:00${OFFSET}`) };
}

/** Current Istanbul year / month / day numbers. */
export function istanbulNow(d: Date = new Date()): { year: number; month: number; day: number; key: string } {
    const key = istanbulDayKey(d);
    const [year, month, day] = key.split('-').map(Number);
    return { year, month, day, key };
}
