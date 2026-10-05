'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TaskWorkPanel } from '@/components/admin/tasks/TaskWorkPanel';
import { TaskWorkOsPanel, type WorkOsTask } from '@/components/admin/work/TaskWorkOsPanel';
import { AvatarStack } from '@/components/admin/work/people';
import Link from 'next/link';
import { CheckSquare, Plus, Search, Play, Send, CheckCircle2, Undo2, RotateCcw, KanbanSquare, MessageSquare, Link2, History, Users, Pause, XCircle, ClipboardCopy, GanttChartSquare, Repeat, GitBranch } from 'lucide-react';
import { PageHeader, Button, Card, Badge, Alert, Skeleton, EmptyState, Drawer, Modal, Field, TextInput, TextArea, Select, Tabs, inputClass, api, formatDate, formatDateTime } from '@/components/admin/ui';

type Status = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
type Scope = 'all' | 'assigned' | 'created' | 'today' | 'overdue' | 'completed';

interface TaskRow {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    status: Status;
    dueDate: string | null;
    createdById: string;
    creator: { id: string; name: string } | null;
    assignees: { user: { id: string; name: string; avatarUrl?: string | null } }[];
    checklistItems: { id: string; title: string; isCompleted: boolean }[];
    _count: { comments: number; attachments: number; subTasks?: number };
    team?: { id: string; name: string; color: string } | null;
    subTasks?: { id: string; status: string }[];
    recurrence?: string | null;
    application: { id: string; applicationNumber: string; applicantName: string } | null;
    entrepreneur: { id: string; name: string } | null;
    program: { id: string; name: string } | null;
    person: { id: string; fullName: string } | null;
    organization: { id: string; name: string } | null;
    project: { id: string; title: string } | null;
    reservation: { id: string; title: string } | null;
    rentContract: { id: string; contractNo: string } | null;
    mentor: { id: string; name: string; surname: string } | null;
}

interface TaskDetail extends TaskRow, Omit<WorkOsTask, 'status' | 'subTasks' | 'team' | 'dueDate' | 'recurrence'> {
    subTasks?: WorkOsTask['subTasks'];
    comments: { id: string; comment: string; createdAt: string; author: { name: string } }[];
    activitiesLog: { id: string; action: string; description: string; actorName: string; createdAt: string }[];
    actualHours?: number | null;
}

