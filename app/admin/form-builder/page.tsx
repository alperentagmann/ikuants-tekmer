'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus, Search, ExternalLink, Copy, Archive, RotateCcw, Download, Inbox, Pencil, FileStack } from 'lucide-react';
import { PageHeader, Button, Card, Badge, EmptyState, Skeleton, Alert, Modal, Field, TextInput, Select, Toggle, api, formatDateTime, inputClass } from '@/components/admin/ui';
import { FORM_TYPES, formTypeLabel, applicationTypeLabel } from '@/lib/forms/schema';

interface FormRow {
    id: string;
    title: string;
    slug: string;
    formType: string;
    isPublished: boolean;
    isArchived: boolean;
    isTemplate: boolean;
    publicPath: string | null;
    owner: { id: string; name: string } | null;
    currentVersion: { id: string; versionNumber: number; publishedAt: string | null } | null;
    hasDraft: boolean;
    draftVersionNumber: number | null;
    versionCount: number;
    campaigns: { id: string; name: string; applicationType: string; status: string; publicPath: string | null; program: { id: string; name: string } | null }[];
    submissionCount: number;
    updatedAt: string;
    updatedBy: string | null;
}

function slugify(text: string): string {
    const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
    return text.split('').map((c) => map[c] ?? c).join('').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}

