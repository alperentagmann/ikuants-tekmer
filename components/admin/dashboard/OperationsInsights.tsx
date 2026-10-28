"use client";
/**
 * Yönetim paneli — operasyon göstergeleri: KPI kartları, grafikler, aksiyon masası, girişim sağlığı.
 * Veri: /api/admin/dashboard/operations. Yetkisiz blok gösterilmez; veri yoksa boş durum yazar (sabit sayı yok).
 */
import { useId, useState } from 'react';
import Link from 'next/link';
import { Activity, Building2, CalendarClock, FileSignature, HeartPulse, Timer, TrendingUp, Wallet } from 'lucide-react';
import { Badge } from '@/components/admin/ui';
import { useApi, ErrorState, ProgressBar, fmtDate } from '@/components/admin/ops-kit';
import type { OperationsDashboard as D } from '@/lib/services/operations-dashboard-service';

const WINDOWS = [7, 14, 30, 60, 90];
const nf = new Intl.NumberFormat('tr-TR');
const money = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
const pct = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `%${nf.format(n)}`);
const TYPE_LABEL: Record<string, string> = { PROGRAM: 'Program', TEKMER: 'TEKMER yer edinme', IDEATHON: 'Ideathon', HACKATHON: 'Hackathon', EVENT: 'Etkinlik', TRAINING: 'Eğitim', MENTOR: 'Mentör' };
const PROJECT_LABEL: Record<string, string> = { PROPOSAL: 'Teklif / başvuru', APPROVED: 'Onaylandı', ACTIVE: 'Aktif', COMPLETED: 'Tamamlandı', SUSPENDED: 'Askıda', CANCELLED: 'İptal' };

function Panel({ title, icon: Icon, href, children, className = '' }: { title: string; icon: React.ComponentType<{ className?: string }>; href?: string; children: React.ReactNode; className?: string }) {
    return (
        <section className={`rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-4 ${className}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Icon className="h-4 w-4 text-primary" />{title}</h3>
                {href && <Link href={href} className="text-xs text-gray-400 hover:text-white">Tümü →</Link>}
            </div>
            {children}
        </section>
    );
}

function Kpi({ label, value, sub, href, children }: { label: string; value: React.ReactNode; sub?: React.ReactNode; href?: string; children?: React.ReactNode }) {
    const body = (
        <>
            <p className="truncate text-xs text-gray-400">{label}</p>
            <p className="mt-1 font-orbitron text-2xl font-bold tabular-nums text-white">{value}</p>
            {children}
            {sub && <p className="mt-1 truncate text-[11px] text-gray-500">{sub}</p>}
        </>
    );
    const cls = 'block min-w-0 rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-4';
    return href ? <Link href={href} className={`${cls} transition-colors hover:border-white/25`}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Dikey çubuk grafik; her çubuğun değeri ve etiketi metin olarak da görünür, ekran okuyucuya tablo verilir. */
function Bars({ data, label, color = 'bg-primary/75', format = (n: number) => nf.format(n) }: { data: { key: string; label: string; value: number }[]; label: string; color?: string; format?: (n: number) => string }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) return <p className="py-8 text-center text-xs text-gray-500">Bu dönemde veri yok.</p>;
    return (
        <figure>
            <div className="flex h-36 items-end gap-1" aria-hidden>
                {data.map((d) => (
                    <div key={d.key} className="group flex min-w-0 flex-1 flex-col items-center gap-1" title={`${d.label}: ${format(d.value)}`}>
                        <span className="text-[10px] tabular-nums text-gray-400">{d.value ? format(d.value) : ''}</span>
                        <div className={`w-full rounded-t ${color} transition-[height] duration-500 group-hover:opacity-100`} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 3 : 1 }} />
                        <span className="w-full truncate text-center text-[10px] text-gray-500">{d.label}</span>
                    </div>
                ))}
            </div>
            <table className="sr-only"><caption>{label}</caption><tbody>{data.map((d) => <tr key={d.key}><th>{d.label}</th><td>{format(d.value)}</td></tr>)}</tbody></table>
        </figure>
    );
}

function HBars({ rows, empty }: { rows: { key: string; label: string; value: number; hint?: string }[]; empty: string }) {
    if (!rows.length) return <p className="py-6 text-center text-xs text-gray-500">{empty}</p>;
    const max = Math.max(1, ...rows.map((r) => r.value));
    return (
        <ul className="space-y-2.5">
            {rows.map((r) => (
                <li key={r.key}>
                    <div className="flex justify-between gap-3 text-sm"><span className="truncate text-gray-300">{r.label}</span><span className="tabular-nums text-white">{r.hint ?? nf.format(r.value)}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(r.value / max) * 100}%` }} /></div>
                </li>
            ))}
        </ul>
    );
}

