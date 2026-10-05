/** Client-side CSV cell escaping with formula-injection protection (mirrors lib/sanitize sanitizeCsvCell). */
export function sanitizeCsvCellClient(value: unknown): string {
    if (value === null || value === undefined) return '';
    let s = String(value);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}
