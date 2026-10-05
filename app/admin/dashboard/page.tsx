"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Rocket, UserCheck, FileText, Receipt, Layers, Mail, CheckSquare, CalendarClock, AlertCircle,
    RefreshCw, Sparkles, Plus, Newspaper, ClipboardList, ShieldCheck, ArrowRight, Inbox, UsersRound, Calculator, Cpu, ArrowRightLeft,
} from 'lucide-react';
import { AiConsole } from '@/components/admin/ai/AiConsole';
import { formatDate, formatDateTime } from '@/components/admin/ui';

type DashboardData = {
    generatedAt: string;
    user: { name: string; isSuperAdmin: boolean };
    canUseAi: boolean;
    shortcuts: { createEntrepreneur: boolean; createMentor: boolean; createNews: boolean; createTask: boolean; rent: boolean; forms: boolean };
    attention: { key: string; title: string; href: string; severity: 'high' | 'medium' | 'low'; count: number }[];
    tasks?: { open: number; overdue: number; dueToday: number; awaitingMyReview: number; items: { id: string; title: string; status: string; priority: string; dueDate: string | null }[] };
    applications?: { total: number; pendingProgram: number; pendingTekmer: number; pendingOther: number; lastWeek: number; funnel: Record<string, number>; recent: { id: string; number: string; applicantName: string; companyName: string | null; type: string; context: string | null; status: string; createdAt: string }[] };
    entrepreneurs?: { total: number; active: number; withoutProgram: number };
    mentors?: { total: number; active: number };
    programs?: { total: number; open: number };
    rent?: { activeContracts: number; overdueCount: number; overdueByCurrency: Record<string, number>; expiringContracts: number };
    reservations?: { pending: number; today: number };
    contacts?: { total: number; new: number };
    forms?: { submissionsLastWeek: number };
    news?: { drafts: number; recent: { id: string; title: string; status: string; createdAt: string }[] };
    email?: { pending: number; failed: number };
    auditLogs?: { id: string; action: string; entityType: string; actorName: string | null; actorEmail: string | null; createdAt: string }[];
    work?: { pendingPasses: number; teams: { id: string; name: string; color: string; members: number; openTasks: number; overdueTasks: number; doneLast30: number }[] };
    finance?: { receivable: number; overdue: number; overdueCount: number; drafts: number };
    quotes?: { pending: number };
};

const AI_SUGGESTIONS = ['Bugünkü işlerim', 'Bekleyen program başvuruları', 'Bekleyen TEKMER yer edinme başvuruları', 'Geciken kiraları göster', '3D modeli olmayan alanlar', 'Programı olmayan girişimler'];

const STATUS_LABEL: Record<string, string> = { TODO: 'Yapılacak', IN_PROGRESS: 'Devam ediyor', IN_REVIEW: 'Kontrolde', DONE: 'Tamamlandı', CANCELLED: 'İptal' };
const TYPE_LABEL: Record<string, string> = { PROGRAM: 'Program', TEKMER: 'TEKMER', IDEATHON: 'Ideathon', MENTOR: 'Mentör', EVENT: 'Etkinlik', TRAINING: 'Eğitim' };

const money = (v: number, c: string) => `${v.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${c}`;

