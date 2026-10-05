'use client';

import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, GitBranchPlus, ListTree, Plus, Repeat, UsersRound } from 'lucide-react';
import { api, Badge, Button, Select, TextInput, formatDate } from '@/components/admin/ui';
import { Avatar, AvatarStack } from './people';

export interface WorkOsTask {
    id: string;
    status: string;
    startDate?: string | null;
    dueDate: string | null;
    recurrence?: string | null;
    team?: { id: string; name: string; color: string } | null;
    parentTask?: { id: string; title: string } | null;
    subTasks?: { id: string; title: string; status: string; dueDate: string | null; assignees: { user: { id: string; name: string; avatarUrl: string | null } }[] }[];
    watchers?: { user: { id: string; name: string; avatarUrl: string | null } }[];
}

const RECUR = [{ value: 'DAILY', label: 'Her gün' }, { value: 'WEEKDAYS', label: 'Hafta içi' }, { value: 'WEEKLY', label: 'Her hafta' }, { value: 'MONTHLY', label: 'Her ay' }, { value: 'QUARTERLY', label: '3 ayda bir' }, { value: 'YEARLY', label: 'Her yıl' }];
const DONE = ['DONE', 'CANCELLED'];

/** Team, recurrence, start date, watchers and sub-tasks of a task (inside the task drawer). */
export function TaskWorkOsPanel({ task, meId, onOpenTask, onChanged, onError }: { task: WorkOsTask; meId: string | null; onOpenTask: (id: string) => void; onChanged: () => void; onError: (m: string) => void }) {
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
    const [subTitle, setSubTitle] = useState('');
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        api<{ teams: { id: string; name: string }[] }>('/api/admin/teams').then((d) => alive && setTeams(d.teams)).catch(() => undefined);
        return () => {
            alive = false;
        };
    }, []);

    const put = async (key: string, json: Record<string, unknown>) => {
        setBusy(key);
        try {
            await api('/api/admin/tasks', { method: 'PUT', json: { taskId: task.id, ...json } });
            onChanged();
        } catch (e) {
            onError(e instanceof Error ? e.message : 'İşlem başarısız');
        } finally {
            setBusy(null);
        }
    };

    const addSub = async () => {
        if (!subTitle.trim()) return;
        setBusy('sub');
        try {
            await api('/api/admin/tasks', { method: 'POST', json: { title: subTitle.trim(), parentTaskId: task.id } });
            setSubTitle('');
            onChanged();
        } catch (e) {
            onError(e instanceof Error ? e.message : 'Alt görev eklenemedi');
        } finally {
            setBusy(null);
        }
    };

    const watchers = task.watchers || [];
    const watching = Boolean(meId && watchers.some((w) => w.user.id === meId));
    const subs = task.subTasks || [];
    const doneSubs = subs.filter((s) => DONE.includes(s.status)).length;

    return (
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            {task.parentTask && (
                <button type="button" onClick={() => onOpenTask(task.parentTask!.id)} className="flex items-center gap-1.5 text-xs text-primary hover:underline"><ListTree className="h-3.5 w-3.5" /> Üst görev: {task.parentTask.title}</button>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-[11px] text-gray-500">
                    <span className="mb-1 flex items-center gap-1"><UsersRound className="h-3 w-3" /> Ekip</span>
                    <Select aria-label="Ekip" value={task.team?.id || ''} placeholder="Ekipsiz" disabled={busy === 'team'} onChange={(e) => put('team', { settings: { teamId: e.target.value || null } })} options={teams.map((t) => ({ value: t.id, label: t.name }))} />
                </label>
                <label className="text-[11px] text-gray-500">
                    <span className="mb-1 flex items-center gap-1"><Repeat className="h-3 w-3" /> Tekrar</span>
                    <Select aria-label="Tekrar" value={task.recurrence || ''} placeholder="Tekrarlanmaz" disabled={busy === 'rec' || !task.dueDate} onChange={(e) => put('rec', { settings: { recurrence: e.target.value || null } })} options={RECUR} />
                </label>
                <label className="text-[11px] text-gray-500">
                    <span className="mb-1 block">Başlangıç</span>
                    <TextInput aria-label="Başlangıç tarihi" type="date" value={task.startDate ? task.startDate.slice(0, 10) : ''} onChange={(e) => put('start', { settings: { startDate: e.target.value || null } })} />
                </label>
            </div>
            {!task.dueDate && <p className="text-[11px] text-gray-500">Tekrarlayan görev için önce termin tarihi girin.</p>}

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Eye className="h-3.5 w-3.5" /> İzleyenler
                    {watchers.length ? <AvatarStack people={watchers.map((w) => ({ name: w.user.name, avatarUrl: w.user.avatarUrl }))} size={22} /> : <span>yok</span>}
                </div>
                <Button size="sm" variant={watching ? 'secondary' : 'ghost'} icon={watching ? EyeOff : Eye} loading={busy === 'watch'} onClick={() => put('watch', { watch: !watching })}>{watching ? 'İzlemeyi bırak' : 'İzle'}</Button>
            </div>

            {!task.parentTask && (
                <div>
                    <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="flex items-center gap-1"><GitBranchPlus className="h-3.5 w-3.5" /> Alt görevler</span>
                        {subs.length > 0 && <span>{doneSubs}/{subs.length} tamamlandı</span>}
                    </div>
                    {subs.length > 0 && (
                        <>
                            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${(doneSubs / subs.length) * 100}%` }} /></div>
                            <ul className="mb-2 space-y-1">
                                {subs.map((s) => (
                                    <li key={s.id}>
                                        <button type="button" onClick={() => onOpenTask(s.id)} className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-left text-xs hover:border-white/25">
                                            <span className={`h-2 w-2 shrink-0 rounded-full ${DONE.includes(s.status) ? 'bg-emerald-400' : s.status === 'IN_PROGRESS' ? 'bg-amber-400' : s.status === 'IN_REVIEW' ? 'bg-violet-400' : 'bg-gray-500'}`} />
                                            <span className={`min-w-0 flex-1 truncate ${DONE.includes(s.status) ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{s.title}</span>
                                            {s.dueDate && <Badge tone="neutral">{formatDate(s.dueDate)}</Badge>}
                                            {s.assignees[0] && <Avatar name={s.assignees[0].user.name} url={s.assignees[0].user.avatarUrl} size={20} />}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void addSub(); }}>
                        <TextInput aria-label="Yeni alt görev" value={subTitle} placeholder="Alt görev ekle…" onChange={(e) => setSubTitle(e.target.value)} />
                        <Button type="submit" size="sm" icon={Plus} loading={busy === 'sub'} disabled={!subTitle.trim()}>Ekle</Button>
                    </form>
                </div>
            )}
        </div>
    );
}
