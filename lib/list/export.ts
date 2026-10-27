import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit';
import { sanitizeSheetValue } from '@/lib/sanitize';
import { DomainError } from '@/lib/errors';

/**
 * Ortak liste dışa aktarımı. Veri istemciden alınmaz: liste sunucuda aynı yetki ve filtrelerle yeniden üretilir.
 * - xlsx: hücreler formül enjeksiyonuna karşı temizlenir.
 * - pdf: yazdırmaya hazır HTML döner; tarayıcının "PDF olarak kaydet" seçeneğiyle kaydedilir
 *   (sunucuda PDF motoru yoktur — bu kasıtlı ve ekranda böyle belirtilir).
 * Her dışa aktarım denetim kaydı üretir.
 */
export type ExportFormat = 'xlsx' | 'pdf';
export type ExportColumn<T> = { label: string; value: (row: T) => string | number | null | undefined };

export function parseExportFormat(v: string | null): ExportFormat | null {
    if (v === null) return null;
    if (v === 'xlsx' || v === 'pdf') return v;
    throw new DomainError('Geçersiz dışa aktarma biçimi.', 400);
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

function slugify(s: string) {
    const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
    return s.replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'liste';
}

export function buildSheet<T>(columns: ExportColumn<T>[], rows: T[]) {
    return rows.map((r) => Object.fromEntries(columns.map((c) => [c.label, sanitizeSheetValue(c.value(r) ?? '')])));
}

export function buildPrintHtml<T>(title: string, columns: ExportColumn<T>[], rows: T[], meta: { generatedBy: string | null; filters: Record<string, string> }) {
    const filterText = Object.entries(meta.filters).filter(([, v]) => v).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ');
    const now = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
    const head = columns.map((c) => `<th>${esc(c.label)}</th>`).join('');
    const body = rows.length
        ? rows.map((r) => `<tr>${columns.map((c) => `<td>${esc(String(c.value(r) ?? ''))}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${columns.length}">Kayıt yok.</td></tr>`;
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
@page{size:A4 landscape;margin:12mm}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#111;font-size:11px;margin:16px}
h1{font-size:16px;margin:0 0 4px}
p.meta{color:#555;margin:0 0 12px}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;vertical-align:top}
th{background:#f2f2f2}
tr{page-break-inside:avoid}
.hint{margin-top:12px;color:#777}
@media print{.hint{display:none}}
</style></head><body>
<h1>${esc(title)}</h1>
<p class="meta">${rows.length} kayıt · ${esc(now)}${meta.generatedBy ? ` · ${esc(meta.generatedBy)}` : ''}${filterText ? `<br>Filtre: ${filterText}` : ''}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<p class="hint">PDF olarak kaydetmek için yazdırma penceresinde "PDF olarak kaydet" hedefini seçin.</p>
<script>window.addEventListener('load',function(){window.print()})</script>
</body></html>`;
}

export async function exportList<T>(opts: {
    format: ExportFormat;
    title: string;
    entityType: string;
    columns: ExportColumn<T>[];
    rows: T[];
    filters: Record<string, string>;
    actor: { id: string; name: string | null; email: string | null };
}) {
    await logAuditEvent({
        actorId: opts.actor.id, actorName: opts.actor.name ?? undefined, actorEmail: opts.actor.email ?? undefined,
        action: 'EXPORT', entityType: opts.entityType, entityId: null,
        newValues: { format: opts.format, rows: opts.rows.length, filters: opts.filters },
    });
    const name = `${slugify(opts.title)}-${new Date().toISOString().slice(0, 10)}`;
    if (opts.format === 'pdf') {
        const html = buildPrintHtml(opts.title, opts.columns, opts.rows, { generatedBy: opts.actor.name, filters: opts.filters });
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `inline; filename="${name}.html"`, 'Cache-Control': 'no-store' } });
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildSheet(opts.columns, opts.rows)), opts.title.slice(0, 31));
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return new NextResponse(new Uint8Array(buf), {
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${name}.xlsx"`, 'Cache-Control': 'no-store' },
    });
}
