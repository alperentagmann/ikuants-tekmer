'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Megaphone, Plus, Pencil, ArrowUp, ArrowDown, Trash2, ExternalLink, ClipboardList, Scale, FileCheck2, Mail, GitBranch, Settings2, Inbox } from 'lucide-react';
import { PageHeader, Button, Card, Badge, Alert, Skeleton, EmptyState, Drawer, Tabs, Field, TextInput, TextArea, Select, Toggle, api, formatDate } from '@/components/admin/ui';
import { APPLICATION_TYPES, APPLICANT_TYPES, applicationTypeLabel } from '@/lib/forms/schema';
import { APPLICATION_STATUSES } from '@/lib/constants/application';

interface Stage { key: string; label: string; order: number; isTerminal?: boolean; outcome?: 'ACCEPTED' | 'REJECTED' | 'WAITLIST' | null }
interface Doc { key: string; label: string; required: boolean; allowedTypes?: string[]; maxSizeMb?: number; description?: string; requiredAtStage?: string | null }
interface Campaign {
    id: string;
    name: string;
    slug: string;
    applicationType: string;
    description: string | null;
    status: string;
    programId: string | null;
    formId: string | null;
    evaluationTemplateId: string | null;
    ownerId: string | null;
    opensAt: string | null;
    closesAt: string | null;
    publicPath: string | null;
    allowedApplicantTypes: string[];
    workflowStages: Stage[];
    requiredDocuments: Doc[];
    notificationRecipients: string[];
    confirmationTemplateKey: string | null;
    statusTemplateMap: Record<string, string>;
    program: { id: string; name: string } | null;
    form: { id: string; title: string; slug: string; isPublished: boolean } | null;
    evaluationTemplate: { id: string; name: string } | null;
    owner: { id: string; name: string } | null;
    _count: { applications: number; submissions: number };
    statusCounts?: Record<string, number>;
}

type EditTab = 'general' | 'workflow' | 'evaluation' | 'documents' | 'email';

const EMPTY: Omit<Campaign, 'id' | 'program' | 'form' | 'evaluationTemplate' | 'owner' | '_count'> = {
    name: '',
    slug: '',
    applicationType: 'PROGRAM',
    description: '',
    status: 'DRAFT',
    programId: null,
    formId: null,
    evaluationTemplateId: null,
    ownerId: null,
    opensAt: null,
    closesAt: null,
    publicPath: '',
    allowedApplicantTypes: ['PERSON'],
    workflowStages: [],
    requiredDocuments: [],
    notificationRecipients: [],
    confirmationTemplateKey: null,
    statusTemplateMap: {},
};

const STATUS_LABEL: Record<string, string> = { DRAFT: 'Taslak', OPEN: 'Başvuruya açık', CLOSED: 'Kapalı', ARCHIVED: 'Arşiv' };
const statusTone = (s: string) => (s === 'OPEN' ? 'success' : s === 'CLOSED' ? 'warning' : 'neutral') as 'success' | 'warning' | 'neutral';

