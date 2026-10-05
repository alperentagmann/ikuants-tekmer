'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, GanttChartSquare, Gauge, Repeat } from 'lucide-react';
import { api, Alert, Card, EmptyState, PageHeader, Select, Skeleton, Tabs } from '@/components/admin/ui';
import { Avatar, AvatarStack, usePeople } from '@/components/admin/work/people';

interface PlanTask {
    id: string;
    title: string;
    status: string;
    priority: string;
    startDate: string | null;
    dueDate: string | null;
    estimatedHours: number | null;
    parentTaskId: string | null;
    recurrence: string | null;
    team: { id: string; name: string; color: string } | null;
    assignees: { user: { id: string; name: string; avatarUrl: string | null } }[];
}
interface Load { userId: string; name: string; avatarUrl: string | null; open: number; overdue: number; urgent: number; estimatedHours: number }
type View = 'calendar' | 'timeline' | 'workload';

const DAY_MS = 86400000;
const key = (d: Date) => new Date(d.getTime() + 3 * 3600000).toISOString().slice(0, 10);
const STATUS_TONE: Record<string, string> = { TODO: 'border-sky-400/50', IN_PROGRESS: 'border-amber-400/60', IN_REVIEW: 'border-violet-400/60', DONE: 'border-emerald-400/60 opacity-60', CANCELLED: 'border-gray-500/50 opacity-40 line-through' };
const PRIORITY_DOT: Record<string, string> = { LOW: 'bg-gray-400', MEDIUM: 'bg-sky-400', HIGH: 'bg-amber-400', URGENT: 'bg-rose-500' };

function monthGrid(anchor: Date) {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => new Date(start.getTime() + i * DAY_MS));
}

