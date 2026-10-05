'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    CheckCircle2, Circle, Plus, Trash2, Play, Square, GripVertical, ChevronDown, ChevronUp, Repeat, Clock, Tag, Inbox, Send,
    Timer, ListTodo, ArrowRightLeft, BarChart3, CalendarDays, AlertTriangle, Check, Undo2, ArrowUpRight,
} from 'lucide-react';
import { api, Alert, Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Select, Skeleton, Tabs, TextArea, TextInput, formatDate, formatDateTime } from '@/components/admin/ui';

type ChecklistItem = { title: string; done: boolean };
type Todo = {
    id: string; title: string; description: string | null; dueDate: string | null; dueTime: string | null; priority: string; category: string;
    isCompleted: boolean; completedAt: string | null; recurrence: string | null; estimatedMinutes: number | null; checklist: ChecklistItem[]; tagList: string[];
    convertedTaskId: string | null; minutesLogged: number; sortOrder: number;
};
type Handoff = {
    id: string; status: string; note: string | null; responseNote: string | null; createdAt: string; respondedAt: string | null;
    task: { id: string; title: string; status: string; priority: string; dueDate: string | null };
    fromUser: { id: string; name: string }; toUser: { id: string; name: string };
};
type Entry = { id: string; startedAt: string; endedAt: string | null; minutes: number; note: string | null; source: string; task: { id: string; title: string } | null; todo: { id: string; title: string } | null };
type Tab = 'todos' | 'inbox' | 'outbox' | 'time';
type Filter = 'today' | 'upcoming' | 'overdue' | 'all' | 'done';

