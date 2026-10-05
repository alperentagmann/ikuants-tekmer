'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRightLeft, Play, Square, Clock, Search } from 'lucide-react';
import { api, Badge, Button, Field, Modal, TextArea, TextInput, formatDateTime } from '@/components/admin/ui';

type Target = { id: string; name: string; email: string; title: string | null; department: string | null; roles: string[]; isSuperAdmin: boolean };
type Handoff = { id: string; status: string; note: string | null; responseNote: string | null; createdAt: string; fromUser: { name: string }; toUser: { name: string } };
type Running = { task: { id: string } | null } | null;

/** Pass the task to a colleague, track time on it, and see its handoff history. */
export function TaskWorkPanel({ taskId, status, actualHours, onChanged, onError }: { taskId: string; status: string; actualHours: number | null; onChanged: () => void; onError: (msg: string) => void }) {
    const [handoffs, setHandoffs] = useState<Handoff[]>([]);
    const [running, setRunning] = useState<Running>(null);
    const [open, setOpen] = useState(false);
    const [targets, setTargets] = useState<Target[]>([]);
    const [query, setQuery] = useState('');
    const [toUserId, setToUserId] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const [h, t] = await Promise.all([api<{ handoffs: Handoff[] }>(`/api/admin/work/handoffs?box=task&taskId=${taskId}`), api<{ running: Running }>('/api/admin/work/time')]);
            setHandoffs(h.handoffs);
            setRunning(t.running);
        } catch {
            /* panel is supplementary; errors are shown on actions */
        }
    }, [taskId]);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const openPass = async () => {
        setOpen(true);
        if (!targets.length) {
            try {
                setTargets((await api<{ users: Target[] }>('/api/admin/work/targets')).users);
            } catch (e) {
                onError(e instanceof Error ? e.message : 'Kişiler alınamadı');
            }
        }
    };
    const pass = async () => {
        setBusy(true);
        try {
            await api('/api/admin/work/handoffs', { method: 'POST', json: { taskId, toUserId, note } });
            setOpen(false);
            setNote('');
            setToUserId('');
            await load();
            onChanged();
        } catch (e) {
            onError(e instanceof Error ? e.message : 'Görev paslanamadı');
        } finally {
            setBusy(false);
        }
    };
    const timer = async () => {
        try {
            await api('/api/admin/work/time', { method: 'POST', json: running?.task?.id === taskId ? { action: 'stop' } : { action: 'start', taskId } });
            await load();
            onChanged();
        } catch (e) {
            onError(e instanceof Error ? e.message : 'Süre işlemi başarısız');
        }
    };

    const isRunning = running?.task?.id === taskId;
    const closed = status === 'DONE' || status === 'CANCELLED';
    const filtered = targets.filter((t) => !query || `${t.name} ${t.email} ${t.title || ''} ${t.department || ''}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));
    const pending = handoffs.find((h) => h.status === 'PENDING');

    return (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-wrap items-center gap-2">
                {!closed && <Button size="sm" icon={ArrowRightLeft} disabled={Boolean(pending)} onClick={openPass} title={pending ? 'Yanıt bekleyen bir pas var' : undefined}>Pasla</Button>}
                {!closed && <Button size="sm" variant={isRunning ? 'success' : 'secondary'} icon={isRunning ? Square : Play} onClick={timer}>{isRunning ? 'Süreyi durdur' : 'Süre başlat'}</Button>}
                <span className="ml-auto flex items-center gap-1 text-xs text-gray-400"><Clock className="h-3.5 w-3.5" /> Kayıtlı süre: {actualHours ? `${actualHours} saat` : '—'}</span>
            </div>
            {handoffs.length > 0 && (
                <ul className="space-y-1.5">
                    {handoffs.map((h) => (
                        <li key={h.id} className="text-xs text-gray-300">
                            <Badge tone={h.status === 'PENDING' ? 'warning' : h.status === 'ACCEPTED' ? 'success' : 'danger'}>{h.status === 'PENDING' ? 'Bekliyor' : h.status === 'ACCEPTED' ? 'Kabul' : 'Geri paslandı'}</Badge>{' '}
                            {h.fromUser.name} → {h.toUser.name} · {formatDateTime(h.createdAt)}
                            {h.note && <span className="block pl-1 text-gray-400">“{h.note}”</span>}
                            {h.responseNote && <span className="block pl-1 text-gray-500">Yanıt: {h.responseNote}</span>}
                        </li>
                    ))}
                </ul>
            )}

            <Modal open={open} onClose={() => setOpen(false)} title="Görevi pasla" description="Görev seçtiğiniz kişiye atanır; size ait atama ona devredilir. Kişi kabul eder veya notla geri paslayabilir." footer={<><Button onClick={() => setOpen(false)}>Vazgeç</Button><Button variant="primary" icon={ArrowRightLeft} loading={busy} disabled={!toUserId} onClick={pass}>Pasla</Button></>}>
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kişi ara (ad, unvan, birim)" className="pl-9" />
                    </div>
                    <ul className="max-h-64 space-y-1 overflow-y-auto">
                        {filtered.map((t) => (
                            <li key={t.id}>
                                <button type="button" onClick={() => setToUserId(t.id)} className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm ${toUserId === t.id ? 'border-primary bg-primary/15 text-white' : 'border-white/10 text-gray-300 hover:border-white/25'}`}>
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">{t.name}</span>
                                        <span className="block truncate text-[11px] text-gray-500">{[t.title, t.department, t.roles.join(', ')].filter(Boolean).join(' · ') || t.email}</span>
                                    </span>
                                    {t.isSuperAdmin && <Badge tone="primary">Süper Yönetici</Badge>}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <Field label="Not (opsiyonel)"><TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ne yapılması gerektiğini kısaca yazın." /></Field>
                </div>
            </Modal>
        </div>
    );
}
