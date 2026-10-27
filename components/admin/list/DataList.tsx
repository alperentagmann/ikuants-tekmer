"use client";
/**
 * Ortak liste ekranı: filtreler + Ara / Temizle, Excel / PDF dışa aktarma, sıralanabilir başlıklar,
 * sayfalama ve yatay kaydırma. Veri, filtre ve sıralama sunucuda uygulanır (lib/list/list-query.ts);
 * dışa aktarım da sunucuda aynı filtrelerle yeniden üretilir ve denetim kaydına yazılır.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, FileText, Search, X } from 'lucide-react';
import { Card, Button, EmptyState } from '@/components/admin/ui';
import { useApi, LoadingRows, ErrorState, TableShell, th, td } from '@/components/admin/ops-kit';

export type ListColumn<T> = { key: string; label: string; sortable?: boolean; align?: 'right'; render?: (row: T) => React.ReactNode; className?: string };
type Opt = { value: string; label: string };
export type ListFilter = { key: string; label: string; type: 'select' | 'text' | 'year' | 'month'; options?: Opt[] | ((draft: Record<string, string>) => Opt[]); placeholder?: string; resets?: string[]; required?: boolean };

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map((label, i) => ({ value: String(i + 1), label }));

type Result<T> = { items: T[]; total: number; page: number; pageSize: number; pageCount: number };
type State = { q: string; filters: Record<string, string>; archived: boolean };

const ctl = 'rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 [&>option]:bg-[#0f0f1a]';

function yearOptions(): Opt[] {
    const y = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => String(y + 1 - i)).map((v) => ({ value: v, label: v }));
}

function buildQuery(s: State, extra: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams();
    if (s.q) sp.set('q', s.q);
    for (const [k, v] of Object.entries(s.filters)) if (v) sp.set(k, v);
    if (s.archived) sp.set('archived', '1');
    for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== '') sp.set(k, String(v));
    return sp.toString();
}

export function DataList<T extends { id: string; isArchived?: boolean }>({
    endpoint, label, columns, filters = [], searchPlaceholder = 'Ara', rowActions, canExport, reloadKey = 0, empty, archiveToggle = true, initialFilters = {}, extraParams = {}, rowClassName, summary,
}: {
    endpoint: string;
    /** Tablonun erişilebilir adı */
    label: string;
    columns: ListColumn<T>[];
    filters?: ListFilter[];
    searchPlaceholder?: string;
    rowActions?: (row: T) => React.ReactNode;
    canExport: boolean;
    reloadKey?: number;
    empty: { title: string; description?: string; action?: React.ReactNode };
    archiveToggle?: boolean;
    initialFilters?: Record<string, string>;
    /** Filtre formunda görünmeyen sabit sorgu parametreleri (ör. rapor türü) */
    extraParams?: Record<string, string>;
    rowClassName?: (row: T) => string;
    /** Tablonun üstünde yanıttaki ek alanlardan özet (ör. uyarı sayısı) */
    summary?: (data: Record<string, unknown>) => React.ReactNode;
}) {
    const blank: State = { q: '', filters: { ...initialFilters }, archived: false };
    const [draft, setDraft] = useState<State>(blank);
    const [applied, setApplied] = useState<State>(blank);
    const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [exporting, setExporting] = useState<string | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);

    const missing = filters.filter((f) => f.required && !applied.filters[f.key]).map((f) => f.label);
    const query = buildQuery(applied, { ...extraParams, sort: sort?.key, dir: sort?.dir, page, pageSize });
    const list = useApi<Result<T>>(missing.length ? null : `${endpoint}?${query}`);
    const { reload } = list;
    useEffect(() => { if (reloadKey) reload(); }, [reloadKey, reload]);

    const search = (e?: React.FormEvent) => { e?.preventDefault(); setApplied(draft); setPage(1); };
    const clear = () => { setDraft(blank); setApplied(blank); setSort(null); setPage(1); };
    const toggleSort = (key: string) => {
        setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));
        setPage(1);
    };
    const setFilter = (f: ListFilter, value: string) =>
        setDraft((d) => ({ ...d, filters: { ...d.filters, [f.key]: value, ...Object.fromEntries((f.resets ?? []).map((k) => [k, ''])) } }));

    const exportFile = async (format: 'xlsx' | 'pdf') => {
        setExportError(null);
        const url = `${endpoint}?${buildQuery(applied, { ...extraParams, sort: sort?.key, dir: sort?.dir, export: format })}`;
        if (format === 'pdf') {
            // Yazdırmaya hazır sayfa yeni sekmede açılır; tarayıcıdan "PDF olarak kaydet"
            window.open(url, '_blank', 'noopener');
            return;
        }
        setExporting(format);
        try {
            const res = await fetch(url);
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Dışa aktarma başarısız.');
            }
            const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? 'liste.xlsx';
            const href = URL.createObjectURL(await res.blob());
            const a = document.createElement('a');
            a.href = href;
            a.download = name;
            a.click();
            setTimeout(() => URL.revokeObjectURL(href), 1000);
        } catch (e) {
            setExportError((e as Error).message);
        } finally {
            setExporting(null);
        }
    };

    const data = list.data;
    const hasFilter = useMemo(() => Boolean(applied.q || applied.archived || Object.entries(applied.filters).some(([k, v]) => v && v !== (initialFilters[k] ?? ''))), [applied, initialFilters]);
    const cols = rowActions ? [...columns, { key: '__actions', label: 'İşlemler' } as ListColumn<T>] : columns;

    return (
        <Card padded={false}>
            <form onSubmit={search} role="search" aria-label={`${label} filtreleri`} className="flex flex-col gap-3 border-b border-white/5 px-4 py-3 lg:flex-row lg:flex-wrap lg:items-end">
                <div className="relative min-w-0 flex-1 lg:min-w-[220px] lg:max-w-sm">
                    <label className="mb-1.5 block text-xs font-medium text-gray-300" htmlFor={`${label}-q`}>Arama</label>
                    <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-gray-500" aria-hidden />
                    <input id={`${label}-q`} value={draft.q} onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))} placeholder={searchPlaceholder} className={`${ctl} w-full pl-9`} />
                </div>
                {filters.map((f) => {
                    const id = `${label}-${f.key}`;
                    const opts = f.type === 'year' ? yearOptions() : f.type === 'month' ? MONTHS : typeof f.options === 'function' ? f.options(draft.filters) : f.options ?? [];
                    return (
                        <div key={f.key} className="min-w-0 lg:w-48">
                            <label className="mb-1.5 block text-xs font-medium text-gray-300" htmlFor={id}>{f.label}{f.required && <span className="text-rose-400" aria-hidden> *</span>}</label>
                            {f.type === 'text' ? (
                                <input id={id} value={draft.filters[f.key] ?? ''} onChange={(e) => setFilter(f, e.target.value)} placeholder={f.placeholder} className={`${ctl} w-full`} />
                            ) : (
                                <select id={id} value={draft.filters[f.key] ?? ''} onChange={(e) => setFilter(f, e.target.value)} className={`${ctl} w-full`}>
                                    <option value="">{f.placeholder ?? (f.required ? 'Seçin' : 'Tümü')}</option>
                                    {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            )}
                        </div>
                    );
                })}
                {archiveToggle && (
                    <label className="flex items-center gap-2 py-2 text-sm text-gray-300">
                        <input type="checkbox" checked={draft.archived} onChange={(e) => setDraft((d) => ({ ...d, archived: e.target.checked }))} className="h-4 w-4 rounded border-white/20 bg-transparent" />
                        Arşivdekileri göster
                    </label>
                )}
                <div className="flex flex-wrap items-center gap-2">
                    <Button type="submit" variant="primary"><Search className="h-4 w-4" aria-hidden /> Ara</Button>
                    <Button type="button" variant="ghost" onClick={clear}><X className="h-4 w-4" aria-hidden /> Temizle</Button>
                </div>
                {canExport && (
                    <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                        <Button type="button" size="sm" disabled={missing.length > 0} onClick={() => exportFile('xlsx')} loading={exporting === 'xlsx'}><Download className="h-3.5 w-3.5" aria-hidden /> Excel</Button>
                        <Button type="button" size="sm" disabled={missing.length > 0} onClick={() => exportFile('pdf')} title="Yazdırmaya hazır sayfa açılır; tarayıcıdan PDF olarak kaydedin"><FileText className="h-3.5 w-3.5" aria-hidden /> PDF</Button>
                    </div>
                )}
            </form>
            {exportError && <p role="alert" className="border-b border-white/5 px-4 py-2 text-xs text-red-300">{exportError}</p>}

            {missing.length ? (
                <div className="p-4"><EmptyState title={`Sorgu için ${missing.join(', ')} seçin`} description="Zorunlu filtreleri seçip Ara’ya basın." /></div>
            ) : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : !data ? <LoadingRows /> : data.total === 0 ? (
                <div className="p-4">{hasFilter ? <EmptyState title="Filtreye uyan kayıt yok" description="Filtreleri değiştirin veya Temizle ile tüm kayıtları görün." /> : <EmptyState {...empty} />}</div>
            ) : (
                <>
                    {summary?.(data as unknown as Record<string, unknown>)}
                    <div aria-busy={list.loading} className={list.loading ? 'opacity-60 transition-opacity' : ''}>
                        <TableShell>
                            <caption className="sr-only">{label}</caption>
                            <thead>
                                <tr className="border-b border-white/5">
                                    {cols.map((c) => {
                                        const active = sort?.key === c.key;
                                        const aria = active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined;
                                        return (
                                            <th key={c.key} scope="col" aria-sort={c.sortable ? aria ?? 'none' : undefined} className={`${th} ${c.align === 'right' ? 'text-right' : ''}`}>
                                                {c.sortable ? (
                                                    <button type="button" onClick={() => toggleSort(c.key)} className={`inline-flex items-center gap-1 uppercase hover:text-gray-200 ${active ? 'text-gray-200' : ''}`}>
                                                        {c.label}
                                                        {active ? (sort!.dir === 'asc' ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />) : <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />}
                                                    </button>
                                                ) : c.key === '__actions' ? <span className="sr-only">{c.label}</span> : c.label}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.items.map((row) => (
                                    <tr key={row.id} className={`hover:bg-white/[0.02] ${row.isArchived ? 'opacity-60' : ''} ${rowClassName?.(row) ?? ''}`}>
                                        {columns.map((c) => (
                                            <td key={c.key} className={`${td} ${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.className ?? ''}`}>
                                                {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                                            </td>
                                        ))}
                                        {rowActions && <td className={`${td} text-right whitespace-nowrap`}>{rowActions(row)}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </TableShell>
                    </div>
                    <nav aria-label={`${label} sayfaları`} className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-3 text-sm text-gray-400">
                        <span aria-live="polite">{(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} / {data.total} kayıt</span>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-xs">
                                Sayfa başı
                                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className={`${ctl} py-1`}>
                                    {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </label>
                            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={data.page <= 1} aria-label="Önceki sayfa"><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="tabular-nums">{data.page} / {data.pageCount}</span>
                            <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(data.pageCount, p + 1))} disabled={data.page >= data.pageCount} aria-label="Sonraki sayfa"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </nav>
                </>
            )}
        </Card>
    );
}
