'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ClipboardList, Save, Send, Undo2, ExternalLink, History, Inbox, Settings, Eye, ListChecks, MapPin, Archive, RotateCcw, EyeOff, Copy } from 'lucide-react';
import { PageHeader, Button, Card, Badge, Alert, Skeleton, Tabs, Field, TextInput, TextArea, Select, Toggle, Modal, EmptyState, api, formatDateTime } from '@/components/admin/ui';
import { FormBuilder } from '@/components/admin/form-center/FormBuilder';
import { FormPreview } from '@/components/admin/form-center/FormPreview';
import { SubmissionsPanel } from '@/components/admin/form-center/SubmissionsPanel';
import { PlacementsPanel } from '@/components/admin/form-center/PlacementsPanel';
import type { KvkkTextOption } from '@/components/admin/form-center/QuestionEditor';
import { FORM_TYPES, FormFieldDefinition, FormSectionDefinition, applicationTypeLabel, formTypeLabel, validateFormDefinition } from '@/lib/forms/schema';
import { FORM_THEME_OPTIONS } from '@/components/forms/form-themes';

type Tab = 'questions' | 'settings' | 'preview' | 'versions' | 'submissions' | 'usage';

interface Detail {
    form: {
        id: string;
        title: string;
        slug: string;
        description: string | null;
        formType: string;
        isPublished: boolean;
        isArchived: boolean;
        isTemplate: boolean;
        allowMultiple: boolean;
        requiresAuth: boolean;
        successMessage: string | null;
        redirectUrl: string | null;
        submitLabel: string | null;
        theme: string | null;
        publicPath: string | null;
        notifyEmails: string[];
        confirmationTemplateKey: string | null;
        owner: { id: string; name: string; email: string } | null;
        sourceFormId: string | null;
        updatedAt: string;
    };
    editing: { versionId: string | null; versionNumber: number | null; status: string | null; isDraft: boolean; sections: FormSectionDefinition[]; fields: FormFieldDefinition[] };
    versions: { id: string; versionNumber: number; status: string; changeNote: string | null; publishedAt: string | null; publisher: { id: string; name: string } | null; fieldCount: number; submissionCount: number; applicationCount: number; createdAt: string }[];
    campaigns: { id: string; name: string; slug: string; applicationType: string; status: string; publicPath: string | null; program: { id: string; name: string } | null }[];
    whereUsed: { kind: string; label: string; href: string | null; publicPath: string | null }[];
}

interface FullKvkkText extends KvkkTextOption {
    content: string;
}