function slugify(text: string): string {
    const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
    return text.split('').map((c) => map[c] ?? c).join('').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
    const [forms, setForms] = useState<{ id: string; title: string; isPublished: boolean; campaigns: { id: string }[] }[]>([]);
    const [templates, setTemplates] = useState<{ id: string; name: string; criteria: { id: string; name: string; maxScore: number; weight: number }[] }[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<{ templateKey: string; name: string }[]>([]);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

    const [editing, setEditing] = useState<(typeof EMPTY & { id?: string }) | null>(null);
    const [editTab, setEditTab] = useState<EditTab>('general');
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const [templateEditor, setTemplateEditor] = useState<{ id?: string; name: string; description: string; criteria: { id?: string; name: string; description?: string; maxScore: number; weight: number }[] } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api<{ campaigns: Campaign[] }>(`/api/admin/campaigns${showArchived ? '?includeArchived=true' : ''}`);
            setCampaigns(data.campaigns);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Kampanyalar yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [showArchived]);

    const loadRefs = useCallback(async () => {
        const [p, f, t, et, u] = await Promise.allSettled([
            api<{ items: { id: string; name: string }[] }>('/api/admin/programs'),
            api<{ forms: { id: string; title: string; isPublished: boolean; campaigns: { id: string }[] }[] }>('/api/admin/forms'),
            api<{ templates: { id: string; name: string; criteria: { id: string; name: string; maxScore: number; weight: number }[] }[] }>('/api/admin/evaluation-templates'),
            api<{ templates: { templateKey: string; name: string }[] }>('/api/admin/email-templates'),
            api<{ users: { id: string; name: string }[] }>('/api/admin/users'),
        ]);
        if (p.status === 'fulfilled') setPrograms(p.value.items || []);
        if (f.status === 'fulfilled') setForms(f.value.forms || []);
        if (t.status === 'fulfilled') setTemplates(t.value.templates || []);
        if (et.status === 'fulfilled') setEmailTemplates(et.value.templates || []);
        if (u.status === 'fulfilled') setUsers(u.value.users || []);
    }, []);

    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        loadRefs();
    }, [loadRefs]);

    // Deep link: /admin/basvuru-kampanyalari?campaignId=...
    useEffect(() => {
        if (loading || typeof window === 'undefined') return;
        const id = new URLSearchParams(window.location.search).get('campaignId');
        const c = id ? campaigns.find((x) => x.id === id) : null;
        if (c) {
            openEdit(c);
            window.history.replaceState(null, '', '/admin/basvuru-kampanyalari');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const filtered = useMemo(() => campaigns.filter((c) => !typeFilter || c.applicationType === typeFilter), [campaigns, typeFilter]);

    const openEdit = (c?: Campaign) => {
        setEditError(null);
        setEditTab('general');
        if (!c) {
            setEditing({ ...EMPTY });
            return;
        }
        setEditing({
            id: c.id,
            name: c.name,
            slug: c.slug,
            applicationType: c.applicationType,
            description: c.description,
            status: c.status,
            programId: c.programId,
            formId: c.formId,
            evaluationTemplateId: c.evaluationTemplateId,
            ownerId: c.ownerId,
            opensAt: c.opensAt ? c.opensAt.slice(0, 10) : null,
            closesAt: c.closesAt ? c.closesAt.slice(0, 10) : null,
            publicPath: c.publicPath,
            allowedApplicantTypes: c.allowedApplicantTypes,
            workflowStages: c.workflowStages,
            requiredDocuments: c.requiredDocuments,
            notificationRecipients: c.notificationRecipients,
            confirmationTemplateKey: c.confirmationTemplateKey,
            statusTemplateMap: c.statusTemplateMap,
        });
    };

    const save = async () => {
        if (!editing) return;
        setSaving(true);
        setEditError(null);
        try {
            const body = { ...editing, opensAt: editing.opensAt || null, closesAt: editing.closesAt || null };
            if (editing.id) await api(`/api/admin/campaigns/${editing.id}`, { method: 'PUT', json: body });
            else await api('/api/admin/campaigns', { method: 'POST', json: body });
            setNotice(`"${editing.name}" kaydedildi.`);
            setEditing(null);
            load();
            loadRefs();
        } catch (e) {
            setEditError(e instanceof Error ? e.message : 'Kaydedilemedi');
        } finally {
            setSaving(false);
        }
    };

    const setStatus = async (c: Campaign, status: string) => {
        try {
            await api(`/api/admin/campaigns/${c.id}`, { method: 'PATCH', json: { status } });
            setNotice(`"${c.name}" durumu: ${STATUS_LABEL[status]}`);
            load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Durum değiştirilemedi');
        }
    };

    const saveTemplate = async () => {
        if (!templateEditor) return;
        try {
            const data = await api<{ template: { id: string } }>('/api/admin/evaluation-templates', { method: 'POST', json: templateEditor });
            setNotice('Değerlendirme şablonu kaydedildi.');
            const created = data.template.id;
            setTemplateEditor(null);
            await loadRefs();
            if (editing) setEditing({ ...editing, evaluationTemplateId: created });
        } catch (e) {
            setEditError(e instanceof Error ? e.message : 'Şablon kaydedilemedi');
        }
    };

    const stages = editing?.workflowStages || [];
    const updateStage = (i: number, patch: Partial<Stage>) => editing && setEditing({ ...editing, workflowStages: stages.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
    const moveStage = (i: number, dir: -1 | 1) => {
        if (!editing) return;
        const next = [...stages];
        const t = i + dir;
        if (t < 0 || t >= next.length) return;
        [next[i], next[t]] = [next[t], next[i]];
        setEditing({ ...editing, workflowStages: next.map((s, k) => ({ ...s, order: k + 1 })) });
    };

    const availableForms = forms.filter((f) => f.campaigns.length === 0 || f.campaigns.some((c) => c.id === editing?.id));
    const selectedTemplate = templates.find((t) => t.id === editing?.evaluationTemplateId) || null;

    return (
        <div>
            <PageHeader
                title="Başvuru Kampanyaları"
                icon={Megaphone}
                description="Her program çağrısı, TEKMER yer edinme dönemi veya diğer başvuru süreci ayrı bir kampanyadır. Form, iş akışı, değerlendirme, belgeler ve e-postalar kampanyaya özeldir; bir kampanyadaki değişiklik diğerlerini etkilemez."
                actions={<Button data-intent="create" variant="primary" icon={Plus} onClick={() => openEdit()}>Yeni Kampanya</Button>}
            />
            {notice && <div className="mb-4"><Alert tone="success" onClose={() => setNotice(null)}>{notice}</Alert></div>}
            {error && <div className="mb-4"><Alert tone="danger" onClose={() => setError(null)}>{error}</Alert></div>}

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select aria-label="Başvuru türü" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={APPLICATION_TYPES} placeholder="Tüm başvuru türleri" className="w-60" />
                <Toggle id="arch" checked={showArchived} onChange={setShowArchived} label="Arşivi göster" />
            </div>

            {loading ? (
                <Skeleton rows={4} />
            ) : filtered.length === 0 ? (
                <EmptyState icon={Megaphone} title="Henüz kampanya yok." description="Program başvuruları ve TEKMER yer edinme başvuruları için ayrı kampanyalar oluşturun." action={<Button variant="primary" icon={Plus} onClick={() => openEdit()}>Kampanya Oluştur</Button>} />
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {filtered.map((c) => (
                        <Card key={c.id}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge tone={c.applicationType === 'TEKMER' ? 'warning' : 'primary'}>{applicationTypeLabel(c.applicationType)}</Badge>
                                        <Badge tone={statusTone(c.status)}>{STATUS_LABEL[c.status] || c.status}</Badge>
                                    </div>
                                    <h2 className="mt-2 truncate text-base font-semibold text-white">{c.name}</h2>
                                    <p className="text-xs text-gray-500">
                                        {c.applicationType === 'TEKMER' ? 'Hedef: TEKMER yer edinme (programa bağlı değil)' : c.program ? `Program: ${c.program.name}` : 'Program bağlı değil'}
                                        {(c.opensAt || c.closesAt) && ` · ${formatDate(c.opensAt)} – ${formatDate(c.closesAt)}`}
                                    </p>
                                </div>
                                <Button size="sm" icon={Pencil} onClick={() => openEdit(c)}>Düzenle</Button>
                            </div>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                <div><dt className="text-gray-500">Başvuru</dt><dd className="text-lg font-semibold text-white">{c._count.applications}</dd></div>
                                <div><dt className="text-gray-500">Yeni</dt><dd className="text-lg font-semibold text-white">{c.statusCounts?.NEW || 0}</dd></div>
                                <div><dt className="text-gray-500">Kabul</dt><dd className="text-lg font-semibold text-emerald-300">{c.statusCounts?.ACCEPTED || 0}</dd></div>
                                <div><dt className="text-gray-500">Aşama</dt><dd className="text-lg font-semibold text-white">{c.workflowStages.length}</dd></div>
                            </dl>
                            <div className="mt-4 space-y-1 border-t border-white/10 pt-3 text-xs text-gray-400">
                                <div className="flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Form: {c.form ? <Link href={`/admin/form-builder/${c.form.id}`} className="text-gray-200 hover:text-primary">{c.form.title}</Link> : <span className="text-amber-300">Form bağlı değil</span>}{c.form && !c.form.isPublished && <Badge tone="warning">Yayında değil</Badge>}</div>
                                <div className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5" />Değerlendirme: {c.evaluationTemplate ? c.evaluationTemplate.name : <span className="text-gray-500">Şablon seçilmedi</span>}</div>
                                <div className="flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5" />Belge gereksinimi: {c.requiredDocuments.length}</div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Link href={`/admin/basvurular?campaignId=${c.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10"><Inbox className="h-3.5 w-3.5" />Başvurular</Link>
                                {c.publicPath && <a href={c.publicPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10"><ExternalLink className="h-3.5 w-3.5" />Public sayfa</a>}
                                {c.status !== 'OPEN' && c.status !== 'ARCHIVED' && <Button size="sm" variant="success" onClick={() => setStatus(c, 'OPEN')}>Başvuruya Aç</Button>}
                                {c.status === 'OPEN' && <Button size="sm" onClick={() => setStatus(c, 'CLOSED')}>Başvuruları Kapat</Button>}
                                {c.status !== 'ARCHIVED' ? <Button size="sm" variant="ghost" onClick={() => setStatus(c, 'ARCHIVED')}>Arşivle</Button> : <Button size="sm" onClick={() => setStatus(c, 'CLOSED')}>Arşivden Çıkar</Button>}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Drawer
                open={Boolean(editing)}
                onClose={() => setEditing(null)}
                title={editing?.id ? 'Kampanyayı düzenle' : 'Yeni kampanya'}
                subtitle={editing?.name}
                footer={<><Button onClick={() => setEditing(null)}>Vazgeç</Button><Button variant="primary" loading={saving} onClick={save}>Kaydet</Button></>}
            >
                {editing && (
                    <div>
                        {editError && <div className="mb-4"><Alert tone="danger" onClose={() => setEditError(null)}>{editError}</Alert></div>}
                        <Tabs<EditTab>
                            value={editTab}
                            onChange={setEditTab}
                            tabs={[
                                { value: 'general', label: 'Genel', icon: Settings2 },
                                { value: 'workflow', label: 'İş Akışı', icon: GitBranch, count: stages.length },
                                { value: 'evaluation', label: 'Değerlendirme', icon: Scale },
                                { value: 'documents', label: 'Belgeler', icon: FileCheck2, count: editing.requiredDocuments.length },
                                { value: 'email', label: 'E-posta', icon: Mail },
                            ]}
                        />

                        {editTab === 'general' && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Kampanya adı" htmlFor="c-name" required className="sm:col-span-2">
                                    <TextInput id="c-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} />
                                </Field>
                                <Field label="Adres (slug)" htmlFor="c-slug" required><TextInput id="c-slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} /></Field>
                                <Field label="Başvuru türü" htmlFor="c-type" required hint="Program ve TEKMER yer edinme başvuruları ayrı süreçlerdir.">
                                    <Select id="c-type" value={editing.applicationType} onChange={(e) => setEditing({ ...editing, applicationType: e.target.value, programId: e.target.value === 'TEKMER' ? null : editing.programId, workflowStages: editing.id ? editing.workflowStages : [] })} options={APPLICATION_TYPES} />
                                </Field>
                                {editing.applicationType !== 'TEKMER' ? (
                                    <Field label="Program" htmlFor="c-program" required={editing.applicationType === 'PROGRAM'}>
                                        <Select id="c-program" value={editing.programId || ''} onChange={(e) => setEditing({ ...editing, programId: e.target.value || null })} placeholder="Program seçin" options={programs.map((p) => ({ value: p.id, label: p.name }))} />
                                    </Field>
                                ) : (
                                    <div className="sm:col-span-1"><Alert tone="info">TEKMER yer edinme kampanyası bir programa bağlanmaz. Kabul sonrası alan tahsis süreci ayrıca başlatılır.</Alert></div>
                                )}
                                <Field label="Form" htmlFor="c-form" hint="Her kampanya kendi formunu kullanır. Başka kampanyada kullanılan formlar listelenmez.">
                                    <Select id="c-form" value={editing.formId || ''} onChange={(e) => setEditing({ ...editing, formId: e.target.value || null })} placeholder="Form seçin" options={availableForms.map((f) => ({ value: f.id, label: `${f.title}${f.isPublished ? '' : ' (yayında değil)'}` }))} />
                                </Field>
                                <Field label="Başlangıç" htmlFor="c-open"><TextInput id="c-open" type="date" value={editing.opensAt || ''} onChange={(e) => setEditing({ ...editing, opensAt: e.target.value || null })} /></Field>
                                <Field label="Bitiş" htmlFor="c-close"><TextInput id="c-close" type="date" value={editing.closesAt || ''} onChange={(e) => setEditing({ ...editing, closesAt: e.target.value || null })} /></Field>
                                <Field label="Public sayfa" htmlFor="c-path"><TextInput id="c-path" value={editing.publicPath || ''} onChange={(e) => setEditing({ ...editing, publicPath: e.target.value })} placeholder="/antspark-basvuru" /></Field>
                                <Field label="Sorumlu" htmlFor="c-owner"><Select id="c-owner" value={editing.ownerId || ''} onChange={(e) => setEditing({ ...editing, ownerId: e.target.value || null })} placeholder="Atanmamış" options={users.map((u) => ({ value: u.id, label: u.name }))} /></Field>
                                <Field label="Açıklama" htmlFor="c-desc" className="sm:col-span-2"><TextArea id="c-desc" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
                                <div className="sm:col-span-2">
                                    <p className="mb-2 text-xs font-medium text-gray-400">Kabul edilen başvuran türleri</p>
                                    <div className="flex flex-wrap gap-4">
                                        {APPLICANT_TYPES.map((t) => (
                                            <label key={t.value} className="flex items-center gap-2 text-sm text-gray-300">
                                                <input type="checkbox" checked={editing.allowedApplicantTypes.includes(t.value)} onChange={(e) => setEditing({ ...editing, allowedApplicantTypes: e.target.checked ? [...editing.allowedApplicantTypes, t.value] : editing.allowedApplicantTypes.filter((x) => x !== t.value) })} />
                                                {t.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {editTab === 'workflow' && (
                            <div className="space-y-3">
                                <Alert tone="info">Bu iş akışı yalnız bu kampanyanın başvurularına uygulanır. Başvuru bulunan aşamalar silinemez.{!editing.id && stages.length === 0 && ' Boş bırakırsanız başvuru türüne uygun varsayılan aşamalar kullanılır.'}</Alert>
                                {stages.map((s, i) => (
                                    <div key={`${s.key}-${i}`} className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 p-3 sm:grid-cols-[1fr_1fr_160px_auto]">
                                        <Select aria-label="Aşama" value={s.key} onChange={(e) => updateStage(i, { key: e.target.value, label: APPLICATION_STATUSES.find((x) => x.key === e.target.value)?.label || s.label })} options={APPLICATION_STATUSES.map((x) => ({ value: x.key, label: `${x.key} · ${x.label}` }))} />
                                        <TextInput aria-label="Aşama adı" value={s.label} onChange={(e) => updateStage(i, { label: e.target.value })} />
                                        <Select aria-label="Sonuç" value={s.outcome || ''} onChange={(e) => updateStage(i, { outcome: (e.target.value || null) as Stage['outcome'], isTerminal: Boolean(e.target.value) })} placeholder="Ara aşama" options={[{ value: 'ACCEPTED', label: 'Kabul (sonuç)' }, { value: 'REJECTED', label: 'Ret (sonuç)' }, { value: 'WAITLIST', label: 'Bekleme (sonuç)' }]} />
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => moveStage(i, -1)} className="rounded p-1.5 text-gray-400 hover:bg-white/5" aria-label="Yukarı"><ArrowUp className="h-4 w-4" /></button>
                                            <button type="button" onClick={() => moveStage(i, 1)} className="rounded p-1.5 text-gray-400 hover:bg-white/5" aria-label="Aşağı"><ArrowDown className="h-4 w-4" /></button>
                                            <button type="button" onClick={() => setEditing({ ...editing, workflowStages: stages.filter((_, j) => j !== i).map((x, k) => ({ ...x, order: k + 1 })) })} className="rounded p-1.5 text-rose-400 hover:bg-rose-500/10" aria-label="Sil"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                <Button size="sm" icon={Plus} onClick={() => {
                                    const unused = APPLICATION_STATUSES.find((x) => !stages.some((s) => s.key === x.key));
                                    if (unused) setEditing({ ...editing, workflowStages: [...stages, { key: unused.key, label: unused.label, order: stages.length + 1 }] });
                                }}>Aşama Ekle</Button>
                            </div>
                        )}

                        {editTab === 'evaluation' && (
                            <div className="space-y-4">
                                <Field label="Değerlendirme şablonu" htmlFor="c-eval" hint="Kriterler bu kampanyaya özel olabilir; aynı şablonu başka kampanyalar da seçebilir.">
                                    <Select id="c-eval" value={editing.evaluationTemplateId || ''} onChange={(e) => setEditing({ ...editing, evaluationTemplateId: e.target.value || null })} placeholder="Şablon seçilmedi" options={templates.map((t) => ({ value: t.id, label: `${t.name} (${t.criteria.length} kriter)` }))} />
                                </Field>
                                {selectedTemplate && (
                                    <Card>
                                        <ul className="space-y-1 text-sm">
                                            {selectedTemplate.criteria.map((c) => <li key={c.id} className="flex justify-between text-gray-300"><span>{c.name}</span><span className="text-xs text-gray-500">0–{c.maxScore} · ağırlık {c.weight}</span></li>)}
                                        </ul>
                                    </Card>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" icon={Plus} onClick={() => setTemplateEditor({ name: `${editing.name} Değerlendirme`, description: '', criteria: [{ name: '', maxScore: 10, weight: 1 }] })}>Yeni Şablon</Button>
                                    {selectedTemplate && <Button size="sm" icon={Pencil} onClick={() => setTemplateEditor({ id: selectedTemplate.id, name: selectedTemplate.name, description: '', criteria: selectedTemplate.criteria.map((c) => ({ id: c.id, name: c.name, maxScore: c.maxScore, weight: c.weight })) })}>Şablonu Düzenle</Button>}
                                </div>
                                {templateEditor && (
                                    <Card className="space-y-3">
                                        <Field label="Şablon adı" htmlFor="t-name" required><TextInput id="t-name" value={templateEditor.name} onChange={(e) => setTemplateEditor({ ...templateEditor, name: e.target.value })} /></Field>
                                        {templateEditor.criteria.map((c, i) => (
                                            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_90px_90px_auto]">
                                                <TextInput aria-label="Kriter" placeholder="Kriter adı" value={c.name} onChange={(e) => setTemplateEditor({ ...templateEditor, criteria: templateEditor.criteria.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                                                <TextInput aria-label="En yüksek puan" type="number" min={1} max={100} value={c.maxScore} onChange={(e) => setTemplateEditor({ ...templateEditor, criteria: templateEditor.criteria.map((x, j) => (j === i ? { ...x, maxScore: Number(e.target.value) } : x)) })} />
                                                <TextInput aria-label="Ağırlık" type="number" min={0.1} step={0.1} value={c.weight} onChange={(e) => setTemplateEditor({ ...templateEditor, criteria: templateEditor.criteria.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)) })} />
                                                <button type="button" onClick={() => setTemplateEditor({ ...templateEditor, criteria: templateEditor.criteria.filter((_, j) => j !== i) })} className="rounded p-2 text-rose-400 hover:bg-rose-500/10" aria-label="Kriteri sil"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                        <p className="text-[11px] text-gray-500">Sütunlar: kriter · en yüksek puan · ağırlık. Toplam puan 100 üzerinden ağırlıklı hesaplanır.</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" icon={Plus} onClick={() => setTemplateEditor({ ...templateEditor, criteria: [...templateEditor.criteria, { name: '', maxScore: 10, weight: 1 }] })}>Kriter Ekle</Button>
                                            <Button size="sm" variant="primary" onClick={saveTemplate}>Şablonu Kaydet</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setTemplateEditor(null)}>Vazgeç</Button>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        )}

                        {editTab === 'documents' && (
                            <div className="space-y-3">
                                <Alert tone="info">Bu kampanyada başvuru sahibinden istenecek belgeler. Belgeler başvuru detayında takip edilir.</Alert>
                                {editing.requiredDocuments.map((d, i) => {
                                    const update = (patch: Partial<Doc>) => setEditing({ ...editing, requiredDocuments: editing.requiredDocuments.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                                    return (
                                        <Card key={i} className="space-y-2">
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                <Field label="Belge adı" htmlFor={`d-${i}`}><TextInput id={`d-${i}`} value={d.label} onChange={(e) => update({ label: e.target.value })} /></Field>
                                                <Field label="Gerekli olduğu aşama" htmlFor={`ds-${i}`}><Select id={`ds-${i}`} value={d.requiredAtStage || ''} onChange={(e) => update({ requiredAtStage: e.target.value || null })} placeholder="Başvuruda" options={stages.map((s) => ({ value: s.key, label: s.label }))} /></Field>
                                                <Field label="İzin verilen türler" htmlFor={`dt-${i}`} hint="Örn: .pdf, .docx"><TextInput id={`dt-${i}`} value={(d.allowedTypes || []).join(', ')} onChange={(e) => update({ allowedTypes: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></Field>
                                                <Field label="Maks. boyut (MB)" htmlFor={`dm-${i}`}><TextInput id={`dm-${i}`} type="number" min={1} value={d.maxSizeMb ?? ''} onChange={(e) => update({ maxSizeMb: e.target.value ? Number(e.target.value) : undefined })} /></Field>
                                                <Field label="Açıklama" htmlFor={`dd-${i}`} className="sm:col-span-2"><TextInput id={`dd-${i}`} value={d.description || ''} onChange={(e) => update({ description: e.target.value })} /></Field>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Toggle id={`dr-${i}`} checked={d.required} onChange={(v) => update({ required: v })} label="Zorunlu" />
                                                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setEditing({ ...editing, requiredDocuments: editing.requiredDocuments.filter((_, j) => j !== i) })}>Kaldır</Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                                <Button size="sm" icon={Plus} onClick={() => setEditing({ ...editing, requiredDocuments: [...editing.requiredDocuments, { key: `doc_${editing.requiredDocuments.length + 1}`, label: '', required: true }] })}>Belge Ekle</Button>
                            </div>
                        )}

                        {editTab === 'email' && (
                            <div className="space-y-4">
                                <Field label="Başvuru alındı e-postası" htmlFor="e-conf" hint="Seçilmezse standart başvuru alındı e-postası gönderilir. E-posta sağlayıcısı yoksa outbox'ta bekler.">
                                    <Select id="e-conf" value={editing.confirmationTemplateKey || ''} onChange={(e) => setEditing({ ...editing, confirmationTemplateKey: e.target.value || null })} placeholder="Standart e-posta" options={emailTemplates.map((t) => ({ value: t.templateKey, label: t.name }))} />
                                </Field>
                                <Field label="İç bildirim alıcıları" htmlFor="e-rec" hint="Virgülle ayırın.">
                                    <TextInput id="e-rec" value={editing.notificationRecipients.join(', ')} onChange={(e) => setEditing({ ...editing, notificationRecipients: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
                                </Field>
                                <div>
                                    <p className="mb-2 text-xs font-medium text-gray-400">Aşama değişikliği e-postaları (bu kampanyaya özel)</p>
                                    <div className="space-y-2">
                                        {stages.map((s) => (
                                            <div key={s.key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[200px_1fr]">
                                                <span className="text-sm text-gray-300">{s.label}</span>
                                                <Select aria-label={`${s.label} e-postası`} value={editing.statusTemplateMap[s.key] || ''} onChange={(e) => {
                                                    const map = { ...editing.statusTemplateMap };
                                                    if (e.target.value) map[s.key] = e.target.value;
                                                    else delete map[s.key];
                                                    setEditing({ ...editing, statusTemplateMap: map });
                                                }} placeholder="E-posta gönderilmez" options={emailTemplates.map((t) => ({ value: t.templateKey, label: t.name }))} />
                                            </div>
                                        ))}
                                        {stages.length === 0 && <p className="text-xs text-gray-500">Önce iş akışı aşamalarını kaydedin.</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
}