export default function FormCenterPage() {
    const router = useRouter();
    const [forms, setForms] = useState<FormRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [formType, setFormType] = useState('');
    const [includeArchived, setIncludeArchived] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [mode, setMode] = useState<'blank' | 'copy' | 'template'>('blank');
    const [newTitle, setNewTitle] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [newType, setNewType] = useState('CUSTOM');
    const [sourceId, setSourceId] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (includeArchived) params.set('includeArchived', 'true');
            const data = await api<{ forms: FormRow[] }>(`/api/admin/forms?${params.toString()}`);
            setForms(data.forms);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Formlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [includeArchived]);

    useEffect(() => {
        load();
    }, [load]);

    // Deep link from the form editor: /admin/form-builder?copy=<formId>
    useEffect(() => {
        if (loading || forms.length === 0 || typeof window === 'undefined') return;
        const copyId = new URLSearchParams(window.location.search).get('copy');
        const source = copyId ? forms.find((f) => f.id === copyId) : null;
        if (source) {
            openCreate('copy', source);
            window.history.replaceState(null, '', '/admin/form-builder');
        }
    }, [loading, forms]);

    const filtered = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr');
        return forms.filter((f) => {
            if (formType && f.formType !== formType) return false;
            if (!q) return true;
            return [f.title, f.slug, ...f.campaigns.map((c) => c.name), ...f.campaigns.map((c) => c.program?.name || '')].some((v) => v.toLocaleLowerCase('tr').includes(q));
        });
    }, [forms, search, formType]);

    const templates = forms.filter((f) => f.isTemplate && !f.isArchived);

    const openCreate = (m: 'blank' | 'copy' | 'template', source?: FormRow) => {
        setMode(m);
        setCreateError(null);
        setSourceId(source?.id || '');
        setNewTitle(source ? `${source.title} (Kopya)` : '');
        setNewSlug(source ? `${source.slug}-kopya` : '');
        setNewType(source?.formType || 'CUSTOM');
        setCreateOpen(true);
    };

    const submitCreate = async () => {
        setCreating(true);
        setCreateError(null);
        try {
            const body = mode === 'blank'
                ? { title: newTitle, slug: newSlug, formType: newType, theme: 'site', fields: [], sections: [{ stepNumber: 1, title: 'Bölüm 1' }] }
                : { title: newTitle, slug: newSlug, sourceFormId: sourceId };
            const data = await api<{ form: { id: string } }>('/api/admin/forms', { method: 'POST', json: body });
            setCreateOpen(false);
            router.push(`/admin/form-builder/${data.form.id}`);
        } catch (e) {
            setCreateError(e instanceof Error ? e.message : 'Form oluşturulamadı');
        } finally {
            setCreating(false);
        }
    };

    const toggleArchive = async (row: FormRow) => {
        try {
            await api(`/api/admin/forms/${row.id}`, { method: 'POST', json: { action: row.isArchived ? 'restore' : 'archive' } });
            setNotice(row.isArchived ? `"${row.title}" geri yüklendi.` : `"${row.title}" arşivlendi.`);
            load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'İşlem başarısız');
        }
    };

    return (
        <div>
            <PageHeader
                title="Form Merkezi"
                icon={ClipboardList}
                description="Sitedeki tüm başvuru, iletişim, kayıt ve talep formları buradan yönetilir. Yayındaki versiyon değişmez; düzenlemeler taslakta yapılır ve yayınlandığında yeni versiyon oluşur."
                actions={
                    <>
                        <Button icon={Copy} onClick={() => openCreate('copy')}>Mevcut Formu Kopyala</Button>
                        <Button data-intent="create" variant="primary" icon={Plus} onClick={() => openCreate('blank')}>Yeni Form</Button>
                    </>
                }
            />

            {notice && <div className="mb-4"><Alert tone="success" onClose={() => setNotice(null)}>{notice}</Alert></div>}
            {error && <div className="mb-4"><Alert tone="danger" onClose={() => setError(null)}>{error}</Alert></div>}

            <Card className="mb-4" padded={false}>
                <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                        <input aria-label="Formlarda ara" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Form adı, adres, kampanya veya program ara..." className={`${inputClass} pl-9`} />
                    </div>
                    <Select aria-label="Form türü" value={formType} onChange={(e) => setFormType(e.target.value)} options={FORM_TYPES} placeholder="Tüm form türleri" className="md:w-64" />
                    <Toggle id="archived" checked={includeArchived} onChange={setIncludeArchived} label="Arşivi göster" />
                </div>
            </Card>

            {loading ? (
                <Skeleton rows={6} />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={FileStack}
                    title={forms.length === 0 ? 'Henüz form yok.' : 'Filtreye uyan form bulunamadı.'}
                    description="Yeni bir form oluşturabilir veya mevcut bir formu kopyalayarak başlayabilirsiniz."
                    action={<Button variant="primary" icon={Plus} onClick={() => openCreate('blank')}>Form Oluştur</Button>}
                />
            ) : (
                <Card padded={false} className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left text-sm">
                        <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Form</th>
                                <th className="px-4 py-3 font-medium">Tür</th>
                                <th className="px-4 py-3 font-medium">Durum</th>
                                <th className="px-4 py-3 font-medium">Kullanıldığı Yer</th>
                                <th className="px-4 py-3 font-medium text-right">Gönderim</th>
                                <th className="px-4 py-3 font-medium">Güncelleme</th>
                                <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((f) => (
                                <tr key={f.id} className="align-top hover:bg-white/[0.02]">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/form-builder/${f.id}`} className="font-medium text-white hover:text-primary">{f.title}</Link>
                                        <div className="mt-0.5 font-mono text-[11px] text-gray-500">{f.slug}</div>
                                        {f.isTemplate && <div className="mt-1"><Badge tone="info">Şablon</Badge></div>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">{formTypeLabel(f.formType)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {f.isArchived ? (
                                                <Badge>Arşiv</Badge>
                                            ) : f.isPublished && f.currentVersion ? (
                                                <Badge tone="success">Yayında · v{f.currentVersion.versionNumber}</Badge>
                                            ) : f.currentVersion ? (
                                                <Badge tone="warning">Yayında değil · v{f.currentVersion.versionNumber}</Badge>
                                            ) : (
                                                <Badge tone="warning">Yayınlanmadı</Badge>
                                            )}
                                            {f.hasDraft && <Badge tone="primary">Taslak v{f.draftVersionNumber}</Badge>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-300">
                                        {f.campaigns.length === 0 && !f.publicPath && <span className="text-gray-600">Bağlı değil</span>}
                                        {f.campaigns.map((c) => (
                                            <div key={c.id}>
                                                <span className="text-gray-500">{applicationTypeLabel(c.applicationType)}</span>
                                                {' · '}
                                                <Link href={`/admin/basvuru-kampanyalari?campaignId=${c.id}`} className="hover:text-primary">{c.program ? `${c.program.name}` : c.name}</Link>
                                            </div>
                                        ))}
                                        {f.publicPath && <div className="font-mono text-[11px] text-gray-500">{f.publicPath}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/admin/form-builder/${f.id}?tab=submissions`} className="font-medium text-white hover:text-primary">{f.submissionCount}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-400">
                                        <div>{formatDateTime(f.updatedAt)}</div>
                                        {f.updatedBy && <div className="text-gray-500">{f.updatedBy}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap justify-end gap-1">
                                            <Link href={`/admin/form-builder/${f.id}`} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-gray-200 hover:bg-white/10"><Pencil className="h-3.5 w-3.5" />Düzenle</Link>
                                            <Link href={`/admin/form-builder/${f.id}?tab=submissions`} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-gray-200 hover:bg-white/10"><Inbox className="h-3.5 w-3.5" />Gönderimler</Link>
                                            {f.publicPath && f.isPublished && (
                                                <a href={f.publicPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-gray-200 hover:bg-white/10" aria-label={`${f.title} public sayfasını aç`}><ExternalLink className="h-3.5 w-3.5" />Public</a>
                                            )}
                                            <button type="button" onClick={() => openCreate('copy', f)} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-gray-200 hover:bg-white/10"><Copy className="h-3.5 w-3.5" />Kopyala</button>
                                            <a href={`/api/admin/forms/${f.id}/submissions?export=csv`} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-gray-200 hover:bg-white/10"><Download className="h-3.5 w-3.5" />CSV</a>
                                            <button type="button" onClick={() => toggleArchive(f)} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-gray-200 hover:bg-white/10">
                                                {f.isArchived ? <><RotateCcw className="h-3.5 w-3.5" />Geri Yükle</> : <><Archive className="h-3.5 w-3.5" />Arşivle</>}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title={mode === 'blank' ? 'Yeni Form' : mode === 'template' ? 'Şablondan Form' : 'Mevcut Formu Kopyala'}
                description={mode === 'blank' ? 'Boş bir taslak oluşturulur; soruları ekleyip yayınlayabilirsiniz.' : 'Kopya bağımsız bir formdur; kaynak formdaki değişiklikler kopyayı etkilemez.'}
                footer={
                    <>
                        <Button onClick={() => setCreateOpen(false)}>Vazgeç</Button>
                        <Button variant="primary" loading={creating} onClick={submitCreate} disabled={!newTitle.trim() || !newSlug.trim() || (mode !== 'blank' && !sourceId)}>Oluştur ve Düzenle</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Oluşturma yöntemi">
                        {([['blank', 'Yeni Boş Form'], ['copy', 'Mevcut Formu Kopyala'], ['template', 'Form Şablonu Kullan']] as const).map(([value, label]) => (
                            <button key={value} type="button" role="radio" aria-checked={mode === value} onClick={() => setMode(value)} className={`rounded-lg border px-3 py-1.5 text-xs ${mode === value ? 'border-primary bg-primary/10 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>{label}</button>
                        ))}
                    </div>
                    {mode !== 'blank' && (
                        <Field label={mode === 'template' ? 'Şablon' : 'Kaynak form'} htmlFor="source" required>
                            <Select
                                id="source"
                                value={sourceId}
                                onChange={(e) => {
                                    const src = forms.find((f) => f.id === e.target.value);
                                    setSourceId(e.target.value);
                                    if (src) {
                                        setNewTitle(`${src.title} (Kopya)`);
                                        setNewSlug(`${src.slug}-kopya`);
                                    }
                                }}
                                placeholder="Seçin..."
                                options={(mode === 'template' ? templates : forms.filter((f) => !f.isArchived)).map((f) => ({ value: f.id, label: f.title }))}
                            />
                            {mode === 'template' && templates.length === 0 && <p className="mt-1 text-[11px] text-gray-500">Henüz şablon işaretlenmiş form yok. Form ayarlarından &quot;Şablon olarak kullan&quot; seçeneğini açabilirsiniz.</p>}
                        </Field>
                    )}
                    <Field label="Form adı" htmlFor="title" required>
                        <TextInput id="title" value={newTitle} onChange={(e) => { setNewTitle(e.target.value); if (mode === 'blank') setNewSlug(slugify(e.target.value)); }} />
                    </Field>
                    <Field label="Form adresi (slug)" htmlFor="slug" required hint="Küçük harf, rakam ve tire. Public form bu adresle yüklenir.">
                        <TextInput id="slug" value={newSlug} onChange={(e) => setNewSlug(slugify(e.target.value))} />
                    </Field>
                    {mode === 'blank' && (
                        <Field label="Form türü" htmlFor="type">
                            <Select id="type" value={newType} onChange={(e) => setNewType(e.target.value)} options={FORM_TYPES} />
                        </Field>
                    )}
                    {createError && <Alert tone="danger">{createError}</Alert>}
                </div>
            </Modal>
        </div>
    );
}
