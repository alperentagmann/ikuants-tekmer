'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Download, Printer, RefreshCw, CheckCircle2, Clock, AlertTriangle, ArrowRightLeft, ListTodo, Target, ArrowUpDown } from 'lucide-react';
import { api, Alert, Badge, Button, Card, EmptyState, PageHeader, Skeleton, TextInput, formatDate, formatDateTime } from '@/components/admin/ui';

type PerUser = { userId: string; name: string; title: string | null; department: string | null; completed: number; completedOnTime: number; onTimeRate: number | null; open: number; overdue: number; inReview: number; avgCycleHours: number | null; hoursLogged: number; handoffsGiven: number; handoffsReceived: number; handoffsReturned: number; todosCompleted: number; comments: number };
type Report = {
    range: { from: string; to: string };
    scope: 'team' | 'self';
    totals: { completed: number; onTime: number; open: number; overdue: number; hours: number; handoffs: number; todos: number; onTimeRate: number | null };
    perUser: PerUser[];
    days: { day: string; completed: number; hours: number }[];
    completedTasks: { id: string; title: string; priority: string; dueDate: string | null; completedAt: string | null; onTime: boolean; assignees: string[] }[];
    overdueTasks: { id: string; title: string; priority: string; dueDate: string | null; status: string; assignees: string[] }[];
    generatedAt: string;
    generatedBy: string;
};

const key = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
function preset(name: string): { from: string; to: string } {
    const now = new Date();
    const today = key(now);
    const [y, m] = today.split('-').map(Number);
    if (name === 'week') {
        const dow = (new Date(`${today}T12:00:00+03:00`).getUTCDay() + 6) % 7;
        return { from: key(new Date(now.getTime() - dow * 86400000)), to: today };
    }
    if (name === 'month') return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: today };
    if (name === 'lastMonth') {
        const ly = m === 1 ? y - 1 : y;
        const lm = m === 1 ? 12 : m - 1;
        const last = new Date(Date.UTC(ly, lm, 0)).getUTCDate();
        return { from: `${ly}-${String(lm).padStart(2, '0')}-01`, to: `${ly}-${String(lm).padStart(2, '0')}-${last}` };
    }
    if (name === 'quarter') return { from: key(new Date(now.getTime() - 89 * 86400000)), to: today };
    return { from: key(new Date(now.getTime() - 29 * 86400000)), to: today };
}
const PRESETS = [['week', 'Bu hafta'], ['month', 'Bu ay'], ['lastMonth', 'Geçen ay'], ['30', 'Son 30 gün'], ['quarter', 'Son 90 gün']] as const;
type SortKey = 'name' | 'completed' | 'onTimeRate' | 'open' | 'overdue' | 'hoursLogged' | 'handoffsGiven';