function DaysPill({ days }: { days: number }) {
    return <Badge tone={days <= 14 ? 'danger' : 'neutral'}>{days <= 0 ? 'Bugün' : `${days} gün`}</Badge>;
}

const DESK = [
    { key: 'expiringRent', label: 'Kira sözleşmeleri' },
    { key: 'expiringPolicies', label: 'Poliçeler' },
    { key: 'expiringProjects', label: 'Projeler' },
] as const;

export function OperationsInsights() {
    const [windowDays, setWindowDays] = useState(30);
    const [tab, setTab] = useState<(typeof DESK)[number]['key']>('expiringRent');
    const baseId = useId();
    const q = useApi<{ dashboard: D }>(`/api/admin/dashboard/operations?window=${windowDays}`);
    if (q.error) return <section className="rounded-2xl border border-white/10"><ErrorState error={q.error} onRetry={q.reload} /></section>;
    const d = q.data?.dashboard;
    if (!d) return <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />)}</div>;
    const k = d.kpis, c = d.charts;
    const desk = DESK.filter((t) => d.actionDesk[t.key] !== null);
    const deskRows = d.actionDesk[tab] ?? [];

    return (
        <section aria-labelledby="ops-insights" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="ops-insights" className="font-orbitron text-base font-bold tracking-wide text-white">Operasyon Göstergeleri</h2>
                <label className="flex items-center gap-2 text-xs text-gray-400">Uyarı penceresi
                    <select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white [&>option]:bg-[#0f0f1a]">
                        {WINDOWS.map((w) => <option key={w} value={w}>{w} gün</option>)}
                    </select>
                </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {k.occupancy && <Kpi label="Ofis doluluk oranı" value={pct(k.occupancy.byAreaPct)} href="/admin/alan-yonetimi" sub={k.occupancy.rentableUnits ? `m² bazında · bölüm bazında ${pct(k.occupancy.byCountPct)} (${k.occupancy.occupiedUnits}/${k.occupancy.rentableUnits}) · ${k.occupancy.available} boş` : 'Bağımsız bölüm tanımlı değil'}><div className="mt-2"><ProgressBar value={k.occupancy.byAreaPct ?? 0} /></div></Kpi>}
                {k.onSite && <Kpi label="Yerleşkede şu an (PDKS)" value={nf.format(k.onSite.total)} href="/admin/pdks" sub={`${k.onSite.staff} personel · ${k.onSite.members} girişim · ${k.onSite.visitors} ziyaretçi · bugün ${k.onSite.entriesToday} giriş`} />}
                {k.contracts && <Kpi label="Aktif kira sözleşmesi" value={nf.format(k.contracts.active)} href="/admin/finans/kiralar" sub={k.contracts.unlinkedAssignments ? `${k.contracts.unlinkedAssignments} aktif ofis tahsisine sözleşme bağlanmamış` : `Toplam ${k.contracts.total} sözleşme kaydı`} />}
                <Kpi label={`${d.windowDays} gün içinde biten`} value={nf.format((k.expiring.rent ?? 0) + (k.expiring.policies ?? 0) + (k.expiring.projects ?? 0))} sub={[k.expiring.rent !== null && `${k.expiring.rent} sözleşme`, k.expiring.policies !== null && `${k.expiring.policies} poliçe`, k.expiring.projects !== null && `${k.expiring.projects} proje`].filter(Boolean).join(' · ')} />
                {k.approvals !== null && <Kpi label="Onayımı bekleyen" value={nf.format(k.approvals)} href="/admin/onaylar" sub="İş akışı onayları" />}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {c.applicationsTrend && (
                    <Panel title="Başvuru trendi (12 ay)" icon={TrendingUp} href="/admin/basvurular" className="xl:col-span-2">
                        <Bars label="Aylık başvuru sayısı" data={c.applicationsTrend.map((m) => ({ key: m.key, label: m.label, value: m.count }))} />
                    </Panel>
                )}
                {c.applicationTypes && (
                    <Panel title="Başvuru türleri (12 ay)" icon={FileSignature}>
                        <HBars rows={c.applicationTypes.map((t) => ({ key: t.type, label: TYPE_LABEL[t.type] ?? t.type, value: t.count }))} empty="Son 12 ayda başvuru yok." />
                    </Panel>
                )}
                {c.occupancyByBuilding && (
                    <Panel title="Bina bazında doluluk (m²)" icon={Building2} href="/admin/alan-yonetimi">
                        <HBars rows={c.occupancyByBuilding.map((b) => ({ key: b.id, label: b.name, value: b.byAreaPct ?? 0, hint: `${pct(b.byAreaPct)} · ${b.occupiedUnits}/${b.rentableUnits}` }))} empty="Bina / bölüm tanımlı değil." />
                    </Panel>
                )}
                {c.pdksDaily && (
                    <Panel title="Günlük ofis girişi (14 gün)" icon={Timer} href="/admin/pdks">
                        <Bars label="Günlük giriş" color="bg-emerald-500/70" data={c.pdksDaily.map((x) => ({ key: x.day, label: x.day.slice(8), value: x.count }))} />
                    </Panel>
                )}
                {c.rentTrend && (
                    <Panel title="Kira tahakkuk / tahsilat (6 ay, TRY)" icon={Wallet} href="/admin/raporlar/kira">
                        <div className="space-y-2">
                            {c.rentTrend.every((m) => !m.accrued) ? <p className="py-6 text-center text-xs text-gray-500">Bu dönemde tahakkuk yok.</p> : c.rentTrend.map((m) => (
                                <div key={m.key} title={`${m.label}: tahakkuk ${money(m.accrued)}, tahsil ${money(m.collected)}`}>
                                    <div className="flex justify-between text-xs"><span className="text-gray-400">{m.label}</span><span className="tabular-nums text-gray-200">{money(m.collected)} / {money(m.accrued)}</span></div>
                                    <div className="mt-1 h-2 rounded-full bg-white/5"><div className="h-full rounded-full bg-amber-400/80" style={{ width: `${m.accrued ? Math.min(100, (m.collected / m.accrued) * 100) : 0}%` }} /></div>
                                </div>
                            ))}
                            {c.otherCurrencyAccruals > 0 && <p className="text-[11px] text-gray-500">{c.otherCurrencyAccruals} döviz tahakkuku bu grafiğe katılmadı (kur çevirisi yapılmaz).</p>}
                        </div>
                    </Panel>
                )}
                {c.projectStatus && (
                    <Panel title="Proje durumları" icon={Activity} href="/admin/projeler">
                        <HBars rows={c.projectStatus.map((p) => ({ key: p.status, label: PROJECT_LABEL[p.status] ?? p.status, value: p.count }))} empty="Proje kaydı yok." />
                    </Panel>
                )}
            </div>

            {desk.length > 0 && (
                <section className="rounded-2xl border border-white/10 bg-[#0d0e1b]/80">
                    <div className="flex items-center justify-between gap-2 px-4 pt-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><CalendarClock className="h-4 w-4 text-primary" />Kritik uyarılar · önümüzdeki {d.windowDays} gün</h3>
                    </div>
                    <div role="tablist" aria-label="Aksiyon masası" className="mt-2 flex gap-1 overflow-x-auto border-b border-white/5 px-3">
                        {desk.map((t) => (
                            <button key={t.key} id={`${baseId}-${t.key}`} role="tab" type="button" aria-selected={tab === t.key} aria-controls={`${baseId}-panel`} onClick={() => setTab(t.key)}
                                className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm ${tab === t.key ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                                {t.label} <span className="ml-1 text-xs text-gray-500">{d.actionDesk[t.key]?.length ?? 0}</span>
                            </button>
                        ))}
                    </div>
                    <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-${tab}`}>
                        {deskRows.length === 0 ? <p className="px-4 py-8 text-center text-sm text-gray-500">Bu aralıkta biten kayıt yok.</p> : (
                            <ul className="divide-y divide-white/5">
                                {deskRows.map((r) => (
                                    <li key={r.id}>
                                        <Link href={r.href} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.02]">
                                            <span className="min-w-0 flex-1 truncate text-white">{r.title}<span className="block truncate text-xs text-gray-500">{r.detail}</span></span>
                                            <span className="text-xs text-gray-400">{fmtDate(r.endDate)}</span>
                                            <DaysPill days={r.daysLeft} />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            {(d.mentoring || d.health) && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    {d.mentoring && (
                        <Panel title="Bu ay mentörlük" icon={HeartPulse} href="/admin/mentorler">
                            <p className="font-orbitron text-2xl font-bold text-white">{nf.format(d.mentoring.hours)} sa</p>
                            <p className="text-xs text-gray-400">{d.mentoring.sessions} seans{d.mentoring.targetHours !== null ? ` · hedef ${d.mentoring.targetHours} sa` : ' · aylık hedef tanımlı değil'}</p>
                            {d.mentoring.targetHours !== null && <div className="mt-2"><ProgressBar value={(d.mentoring.hours / Math.max(1, d.mentoring.targetHours)) * 100} /></div>}
                            <p className="mt-3 text-sm text-gray-300">Ortalama memnuniyet: {d.mentoring.avgRating === null ? <span className="text-gray-500">değerlendirme yok</span> : <span aria-label={`5 üzerinden ${d.mentoring.avgRating}`}>{'★'.repeat(Math.round(d.mentoring.avgRating))}<span className="text-gray-600">{'★'.repeat(5 - Math.round(d.mentoring.avgRating))}</span> {d.mentoring.avgRating}</span>}</p>
                        </Panel>
                    )}
                    {d.health && (
                        <Panel title="Girişim sağlığı (son 30 gün)" icon={Activity} href="/admin/girisimciler" className="xl:col-span-2">
                            {d.health.thresholds.minEntries === null && d.health.thresholds.minHours === null && <p className="mb-2 text-xs text-amber-300">Sağlık eşikleri tanımlı değil; durum hesaplanmıyor. <Link href="/admin/parametreler" className="underline">Sistem Parametreleri</Link> → “Mentörlük ve girişim sağlığı” eşiklerini girin.</p>}
                            {d.health.rows.length === 0 ? <p className="py-6 text-center text-xs text-gray-500">Aktif girişim yok.</p> : (
                                <div className="max-h-72 overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-[#0d0e1b]"><tr className="text-left text-[11px] uppercase tracking-wider text-gray-500"><th className="py-1.5 pr-3">Firma</th><th className="py-1.5 pr-3 text-right">Ofis girişi</th><th className="py-1.5 pr-3 text-right">Mentörlük</th><th className="py-1.5">Durum</th></tr></thead>
                                        <tbody className="divide-y divide-white/5">
                                            {d.health.rows.map((r) => (
                                                <tr key={r.id}>
                                                    <td className="py-1.5 pr-3"><Link href={`/admin/girisimciler/${r.id}`} className="text-gray-200 hover:underline">{r.name}</Link></td>
                                                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.officeEntries ?? '—'}</td>
                                                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.mentorHours === null ? '—' : `${nf.format(r.mentorHours)} sa`}</td>
                                                    <td className="py-1.5">{r.status ? <Badge tone={r.status === 'HEALTHY' ? 'success' : r.status === 'WATCH' ? 'warning' : 'danger'}>{r.status === 'HEALTHY' ? 'Sağlıklı' : r.status === 'WATCH' ? 'İzlenmeli' : 'Risk'}</Badge> : <span className="text-xs text-gray-500">—</span>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Panel>
                    )}
                </div>
            )}
        </section>
    );
}