const STATUS_LABEL: Record<Status, string> = { TODO: 'Yapılacak', IN_PROGRESS: 'Devam Ediyor', IN_REVIEW: 'Kontrol Bekliyor', DONE: 'Tamamlandı', CANCELLED: 'İptal' };
const STATUS_TONE: Record<Status, 'neutral' | 'warning' | 'info' | 'success' | 'danger'> = { TODO: 'neutral', IN_PROGRESS: 'warning', IN_REVIEW: 'info', DONE: 'success', CANCELLED: 'danger' };
const PRIORITY_LABEL: Record<string, string> = { LOW: 'Düşük', MEDIUM: 'Orta', HIGH: 'Yüksek', URGENT: 'Acil' };
const PRIORITY_TONE: Record<string, 'neutral' | 'info' | 'warning' | 'danger'> = { LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', URGENT: 'danger' };

function relationLinks(t: TaskRow): { label: string; href: string }[] {
    const links: { label: string; href: string }[] = [];
    if (t.application) links.push({ label: `Başvuru ${t.application.applicationNumber}`, href: `/admin/basvurular/${t.application.id}` });
    if (t.entrepreneur) links.push({ label: `Girişim: ${t.entrepreneur.name}`, href: `/admin/girisimciler/${t.entrepreneur.id}` });
    if (t.program) links.push({ label: `Program: ${t.program.name}`, href: `/admin/programlar` });
    if (t.person) links.push({ label: `Kişi: ${t.person.fullName}`, href: `/admin/rehber?personId=${t.person.id}` });
    if (t.organization) links.push({ label: `Kurum: ${t.organization.name}`, href: `/admin/rehber?organizationId=${t.organization.id}` });
    if (t.project) links.push({ label: `Proje: ${t.project.title}`, href: `/admin/projeler` });
    if (t.reservation) links.push({ label: `Rezervasyon: ${t.reservation.title}`, href: `/admin/alanlar?tab=rezervasyonlar` });
    if (t.rentContract) links.push({ label: `Sözleşme ${t.rentContract.contractNo}`, href: `/admin/finans/kiralar` });
    if (t.mentor) links.push({ label: `Mentör: ${t.mentor.name} ${t.mentor.surname}`, href: `/admin/mentorler` });
    return links;
}

const RELATION_PARAMS = ['applicationId', 'entrepreneurId', 'programId', 'personId', 'organizationId', 'projectId', 'reservationId', 'rentContractId'] as const;

export default function TasksPage() {
    const [tasks, setTasks] = useState<TaskRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ text: string; taskId?: string } | null>(null);
    const [scope, setScope] = useState<Scope>('all');
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [teams, setTeams] = useState<{ id: string; name: string; color: string }[]>([]);
    const [me, setMe] = useState<{ id: string; isSuperAdmin: boolean; permissions: string[] } | null>(null);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

    const [createOpen, setCreateOpen] = useState(false);
    const emptyForm = { title: '', description: '', priority: 'MEDIUM', startDate: '', dueDate: '', assigneeIds: [] as string[], watcherIds: [] as string[], checklist: '', teamId: '', recurrence: '' };
    const [form, setForm] = useState(emptyForm);
    const [relations, setRelations] = useState<Record<string, string>>({});
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const [detailId, setDetailId] = useState<string | null>(null);
    const [detail, setDetail] = useState<TaskDetail | null>(null);
    const [detailTab, setDetailTab] = useState<'overview' | 'comments' | 'history'>('overview');
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState<string | null>(null);
    const [returnOpen, setReturnOpen] = useState(false);
    const [returnText, setReturnText] = useState('');

    const can = useCallback((perm: string) => {
        if (!me) return false;
        if (me.isSuperAdmin) return true;
        const [action, resource] = perm.split(':');
        const p = new Set(me.permissions);
        return p.has(perm) || p.has(`*:${resource}`) || p.has(`${action}:*`) || p.has('*:*');
    }, [me]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ scope });
            if (statusFilter) p.set('status', statusFilter);
            if (search) p.set('search', search);
            if (teamFilter) p.set('teamId', teamFilter);
            const data = await api<{ tasks: TaskRow[] }>(`/api/admin/tasks?${p.toString()}`);
            setTasks(data.tasks);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Görevler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [scope, statusFilter, search, teamFilter]);

    const loadDetail = useCallback(async (id: string) => {
        try {
            const data = await api<{ task: TaskDetail }>(`/api/admin/tasks/${id}`);
            setDetail(data.task);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Görev yüklenemedi');
            setDetailId(null);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [load]);

    useEffect(() => {
        api<{ user: { id: string; isSuperAdmin: boolean; permissions: string[] } }>('/api/admin/auth/me').then((d) => setMe(d.user)).catch(() => setMe(null));
        api<{ users: { id: string; name: string }[] }>('/api/admin/users').then((d) => setUsers(d.users || [])).catch(() => setUsers([]));
        api<{ teams: { id: string; name: string; color: string }[] }>('/api/admin/teams').then((d) => setTeams(d.teams)).catch(() => setTeams([]));
        if (typeof window !== 'undefined') {
            const qp = new URLSearchParams(window.location.search);
            const taskId = qp.get('taskId');
            if (taskId) setDetailId(taskId);
            const initialScope = qp.get('scope');
            if (initialScope && ['all', 'assigned', 'created', 'today', 'overdue', 'completed'].includes(initialScope)) setScope(initialScope as Scope);
            const initialStatus = qp.get('status');
            if (initialStatus) setStatusFilter(initialStatus);
            const initialTeam = qp.get('teamId');
            if (initialTeam) setTeamFilter(initialTeam);
            const rel: Record<string, string> = {};
            RELATION_PARAMS.forEach((k) => { const v = qp.get(k); if (v) rel[k] = v; });
            if (Object.keys(rel).length || qp.get('title')) {
                setRelations(rel);
                setForm((f) => ({ ...f, title: qp.get('title') || f.title }));
            }
        }
    }, []);

    useEffect(() => {
        if (detailId) {
            setDetail(null);
            setDetailTab('overview');
            loadDetail(detailId);
        }
    }, [detailId, loadDetail]);

    const runAction = async (task: { id: string; title: string }, action: string, extra: Record<string, unknown> = {}, message?: string) => {
        setBusy(action);
        setError(null);
        try {
            await api('/api/admin/tasks', { method: 'PUT', json: { taskId: task.id, action, ...extra } });
            setNotice({ text: message || 'Görev güncellendi.', taskId: task.id });
            await load();
            if (detailId === task.id) await loadDetail(task.id);
            return true;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'İşlem başarısız');
            return false;
        } finally {
            setBusy(null);
        }
    };

    const create = async () => {
        setCreating(true);
        setCreateError(null);
        try {
            const data = await api<{ task: { id: string; title: string } }>('/api/admin/tasks', {
                method: 'POST',
                json: {
                    title: form.title,
                    description: form.description,
                    priority: form.priority,
                    startDate: form.startDate || undefined,
                    dueDate: form.dueDate || undefined,
                    assigneeIds: form.assigneeIds,
                    watcherIds: form.watcherIds,
                    teamId: form.teamId || undefined,
                    recurrence: form.recurrence || undefined,
                    checklistItems: form.checklist.split('\n').map((x) => x.trim()).filter(Boolean),
                    ...relations,
                },
            });
            setCreateOpen(false);
            setForm({ ...emptyForm, teamId: teamFilter });
            setRelations({});
            setNotice({ text: `"${data.task.title}" oluşturuldu.`, taskId: data.task.id });
            load();
        } catch (e) {
            setCreateError(e instanceof Error ? e.message : 'Görev oluşturulamadı');
        } finally {
            setCreating(false);
        }
    };

    const counts = useMemo(() => {
        const c: Record<string, number> = {};
        tasks.forEach((t) => { c[t.status] = (c[t.status] || 0) + 1; });
        return c;
    }, [tasks]);

    const actionsFor = (t: TaskRow, compact = false) => {
        const size = compact ? 'sm' : 'md';
        const isCreator = me?.id === t.createdById;
        const canReview = can('approve:tasks') || isCreator;
        return (
            <div className="flex flex-wrap gap-1.5">
                {t.status === 'TODO' && <Button size={size} icon={Play} loading={busy === 'start'} onClick={() => runAction(t, 'start', {}, `"${t.title}" başlatıldı.`)}>Başlat</Button>}
                {t.status === 'IN_PROGRESS' && <Button size={size} icon={Send} loading={busy === 'submitForReview'} onClick={() => runAction(t, 'submitForReview', {}, `"${t.title}" kontrole gönderildi.`)}>Kontrole Gönder</Button>}
                {(t.status === 'TODO' || t.status === 'IN_PROGRESS') && (can('approve:tasks') || (isCreator && t.assignees.every((a) => a.user.id === me?.id))) && (
                    <Button size={size} variant="success" icon={CheckCircle2} loading={busy === 'complete'} onClick={() => runAction(t, 'complete', {}, `"${t.title}" tamamlandı.`)}>Tamamla</Button>
                )}
                {t.status === 'IN_PROGRESS' && !compact && <Button size={size} variant="ghost" icon={Pause} onClick={() => runAction(t, 'pause', {}, `"${t.title}" beklemeye alındı.`)}>Beklet</Button>}
                {t.status === 'IN_REVIEW' && canReview && (
                    <>
                        <Button size={size} variant="success" icon={CheckCircle2} loading={busy === 'approve'} onClick={() => runAction(t, 'approve', {}, `"${t.title}" onaylandı ve tamamlandı.`)}>Onayla & Tamamla</Button>
                        <Button size={size} icon={Undo2} onClick={() => { setDetailId(t.id); setReturnText(''); setReturnOpen(true); }}>Düzeltmeye Gönder</Button>
                    </>
                )}
                {t.status === 'IN_REVIEW' && !canReview && <span className="text-[11px] text-gray-500">Kontrol bekleniyor</span>}
                {(t.status === 'DONE' || t.status === 'CANCELLED') && <Button size={size} icon={RotateCcw} loading={busy === 'reopen'} onClick={() => runAction(t, 'reopen', {}, `"${t.title}" yeniden açıldı.`)}>Yeniden Aç</Button>}
            </div>
        );
    };

    return (
        <div>
            <PageHeader
                title="Görevler"
                icon={CheckSquare}
                description="Görevler Yapılacak → Devam Ediyor → Kontrol Bekliyor → Tamamlandı akışıyla ilerler. Başkasına atama ve tüm görevleri görme ayrı yetkilerdir."
                actions={
                    <>
                        <Link href="/admin/gorevler/kanban" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10"><KanbanSquare className="h-4 w-4" />Kanban</Link>
                        <Link href={`/admin/is-planlama${teamFilter ? `?teamId=${teamFilter}` : ''}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10"><GanttChartSquare className="h-4 w-4" />Planlama</Link>
                        <Link href="/admin/is-otomasyon" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10"><ClipboardCopy className="h-4 w-4" />Şablondan</Link>
                        <Button data-intent="create" variant="primary" icon={Plus} onClick={() => { setCreateError(null); setForm((f) => ({ ...f, teamId: f.teamId || teamFilter })); setCreateOpen(true); }}>Yeni Görev</Button>
                    </>
                }
            />
            {notice && <div className="mb-4"><Alert tone="success" onClose={() => setNotice(null)}>{notice.text} {notice.taskId && <button type="button" className="ml-1 underline" onClick={() => setDetailId(notice.taskId!)}>Görevi aç</button>}</Alert></div>}
            {error && <div className="mb-4"><Alert tone="danger" onClose={() => setError(null)}>{error}</Alert></div>}

            <Tabs<Scope>
                value={scope}
                onChange={setScope}
                tabs={[
                    { value: 'all', label: can('view_all:tasks') ? 'Tüm Görevler' : 'Görevlerim' },
                    { value: 'assigned', label: 'Bana Atananlar' },
                    { value: 'created', label: 'Oluşturduklarım' },
                    { value: 'today', label: 'Bugün' },
                    { value: 'overdue', label: 'Gecikenler' },
                    { value: 'completed', label: 'Tamamlananlar' },
                ]}
            />

            <Card className="mb-4" padded={false}>
                <div className="flex flex-col gap-2 p-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                        <input aria-label="Görev ara" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Görev ara..." className={`${inputClass} pl-9`} />
                    </div>
                    <Select aria-label="Ekip" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} placeholder="Tüm ekipler" options={[...teams.map((t) => ({ value: t.id, label: t.name })), { value: 'none', label: 'Ekipsiz işler' }]} className="md:w-52" />
                    <Select aria-label="Durum" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="Tüm durumlar" options={(Object.keys(STATUS_LABEL) as Status[]).map((s) => ({ value: s, label: `${STATUS_LABEL[s]}${counts[s] ? ` (${counts[s]})` : ''}` }))} className="md:w-56" />
                </div>
            </Card>

            {loading ? <Skeleton rows={6} /> : tasks.length === 0 ? (
                <EmptyState icon={CheckSquare} title="Bu görünümde görev yok." action={<Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>Görev Oluştur</Button>} />
            ) : (
                <Card padded={false} className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left text-sm">
                        <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Görev</th>
                                <th className="px-4 py-3 font-medium">Durum</th>
                                <th className="px-4 py-3 font-medium">Öncelik</th>
                                <th className="px-4 py-3 font-medium">Atanan</th>
                                <th className="px-4 py-3 font-medium">Termin</th>
                                <th className="px-4 py-3 font-medium">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tasks.map((t) => {
                                const overdue = t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString()) && !['DONE', 'CANCELLED'].includes(t.status);
                                return (
                                    <tr key={t.id} className="align-top hover:bg-white/[0.02]">
                                        <td className="px-4 py-3">
                                            <button type="button" onClick={() => setDetailId(t.id)} className="text-left font-medium text-white hover:text-primary">{t.title}</button>
                                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                                                {t.team && <span className="inline-flex items-center gap-1 font-semibold" style={{ color: t.team.color }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: t.team.color }} />{t.team.name}</span>}
                                                {t.recurrence && <span><Repeat className="mr-0.5 inline h-3 w-3" />Tekrarlı</span>}
                                                {t.subTasks && t.subTasks.length > 0 && <span><GitBranch className="mr-0.5 inline h-3 w-3" />{t.subTasks.filter((x) => ['DONE', 'CANCELLED'].includes(x.status)).length}/{t.subTasks.length} alt görev</span>}
                                                {relationLinks(t).map((l) => <Link key={l.href + l.label} href={l.href} className="hover:text-primary"><Link2 className="mr-0.5 inline h-3 w-3" />{l.label}</Link>)}
                                                {t._count.comments > 0 && <span><MessageSquare className="mr-0.5 inline h-3 w-3" />{t._count.comments}</span>}
                                                {t.checklistItems.length > 0 && <span>✓ {t.checklistItems.filter((c) => c.isCompleted).length}/{t.checklistItems.length}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><Badge tone={STATUS_TONE[t.status] || 'neutral'}>{STATUS_LABEL[t.status] || t.status}</Badge></td>
                                        <td className="px-4 py-3"><Badge tone={PRIORITY_TONE[t.priority] || 'neutral'}>{PRIORITY_LABEL[t.priority] || t.priority}</Badge></td>
                                        <td className="px-4 py-3 text-xs text-gray-300">{t.assignees.length ? <span className="flex items-center gap-2"><AvatarStack people={t.assignees.map((a) => ({ name: a.user.name, avatarUrl: a.user.avatarUrl }))} max={3} size={24} /><span className="truncate">{t.assignees.map((a) => a.user.name).join(', ')}</span></span> : <span className="text-gray-600">Atanmadı</span>}</td>
                                        <td className={`px-4 py-3 text-xs ${overdue ? 'font-semibold text-rose-300' : 'text-gray-400'}`}>{t.dueDate ? formatDate(t.dueDate) : '—'}{overdue && ' (gecikti)'}</td>
                                        <td className="px-4 py-3">{actionsFor(t, true)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}

            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Yeni görev"
                footer={<><Button onClick={() => setCreateOpen(false)}>Vazgeç</Button><Button variant="primary" loading={creating} disabled={!form.title.trim()} onClick={create}>Oluştur</Button></>}
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Başlık" htmlFor="t-title" required className="sm:col-span-2"><TextInput id="t-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                    <Field label="Açıklama" htmlFor="t-desc" className="sm:col-span-2"><TextArea id="t-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                    <Field label="Öncelik" htmlFor="t-pri"><Select id="t-pri" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={Object.entries(PRIORITY_LABEL).map(([value, label]) => ({ value, label }))} /></Field>
                    <Field label="Ekip" htmlFor="t-team" hint={teams.length ? undefined : 'Henüz ekip yok. Ekip listesi İş & Operasyon › Ekipler ekranından oluşturulur.'}><Select id="t-team" value={form.teamId} placeholder="Ekipsiz" onChange={(e) => setForm({ ...form, teamId: e.target.value })} options={teams.map((t) => ({ value: t.id, label: t.name }))} /></Field>
                    <Field label="Başlangıç" htmlFor="t-start"><TextInput id="t-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
                    <Field label="Termin" htmlFor="t-due"><TextInput id="t-due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
                    <Field label="Tekrar" htmlFor="t-rec" hint={form.dueDate ? undefined : 'Tekrar için termin girin.'}><Select id="t-rec" value={form.recurrence} placeholder="Tekrarlanmaz" disabled={!form.dueDate} onChange={(e) => setForm({ ...form, recurrence: e.target.value })} options={[{ value: 'DAILY', label: 'Her gün' }, { value: 'WEEKDAYS', label: 'Hafta içi her gün' }, { value: 'WEEKLY', label: 'Her hafta' }, { value: 'MONTHLY', label: 'Her ay' }, { value: 'QUARTERLY', label: 'Her 3 ayda bir' }, { value: 'YEARLY', label: 'Her yıl' }]} /></Field>
                    <Field label="Atananlar" htmlFor="t-assign" className="sm:col-span-2" hint={can('assign:tasks') ? undefined : 'Başkasına atama yetkiniz yok; görevi yalnız kendinize atayabilirsiniz.'}>
                        <div id="t-assign" className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-lg border border-white/10 p-2">
                            {users.filter((u) => can('assign:tasks') || u.id === me?.id).map((u) => (
                                <label key={u.id} className="flex items-center gap-1.5 text-xs text-gray-300">
                                    <input type="checkbox" checked={form.assigneeIds.includes(u.id)} onChange={(e) => setForm({ ...form, assigneeIds: e.target.checked ? [...form.assigneeIds, u.id] : form.assigneeIds.filter((x) => x !== u.id) })} />
                                    {u.name}
                                </label>
                            ))}
                        </div>
                    </Field>
                    <Field label="İzleyenler (bilgilendirilecek kişiler)" htmlFor="t-watch" className="sm:col-span-2">
                        <div id="t-watch" className="flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-lg border border-white/10 p-2">
                            {users.map((u) => (
                                <label key={u.id} className="flex items-center gap-1.5 text-xs text-gray-300">
                                    <input type="checkbox" checked={form.watcherIds.includes(u.id)} onChange={(e) => setForm({ ...form, watcherIds: e.target.checked ? [...form.watcherIds, u.id] : form.watcherIds.filter((x) => x !== u.id) })} />
                                    {u.name}
                                </label>
                            ))}
                        </div>
                    </Field>
                    <Field label="Kontrol listesi" htmlFor="t-check" hint="Her satır bir madde." className="sm:col-span-2"><TextArea id="t-check" rows={3} value={form.checklist} onChange={(e) => setForm({ ...form, checklist: e.target.value })} /></Field>
                    {Object.keys(relations).length > 0 && <div className="sm:col-span-2"><Alert tone="info">Görev ilgili kayda bağlanacak: {Object.keys(relations).join(', ')}</Alert></div>}
                    {createError && <div className="sm:col-span-2"><Alert tone="danger">{createError}</Alert></div>}
                </div>
            </Modal>

            <Drawer
                open={Boolean(detailId)}
                onClose={() => { setDetailId(null); setReturnOpen(false); }}
                title={detail?.title || 'Görev'}
                subtitle={detail ? <span className="flex flex-wrap items-center gap-2"><Badge tone={STATUS_TONE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge><span>Oluşturan: {detail.creator?.name || '—'}</span></span> : undefined}
                footer={detail ? actionsFor(detail) : undefined}
            >
                {!detail ? <Skeleton rows={6} /> : (
                    <div>
                        {returnOpen && detail.status === 'IN_REVIEW' && (
                            <Card className="mb-4 space-y-2">
                                <Field label="Düzeltme açıklaması" htmlFor="ret" required><TextArea id="ret" value={returnText} onChange={(e) => setReturnText(e.target.value)} /></Field>
                                <div className="flex gap-2">
                                    <Button variant="primary" icon={Undo2} disabled={!returnText.trim()} loading={busy === 'returnForRevision'} onClick={async () => { if (await runAction(detail, 'returnForRevision', { comment: returnText }, `"${detail.title}" düzeltmeye gönderildi.`)) setReturnOpen(false); }}>Düzeltmeye Gönder</Button>
                                    <Button variant="ghost" onClick={() => setReturnOpen(false)}>Vazgeç</Button>
                                </div>
                            </Card>
                        )}
                        <Tabs value={detailTab} onChange={setDetailTab} tabs={[{ value: 'overview', label: 'Genel', icon: CheckSquare }, { value: 'comments', label: 'Yorumlar', icon: MessageSquare, count: detail.comments.length }, { value: 'history', label: 'Geçmiş', icon: History }]} />
                        {detailTab === 'overview' && (
                            <div className="space-y-4">
                                {detail.description && <p className="whitespace-pre-wrap text-sm text-gray-300">{detail.description}</p>}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><p className="text-[11px] text-gray-500">Öncelik</p><Badge tone={PRIORITY_TONE[detail.priority]}>{PRIORITY_LABEL[detail.priority] || detail.priority}</Badge></div>
                                    <div><p className="text-[11px] text-gray-500">Termin</p><p className="text-gray-200">{detail.dueDate ? formatDate(detail.dueDate) : '—'}</p></div>
                                </div>
                                <div>
                                    <p className="mb-1 flex items-center gap-1 text-[11px] text-gray-500"><Users className="h-3 w-3" />Atananlar</p>
                                    {can('assign:tasks') ? (
                                        <div className="flex flex-wrap gap-2">
                                            {users.map((u) => {
                                                const assigned = detail.assignees.some((a) => a.user.id === u.id);
                                                return (
                                                    <button key={u.id} type="button" onClick={async () => {
                                                        const ids = assigned ? detail.assignees.filter((a) => a.user.id !== u.id).map((a) => a.user.id) : [...detail.assignees.map((a) => a.user.id), u.id];
                                                        try { await api('/api/admin/tasks', { method: 'PUT', json: { taskId: detail.id, assigneeIds: ids } }); loadDetail(detail.id); load(); } catch (e) { setError(e instanceof Error ? e.message : 'Atama başarısız'); }
                                                    }} className={`rounded-full border px-2.5 py-1 text-xs ${assigned ? 'border-primary bg-primary/15 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>{u.name}</button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-200">{detail.assignees.map((a) => a.user.name).join(', ') || 'Atanmadı'}</p>
                                    )}
                                </div>
                                <TaskWorkOsPanel task={detail as unknown as WorkOsTask} meId={me?.id || null} onOpenTask={(id) => setDetailId(id)} onChanged={() => { loadDetail(detail.id); load(); }} onError={(m) => setError(m)} />
                                <TaskWorkPanel taskId={detail.id} status={detail.status} actualHours={detail.actualHours ?? null} onChanged={() => { loadDetail(detail.id); load(); }} onError={(m) => setError(m)} />
                                {relationLinks(detail).length > 0 && (
                                    <div>
                                        <p className="mb-1 text-[11px] text-gray-500">İlişkili kayıtlar</p>
                                        <ul className="space-y-1">{relationLinks(detail).map((l) => <li key={l.href + l.label}><Link href={l.href} className="text-sm text-primary hover:underline">{l.label}</Link></li>)}</ul>
                                    </div>
                                )}
                                {detail.checklistItems.length > 0 && (
                                    <div>
                                        <p className="mb-1 text-[11px] text-gray-500">Kontrol listesi</p>
                                        <ul className="space-y-1">
                                            {detail.checklistItems.map((c) => (
                                                <li key={c.id}>
                                                    <label className="flex items-center gap-2 text-sm text-gray-200">
                                                        <input type="checkbox" checked={c.isCompleted} onChange={async (e) => { await api('/api/admin/tasks', { method: 'PUT', json: { taskId: detail.id, checklistItemId: c.id, isCompleted: e.target.checked } }); loadDetail(detail.id); }} />
                                                        <span className={c.isCompleted ? 'text-gray-500 line-through' : ''}>{c.title}</span>
                                                    </label>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {detail.status !== 'CANCELLED' && detail.status !== 'DONE' && (me?.id === detail.createdById || can('approve:tasks')) && (
                                    <Button variant="ghost" size="sm" icon={XCircle} onClick={() => runAction(detail, 'cancel', {}, `"${detail.title}" iptal edildi.`)}>Görevi İptal Et</Button>
                                )}
                            </div>
                        )}
                        {detailTab === 'comments' && (
                            <div className="space-y-3">
                                <form className="space-y-2" onSubmit={async (e) => { e.preventDefault(); if (!comment.trim()) return; await api('/api/admin/tasks', { method: 'PUT', json: { taskId: detail.id, comment } }); setComment(''); loadDetail(detail.id); }}>
                                    <TextArea aria-label="Yorum" placeholder="Yorum yazın..." value={comment} onChange={(e) => setComment(e.target.value)} />
                                    <Button type="submit" size="sm" variant="primary" disabled={!comment.trim()}>Yorum Ekle</Button>
                                </form>
                                {detail.comments.map((c) => <div key={c.id} className="rounded-lg border border-white/10 p-3"><p className="whitespace-pre-wrap text-sm text-gray-200">{c.comment}</p><p className="mt-1 text-[11px] text-gray-500">{c.author.name} · {formatDateTime(c.createdAt)}</p></div>)}
                            </div>
                        )}
                        {detailTab === 'history' && (
                            <ol className="space-y-3 border-l border-white/10 pl-4">
                                {detail.activitiesLog.map((a) => <li key={a.id}><p className="text-sm text-gray-200">{a.description}</p><p className="text-[11px] text-gray-500">{a.actorName} · {formatDateTime(a.createdAt)}</p></li>)}
                            </ol>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
}