export default function WorkReportPage() {
    const [range, setRange] = useState(preset('month'));
    const [activePreset, setActivePreset] = useState('month');
    const [report, setReport] = useState<Report | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'completed', dir: -1 });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ from: range.from, to: range.to });
            if (selected.length) p.set('users', selected.join(','));
            setReport((await api<{ report: Report }>(`/api/admin/work/report?${p.toString()}`)).report);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Rapor oluşturulamadı');
        } finally {
            setLoading(false);
        }
    }, [range, selected]);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const rows = useMemo(() => {
        const list = [...(report?.perUser || [])];
        list.sort((a, b) => {
            const av = a[sort.key] ?? -1;
            const bv = b[sort.key] ?? -1;
            return (typeof av === 'string' ? String(av).localeCompare(String(bv), 'tr') : (av as number) - (bv as number)) * sort.dir;
        });
        return list;
    }, [report, sort]);
    const maxCompleted = Math.max(1, ...(report?.days || []).map((d) => d.completed));
    const maxHours = Math.max(1, ...(report?.days || []).map((d) => d.hours));
    const csvHref = `/api/admin/work/report?from=${range.from}&to=${range.to}${selected.length ? `&users=${selected.join(',')}` : ''}&format=csv`;

    const Th = ({ k, label }: { k: SortKey; label: string }) => (
        <th className="px-3 py-2 text-left font-medium">
            <button type="button" onClick={() => setSort({ key: k, dir: sort.key === k ? (sort.dir === 1 ? -1 : 1) : -1 })} className="inline-flex items-center gap-1 hover:text-white print:pointer-events-none">
                {label} <ArrowUpDown className="h-3 w-3 opacity-50 print:hidden" />
            </button>
        </th>
    );

    return (
        <div className="space-y-5 pb-12 print:space-y-3 print:text-black">
            <div className="print:hidden">
                <PageHeader
                    title="İş Takip Raporu"
                    icon={BarChart3}
                    description="Görev, süre, paslama ve yapılacak verilerinden hesaplanır. Tahmini değer içermez."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <a href={csvHref} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:border-primary/40"><Download className="h-4 w-4" /> CSV</a>
                            <Button icon={Printer} onClick={() => window.print()}>Yazdır / PDF</Button>
                        </div>
                    }
                />
            </div>
            <div className="hidden print:block">
                <h1 className="text-2xl font-bold">İKÜANTS TEKMER — İş Takip Raporu</h1>
                {report && <p className="text-sm">{formatDate(report.range.from)} – {formatDate(report.range.to)} · Hazırlayan: {report.generatedBy} · {formatDateTime(report.generatedAt)}</p>}
            </div>

            <Card className="print:hidden">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map(([k, label]) => (
                            <button key={k} type="button" onClick={() => { setActivePreset(k); setRange(preset(k)); }} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${activePreset === k ? 'border-primary bg-primary/20 text-white' : 'border-white/10 text-gray-300 hover:text-white'}`}>{label}</button>
                        ))}
                    </div>
                    <div className="flex items-end gap-2">
                        <label className="text-xs text-gray-400">Başlangıç<TextInput type="date" value={range.from} onChange={(e) => { setActivePreset(''); setRange({ ...range, from: e.target.value }); }} /></label>
                        <label className="text-xs text-gray-400">Bitiş<TextInput type="date" value={range.to} onChange={(e) => { setActivePreset(''); setRange({ ...range, to: e.target.value }); }} /></label>
                        <Button icon={RefreshCw} loading={loading} onClick={load}>Yenile</Button>
                    </div>
                </div>
                {report?.scope === 'team' && report.perUser.length > 0 && (
                    <div className="mt-4">
                        <div className="mb-2 text-xs text-gray-400">Kişiler ({selected.length ? `${selected.length} seçili` : 'tümü'})</div>
                        <div className="flex flex-wrap gap-1.5">
                            {(report.perUser.length ? report.perUser : []).map((u) => (
                                <button key={u.userId} type="button" onClick={() => setSelected((s) => (s.includes(u.userId) ? s.filter((x) => x !== u.userId) : [...s, u.userId]))} className={`rounded-full border px-2.5 py-1 text-xs ${selected.includes(u.userId) ? 'border-primary bg-primary/15 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>{u.name}</button>
                            ))}
                            {selected.length > 0 && <button type="button" onClick={() => setSelected([])} className="rounded-full px-2.5 py-1 text-xs text-gray-400 underline">Temizle</button>}
                        </div>
                    </div>
                )}
                {report?.scope === 'self' && <p className="mt-3 text-xs text-gray-500">Yalnızca kendi verileriniz gösterilir. Ekip raporu için “tüm görevleri görme” yetkisi gerekir.</p>}
            </Card>

            {error && <Alert tone="danger">{error}</Alert>}
            {!report ? <Skeleton rows={8} /> : (
                <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                        {[
                            { label: 'Tamamlanan görev', value: report.totals.completed, icon: CheckCircle2, tone: 'text-emerald-300' },
                            { label: 'Zamanında tamamlanma', value: report.totals.onTimeRate === null ? '—' : `%${report.totals.onTimeRate}`, icon: Target, tone: 'text-sky-300' },
                            { label: 'Açık görev', value: report.totals.open, icon: ListTodo, tone: 'text-gray-200' },
                            { label: 'Geciken', value: report.totals.overdue, icon: AlertTriangle, tone: report.totals.overdue ? 'text-rose-300' : 'text-gray-200' },
                            { label: 'Kayıtlı süre', value: `${report.totals.hours} sa`, icon: Clock, tone: 'text-violet-300' },
                            { label: 'Paslanan iş', value: report.totals.handoffs, icon: ArrowRightLeft, tone: 'text-amber-300' },
                        ].map((k) => (
                            <div key={k.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl print:border-gray-300 print:bg-white">
                                <k.icon className={`mb-2 h-5 w-5 ${k.tone} print:text-black`} />
                                <div className="font-orbitron text-2xl font-bold text-white print:text-black">{k.value}</div>
                                <div className="text-xs text-gray-400 print:text-gray-700">{k.label}</div>
                            </div>
                        ))}
                    </div>

                    <Card className="print:break-inside-avoid">
                        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-white print:text-black">
                            <span>Günlük üretkenlik</span>
                            <span className="flex gap-3 text-[11px] font-normal text-gray-400"><span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-emerald-400" />Tamamlanan</span><span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-violet-400" />Saat</span></span>
                        </div>
                        {report.days.every((d) => !d.completed && !d.hours) ? <p className="py-8 text-center text-sm text-gray-500">Bu aralıkta tamamlanan görev veya süre kaydı yok.</p> : (
                            <div className="flex h-44 items-end gap-[3px] overflow-x-auto">
                                {report.days.map((d) => (
                                    <div key={d.day} className="flex min-w-[10px] flex-1 flex-col items-center justify-end gap-[2px]" title={`${formatDate(d.day)} · ${d.completed} görev · ${d.hours} sa`}>
                                        <div className="w-full rounded-t bg-emerald-400/90" style={{ height: `${(d.completed / maxCompleted) * 70}px` }} />
                                        <div className="w-full rounded-t bg-violet-400/80" style={{ height: `${(d.hours / maxHours) * 70}px` }} />
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-1 flex justify-between text-[10px] text-gray-500"><span>{formatDate(report.range.from)}</span><span>{formatDate(report.range.to)}</span></div>
                    </Card>

                    <Card padded={false} className="print:break-inside-avoid">
                        {rows.length === 0 ? <EmptyState icon={BarChart3} title="Veri yok" /> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 text-xs text-gray-400 print:bg-gray-100 print:text-black">
                                        <tr>
                                            <Th k="name" label="Kişi" />
                                            <Th k="completed" label="Tamamlanan" />
                                            <Th k="onTimeRate" label="Zamanında" />
                                            <Th k="open" label="Açık" />
                                            <Th k="overdue" label="Geciken" />
                                            <th className="px-3 py-2 text-left font-medium">Ort. süre</th>
                                            <Th k="hoursLogged" label="Saat" />
                                            <Th k="handoffsGiven" label="Pas (ver./al.)" />
                                            <th className="px-3 py-2 text-left font-medium">Yapılacak</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 print:divide-gray-200">
                                        {rows.map((u) => (
                                            <tr key={u.userId} className="text-gray-200 print:text-black">
                                                <td className="px-3 py-2"><div className="font-medium">{u.name}</div><div className="text-[11px] text-gray-500">{[u.title, u.department].filter(Boolean).join(' · ')}</div></td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 text-right font-semibold">{u.completed}</span>
                                                        <div className="h-1.5 w-20 overflow-hidden rounded bg-white/10 print:hidden"><div className="h-full bg-emerald-400" style={{ width: `${(u.completed / Math.max(1, rows[0] ? Math.max(...rows.map((r) => r.completed)) : 1)) * 100}%` }} /></div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">{u.onTimeRate === null ? '—' : <Badge tone={u.onTimeRate >= 80 ? 'success' : u.onTimeRate >= 50 ? 'warning' : 'danger'}>%{u.onTimeRate}</Badge>}</td>
                                                <td className="px-3 py-2">{u.open}{u.inReview ? <span className="text-[11px] text-gray-500"> ({u.inReview} kontrolde)</span> : ''}</td>
                                                <td className={`px-3 py-2 ${u.overdue ? 'text-rose-300 print:text-red-700' : ''}`}>{u.overdue}</td>
                                                <td className="px-3 py-2">{u.avgCycleHours === null ? '—' : u.avgCycleHours >= 24 ? `${Math.round((u.avgCycleHours / 24) * 10) / 10} gün` : `${u.avgCycleHours} sa`}</td>
                                                <td className="px-3 py-2">{u.hoursLogged}</td>
                                                <td className="px-3 py-2">{u.handoffsGiven} / {u.handoffsReceived}{u.handoffsReturned ? <span className="text-[11px] text-gray-500"> ({u.handoffsReturned} geri)</span> : ''}</td>
                                                <td className="px-3 py-2">{u.todosCompleted}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <Card className="print:break-inside-avoid">
                            <div className="mb-3 text-sm font-semibold text-white print:text-black">Tamamlanan görevler ({report.completedTasks.length})</div>
                            {report.completedTasks.length === 0 ? <p className="text-sm text-gray-500">Yok.</p> : (
                                <ul className="max-h-96 space-y-1.5 overflow-y-auto text-sm print:max-h-none">
                                    {report.completedTasks.map((t) => (
                                        <li key={t.id} className="flex items-start justify-between gap-3">
                                            <Link href={`/admin/gorevler?taskId=${t.id}`} className="min-w-0 text-gray-200 hover:underline print:text-black"><span className="block truncate">{t.title}</span><span className="text-[11px] text-gray-500">{t.assignees.join(', ')}</span></Link>
                                            <span className="shrink-0 text-right text-[11px] text-gray-400">{formatDate(t.completedAt)}<br />{t.dueDate ? (t.onTime ? <span className="text-emerald-300 print:text-green-700">zamanında</span> : <span className="text-rose-300 print:text-red-700">gecikmeli</span>) : 'terminsiz'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                        <Card className="print:break-inside-avoid">
                            <div className="mb-3 text-sm font-semibold text-white print:text-black">Geciken açık görevler ({report.overdueTasks.length})</div>
                            {report.overdueTasks.length === 0 ? <p className="text-sm text-gray-500">Geciken görev yok.</p> : (
                                <ul className="max-h-96 space-y-1.5 overflow-y-auto text-sm print:max-h-none">
                                    {report.overdueTasks.map((t) => (
                                        <li key={t.id} className="flex items-start justify-between gap-3">
                                            <Link href={`/admin/gorevler?taskId=${t.id}`} className="min-w-0 text-gray-200 hover:underline print:text-black"><span className="block truncate">{t.title}</span><span className="text-[11px] text-gray-500">{t.assignees.join(', ') || 'Atanmamış'}</span></Link>
                                            <span className="shrink-0 text-[11px] text-rose-300 print:text-red-700">{formatDate(t.dueDate)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </div>
                    <p className="text-[11px] text-gray-500 print:text-gray-700">Oluşturma: {formatDateTime(report.generatedAt)} · {report.generatedBy}. “Zamanında”: termin gününün sonuna kadar tamamlanan görevler. Ortalama süre: görevin oluşturulmasından tamamlanmasına kadar geçen süre.</p>
                </>
            )}
        </div>
    );
}