function StatCard({ title, value, sub, href, icon: Icon, accent }: { title: string; value: number; sub: string; href: string; icon: React.ComponentType<{ className?: string }>; accent: string }) {
    return (
        <Link href={href} className="group rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-4 transition-colors hover:border-white/25">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">{title}</span>
                <Icon className={`h-4 w-4 ${accent}`} />
            </div>
            <div className="mt-2 font-orbitron text-2xl font-bold text-white">{value.toLocaleString('tr-TR')}</div>
            <div className="mt-1 text-[11px] text-gray-500 group-hover:text-gray-300">{sub}</div>
        </Link>
    );
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Veriler alınamadı');
            setData(json as DashboardData);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Veriler alınamadı');
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const stats: React.ComponentProps<typeof StatCard>[] = [];
    if (data?.entrepreneurs) stats.push({ title: 'Girişimciler', value: data.entrepreneurs.total, sub: `${data.entrepreneurs.active} aktif · ${data.entrepreneurs.withoutProgram} programsız`, href: '/admin/girisimciler', icon: Rocket, accent: 'text-purple-400' });
    if (data?.applications) stats.push({ title: 'Bekleyen program başvurusu', value: data.applications.pendingProgram, sub: `Son 7 gün: ${data.applications.lastWeek} yeni başvuru`, href: '/admin/basvurular?view=program', icon: FileText, accent: 'text-emerald-400' });
    if (data?.applications) stats.push({ title: 'Bekleyen TEKMER başvurusu', value: data.applications.pendingTekmer, sub: 'Yer edinme başvuruları', href: '/admin/basvurular?view=tekmer', icon: ClipboardList, accent: 'text-teal-400' });
    if (data?.rent) stats.push({ title: 'Kira & Sözleşme', value: data.rent.activeContracts, sub: data.rent.overdueCount ? `${data.rent.overdueCount} gecikmiş tahakkuk` : 'Gecikmiş tahakkuk yok', href: '/admin/finans/kiralar', icon: Receipt, accent: 'text-amber-400' });
    if (data?.mentors) stats.push({ title: 'Mentörler', value: data.mentors.total, sub: `${data.mentors.active} aktif`, href: '/admin/mentorler', icon: UserCheck, accent: 'text-cyan-400' });
    if (data?.programs) stats.push({ title: 'Programlar', value: data.programs.total, sub: `${data.programs.open} başvuruya açık`, href: '/admin/programlar', icon: Layers, accent: 'text-indigo-400' });
    if (data?.reservations) stats.push({ title: 'Rezervasyon talepleri', value: data.reservations.pending, sub: `Bugün ${data.reservations.today} onaylı rezervasyon`, href: '/admin/alanlar?tab=rezervasyonlar', icon: CalendarClock, accent: 'text-sky-400' });
    if (data?.contacts) stats.push({ title: 'İletişim talepleri', value: data.contacts.new, sub: `Toplam ${data.contacts.total} talep`, href: '/admin/iletisim', icon: Mail, accent: 'text-rose-400' });
    if (data?.work) stats.push({ title: 'Bana paslanan işler', value: data.work.pendingPasses, sub: 'Yanıt bekleyen paslar', href: '/admin/is-takip?tab=inbox', icon: ArrowRightLeft, accent: 'text-fuchsia-400' });
    if (data?.quotes) stats.push({ title: 'Makine teklif talepleri', value: data.quotes.pending, sub: 'Lazer · dizgi · 3D baskı', href: '/admin/form-builder', icon: Cpu, accent: 'text-orange-400' });

    const shortcuts = [
        data?.shortcuts.createEntrepreneur && { label: 'Girişimci Ekle', href: '/admin/girisimciler?action=create', icon: Rocket },
        data?.shortcuts.createMentor && { label: 'Mentör Ekle', href: '/admin/mentorler?action=create', icon: UserCheck },
        data?.shortcuts.createTask && { label: 'Görev Oluştur', href: '/admin/gorevler?action=create', icon: CheckSquare },
        data?.shortcuts.createNews && { label: 'Haber Ekle', href: '/admin/haberler?action=create', icon: Newspaper },
        data?.shortcuts.forms && { label: 'Form Merkezi', href: '/admin/form-builder', icon: ClipboardList },
        data?.shortcuts.rent && { label: 'Kira Yönetimi', href: '/admin/finans/kiralar', icon: Receipt },
    ].filter(Boolean) as { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];

    const funnel = data?.applications?.funnel;
    const funnelTotal = funnel ? Object.values(funnel).reduce((a, b) => a + b, 0) : 0;

    return (
        <div className="space-y-6 pb-12">
            {data?.canUseAi && (
                <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-[#121124] via-[#0b0a14] to-[#07060e] p-5 sm:p-6">
                    <div className="relative z-10 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-purple-600">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-orbitron text-base font-bold tracking-wide text-white sm:text-lg">İKÜANTS AI Komuta & Operasyon Merkezi</h2>
                                    <p className="text-xs text-gray-400">Bugün kurumda veya web sitesinde ne yapmak istiyorsunuz? Doğal Türkçe ile komut verin.</p>
                                </div>
                            </div>
                            <Link href="/admin/ai" className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white">
                                Komuta Merkezi <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        <AiConsole variant="hero" suggestions={AI_SUGGESTIONS} onChanged={load} />
                    </div>
                </section>
            )}

            <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d0e1b]/90 p-4 sm:flex-row sm:items-center sm:p-5">
                <div>
                    <h1 className="font-orbitron text-xl font-bold tracking-wide text-white sm:text-2xl">Operasyon & Yönetim Merkezi</h1>
                    <p className="mt-1 text-xs text-gray-400">
                        {data ? `Merhaba ${data.user.name}. Veriler canlıdır · ${formatDateTime(data.generatedAt)}` : 'Veriler yükleniyor…'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={load} disabled={refreshing} title="Verileri Yenile" aria-label="Verileri Yenile" className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 hover:text-white disabled:opacity-50">
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <Link href="/admin/benim-gunum" className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90">Benim Günüm</Link>
                </div>
            </div>

            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div>}

            {!data && !error && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />)}
                </div>
            )}

            {data && (
                <>
                    {stats.length > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((s) => <StatCard key={s.title} {...s} />)}</div>}

                    {shortcuts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {shortcuts.map((s) => (
                                <Link key={s.href} href={s.href} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 hover:border-primary/40 hover:text-white">
                                    <Plus className="h-3.5 w-3.5" /> <s.icon className="h-3.5 w-3.5" /> {s.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {(data.work?.teams.length || data.finance) && (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {data.work && data.work.teams.length > 0 && (
                                <section className="rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-5 lg:col-span-2">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 font-orbitron text-sm font-bold text-white"><UsersRound className="h-4 w-4 text-primary" /> Ekip Nabzı</h3>
                                        <Link href="/admin/ekipler" className="text-xs text-primary hover:underline">Tüm ekipler</Link>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {data.work.teams.slice(0, 6).map((t) => {
                                            const total = Math.max(1, t.openTasks + t.doneLast30);
                                            return (
                                                <Link key={t.id} href={`/admin/gorevler?teamId=${t.id}`} className="rounded-xl border border-white/5 bg-white/[0.03] p-3 hover:border-white/20">
                                                    <div className="flex items-center justify-between text-sm font-semibold text-white"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />{t.name}</span><span className="text-[11px] font-normal text-gray-500">{t.members} kişi</span></div>
                                                    <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/5"><div className="bg-emerald-400" style={{ width: `${(t.doneLast30 / total) * 100}%` }} /><div className="bg-rose-400" style={{ width: `${(t.overdueTasks / total) * 100}%` }} /></div>
                                                    <div className="mt-1.5 text-[11px] text-gray-400">{t.openTasks} açık · <span className={t.overdueTasks ? 'text-rose-300' : ''}>{t.overdueTasks} geciken</span> · {t.doneLast30} biten (30 gün)</div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                            {data.finance && (
                                <section className={`rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-5 ${data.work?.teams.length ? '' : 'lg:col-span-3'}`}>
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 font-orbitron text-sm font-bold text-white"><Calculator className="h-4 w-4 text-emerald-400" /> Finans</h3>
                                        <Link href="/admin/muhasebe" className="text-xs text-primary hover:underline">Ön muhasebe</Link>
                                    </div>
                                    <div className={data.work?.teams.length ? 'space-y-3' : 'grid gap-4 sm:grid-cols-3'}>
                                        <div><div className="text-[11px] text-gray-500">Açık alacak</div><div className="font-mono text-xl font-bold text-white">{money(data.finance.receivable, '₺')}</div></div>
                                        <div><div className="text-[11px] text-gray-500">Vadesi geçen</div><div className={`font-mono text-lg font-bold ${data.finance.overdue ? 'text-amber-300' : 'text-white'}`}>{money(data.finance.overdue, '₺')} <span className="text-xs font-normal text-gray-500">({data.finance.overdueCount} fatura)</span></div></div>
                                        {data.finance.drafts > 0 && <div className="text-[11px] text-gray-400">{data.finance.drafts} fatura taslakta bekliyor.</div>}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <section className="rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-5 lg:col-span-1">
                            <h3 className="mb-3 flex items-center gap-2 font-orbitron text-sm font-bold text-white"><AlertCircle className="h-4 w-4 text-amber-400" /> Dikkat Gerektirenler</h3>
                            {data.attention.length === 0 ? (
                                <p className="text-xs text-gray-500">Şu anda bekleyen kritik bir iş yok.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {data.attention.map((a) => (
                                        <li key={a.key}>
                                            <Link href={a.href} className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-gray-200 hover:border-white/20">
                                                <span className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 shrink-0 rounded-full ${a.severity === 'high' ? 'bg-rose-400' : a.severity === 'medium' ? 'bg-amber-400' : 'bg-gray-500'}`} />
                                                    {a.title}
                                                </span>
                                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {data.rent && Object.keys(data.rent.overdueByCurrency).length > 0 && (
                                <p className="mt-3 text-[11px] text-gray-400">Geciken kira toplamı: {Object.entries(data.rent.overdueByCurrency).map(([c, v]) => money(v, c)).join(' + ')}</p>
                            )}
                            {data.email && data.email.pending > 0 && <p className="mt-2 text-[11px] text-gray-400">E-posta kuyruğunda {data.email.pending} ileti bekliyor.</p>}
                        </section>

                        {data.tasks && (
                            <section className="rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-5 lg:col-span-2">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 font-orbitron text-sm font-bold text-white"><CheckSquare className="h-4 w-4 text-blue-400" /> İşlerim</h3>
                                    <Link href="/admin/gorevler?scope=assigned" className="text-xs text-primary hover:underline">Tüm görevler</Link>
                                </div>
                                <div className="mb-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                                    {[
                                        ['Açık', data.tasks.open],
                                        ['Bugün', data.tasks.dueToday],
                                        ['Geciken', data.tasks.overdue],
                                        ['Kontrolümde', data.tasks.awaitingMyReview],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-xl bg-white/[0.03] px-2 py-2">
                                            <div className="font-orbitron text-lg font-bold text-white">{value}</div>
                                            <div className="text-[11px] text-gray-500">{label}</div>
                                        </div>
                                    ))}
                                </div>
                                {data.tasks.items.length === 0 ? (
                                    <p className="text-xs text-gray-500">Size atanmış açık görev yok.</p>
                                ) : (
                                    <ul className="divide-y divide-white/5">
                                        {data.tasks.items.map((t) => (
                                            <li key={t.id}>
                                                <Link href={`/admin/gorevler?taskId=${t.id}`} className="flex items-center justify-between gap-3 py-2 text-xs hover:text-white">
                                                    <span className="truncate text-gray-200">{t.title}</span>
                                                    <span className="shrink-0 text-gray-500">{STATUS_LABEL[t.status] || t.status} · {t.dueDate ? formatDate(t.dueDate) : 'Terminsiz'}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        )}
                    </div>

                    {data.applications && (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <section className="rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-orbitron text-sm font-bold text-white">Başvuru Huni Dağılımı</h3>
                                    <Link href="/admin/basvurular" className="text-xs text-primary hover:underline">Tümü</Link>
                                </div>
                                {funnelTotal === 0 ? (
                                    <p className="text-xs text-gray-500">Henüz başvuru yok.</p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {[
                                            ['NEW', 'Yeni', 'bg-sky-400'],
                                            ['IN_REVIEW', 'Değerlendirmede', 'bg-amber-400'],
                                            ['ACCEPTED', 'Kabul', 'bg-emerald-400'],
                                            ['REJECTED', 'Ret', 'bg-rose-400'],
                                        ].map(([key, label, color]) => {
                                            const v = funnel?.[key] || 0;
                                            return (
                                                <div key={key}>
                                                    <div className="mb-1 flex justify-between text-[11px] text-gray-400"><span>{label}</span><span>{v}</span></div>
                                                    <div className="h-1.5 rounded-full bg-white/5"><div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.round((v / funnelTotal) * 100)}%` }} /></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {data.applications.pendingOther > 0 && <p className="mt-3 text-[11px] text-gray-500">Diğer bekleyen başvurular (Ideathon, mentör vb.): {data.applications.pendingOther}</p>}
                            </section>

                            <section className="rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-5 lg:col-span-2">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-orbitron text-sm font-bold text-white">Son Başvurular</h3>
                                    <Link href="/admin/basvurular" className="text-xs text-primary hover:underline">Başvuru Merkezi</Link>
                                </div>
                                {data.applications.recent.length === 0 ? (
                                    <p className="text-xs text-gray-500">Henüz başvuru yok.</p>
                                ) : (
                                    <ul className="divide-y divide-white/5">
                                        {data.applications.recent.map((a) => (
                                            <li key={a.id}>
                                                <Link href={`/admin/basvurular/${a.id}`} className="flex items-center justify-between gap-3 py-2 text-xs hover:text-white">
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-gray-200">{a.applicantName}{a.companyName ? ` · ${a.companyName}` : ''}</span>
                                                        <span className="block truncate text-[11px] text-gray-500">{a.number} · {TYPE_LABEL[a.type] || a.type}{a.context ? ` · ${a.context}` : ''}</span>
                                                    </span>
                                                    <span className="shrink-0 text-right text-[11px] text-gray-400">{a.status}<br />{formatDate(a.createdAt)}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {data.auditLogs && (
                            <section className="rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 font-orbitron text-sm font-bold text-white"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Yönetici Hareketleri</h3>
                                    <Link href="/admin/audit-log" className="text-xs text-primary hover:underline">Denetim kayıtları</Link>
                                </div>
                                {data.auditLogs.length === 0 ? <p className="text-xs text-gray-500">Kayıt yok.</p> : (
                                    <ul className="space-y-1.5 text-xs">
                                        {data.auditLogs.map((l) => (
                                            <li key={l.id} className="flex justify-between gap-3 text-gray-300">
                                                <span className="truncate">{l.actorName || l.actorEmail || 'Sistem'} · {l.action} · {l.entityType}</span>
                                                <span className="shrink-0 text-gray-500">{formatDateTime(l.createdAt)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        )}
                        {data.news && (
                            <section className="rounded-2xl border border-white/10 bg-[#0d0e1b]/80 p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 font-orbitron text-sm font-bold text-white"><Newspaper className="h-4 w-4 text-sky-400" /> Haberler & Yayınlar</h3>
                                    <Link href="/admin/haberler" className="text-xs text-primary hover:underline">Haberler</Link>
                                </div>
                                {data.news.recent.length === 0 ? <p className="text-xs text-gray-500">Haber yok.</p> : (
                                    <ul className="space-y-1.5 text-xs">
                                        {data.news.recent.map((n) => (
                                            <li key={n.id} className="flex justify-between gap-3 text-gray-300">
                                                <span className="truncate">{n.title}</span>
                                                <span className="shrink-0 text-gray-500">{n.status === 'PUBLISHED' ? 'Yayında' : n.status === 'DRAFT' ? 'Taslak' : n.status}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {data.forms && <p className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500"><Inbox className="h-3.5 w-3.5" /> Son 7 günde {data.forms.submissionsLastWeek} form gönderimi</p>}
                            </section>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
