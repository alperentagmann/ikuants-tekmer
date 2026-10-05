'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Bot, ClipboardCopy, FilePlus2, Pencil, Play, Plus, Trash2, Workflow, Zap } from 'lucide-react';
import { api, Alert, Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Select, Skeleton, Tabs, TextArea, TextInput, Toggle, formatDateTime } from '@/components/admin/ui';
import { PeoplePicker, usePeople } from '@/components/admin/work/people';

interface Template {
    id: string; name: string; description: string | null; title: string; body: string | null; priority: string; teamId: string | null;
    team: { id: string; name: string; color: string } | null; checklist: string[]; subTasks: string[]; estimatedHours: number | null; dueInDays: number | null; recurrence: string | null; usageCount: number;
}
interface RuleAction { type: string; userId?: string | null; priority?: string | null; title?: string | null; dueInDays?: number | null; message?: string | null }
interface Rule {
    id: string; name: string; description: string | null; isActive: boolean; trigger: string;
    conditions: { teamId?: string | null; priority?: string | null; toStatus?: string | null }; actions: RuleAction[];
    executionCount: number; lastExecutedAt: string | null; recentLogs: { id: string; status: string; executedAt: string; result: string | null; error: string | null }[];
}
type Tab = 'templates' | 'rules';

const PRIORITIES = [{ value: 'LOW', label: 'Düşük' }, { value: 'MEDIUM', label: 'Orta' }, { value: 'HIGH', label: 'Yüksek' }, { value: 'URGENT', label: 'Acil' }];
const STATUSES = [{ value: 'TODO', label: 'Yapılacak' }, { value: 'IN_PROGRESS', label: 'Devam ediyor' }, { value: 'IN_REVIEW', label: 'Kontrolde' }, { value: 'DONE', label: 'Tamamlandı' }, { value: 'CANCELLED', label: 'İptal' }];
const RECUR = [{ value: 'DAILY', label: 'Her gün' }, { value: 'WEEKDAYS', label: 'Hafta içi her gün' }, { value: 'WEEKLY', label: 'Her hafta' }, { value: 'MONTHLY', label: 'Her ay' }, { value: 'QUARTERLY', label: 'Her 3 ayda bir' }, { value: 'YEARLY', label: 'Her yıl' }];
const NEEDS_USER = ['NOTIFY_USER', 'ADD_WATCHER', 'ASSIGN_USER'];

const STARTERS: { name: string; trigger: string; conditions: Rule['conditions']; actions: RuleAction[] }[] = [
    { name: 'Acil iş açılınca ekip liderine haber ver', trigger: 'TASK_CREATED', conditions: { priority: 'URGENT' }, actions: [{ type: 'NOTIFY_TEAM_LEAD', message: 'Ekibinize acil bir iş açıldı.' }] },
    { name: 'Kontrole gelince oluşturana bildir', trigger: 'TASK_STATUS_CHANGED', conditions: { toStatus: 'IN_REVIEW' }, actions: [{ type: 'NOTIFY_CREATOR', message: 'Görev kontrolünüzü bekliyor.' }] },
    { name: 'Geciken işi yükselt', trigger: 'TASK_OVERDUE', conditions: {}, actions: [{ type: 'SET_PRIORITY', priority: 'HIGH' }, { type: 'NOTIFY_TEAM_LEAD', message: 'Ekipte geciken iş var.' }] },
    { name: 'Tamamlanınca 7 gün sonra takip görevi', trigger: 'TASK_COMPLETED', conditions: {}, actions: [{ type: 'CREATE_FOLLOW_UP', dueInDays: 7 }] },
];