export default function FormEditorPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params.id;

    const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'questions');
    const [detail, setDetail] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [problems, setProblems] = useState<string[]>([]);

    const [sections, setSections] = useState<FormSectionDefinition[]>([]);
    const [fields, setFields] = useState<FormFieldDefinition[]>([]);
    const [changeNote, setChangeNote] = useState('');
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [publishOpen, setPublishOpen] = useState(false);
    const [kvkkTexts, setKvkkTexts] = useState<FullKvkkText[]>([]);
    const [templates, setTemplates] = useState<{ templateKey: string; name: string }[]>([]);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const [settings, setSettings] = useState<Detail['form'] | null>(null);
    const [previewDark, setPreviewDark] = useState(true);
    const [versionView, setVersionView] = useState<{ versionNumber: number; sections: FormSectionDefinition[]; fields: FormFieldDefinition[] } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api<Detail & { success: boolean }>(`/api/admin/forms/${id}`);
            setDetail(data);
            setSections(data.editing.sections);
            setFields(data.editing.fields);
            setSettings(data.form);
            setDirty(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Form yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
        api<{ items: FullKvkkText[] }>('/api/admin/kvkk/versions').then((d) => setKvkkTexts(d.items || [])).catch(() => setKvkkTexts([]));
        api<{ templates?: { templateKey: string; name: string }[]; items?: { templateKey: string; name: string }[] }>('/api/admin/email-templates')
            .then((d) => setTemplates(d.templates || d.items || []))
            .catch(() => setTemplates([]));
        api<{ users: { id: string; name: string }[] }>('/api/admin/users').then((d) => setUsers(d.users || [])).catch(() => setUsers([]));
    }, [load]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (dirty) e.preventDefault();
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    const publishedVersion = detail?.versions.find((v) => v.status === 'PUBLISHED') || null;
    // Keys of questions that exist in a version which already received or may receive submissions
    const publishedKeys = useMemo(() => new Set(detail?.versions.some((v) => v.status !== 'DRAFT') ? detail?.editing.fields.map((f) => f.fieldKey) || [] : []), [detail]);

    const liveProblems = useMemo(() => validateFormDefinition(fields), [fields]);

    const onBuilderChange = (s: FormSectionDefinition[], f: FormFieldDefinition[]) => {
        setSections(s);
        setFields(f);
        setDirty(true);
    };

    const run = async (action: string, body: Record<string, unknown> = {}) => {
        setSaving(action);
        setError(null);
        setProblems([]);
        try {
            const data = await api<{ message?: string }>(`/api/admin/forms/${id}`, { method: 'POST', json: { action, ...body } });
            setNotice(data.message || 'İşlem tamamlandı.');
            setChangeNote('');
            await load();
            return true;
        } catch (e) {
            const err = e as Error & { data?: { problems?: string[] } };
            setError(err.message);
            setProblems(err.data?.problems || []);
            return false;
        } finally {
            setSaving(null);
        }
    };

    const saveSettings = async () => {
        if (!settings) return;
        setSaving('settings');
        setError(null);
        try {
            await api(`/api/admin/forms/${id}`, {
                method: 'PATCH',
                json: {
                    title: settings.title,
                    description: settings.description,
                    formType: settings.formType,
                    theme: settings.theme,
                    publicPath: settings.publicPath,
                    successMessage: settings.successMessage,
                    redirectUrl: settings.redirectUrl,
                    submitLabel: settings.submitLabel,
                    notifyEmails: settings.notifyEmails,
                    confirmationTemplateKey: settings.confirmationTemplateKey,
                    ownerId: settings.owner?.id || null,
                    allowMultiple: settings.allowMultiple,
                    requiresAuth: settings.requiresAuth,
                    isTemplate: settings.isTemplate,
                },
            });
            setNotice('Form ayarları kaydedildi.');
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ayarlar kaydedilemedi');
        } finally {
            setSaving(null);
        }
    };

    const viewVersion = async (versionId: string) => {
        try {
            const data = await api<{ version: { versionNumber: number }; sections: FormSectionDefinition[]; fields: FormFieldDefinition[] }>(`/api/admin/forms/versions/${versionId}`);
            setVersionView({ versionNumber: data.version.versionNumber, sections: data.sections, fields: data.fields });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Versiyon yüklenemedi');
        }
    };

    if (loading && !detail) return <Skeleton rows={8} />;
    if (!detail || !settings) {
        return <EmptyState icon={ClipboardList} title="Form bulunamadı" description={error || undefined} action={<Link href="/admin/form-builder" className="text-primary">Form Merkezine dön</Link>} />;
    }

    const f = detail.form;
    const publicUrl = f.publicPath;

    return (
        <div>
            <PageHeader
                breadcrumb={[{ label: 'Form Merkezi', href: '/admin/form-builder' }, { label: f.title }]}
                title={f.title}
                icon={ClipboardList}
                description={
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-gray-500">{f.slug}</span>
                        <span>·</span>
                        <span>{formTypeLabel(f.formType)}</span>
                        {f.isArchived ? <Badge>Arşiv</Badge> : f.isPublished && publishedVersion ? <Badge tone="success">Yayında · v{publishedVersion.versionNumber}</Badge> : <Badge tone="warning">Yayında değil</Badge>}
                        {detail.editing.isDraft && <Badge tone="primary">Taslak v{detail.editing.versionNumber}</Badge>}
                        {dirty && <Badge tone="warning">Kaydedilmemiş değişiklik</Badge>}
                    </span>
                }
                actions={
                    <>
                        {publicUrl && f.isPublished && (
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10">
                                <ExternalLink className="h-4 w-4" /> Public&apos;te Gör
                            </a>
                        )}
                        <Button icon={Save} loading={saving === 'saveDraft'} disabled={!dirty || f.isArchived} onClick={() => run('saveDraft', { sections, fields, changeNote })}>
                            Taslağı Kaydet
                        </Button>
                        <Button variant="primary" icon={Send} disabled={f.isArchived || (!dirty && !detail.editing.isDraft)} onClick={() => setPublishOpen(true)}>
                            Yayınla
                        </Button>
                    </>
                }
            />

            {notice && <div className="mb-4"><Alert tone="success" onClose={() => setNotice(null)}>{notice}</Alert></div>}
            {error && (
                <div className="mb-4">
                    <Alert tone="danger" title={error} onClose={() => { setError(null); setProblems([]); }}>
                        {problems.length > 0 && <ul className="list-disc pl-4">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
                    </Alert>
                </div>
            )}
            {!detail.editing.isDraft && publishedVersion && tab === 'questions' && (
                <div className="mb-4">
                    <Alert tone="info">
                        Yayındaki v{publishedVersion.versionNumber} değiştirilemez. Yaptığınız değişiklikler kaydedildiğinde yeni bir taslak versiyon oluşur; eski gönderimler kendi versiyonlarına bağlı kalır.
                    </Alert>
                </div>
            )}

            <Tabs<Tab>
                value={tab}
                onChange={(t) => { setTab(t); router.replace(`/admin/form-builder/${id}?tab=${t}`); }}
                tabs={[
                    { value: 'questions', label: 'Sorular', icon: ListChecks, count: fields.length },
                    { value: 'settings', label: 'Ayarlar', icon: Settings },
                    { value: 'preview', label: 'Önizleme', icon: Eye },
                    { value: 'versions', label: 'Versiyonlar', icon: History, count: detail.versions.length },
                    { value: 'submissions', label: 'Gönderimler', icon: Inbox, count: detail.versions.reduce((s, v) => s + v.submissionCount, 0) },
                    { value: 'usage', label: 'Kullanıldığı Yerler', icon: MapPin, count: detail.whereUsed.length },
                ]}
            />

            {tab === 'questions' && (
                <>
                    {liveProblems.length > 0 && (
                        <div className="mb-4">
                            <Alert tone="warning" title="Yayınlamadan önce düzeltilmesi gerekenler">
                                <ul className="list-disc pl-4">{liveProblems.map((p) => <li key={p}>{p}</li>)}</ul>
                            </Alert>
                        </div>
                    )}
                    <FormBuilder sections={sections} fields={fields} onChange={onBuilderChange} kvkkTexts={kvkkTexts} publishedKeys={publishedKeys} />
                </>
            )}

            {tab === 'settings' && (
                <Card>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Form adı" htmlFor="s-title" required><TextInput id="s-title" value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} /></Field>
                        <Field label="Form türü" htmlFor="s-type"><Select id="s-type" value={settings.formType} onChange={(e) => setSettings({ ...settings, formType: e.target.value })} options={FORM_TYPES} /></Field>
                        <Field label="Açıklama" htmlFor="s-desc" className="md:col-span-2"><TextArea id="s-desc" value={settings.description || ''} onChange={(e) => setSettings({ ...settings, description: e.target.value })} /></Field>
                        <Field label="Public sayfa" htmlFor="s-path" hint="Formun gösterildiği sayfa (örn. /iletisim). Kullanıldığı yerler listesinde görünür."><TextInput id="s-path" value={settings.publicPath || ''} onChange={(e) => setSettings({ ...settings, publicPath: e.target.value })} /></Field>
                        <Field label="Görünüm teması" htmlFor="s-theme"><Select id="s-theme" value={settings.theme || 'site'} onChange={(e) => setSettings({ ...settings, theme: e.target.value })} options={FORM_THEME_OPTIONS} /></Field>
                        <Field label="Gönder butonu metni" htmlFor="s-submit"><TextInput id="s-submit" value={settings.submitLabel || ''} onChange={(e) => setSettings({ ...settings, submitLabel: e.target.value })} /></Field>
                        <Field label="Sorumlu" htmlFor="s-owner">
                            <Select id="s-owner" value={settings.owner?.id || ''} onChange={(e) => setSettings({ ...settings, owner: e.target.value ? { id: e.target.value, name: users.find((u) => u.id === e.target.value)?.name || '', email: '' } : null })} placeholder="Atanmamış" options={users.map((u) => ({ value: u.id, label: u.name }))} />
                        </Field>
                        <Field label="Başarı mesajı" htmlFor="s-success" className="md:col-span-2"><TextArea id="s-success" value={settings.successMessage || ''} onChange={(e) => setSettings({ ...settings, successMessage: e.target.value })} /></Field>
                        <Field label="Bildirim alıcıları" htmlFor="s-notify" hint="Virgülle ayırın. Her gönderimde bu adreslere iç bildirim e-postası kuyruğa alınır." className="md:col-span-2">
                            <TextInput id="s-notify" value={settings.notifyEmails.join(', ')} onChange={(e) => setSettings({ ...settings, notifyEmails: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
                        </Field>
                        <Field label="Gönderene onay e-postası şablonu" htmlFor="s-tpl" hint="Seçilmezse yalnız başvuru formlarında standart onay e-postası kullanılır.">
                            <Select id="s-tpl" value={settings.confirmationTemplateKey || ''} onChange={(e) => setSettings({ ...settings, confirmationTemplateKey: e.target.value || null })} placeholder="Şablon yok" options={templates.map((t) => ({ value: t.templateKey, label: t.name }))} />
                        </Field>
                        <div className="flex flex-col gap-3 md:col-span-2">
                            <Toggle id="s-template" checked={settings.isTemplate} onChange={(v) => setSettings({ ...settings, isTemplate: v })} label="Bu formu yeni formlar için şablon olarak kullan" />
                            <Toggle id="s-auth" checked={settings.requiresAuth} onChange={(v) => setSettings({ ...settings, requiresAuth: v })} label="Yalnız iç kullanım (public sayfada gösterilmez)" />
                        </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
                        <div className="flex flex-wrap gap-2">
                            {f.isPublished ? (
                                <Button icon={EyeOff} loading={saving === 'unpublish'} onClick={() => run('unpublish')}>Yayından Kaldır</Button>
                            ) : publishedVersion ? (
                                <Button icon={Eye} loading={saving === 'republish'} onClick={() => run('republish')}>Yeniden Yayına Al</Button>
                            ) : null}
                            <Button icon={f.isArchived ? RotateCcw : Archive} loading={saving === 'archive' || saving === 'restore'} onClick={() => run(f.isArchived ? 'restore' : 'archive')}>{f.isArchived ? 'Geri Yükle' : 'Arşivle'}</Button>
                            <Link href={`/admin/form-builder?copy=${f.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10"><Copy className="h-4 w-4" />Kopyala</Link>
                        </div>
                        <Button variant="primary" icon={Save} loading={saving === 'settings'} onClick={saveSettings}>Ayarları Kaydet</Button>
                    </div>
                </Card>
            )}

            {tab === 'preview' && (
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs text-gray-400">Kaydedilmemiş değişiklikler dahil güncel düzenleme gösterilir.</p>
                        <Toggle id="p-dark" checked={previewDark} onChange={setPreviewDark} label="Koyu arka plan" />
                    </div>
                    <FormPreview sections={sections} fields={fields} theme={settings.theme} kvkkTexts={kvkkTexts} dark={previewDark} />
                </div>
            )}

            {tab === 'versions' && (
                <Card padded={false} className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Versiyon</th>
                                <th className="px-4 py-3 font-medium">Durum</th>
                                <th className="px-4 py-3 font-medium">Not</th>
                                <th className="px-4 py-3 font-medium text-right">Soru</th>
                                <th className="px-4 py-3 font-medium text-right">Gönderim</th>
                                <th className="px-4 py-3 font-medium">Yayın</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {detail.versions.map((v) => (
                                <tr key={v.id}>
                                    <td className="px-4 py-3 font-mono text-white">v{v.versionNumber}</td>
                                    <td className="px-4 py-3">{v.status === 'PUBLISHED' ? <Badge tone="success">Yayında</Badge> : v.status === 'DRAFT' ? <Badge tone="primary">Taslak</Badge> : <Badge>Önceki versiyon</Badge>}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{v.changeNote || '—'}</td>
                                    <td className="px-4 py-3 text-right text-gray-300">{v.fieldCount}</td>
                                    <td className="px-4 py-3 text-right text-gray-300">{v.submissionCount}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{v.publishedAt ? `${formatDateTime(v.publishedAt)}${v.publisher ? ` · ${v.publisher.name}` : ''}` : '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="sm" icon={Eye} onClick={() => viewVersion(v.id)}>Görüntüle</Button>
                                            {v.status === 'DRAFT' && <Button size="sm" variant="danger" icon={Undo2} loading={saving === 'discardDraft'} onClick={() => run('discardDraft')}>Taslağı Sil</Button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {tab === 'submissions' && <SubmissionsPanel formId={id} campaigns={detail.campaigns.map((c) => ({ id: c.id, name: c.name }))} />}

            {tab === 'usage' && (
                <div className="space-y-5">
                <PlacementsPanel formId={id} formSlug={detail.form.slug} isPublished={detail.form.isPublished} />
                <Card>
                    {detail.whereUsed.length === 0 ? (
                        <EmptyState icon={MapPin} title="Bu form henüz bir yerde kullanılmıyor." description="Bir başvuru kampanyasına bağlayabilir veya ayarlardan public sayfasını belirtebilirsiniz." action={<Link href="/admin/basvuru-kampanyalari" className="text-sm text-primary">Kampanyalara git</Link>} />
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {detail.whereUsed.map((u) => (
                                <li key={`${u.kind}-${u.label}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                                    <div>
                                        <Badge tone="info">{applicationTypeLabel(u.kind) !== u.kind ? applicationTypeLabel(u.kind) : u.kind}</Badge>
                                        <span className="ml-2 text-sm text-gray-200">{u.label}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {u.href && <Link href={u.href} className="text-xs text-primary hover:underline">Kaydı aç</Link>}
                                        {u.publicPath && <a href={u.publicPath} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-white">{u.publicPath} ↗</a>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
                </div>
            )}

            <Modal
                open={publishOpen}
                onClose={() => setPublishOpen(false)}
                title="Yeni versiyonu yayınla"
                description="Yayınlanan versiyon public formda hemen görünür. Önceki versiyon ve ona bağlı gönderimler değişmeden saklanır."
                footer={
                    <>
                        <Button onClick={() => setPublishOpen(false)}>Vazgeç</Button>
                        <Button
                            variant="primary"
                            icon={Send}
                            loading={saving === 'publish'}
                            disabled={liveProblems.length > 0}
                            onClick={async () => {
                                const ok = await run('publish', dirty ? { sections, fields, changeNote } : { changeNote });
                                if (ok) setPublishOpen(false);
                            }}
                        >
                            Yayınla
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    {liveProblems.length > 0 && <Alert tone="warning" title="Önce şu sorunları düzeltin"><ul className="list-disc pl-4">{liveProblems.map((p) => <li key={p}>{p}</li>)}</ul></Alert>}
                    <Field label="Değişiklik notu" htmlFor="p-note" hint="Versiyon geçmişinde görünür."><TextInput id="p-note" value={changeNote} onChange={(e) => setChangeNote(e.target.value)} placeholder="Örn: Ekip bilgileri bölümüne yeni soru eklendi" /></Field>
                    <p className="text-xs text-gray-400">{fields.length} soru · {sections.length} bölüm</p>
                </div>
            </Modal>

            <Modal open={Boolean(versionView)} onClose={() => setVersionView(null)} title={`v${versionView?.versionNumber} önizlemesi`} description="Geçmiş versiyonlar salt okunurdur." size="lg">
                {versionView && <FormPreview sections={versionView.sections} fields={versionView.fields} theme={settings.theme} kvkkTexts={kvkkTexts} dark />}
            </Modal>
        </div>
    );
}