const PRIORITY: Record<string, { label: string; tone: 'neutral' | 'info' | 'warning' | 'danger'; dot: string }> = {
    LOW: { label: 'Düşük', tone: 'neutral', dot: 'bg-gray-400' },
    MEDIUM: { label: 'Orta', tone: 'info', dot: 'bg-sky-400' },
    HIGH: { label: 'Yüksek', tone: 'warning', dot: 'bg-amber-400' },
    URGENT: { label: 'Acil', tone: 'danger', dot: 'bg-rose-500' },
};
const RECURRENCE: Record<string, string> = { DAILY: 'Her gün', WEEKDAYS: 'Hafta içi her gün', WEEKLY: 'Her hafta', MONTHLY: 'Her ay' };
const todayKey = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
const dayOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }) : null);
const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60 ? `${m % 60} dk` : ''}`.trim() : `${m} dk`);

/** Current time, refreshed every second while a timer runs (keeps render pure). */
function useNow(active: boolean) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), active ? 1000 : 60000);
        return () => clearInterval(t);
    }, [active]);
    return now;
}

export default function WorkCenterPage() {
    const [tab, setTab] = useState<Tab>('todos');
    const [filter, setFilter] = useState<Filter>('today');
    const [todos, setTodos] = useState<Todo[] | null>(null);
    const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
    const [inbox, setInbox] = useState<Handoff[]>([]);
    const [outbox, setOutbox] = useState<Handoff[]>([]);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [running, setRunning] = useState<Entry | null>(null);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger' | 'info'; text: string } | null>(null);
    const [quick, setQuick] = useState({ title: '', dueDate: todayKey(), priority: 'MEDIUM', category: 'GENERAL' });
    const [expanded, setExpanded] = useState<string | null>(null);
    const [respond, setRespond] = useState<{ h: Handoff; note: string } | null>(null);
    const [manual, setManual] = useState<{ todoId: string; date: string; minutes: string; note: string } | null>(null);
    const dragId = useRef<string | null>(null);
    const now = useNow(Boolean(running));

    const fail = useCallback((e: unknown) => setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'İşlem başarısız' }), []);

    const loadTodos = useCallback(async () => {
        try {
            const d = await api<{ todos: Todo[]; categories: { value: string; label: string }[] }>(`/api/admin/work/todos${filter === 'done' ? '?all=1' : ''}`);
            setTodos(d.todos);
            setCategories(d.categories);
        } catch (e) {
            fail(e);
            setTodos([]);
        }
    }, [filter, fail]);
    const loadHandoffs = useCallback(async () => {
        try {
            const [i, o] = await Promise.all([api<{ handoffs: Handoff[] }>('/api/admin/work/handoffs?box=inbox'), api<{ handoffs: Handoff[] }>('/api/admin/work/handoffs?box=outbox')]);
            setInbox(i.handoffs);
            setOutbox(o.handoffs);
        } catch (e) {
            fail(e);
        }
    }, [fail]);
    const loadTime = useCallback(async () => {
        try {
            const d = await api<{ entries: Entry[]; running: Entry | null }>('/api/admin/work/time');
            setEntries(d.entries);
            setRunning(d.running);
        } catch (e) {
            fail(e);
        }
    }, [fail]);

    useEffect(() => {
        const qp = new URLSearchParams(window.location.search);
        const t = setTimeout(() => {
            const qt = qp.get('tab') as Tab | null;
            if (qt && ['todos', 'inbox', 'outbox', 'time'].includes(qt)) setTab(qt);
            loadHandoffs();
            loadTime();
        }, 0);
        return () => clearTimeout(t);
    }, [loadHandoffs, loadTime]);
    useEffect(() => {
        const t = setTimeout(loadTodos, 0);
        return () => clearTimeout(t);
    }, [loadTodos]);

    const visible = useMemo(() => {
        const list = todos || [];
        const today = todayKey();
        return list.filter((t) => {
            const d = dayOf(t.dueDate);
            if (filter === 'done') return t.isCompleted;
            if (t.isCompleted) return filter === 'today' && dayOf(t.completedAt) === today;
            if (filter === 'today') return !d || d <= today;
            if (filter === 'upcoming') return d && d > today;
            if (filter === 'overdue') return d && d < today;
            return true;
        });
    }, [todos, filter]);

    const counts = useMemo(() => {
        const list = (todos || []).filter((t) => !t.isCompleted);
        const today = todayKey();
        return { today: list.filter((t) => !t.dueDate || (dayOf(t.dueDate) as string) <= today).length, overdue: list.filter((t) => t.dueDate && (dayOf(t.dueDate) as string) < today).length, upcoming: list.filter((t) => t.dueDate && (dayOf(t.dueDate) as string) > today).length };
    }, [todos]);
    const todayDone = (todos || []).filter((t) => t.isCompleted && dayOf(t.completedAt) === todayKey()).length;
    const todayTotal = todayDone + counts.today;
    const pendingInbox = inbox.filter((h) => h.status === 'PENDING').length;

    const post = async (body: Record<string, unknown>) => api('/api/admin/work/todos', { method: 'POST', json: body });
    const addQuick = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quick.title.trim()) return;
        try {
            await post({ ...quick, title: quick.title.trim() });
            setQuick({ ...quick, title: '' });
            loadTodos();
        } catch (err) {
            fail(err);
        }
    };
    const toggle = async (t: Todo) => {
        setTodos((list) => (list || []).map((x) => (x.id === t.id ? { ...x, isCompleted: !x.isCompleted, completedAt: !x.isCompleted ? new Date().toISOString() : null } : x)));
        try {
            const r = await api<{ next: Todo | null }>('/api/admin/work/todos', { method: 'POST', json: { action: 'toggle', id: t.id } });
            if (r.next) setNotice({ tone: 'info', text: `Tekrarlanan yapılacak bir sonraki tarih için oluşturuldu (${formatDate(r.next.dueDate)}).` });
            loadTodos();
        } catch (e) {
            fail(e);
            loadTodos();
        }
    };
    const update = async (t: Todo, patch: Record<string, unknown>) => {
        setTodos((list) => (list || []).map((x) => (x.id === t.id ? { ...x, ...patch } as Todo : x)));
        try {
            await post({ action: 'update', id: t.id, ...patch });
        } catch (e) {
            fail(e);
            loadTodos();
        }
    };
    const remove = async (t: Todo) => {
        if (!window.confirm(`"${t.title}" silinsin mi?`)) return;
        try {
            await api(`/api/admin/work/todos?id=${t.id}`, { method: 'DELETE' });
            loadTodos();
        } catch (e) {
            fail(e);
        }
    };
    const convert = async (t: Todo) => {
        try {
            const r = await api<{ task: { id: string } }>('/api/admin/work/todos', { method: 'POST', json: { action: 'convert', id: t.id } });
            setNotice({ tone: 'success', text: 'Göreve dönüştürüldü. Artık ekibe paslanabilir.' });
            loadTodos();
            window.open(`/admin/gorevler?taskId=${r.task.id}`, '_self');
        } catch (e) {
            fail(e);
        }
    };
    const timer = async (todoId: string | null) => {
        try {
            await api('/api/admin/work/time', { method: 'POST', json: todoId ? { action: 'start', todoId } : { action: 'stop' } });
            await loadTime();
            if (!todoId) loadTodos();
        } catch (e) {
            fail(e);
        }
    };

    // Drag & drop ordering (open items in the current view)
    const onDrop = async (targetId: string) => {
        const from = dragId.current;
        dragId.current = null;
        if (!from || from === targetId || !todos) return;
        const ids = todos.filter((t) => !t.isCompleted).map((t) => t.id);
        const a = ids.indexOf(from);
        const b = ids.indexOf(targetId);
        if (a < 0 || b < 0) return;
        ids.splice(b, 0, ids.splice(a, 1)[0]);
        setTodos((list) => [...(list || [])].sort((x, y) => (x.isCompleted === y.isCompleted ? ids.indexOf(x.id) - ids.indexOf(y.id) : x.isCompleted ? 1 : -1)));
        try {
            await post({ action: 'reorder', orderedIds: ids });
        } catch (e) {
            fail(e);
            loadTodos();
        }
    };

    const respondHandoff = async (h: Handoff, decision: 'accept' | 'return', note = '') => {
        try {
            await api('/api/admin/work/handoffs', { method: 'PATCH', json: { id: h.id, decision, note } });
            setRespond(null);
            setNotice({ tone: 'success', text: decision === 'accept' ? 'Görev kabul edildi.' : 'Görev geri paslandı.' });
            loadHandoffs();
        } catch (e) {
            fail(e);
        }
    };

    const weekDays = useMemo(() => {
        const days: { key: string; label: string; minutes: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now - i * 86400000);
            const key = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
            days.push({ key, label: d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'short', day: 'numeric' }), minutes: entries.filter((e) => dayOf(e.startedAt) === key).reduce((s, e) => s + e.minutes, 0) });
        }
        return days;
    }, [entries, now]);
    const maxDay = Math.max(60, ...weekDays.map((d) => d.minutes));
    const runningSeconds = running ? Math.max(0, Math.floor((now - new Date(running.startedAt).getTime()) / 1000)) : 0;

    return (
        <div className="space-y-5 pb-12">
            <PageHeader
                title="İş Takip Merkezi"
                icon={ListTodo}
                description="Kişisel yapılacaklar, size paslanan işler, süre takibi ve raporlar tek yerde."
                actions={<Link href="/admin/raporlar/is-takip" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:border-primary/40"><BarChart3 className="h-4 w-4" /> İş takip raporu</Link>}
            />
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}

            {running && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-3 text-sm text-emerald-100">
                        <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" /></span>
                        <span>Süre işliyor: <strong>{running.task?.title || running.todo?.title}</strong></span>
                        <span className="font-mono text-base">{String(Math.floor(runningSeconds / 3600)).padStart(2, '0')}:{String(Math.floor((runningSeconds % 3600) / 60)).padStart(2, '0')}:{String(runningSeconds % 60).padStart(2, '0')}</span>
                    </div>
                    <Button size="sm" icon={Square} onClick={() => timer(null)}>Durdur</Button>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                    { label: 'Bugün tamamlanan', value: `${todayDone}/${todayTotal || 0}`, icon: CheckCircle2, tone: 'text-emerald-300' },
                    { label: 'Geciken', value: counts.overdue, icon: AlertTriangle, tone: counts.overdue ? 'text-rose-300' : 'text-gray-300' },
                    { label: 'Yanıt bekleyen pas', value: pendingInbox, icon: Inbox, tone: pendingInbox ? 'text-amber-300' : 'text-gray-300' },
                    { label: 'Son 7 gün süre', value: fmtMin(entries.reduce((s, e) => s + e.minutes, 0)), icon: Timer, tone: 'text-sky-300' },
                ].map((k) => (
                    <div key={k.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                        <k.icon className={`mb-2 h-5 w-5 ${k.tone}`} />
                        <div className="font-orbitron text-2xl font-bold text-white">{k.value}</div>
                        <div className="text-xs text-gray-400">{k.label}</div>
                    </div>
                ))}
            </div>

            <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                    { value: 'todos', label: 'Yapılacaklarım', icon: ListTodo, count: counts.today || null },
                    { value: 'inbox', label: 'Bana paslananlar', icon: Inbox, count: pendingInbox || null },
                    { value: 'outbox', label: 'Paslarım', icon: Send },
                    { value: 'time', label: 'Zaman çizelgesi', icon: Clock },
                ]}
            />

            {tab === 'todos' && (
                <div className="space-y-4">
                    <form onSubmit={addQuick} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl md:flex-row">
                        <TextInput value={quick.title} onChange={(e) => setQuick({ ...quick, title: e.target.value })} placeholder="Yeni yapılacak ekle… (Enter)" aria-label="Yapılacak başlığı" />
                        <div className="flex gap-2">
                            <TextInput type="date" value={quick.dueDate} onChange={(e) => setQuick({ ...quick, dueDate: e.target.value })} aria-label="Termin" className="md:w-40" />
                            <Select value={quick.priority} onChange={(e) => setQuick({ ...quick, priority: e.target.value })} options={Object.entries(PRIORITY).map(([value, p]) => ({ value, label: p.label }))} aria-label="Öncelik" className="min-w-[7.5rem]" />
                            <Select value={quick.category} onChange={(e) => setQuick({ ...quick, category: e.target.value })} options={categories} aria-label="Kategori" className="min-w-[8.5rem]" />
                            <Button type="submit" variant="primary" icon={Plus}>Ekle</Button>
                        </div>
                    </form>

                    <div className="flex flex-wrap gap-2">
                        {([['today', `Bugün (${counts.today})`], ['overdue', `Geciken (${counts.overdue})`], ['upcoming', `Yaklaşan (${counts.upcoming})`], ['all', 'Tümü'], ['done', 'Tamamlanan']] as const).map(([k, label]) => (
                            <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${filter === k ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:text-white'}`}>{label}</button>
                        ))}
                    </div>

                    {!todos ? <Skeleton rows={6} /> : visible.length === 0 ? (
                        <EmptyState icon={CheckCircle2} title={filter === 'today' ? 'Bugün için yapılacak yok' : 'Bu görünümde yapılacak yok'} description="Yukarıdan hızlıca yeni bir yapılacak ekleyebilirsiniz." />
                    ) : (
                        <ul className="space-y-2">
                            {visible.map((t) => {
                                const overdue = !t.isCompleted && t.dueDate && (dayOf(t.dueDate) as string) < todayKey();
                                const doneSteps = t.checklist.filter((c) => c.done).length;
                                const isRunning = running?.todo?.id === t.id;
                                const open = expanded === t.id;
                                return (
                                    <li
                                        key={t.id}
                                        draggable={!t.isCompleted}
                                        onDragStart={() => { dragId.current = t.id; }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => onDrop(t.id)}
                                        className={`group rounded-2xl border bg-white/[0.04] backdrop-blur-xl transition-colors ${overdue ? 'border-rose-500/30' : 'border-white/10'} ${t.isCompleted ? 'opacity-60' : 'hover:border-white/20'}`}
                                    >
                                        <div className="flex items-start gap-3 p-3">
                                            {!t.isCompleted && <GripVertical className="mt-1 h-4 w-4 shrink-0 cursor-grab text-gray-600 group-hover:text-gray-400" aria-label="Sürükleyerek sırala" />}
                                            <button type="button" onClick={() => toggle(t)} className="mt-0.5 shrink-0" aria-label={t.isCompleted ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}>
                                                {t.isCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Circle className="h-5 w-5 text-gray-500 hover:text-primary" />}
                                            </button>
                                            <button type="button" onClick={() => setExpanded(open ? null : t.id)} className="min-w-0 flex-1 text-left">
                                                <div className={`text-sm font-medium ${t.isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>{t.title}</div>
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                                                    <span className={`h-2 w-2 rounded-full ${PRIORITY[t.priority]?.dot || 'bg-gray-400'}`} />
                                                    <span>{PRIORITY[t.priority]?.label}</span>
                                                    <span>· {categories.find((c) => c.value === t.category)?.label || t.category}</span>
                                                    {t.dueDate && <span className={overdue ? 'text-rose-300' : ''}>· <CalendarDays className="inline h-3 w-3" /> {formatDate(t.dueDate)}{t.dueTime ? ` ${t.dueTime}` : ''}</span>}
                                                    {t.recurrence && <span>· <Repeat className="inline h-3 w-3" /> {RECURRENCE[t.recurrence]}</span>}
                                                    {t.checklist.length > 0 && <span>· {doneSteps}/{t.checklist.length} adım</span>}
                                                    {(t.estimatedMinutes || t.minutesLogged > 0) && <span>· <Clock className="inline h-3 w-3" /> {fmtMin(t.minutesLogged)}{t.estimatedMinutes ? ` / ${fmtMin(t.estimatedMinutes)}` : ''}</span>}
                                                    {t.tagList.map((tag) => <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5"><Tag className="inline h-2.5 w-2.5" /> {tag}</span>)}
                                                    {t.convertedTaskId && <Link href={`/admin/gorevler?taskId=${t.convertedTaskId}`} className="text-primary hover:underline">· Görev <ArrowUpRight className="inline h-3 w-3" /></Link>}
                                                </div>
                                            </button>
                                            <div className="flex shrink-0 items-center gap-1">
                                                {!t.isCompleted && (
                                                    <button type="button" onClick={() => timer(isRunning ? null : t.id)} className={`rounded-lg p-1.5 ${isRunning ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`} aria-label={isRunning ? 'Süreyi durdur' : 'Süre başlat'} title={isRunning ? 'Süreyi durdur' : 'Süre başlat'}>
                                                        {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                    </button>
                                                )}
                                                <button type="button" onClick={() => setExpanded(open ? null : t.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white" aria-label="Detay">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                                            </div>
                                        </div>
                                        {open && <TodoEditor todo={t} categories={categories} onChange={(patch) => update(t, patch)} onDelete={() => remove(t)} onConvert={() => convert(t)} onManual={() => setManual({ todoId: t.id, date: todayKey(), minutes: '30', note: '' })} />}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <p className="text-[11px] text-gray-500">İpucu: Açık yapılacakları tutup sürükleyerek önceliğe göre sıralayabilirsiniz; sıralama kaydedilir.</p>
                </div>
            )}

            {(tab === 'inbox' || tab === 'outbox') && (
                <Card padded={false}>
                    {(tab === 'inbox' ? inbox : outbox).length === 0 ? (
                        <EmptyState icon={ArrowRightLeft} title={tab === 'inbox' ? 'Size paslanan iş yok' : 'Paslanmış iş yok'} description="Görevler ekranında bir görevi açıp “Pasla” ile ekip arkadaşınıza devredebilirsiniz." />
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {(tab === 'inbox' ? inbox : outbox).map((h) => (
                                <li key={h.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link href={`/admin/gorevler?taskId=${h.task.id}`} className="font-medium text-white hover:underline">{h.task.title}</Link>
                                            <Badge tone={h.status === 'PENDING' ? 'warning' : h.status === 'ACCEPTED' ? 'success' : 'danger'}>{h.status === 'PENDING' ? 'Yanıt bekliyor' : h.status === 'ACCEPTED' ? 'Kabul edildi' : 'Geri paslandı'}</Badge>
                                            <Badge tone={PRIORITY[h.task.priority]?.tone || 'neutral'}>{PRIORITY[h.task.priority]?.label || h.task.priority}</Badge>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-400">
                                            {tab === 'inbox' ? `${h.fromUser.name} pasladı` : `${h.toUser.name} kişisine paslandı`} · {formatDateTime(h.createdAt)}{h.task.dueDate ? ` · Termin ${formatDate(h.task.dueDate)}` : ''}
                                        </div>
                                        {h.note && <p className="mt-1 text-sm text-gray-300">“{h.note}”</p>}
                                        {h.responseNote && <p className="mt-1 text-xs text-gray-400">Yanıt: {h.responseNote}</p>}
                                    </div>
                                    {tab === 'inbox' && h.status === 'PENDING' && (
                                        <div className="flex shrink-0 gap-2">
                                            <Button size="sm" variant="success" icon={Check} onClick={() => respondHandoff(h, 'accept')}>Kabul et</Button>
                                            <Button size="sm" icon={Undo2} onClick={() => setRespond({ h, note: '' })}>Geri pasla</Button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}

            {tab === 'time' && (
                <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                    <Card>
                        <div className="mb-4 text-sm font-semibold text-white">Son 7 gün</div>
                        <div className="flex h-40 items-end gap-2">
                            {weekDays.map((d) => (
                                <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                                    <span className="text-[10px] text-gray-400">{d.minutes ? fmtMin(d.minutes) : ''}</span>
                                    <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-purple-500" style={{ height: `${Math.max(4, (d.minutes / maxDay) * 120)}px`, opacity: d.minutes ? 1 : 0.25 }} />
                                    <span className="text-[10px] text-gray-500">{d.label}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card padded={false}>
                        {entries.length === 0 ? <EmptyState icon={Timer} title="Süre kaydı yok" description="Bir yapılacakta veya görevde ▶ ile süre başlatın ya da manuel süre ekleyin." /> : (
                            <ul className="divide-y divide-white/5">
                                {entries.map((e) => (
                                    <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                                        <div className="min-w-0">
                                            <div className="truncate text-white">{e.task?.title || e.todo?.title || '—'}</div>
                                            <div className="text-xs text-gray-500">{formatDateTime(e.startedAt)} · {e.source === 'MANUAL' ? 'Manuel' : 'Zamanlayıcı'}{e.note ? ` · ${e.note}` : ''}</div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <span className="font-mono text-gray-200">{e.endedAt ? fmtMin(e.minutes) : 'çalışıyor'}</span>
                                            {e.endedAt && <button type="button" onClick={async () => { try { await api(`/api/admin/work/time?id=${e.id}`, { method: 'DELETE' }); loadTime(); loadTodos(); } catch (err) { fail(err); } }} className="rounded p-1 text-gray-500 hover:text-rose-300" aria-label="Kaydı sil"><Trash2 className="h-3.5 w-3.5" /></button>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            )}

            <Modal open={Boolean(respond)} onClose={() => setRespond(null)} title="Görevi geri pasla" description="Görev, gönderen kişiye geri atanır ve notunuz iletilir." footer={<><Button onClick={() => setRespond(null)}>Vazgeç</Button><Button variant="primary" icon={Undo2} disabled={!respond?.note.trim()} onClick={() => respond && respondHandoff(respond.h, 'return', respond.note)}>Geri pasla</Button></>}>
                {respond && <Field label="Neden?" required><TextArea rows={3} value={respond.note} onChange={(e) => setRespond({ ...respond, note: e.target.value })} placeholder="Örn: Bu hafta yoğunum, Ayşe Hanım daha uygun olabilir." /></Field>}
            </Modal>

            <Modal open={Boolean(manual)} onClose={() => setManual(null)} title="Manuel süre ekle" footer={<><Button onClick={() => setManual(null)}>Vazgeç</Button><Button variant="primary" onClick={async () => { if (!manual) return; try { await api('/api/admin/work/time', { method: 'POST', json: { action: 'manual', todoId: manual.todoId, date: manual.date, minutes: Number(manual.minutes), note: manual.note } }); setManual(null); loadTime(); loadTodos(); } catch (e) { fail(e); } }}>Kaydet</Button></>}>
                {manual && (
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Tarih"><TextInput type="date" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} /></Field>
                        <Field label="Süre (dakika)"><TextInput type="number" min={1} max={1440} value={manual.minutes} onChange={(e) => setManual({ ...manual, minutes: e.target.value })} /></Field>
                        <div className="col-span-2"><Field label="Not"><TextInput value={manual.note} onChange={(e) => setManual({ ...manual, note: e.target.value })} /></Field></div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function TodoEditor({ todo, categories, onChange, onDelete, onConvert, onManual }: { todo: Todo; categories: { value: string; label: string }[]; onChange: (patch: Record<string, unknown>) => void; onDelete: () => void; onConvert: () => void; onManual: () => void }) {
    const [title, setTitle] = useState(todo.title);
    const [description, setDescription] = useState(todo.description || '');
    const [step, setStep] = useState('');
    const [tags, setTags] = useState(todo.tagList.join(', '));
    const setChecklist = (checklist: ChecklistItem[]) => onChange({ checklist });

    return (
        <div className="space-y-4 border-t border-white/10 p-4">
            <div className="grid gap-3 md:grid-cols-2">
                <Field label="Başlık"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title.trim() && title !== todo.title && onChange({ title })} /></Field>
                <Field label="Etiketler" hint="Virgülle ayırın"><TextInput value={tags} onChange={(e) => setTags(e.target.value)} onBlur={() => onChange({ tags: tags.split(',').map((t) => t.trim()).filter(Boolean), tagList: tags.split(',').map((t) => t.trim()).filter(Boolean) })} /></Field>
                <div className="md:col-span-2"><Field label="Açıklama"><TextArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} onBlur={() => description !== (todo.description || '') && onChange({ description })} /></Field></div>
                <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-5">
                    <Field label="Termin"><TextInput type="date" value={todo.dueDate ? (dayOf(todo.dueDate) as string) : ''} onChange={(e) => onChange({ dueDate: e.target.value || null, dueTime: todo.dueTime })} /></Field>
                    <Field label="Saat"><TextInput type="time" value={todo.dueTime || ''} onChange={(e) => onChange({ dueTime: e.target.value || null, dueDate: todo.dueDate ? dayOf(todo.dueDate) : null })} /></Field>
                    <Field label="Öncelik"><Select value={todo.priority} onChange={(e) => onChange({ priority: e.target.value })} options={Object.entries(PRIORITY).map(([value, p]) => ({ value, label: p.label }))} /></Field>
                    <Field label="Tekrar"><Select value={todo.recurrence || ''} onChange={(e) => onChange({ recurrence: e.target.value || null })} placeholder="Tekrarlanmaz" options={Object.entries(RECURRENCE).map(([value, label]) => ({ value, label }))} /></Field>
                    <Field label="Tahmini (dk)"><TextInput type="number" min={0} value={todo.estimatedMinutes ?? ''} onChange={(e) => onChange({ estimatedMinutes: e.target.value ? Number(e.target.value) : null })} /></Field>
                </div>
                <Field label="Kategori"><Select value={todo.category} onChange={(e) => onChange({ category: e.target.value })} options={categories} /></Field>
            </div>
            <div>
                <div className="mb-2 text-xs font-semibold text-gray-300">Adımlar</div>
                <ul className="space-y-1.5">
                    {todo.checklist.map((c, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={c.done} onChange={() => setChecklist(todo.checklist.map((x, k) => (k === i ? { ...x, done: !x.done } : x)))} className="h-4 w-4" aria-label={c.title} />
                            <span className={c.done ? 'text-gray-500 line-through' : 'text-gray-200'}>{c.title}</span>
                            <button type="button" onClick={() => setChecklist(todo.checklist.filter((_, k) => k !== i))} className="ml-auto text-gray-500 hover:text-rose-300" aria-label="Adımı sil"><Trash2 className="h-3.5 w-3.5" /></button>
                        </li>
                    ))}
                </ul>
                <form onSubmit={(e) => { e.preventDefault(); if (step.trim()) { setChecklist([...todo.checklist, { title: step.trim(), done: false }]); setStep(''); } }} className="mt-2 flex gap-2">
                    <TextInput value={step} onChange={(e) => setStep(e.target.value)} placeholder="Adım ekle…" />
                    <Button type="submit" size="sm" icon={Plus}>Ekle</Button>
                </form>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-3">
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" icon={Clock} onClick={onManual}>Manuel süre</Button>
                    {!todo.convertedTaskId && <Button size="sm" icon={ArrowRightLeft} onClick={onConvert}>Göreve dönüştür (paslanabilir)</Button>}
                </div>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={onDelete}>Sil</Button>
            </div>
        </div>
    );
}
