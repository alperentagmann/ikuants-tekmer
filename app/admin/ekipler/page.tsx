'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Crown, KanbanSquare, ListTodo, Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { api, Alert, Button, Card, EmptyState, Field, Modal, PageHeader, Skeleton, TextArea, TextInput } from '@/components/admin/ui';
import { Avatar, AvatarStack, PeoplePicker } from '@/components/admin/work/people';

interface Team {
    id: string;
    name: string;
    description: string | null;
    color: string;
    lead: { id: string; name: string; avatarUrl: string | null; title: string | null } | null;
    members: { userId: string; role: string; name: string; avatarUrl: string | null; title: string | null }[];
    openTasks: number;
    overdueTasks: number;
    doneLast30: number;
}

const COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#4f46e5'];
const SUGGESTED = ['Yönetim', 'Uzmanlar', 'Muhasebe & Finans', 'Kurumsal İletişim', 'Tanıtım & Etkinlik', 'Operasyon', 'Program & Kuluçka', 'Teknik Altyapı'];
const empty = { id: '', name: '', description: '', color: COLORS[0], leadUserId: '' as string, memberIds: [] as string[] };

/** Teams / departments: who works where, team load and quick links to the team's boards. */
export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[] | null>(null);
    const [form, setForm] = useState<typeof empty | null>(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

    const load = useCallback(async () => {
        try {
            setTeams((await api<{ teams: Team[] }>('/api/admin/teams')).teams);
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Ekipler yüklenemedi' });
        }
    }, []);
    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const save = async () => {
        if (!form) return;
        setBusy(true);
        try {
            const body = { name: form.name, description: form.description, color: form.color, leadUserId: form.leadUserId || null, members: form.memberIds.map((userId) => ({ userId })) };
            if (form.id) await api(`/api/admin/teams/${form.id}`, { method: 'PUT', json: body });
            else await api('/api/admin/teams', { method: 'POST', json: body });
            setNotice({ tone: 'success', text: form.id ? 'Ekip güncellendi.' : 'Ekip oluşturuldu.' });
            setForm(null);
            await load();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Kaydedilemedi' });
        } finally {
            setBusy(false);
        }
    };

    const archive = async (t: Team) => {
        if (!window.confirm(`"${t.name}" ekibi arşivlensin mi? Görevler silinmez, ekipsiz kalır.`)) return;
        try {
            await api(`/api/admin/teams/${t.id}`, { method: 'DELETE' });
            await load();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Arşivlenemedi' });
        }
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Ekipler & Departmanlar"
                icon={UsersRound}
                description="Yönetim, uzmanlar, muhasebe, kurumsal iletişim ve tanıtım ekiplerini kurun. Görevler ekiplere bağlanır; ekip yükü, gecikmeler ve raporlar ekip bazında izlenir."
                actions={<Button variant="primary" icon={Plus} onClick={() => setForm({ ...empty })}>Yeni ekip</Button>}
            />
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}

            {!teams ? (
                <Skeleton rows={6} />
            ) : teams.length === 0 ? (
                <Card>
                    <EmptyState icon={UsersRound} title="Henüz ekip yok" description="Önerilen ekiplerden birine tıklayarak başlayın." />
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                        {SUGGESTED.map((n, i) => <Button key={n} size="sm" icon={Plus} onClick={() => setForm({ ...empty, name: n, color: COLORS[i % COLORS.length] })}>{n}</Button>)}
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {teams.map((t) => (
                        <Card key={t.id} className="relative overflow-hidden">
                            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-2xl" style={{ background: t.color }} />
                            <div className="relative mb-3 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: t.color }}><UsersRound className="h-5 w-5" /></span>
                                    <div>
                                        <h3 className="font-semibold text-white">{t.name}</h3>
                                        <p className="line-clamp-1 text-[11px] text-gray-400">{t.description || `${t.members.length} üye`}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button type="button" className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Düzenle" onClick={() => setForm({ id: t.id, name: t.name, description: t.description || '', color: t.color, leadUserId: t.lead?.id || '', memberIds: t.members.map((m) => m.userId) })}><Pencil className="h-4 w-4" /></button>
                                    <button type="button" className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-rose-300" aria-label="Arşivle" onClick={() => archive(t)}><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div className="relative mb-4 grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-lg bg-black/25 p-2"><div className="flex items-center justify-center gap-1 text-lg font-bold text-white"><ListTodo className="h-4 w-4 text-cyan-400" />{t.openTasks}</div><div className="text-[10px] text-gray-500">Açık iş</div></div>
                                <div className="rounded-lg bg-black/25 p-2"><div className={`flex items-center justify-center gap-1 text-lg font-bold ${t.overdueTasks ? 'text-rose-300' : 'text-white'}`}><AlertTriangle className="h-4 w-4" />{t.overdueTasks}</div><div className="text-[10px] text-gray-500">Geciken</div></div>
                                <div className="rounded-lg bg-black/25 p-2"><div className="flex items-center justify-center gap-1 text-lg font-bold text-white"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{t.doneLast30}</div><div className="text-[10px] text-gray-500">30 günde biten</div></div>
                            </div>
                            <div className="relative flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                    {t.lead ? <><Avatar name={t.lead.name} url={t.lead.avatarUrl} size={26} /><span><Crown className="mr-1 inline h-3 w-3 text-amber-300" />{t.lead.name}</span></> : <span className="text-gray-500">Lider atanmadı</span>}
                                </div>
                                <AvatarStack people={t.members.map((m) => ({ name: m.name, avatarUrl: m.avatarUrl }))} />
                            </div>
                            <div className="relative mt-4 flex gap-2 border-t border-white/10 pt-3">
                                <Link href={`/admin/gorevler?teamId=${t.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-200 hover:border-primary/50"><ListTodo className="h-3.5 w-3.5" /> Görevler</Link>
                                <Link href={`/admin/is-planlama?teamId=${t.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-200 hover:border-primary/50"><KanbanSquare className="h-3.5 w-3.5" /> Planlama</Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                open={Boolean(form)}
                onClose={() => setForm(null)}
                title={form?.id ? 'Ekibi düzenle' : 'Yeni ekip'}
                size="lg"
                footer={<><Button onClick={() => setForm(null)}>Vazgeç</Button><Button variant="primary" loading={busy} disabled={!form || form.name.trim().length < 2} onClick={save}>Kaydet</Button></>}
            >
                {form && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                            <Field label="Ekip adı" htmlFor="t-name" required><TextInput id="t-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                            <Field label="Açıklama" htmlFor="t-desc"><TextArea id="t-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                            <Field label="Renk">
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map((c) => <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} aria-label={c} className={`h-7 w-7 rounded-full ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d0d17]' : ''}`} style={{ background: c }} />)}
                                </div>
                            </Field>
                            <Field label="Ekip lideri">
                                <PeoplePicker single value={form.leadUserId ? [form.leadUserId] : []} onChange={(ids) => setForm({ ...form, leadUserId: ids[0] || '', memberIds: ids[0] && !form.memberIds.includes(ids[0]) ? [...form.memberIds, ids[0]] : form.memberIds })} placeholder="Lider ara" />
                            </Field>
                        </div>
                        <Field label={`Üyeler (${form.memberIds.length})`}>
                            <PeoplePicker value={form.memberIds} onChange={(ids) => setForm({ ...form, memberIds: ids })} placeholder="Üye ara" />
                        </Field>
                    </div>
                )}
            </Modal>
        </div>
    );
}