/** Task templates and "when … then …" automation rules for the whole office. */
export default function AutomationPage() {
    const [tab, setTab] = useState<Tab>('templates');
    const [templates, setTemplates] = useState<Template[] | null>(null);
    const [rules, setRules] = useState<Rule[] | null>(null);
    const [triggers, setTriggers] = useState<Record<string, string>>({});
    const [actionLabels, setActionLabels] = useState<Record<string, string>>({});
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
    const [tpl, setTpl] = useState<(Partial<Template> & { checklistText: string; subTasksText: string }) | null>(null);
    const [useTpl, setUseTpl] = useState<{ template: Template; assigneeIds: string[]; dueDate: string; title: string } | null>(null);
    const [rule, setRule] = useState<Partial<Rule> | null>(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string; link?: string } | null>(null);
    const people = usePeople();

    const load = useCallback(async () => {
        try {
            const [t, r, tm] = await Promise.all([
                api<{ templates: Template[] }>('/api/admin/work/templates'),
                api<{ rules: Rule[]; triggers: Record<string, string>; actions: Record<string, string> }>('/api/admin/work/automations'),
                api<{ teams: { id: string; name: string }[] }>('/api/admin/teams'),
            ]);
            setTemplates(t.templates);
            setRules(r.rules);
            setTriggers(r.triggers);
            setActionLabels(r.actions);
            setTeams(tm.teams);
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Yüklenemedi' });
        }
    }, []);
    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const run = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => {
        setBusy(true);
        try {
            const res = (await fn()) as { link?: string } | undefined;
            setNotice({ tone: 'success', text: ok, link: res?.link });
            after?.();
            await load();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'İşlem başarısız' });
        } finally {
            setBusy(false);
        }
    };

    const personName = (id?: string | null) => people.find((p) => p.id === id)?.name || 'kişi';
    const describeAction = (a: RuleAction) => {
        const base = actionLabels[a.type] || a.type;
        if (NEEDS_USER.includes(a.type)) return `${base}: ${personName(a.userId)}`;
        if (a.type === 'SET_PRIORITY') return `${base}: ${PRIORITIES.find((p) => p.value === a.priority)?.label}`;
        if (a.type === 'CREATE_FOLLOW_UP') return `${base}${a.dueInDays !== null && a.dueInDays !== undefined ? ` (+${a.dueInDays} gün)` : ''}`;
        return base;
    };

    return (
        <div className="space-y-5">
            <PageHeader title="Şablonlar & Otomasyon" icon={Workflow} description="Sık yapılan işler için şablon hazırlayın; tek tıkla kontrol listesi ve alt görevleriyle oluşturun. Otomasyon kurallarıyla bildirim, atama ve takip görevlerini sisteme bırakın." />
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}{notice.link && <a href={notice.link} className="ml-2 underline">Görevi aç</a>}</Alert>}
            <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ value: 'templates', label: 'Görev şablonları', icon: ClipboardCopy, count: templates?.length || null }, { value: 'rules', label: 'Otomasyon kuralları', icon: Zap, count: rules?.length || null }]} />

            {tab === 'templates' && (
                !templates ? <Skeleton rows={5} /> : (
                    <div className="space-y-4">
                        <div className="flex justify-end"><Button variant="primary" icon={Plus} onClick={() => setTpl({ name: '', title: '', priority: 'MEDIUM', checklistText: '', subTasksText: '' })}>Yeni şablon</Button></div>
                        {templates.length === 0 ? (
                            <Card><EmptyState icon={ClipboardCopy} title="Henüz şablon yok" description="Örn: Aylık kira tahakkuku, Etkinlik hazırlığı, Yeni girişimci onboarding, Basın bülteni yayını." /></Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {templates.map((t) => (
                                    <Card key={t.id} className="flex flex-col">
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-white">{t.name}</h3>
                                                <p className="text-[11px] text-gray-400">{t.title}</p>
                                            </div>
                                            {t.team && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: t.team.color }}>{t.team.name}</span>}
                                        </div>
                                        {t.description && <p className="mb-2 text-xs text-gray-400">{t.description}</p>}
                                        <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
                                            <Badge tone="neutral">{t.checklist.length} adım</Badge>
                                            <Badge tone="neutral">{t.subTasks.length} alt görev</Badge>
                                            {t.dueInDays !== null && <Badge tone="info">+{t.dueInDays} gün</Badge>}
                                            {t.recurrence && <Badge tone="primary">{RECUR.find((r) => r.value === t.recurrence)?.label}</Badge>}
                                            <Badge tone="neutral">{t.usageCount} kez kullanıldı</Badge>
                                        </div>
                                        <div className="mt-auto flex gap-2 border-t border-white/10 pt-3">
                                            <Button size="sm" variant="primary" icon={FilePlus2} onClick={() => setUseTpl({ template: t, assigneeIds: [], dueDate: '', title: t.title })}>Görev oluştur</Button>
                                            <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setTpl({ ...t, checklistText: t.checklist.join('\n'), subTasksText: t.subTasks.join('\n') })}>Düzenle</Button>
                                            <Button size="sm" variant="ghost" icon={Trash2} aria-label="Sil" onClick={() => window.confirm('Şablon silinsin mi?') && run(() => api(`/api/admin/work/templates?id=${t.id}`, { method: 'DELETE' }), 'Şablon silindi.')} />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )
            )}

            {tab === 'rules' && (
                !rules ? <Skeleton rows={5} /> : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-2">
                                {STARTERS.map((s) => <Button key={s.name} size="sm" icon={Bot} onClick={() => setRule({ ...s, isActive: true })}>{s.name}</Button>)}
                            </div>
                            <Button variant="primary" icon={Plus} onClick={() => setRule({ name: '', trigger: 'TASK_CREATED', conditions: {}, actions: [{ type: 'NOTIFY_TEAM_LEAD' }], isActive: true })}>Yeni kural</Button>
                        </div>
                        {rules.length === 0 ? (
                            <Card><EmptyState icon={Zap} title="Henüz kural yok" description="Yukarıdaki hazır örneklerden biriyle başlayabilirsiniz." /></Card>
                        ) : (
                            rules.map((r) => (
                                <Card key={r.id}>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2"><Zap className={`h-4 w-4 ${r.isActive ? 'text-amber-300' : 'text-gray-600'}`} /><h3 className="font-semibold text-white">{r.name}</h3>{!r.isActive && <Badge tone="neutral">Pasif</Badge>}</div>
                                            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-300">
                                                <Badge tone="info">{triggers[r.trigger]}</Badge>
                                                {r.conditions.teamId && <Badge tone="neutral">Ekip: {teams.find((t) => t.id === r.conditions.teamId)?.name || '—'}</Badge>}
                                                {r.conditions.priority && <Badge tone="neutral">Öncelik: {PRIORITIES.find((p) => p.value === r.conditions.priority)?.label}</Badge>}
                                                {r.conditions.toStatus && <Badge tone="neutral">Durum: {STATUSES.find((s) => s.value === r.conditions.toStatus)?.label}</Badge>}
                                                <ArrowRight className="h-3.5 w-3.5 text-gray-500" />
                                                {r.actions.map((a, i) => <Badge key={i} tone="primary">{describeAction(a)}</Badge>)}
                                            </p>
                                            <p className="mt-1 text-[11px] text-gray-500">{r.executionCount} kez çalıştı{r.lastExecutedAt ? ` · son: ${formatDateTime(r.lastExecutedAt)}` : ''}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setRule(r)}>Düzenle</Button>
                                            <Button size="sm" variant="ghost" icon={Trash2} aria-label="Sil" onClick={() => window.confirm('Kural silinsin mi?') && run(() => api(`/api/admin/work/automations?id=${r.id}`, { method: 'DELETE' }), 'Kural silindi.')} />
                                        </div>
                                    </div>
                                    {r.recentLogs.length > 0 && (
                                        <ul className="mt-3 space-y-1 border-t border-white/10 pt-2 text-[11px] text-gray-400">
                                            {r.recentLogs.map((l) => <li key={l.id}><span className={l.status === 'SUCCESS' ? 'text-emerald-300' : 'text-rose-300'}>{l.status === 'SUCCESS' ? '✓' : '✕'}</span> {formatDateTime(l.executedAt)} · {l.error || l.result}</li>)}
                                        </ul>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>
                )
            )}

            <Modal open={Boolean(tpl)} onClose={() => setTpl(null)} title={tpl?.id ? 'Şablonu düzenle' : 'Yeni şablon'} size="lg"
                footer={<><Button onClick={() => setTpl(null)}>Vazgeç</Button><Button variant="primary" loading={busy} disabled={!tpl?.name?.trim() || !tpl?.title?.trim()} onClick={() => tpl && run(() => api('/api/admin/work/templates', { method: 'POST', json: { action: 'save', ...tpl, checklist: tpl.checklistText, subTasks: tpl.subTasksText } }), 'Şablon kaydedildi.', () => setTpl(null))}>Kaydet</Button></>}>
                {tpl && (
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Şablon adı" htmlFor="tp-name" required><TextInput id="tp-name" value={tpl.name || ''} onChange={(e) => setTpl({ ...tpl, name: e.target.value })} placeholder="Örn: Aylık kira tahakkuku" /></Field>
                        <Field label="Oluşacak görev başlığı" htmlFor="tp-title" required><TextInput id="tp-title" value={tpl.title || ''} onChange={(e) => setTpl({ ...tpl, title: e.target.value })} /></Field>
                        <Field label="Ekip" htmlFor="tp-team" hint={teams.length ? undefined : 'Henüz ekip yok. Ekip listesi İş & Operasyon › Ekipler ekranından oluşturulur.'}><Select id="tp-team" value={tpl.teamId || ''} placeholder="Ekipsiz" onChange={(e) => setTpl({ ...tpl, teamId: e.target.value || null })} options={teams.map((t) => ({ value: t.id, label: t.name }))} /></Field>
                        <Field label="Öncelik" htmlFor="tp-pri"><Select id="tp-pri" value={tpl.priority || 'MEDIUM'} onChange={(e) => setTpl({ ...tpl, priority: e.target.value })} options={PRIORITIES} /></Field>
                        <Field label="Termin (oluşturulduktan kaç gün sonra)" htmlFor="tp-due"><TextInput id="tp-due" type="number" min={0} value={tpl.dueInDays ?? ''} onChange={(e) => setTpl({ ...tpl, dueInDays: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
                        <Field label="Tekrar" htmlFor="tp-rec"><Select id="tp-rec" value={tpl.recurrence || ''} placeholder="Tekrarlanmaz" onChange={(e) => setTpl({ ...tpl, recurrence: e.target.value || null })} options={RECUR} /></Field>
                        <Field label="Açıklama (görev metni)" htmlFor="tp-body" className="md:col-span-2"><TextArea id="tp-body" rows={3} value={tpl.body || ''} onChange={(e) => setTpl({ ...tpl, body: e.target.value })} /></Field>
                        <Field label="Kontrol listesi (her satır bir adım)" htmlFor="tp-check"><TextArea id="tp-check" rows={5} value={tpl.checklistText} onChange={(e) => setTpl({ ...tpl, checklistText: e.target.value })} /></Field>
                        <Field label="Alt görevler (her satır bir alt görev)" htmlFor="tp-sub"><TextArea id="tp-sub" rows={5} value={tpl.subTasksText} onChange={(e) => setTpl({ ...tpl, subTasksText: e.target.value })} /></Field>
                    </div>
                )}
            </Modal>

            <Modal open={Boolean(useTpl)} onClose={() => setUseTpl(null)} title={`Şablondan görev: ${useTpl?.template.name || ''}`}
                footer={<><Button onClick={() => setUseTpl(null)}>Vazgeç</Button><Button variant="primary" icon={Play} loading={busy} onClick={() => useTpl && run(() => api('/api/admin/work/templates', { method: 'POST', json: { action: 'use', id: useTpl.template.id, assigneeIds: useTpl.assigneeIds, dueDate: useTpl.dueDate || null, title: useTpl.title } }), 'Görev oluşturuldu.', () => setUseTpl(null))}>Oluştur</Button></>}>
                {useTpl && (
                    <div className="space-y-3">
                        <Field label="Başlık" htmlFor="ut-title"><TextInput id="ut-title" value={useTpl.title} onChange={(e) => setUseTpl({ ...useTpl, title: e.target.value })} /></Field>
                        <Field label="Termin" htmlFor="ut-due" hint={useTpl.template.dueInDays !== null ? `Boş bırakılırsa ${useTpl.template.dueInDays} gün sonrası` : undefined}><TextInput id="ut-due" type="date" value={useTpl.dueDate} onChange={(e) => setUseTpl({ ...useTpl, dueDate: e.target.value })} /></Field>
                        <Field label="Atanacak kişiler (boşsa siz)"><PeoplePicker value={useTpl.assigneeIds} onChange={(ids) => setUseTpl({ ...useTpl, assigneeIds: ids })} /></Field>
                    </div>
                )}
            </Modal>

            <Modal open={Boolean(rule)} onClose={() => setRule(null)} title={rule?.id ? 'Kuralı düzenle' : 'Yeni otomasyon kuralı'} size="lg"
                footer={<><Button onClick={() => setRule(null)}>Vazgeç</Button><Button variant="primary" loading={busy} disabled={!rule?.name?.trim()} onClick={() => rule && run(() => api('/api/admin/work/automations', { method: 'POST', json: rule }), 'Kural kaydedildi.', () => setRule(null))}>Kaydet</Button></>}>
                {rule && (
                    <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Kural adı" htmlFor="r-name" required><TextInput id="r-name" value={rule.name || ''} onChange={(e) => setRule({ ...rule, name: e.target.value })} /></Field>
                            <Field label="Ne zaman?" htmlFor="r-trig"><Select id="r-trig" value={rule.trigger || 'TASK_CREATED'} onChange={(e) => setRule({ ...rule, trigger: e.target.value })} options={Object.entries(triggers).map(([value, label]) => ({ value, label }))} /></Field>
                        </div>
                        <div className="rounded-xl border border-white/10 p-3">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Koşullar (opsiyonel)</div>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Ekip"><Select value={rule.conditions?.teamId || ''} placeholder="Tümü" onChange={(e) => setRule({ ...rule, conditions: { ...rule.conditions, teamId: e.target.value || null } })} options={teams.map((t) => ({ value: t.id, label: t.name }))} /></Field>
                                <Field label="Öncelik"><Select value={rule.conditions?.priority || ''} placeholder="Tümü" onChange={(e) => setRule({ ...rule, conditions: { ...rule.conditions, priority: e.target.value || null } })} options={PRIORITIES} /></Field>
                                {rule.trigger === 'TASK_STATUS_CHANGED' && <Field label="Yeni durum"><Select value={rule.conditions?.toStatus || ''} placeholder="Herhangi" onChange={(e) => setRule({ ...rule, conditions: { ...rule.conditions, toStatus: e.target.value || null } })} options={STATUSES} /></Field>}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 p-3">
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400">Ne yapılsın? <Button size="sm" icon={Plus} onClick={() => setRule({ ...rule, actions: [...(rule.actions || []), { type: 'NOTIFY_TEAM_LEAD' }] })}>Eylem</Button></div>
                            <div className="space-y-3">
                                {(rule.actions || []).map((a, i) => {
                                    const setA = (patch: Partial<RuleAction>) => setRule({ ...rule, actions: (rule.actions || []).map((x, k) => (k === i ? { ...x, ...patch } : x)) });
                                    return (
                                        <div key={i} className="grid gap-2 rounded-lg bg-black/20 p-2 md:grid-cols-[1fr_1fr_auto]">
                                            <Select aria-label="Eylem" value={a.type} onChange={(e) => setA({ type: e.target.value })} options={Object.entries(actionLabels).map(([value, label]) => ({ value, label }))} />
                                            {NEEDS_USER.includes(a.type) ? (
                                                <Select aria-label="Kişi" value={a.userId || ''} placeholder="Kişi seçin" onChange={(e) => setA({ userId: e.target.value || null })} options={people.map((p) => ({ value: p.id, label: p.name }))} />
                                            ) : a.type === 'SET_PRIORITY' ? (
                                                <Select aria-label="Öncelik" value={a.priority || ''} placeholder="Öncelik" onChange={(e) => setA({ priority: e.target.value || null })} options={PRIORITIES} />
                                            ) : a.type === 'CREATE_FOLLOW_UP' ? (
                                                <div className="flex gap-2"><TextInput aria-label="Başlık" value={a.title || ''} placeholder="Takip başlığı (boşsa otomatik)" onChange={(e) => setA({ title: e.target.value })} /><TextInput aria-label="Gün" type="number" min={0} className="w-20" value={a.dueInDays ?? ''} placeholder="Gün" onChange={(e) => setA({ dueInDays: e.target.value === '' ? null : Number(e.target.value) })} /></div>
                                            ) : (
                                                <TextInput aria-label="Mesaj" value={a.message || ''} placeholder="Bildirim mesajı (opsiyonel)" onChange={(e) => setA({ message: e.target.value })} />
                                            )}
                                            <Button size="sm" variant="ghost" icon={Trash2} aria-label="Eylemi kaldır" onClick={() => setRule({ ...rule, actions: (rule.actions || []).filter((_, k) => k !== i) })} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <Toggle id="r-active" checked={rule.isActive !== false} onChange={(v) => setRule({ ...rule, isActive: v })} label="Kural aktif" />
                    </div>
                )}
            </Modal>
        </div>
    );
}