/** Calendar, timeline (Gantt) and workload views over the same task data; filters by team and person. */
export default function PlanningPage() {
    const [view, setView] = useState<View>('calendar');
    const [anchor, setAnchor] = useState(() => new Date());
    const [teamId, setTeamId] = useState('');
    const [userId, setUserId] = useState('');
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
    const [data, setData] = useState<{ tasks: PlanTask[]; workload: Load[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const people = usePeople();
    const [nowMs, setNowMs] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setNowMs(Date.now()), 0);
        return () => clearTimeout(t);
    }, [data]);

    useEffect(() => {
        const t = setTimeout(() => {
            const q = new URLSearchParams(window.location.search);
            if (q.get('teamId')) setTeamId(q.get('teamId') || '');
            if (q.get('view') === 'timeline' || q.get('view') === 'workload') setView(q.get('view') as View);
        }, 0);
        api<{ teams: { id: string; name: string }[] }>('/api/admin/teams').then((d) => setTeams(d.teams)).catch(() => undefined);
        return () => clearTimeout(t);
    }, []);

    const range = useMemo(() => {
        if (view === 'timeline') {
            const start = new Date(anchor);
            start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
            return { from: start, to: new Date(start.getTime() + 41 * DAY_MS) };
        }
        const grid = monthGrid(anchor);
        return { from: grid[0], to: grid[41] };
    }, [anchor, view]);

    const load = useCallback(async () => {
        setError(null);
        try {
            const q = new URLSearchParams({ from: key(range.from), to: key(range.to) });
            if (teamId) q.set('teamId', teamId);
            if (userId) q.set('userId', userId);
            setData(await api<{ tasks: PlanTask[]; workload: Load[] }>(`/api/admin/work/planning?${q}`));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Planlama verisi yüklenemedi');
        }
    }, [range, teamId, userId]);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const shift = (dir: -1 | 1) => {
        const d = new Date(anchor);
        if (view === 'timeline') d.setDate(d.getDate() + dir * 28);
        else d.setMonth(d.getMonth() + dir);
        setAnchor(d);
    };

    const byDay = useMemo(() => {
        const m = new Map<string, PlanTask[]>();
        for (const t of data?.tasks || []) {
            if (!t.dueDate) continue;
            const k = key(new Date(t.dueDate));
            m.set(k, [...(m.get(k) || []), t]);
        }
        return m;
    }, [data]);

    const todayKey = key(new Date());
    const title = view === 'timeline' ? `${range.from.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${range.to.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}` : anchor.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-5">
            <PageHeader title="İş Planlama" icon={CalendarDays} description="Ekiplerin işlerini takvimde, zaman çizelgesinde ve kişi bazlı iş yükünde görün. Bir işe tıklayarak ayrıntısını açın." />
            <div className="flex flex-wrap items-center gap-3">
                <Tabs<View> value={view} onChange={setView} tabs={[{ value: 'calendar', label: 'Takvim', icon: CalendarDays }, { value: 'timeline', label: 'Zaman çizelgesi', icon: GanttChartSquare }, { value: 'workload', label: 'Ekip yükü', icon: Gauge }]} />
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Select aria-label="Ekip" value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="Tüm ekipler" options={teams.map((t) => ({ value: t.id, label: t.name }))} />
                    <Select aria-label="Kişi" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Tüm kişiler" options={people.map((p) => ({ value: p.id, label: p.name }))} />
                </div>
            </div>
            {error && <Alert tone="danger">{error}</Alert>}

            {view !== 'workload' && (
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => shift(-1)} className="rounded-lg border border-white/10 p-1.5 text-gray-300 hover:bg-white/5" aria-label="Önceki"><ChevronLeft className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setAnchor(new Date())} className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-300 hover:bg-white/5">Bugün</button>
                    <button type="button" onClick={() => shift(1)} className="rounded-lg border border-white/10 p-1.5 text-gray-300 hover:bg-white/5" aria-label="Sonraki"><ChevronRight className="h-4 w-4" /></button>
                    <h2 className="ml-2 text-sm font-semibold capitalize text-white">{title}</h2>
                </div>
            )}

            {!data ? (
                <Skeleton rows={8} />
            ) : view === 'calendar' ? (
                <Card padded={false} className="overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-white/10 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => <div key={d} className="py-2">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7">
                        {monthGrid(anchor).map((d) => {
                            const k = key(d);
                            const items = byDay.get(k) || [];
                            const inMonth = d.getMonth() === anchor.getMonth();
                            return (
                                <div key={k} className={`min-h-[110px] border-b border-r border-white/5 p-1.5 ${inMonth ? '' : 'bg-black/20 opacity-60'}`}>
                                    <div className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${k === todayKey ? 'bg-primary font-bold text-white' : 'text-gray-400'}`}>{d.getDate()}</div>
                                    <div className="space-y-1">
                                        {items.slice(0, 4).map((t) => (
                                            <Link key={t.id} href={`/admin/gorevler?taskId=${t.id}`} className={`flex items-center gap-1 truncate rounded-md border-l-2 bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-gray-200 hover:bg-white/10 ${STATUS_TONE[t.status] || ''}`} style={t.team ? { borderLeftColor: t.team.color } : undefined} title={t.title}>
                                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority] || 'bg-gray-400'}`} />
                                                {t.recurrence && <Repeat className="h-3 w-3 shrink-0 text-gray-500" />}
                                                <span className="truncate">{t.title}</span>
                                            </Link>
                                        ))}
                                        {items.length > 4 && <div className="px-1 text-[10px] text-gray-500">+{items.length - 4} iş</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            ) : view === 'timeline' ? (
                <Card padded={false} className="overflow-x-auto">
                    <div className="min-w-[900px]">
                        <div className="grid border-b border-white/10 text-[10px] text-gray-500" style={{ gridTemplateColumns: '260px repeat(42, minmax(0, 1fr))' }}>
                            <div className="px-3 py-2 font-semibold uppercase tracking-wide">İş</div>
                            {Array.from({ length: 42 }, (_, i) => new Date(range.from.getTime() + i * DAY_MS)).map((d) => (
                                <div key={key(d)} className={`py-2 text-center ${key(d) === todayKey ? 'bg-primary/20 font-bold text-white' : d.getDay() === 0 || d.getDay() === 6 ? 'bg-white/[0.02]' : ''}`}>{d.getDate()}</div>
                            ))}
                        </div>
                        {data.tasks.filter((t) => t.dueDate).length === 0 && <EmptyState icon={GanttChartSquare} title="Bu aralıkta tarihli iş yok" description="Görevlere başlangıç ve termin tarihi girildiğinde burada çubuk olarak görünür." />}
                        {data.tasks.filter((t) => t.dueDate).map((t) => {
                            const due = new Date(t.dueDate as string).getTime();
                            const start = t.startDate ? new Date(t.startDate).getTime() : due;
                            const startIdx = Math.max(0, Math.floor((start - range.from.getTime()) / DAY_MS));
                            const endIdx = Math.min(41, Math.floor((due - range.from.getTime()) / DAY_MS));
                            if (endIdx < 0 || startIdx > 41) return null;
                            const overdue = nowMs > 0 && due < nowMs && !['DONE', 'CANCELLED'].includes(t.status);
                            return (
                                <div key={t.id} className="grid items-center border-b border-white/5 hover:bg-white/[0.02]" style={{ gridTemplateColumns: '260px repeat(42, minmax(0, 1fr))' }}>
                                    <Link href={`/admin/gorevler?taskId=${t.id}`} className="flex min-w-0 items-center gap-2 px-3 py-2 text-xs text-gray-200 hover:text-white">
                                        <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority] || 'bg-gray-400'}`} />
                                        <span className="truncate">{t.parentTaskId ? '↳ ' : ''}{t.title}</span>
                                    </Link>
                                    <div className="relative h-7" style={{ gridColumn: `${startIdx + 2} / ${endIdx + 3}` }}>
                                        <div className={`absolute inset-y-1 left-0.5 right-0.5 flex items-center gap-1 overflow-hidden rounded-md px-1.5 text-[10px] font-semibold text-white shadow ${overdue ? 'ring-1 ring-rose-400' : ''} ${t.status === 'DONE' ? 'opacity-50' : ''}`} style={{ background: t.team?.color || '#4f46e5' }} title={`${t.title}${overdue ? ' · gecikmede' : ''}`}>
                                            <AvatarStack people={t.assignees.map((a) => ({ name: a.user.name, avatarUrl: a.user.avatarUrl }))} max={2} size={16} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            ) : (
                <Card>
                    {data.workload.length === 0 ? (
                        <EmptyState icon={Gauge} title="Açık iş yok" description="Seçili filtrede kimseye atanmış açık iş bulunmuyor." />
                    ) : (
                        <ul className="space-y-3">
                            {data.workload.map((w) => {
                                const max = Math.max(...data.workload.map((x) => x.open), 1);
                                return (
                                    <li key={w.userId} className="flex items-center gap-3">
                                        <Avatar name={w.name} url={w.avatarUrl} size={34} />
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center justify-between text-xs">
                                                <span className="font-medium text-white">{w.name}</span>
                                                <span className="text-gray-400">{w.open} açık · <span className={w.overdue ? 'text-rose-300' : ''}>{w.overdue} geciken</span> · {w.urgent} yüksek öncelik{w.estimatedHours ? ` · ~${Math.round(w.estimatedHours)} sa` : ''}</span>
                                            </div>
                                            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5">
                                                <div className="h-full bg-rose-500" style={{ width: `${(w.overdue / max) * 100}%` }} />
                                                <div className="h-full bg-gradient-to-r from-primary to-cyan-500" style={{ width: `${((w.open - w.overdue) / max) * 100}%` }} />
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>
            )}
        </div>
    );
}
