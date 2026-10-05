'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FileStack, Upload, Search, Archive, RotateCcw, Lock, FileText } from 'lucide-react';
import { PageHeader, Button, Card, Badge, Alert, Skeleton, EmptyState, Modal, Field, TextInput, TextArea, Select, Toggle, inputClass, api, formatDateTime } from '@/components/admin/ui';

interface Doc {
    id: string; title: string; description: string | null; category: string; entityType: string; entityId: string; visibility: string; isArchived: boolean; createdAt: string;
    media: { originalName: string; mimeType: string; fileSize: number; publicUrl: string };
    entityLabel: string; entityHref: string | null; uploadedBy: string | null;
}
type Opt = { value: string; label: string };

function size(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentCenterPage() {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [categories, setCategories] = useState<Opt[]>([]);
    const [entityTypes, setEntityTypes] = useState<Opt[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ text: string; href?: string } | null>(null);
    const [filters, setFilters] = useState({ search: '', category: '', entityType: '', entityId: '', includeArchived: false });

    const [uploadOpen, setUploadOpen] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', category: 'GENERAL', entityType: '', entityId: '', restricted: false });
    const [file, setFile] = useState<File | null>(null);
    const [entitySearch, setEntitySearch] = useState('');
    const [entityResults, setEntityResults] = useState<{ id: string; label: string }[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        const qp = new URLSearchParams(window.location.search);
        const entityType = qp.get('entityType') || '';
        const entityId = qp.get('entityId') || '';
        const t = window.setTimeout(() => {
            if (entityType || entityId) {
                setFilters((f) => ({ ...f, entityType, entityId }));
                setForm((f) => ({ ...f, entityType, entityId }));
            }
        }, 0);
        return () => window.clearTimeout(t);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page: String(page) });
            if (filters.search) p.set('search', filters.search);
            if (filters.category) p.set('category', filters.category);
            if (filters.entityType) p.set('entityType', filters.entityType);
            if (filters.entityId) p.set('entityId', filters.entityId);
            if (filters.includeArchived) p.set('includeArchived', 'true');
            const d = await api<{ items: Doc[]; total: number; totalPages: number; categories: Opt[]; entityTypes: Opt[] }>(`/api/admin/documents?${p.toString()}`);
            setDocs(d.items);
            setTotal(d.total);
            setTotalPages(d.totalPages);
            setCategories(d.categories);
            setEntityTypes(d.entityTypes);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Dokümanlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [load]);

    // Entity lookup for the upload dialog
    useEffect(() => {
        if (!uploadOpen || entitySearch.trim().length < 2 || !form.entityType) return;
        const q = encodeURIComponent(entitySearch);
        const endpoints: Record<string, { url: string; map: (x: Record<string, string>) => { id: string; label: string } }> = {
            Person: { url: `/api/admin/persons?search=${q}&limit=8`, map: (x) => ({ id: x.id, label: x.fullName }) },
            Organization: { url: `/api/admin/organizations?search=${q}&limit=8`, map: (x) => ({ id: x.id, label: x.name }) },
            Entrepreneur: { url: `/api/admin/entrepreneurs?search=${q}&limit=8`, map: (x) => ({ id: x.id, label: x.name }) },
            Application: { url: `/api/admin/applications?search=${q}&limit=8`, map: (x) => ({ id: x.id, label: `${x.applicationNumber} · ${x.applicantName}` }) },
        };
        const ep = endpoints[form.entityType];
        if (!ep) return;
        const t = setTimeout(() => api<{ items: Record<string, string>[] }>(ep.url).then((d) => setEntityResults((d.items || []).map(ep.map))).catch(() => setEntityResults([])), 250);
        return () => clearTimeout(t);
    }, [entitySearch, form.entityType, uploadOpen]);

    const upload = async () => {
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        try {
            const data = new FormData();
            data.append('file', file);
            data.append('title', form.title || file.name);
            data.append('description', form.description);
            data.append('category', form.category);
            data.append('entityType', form.entityType);
            data.append('entityId', form.entityId);
            data.append('visibility', form.restricted ? 'RESTRICTED' : 'INTERNAL');
            const res = await fetch('/api/admin/documents', { method: 'POST', body: data });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || 'Yükleme başarısız');
            setUploadOpen(false);
            setFile(null);
            setForm((f) => ({ ...f, title: '', description: '' }));
            setNotice({ text: json.message, href: json.entityHref });
            load();
        } catch (e) {
            setUploadError(e instanceof Error ? e.message : 'Yükleme başarısız');
        } finally {
            setUploading(false);
        }
    };

    const freeTextEntity = form.entityType && !['Person', 'Organization', 'Entrepreneur', 'Application'].includes(form.entityType);

    return (
        <div>
            <PageHeader
                title="Doküman Merkezi"
                icon={FileStack}
                description="Kişi, kurum, girişim, başvuru, proje, sözleşme, fatura ve alanlara bağlı tüm belgeler. Dosyalar özel depolamada tutulur; erişim kaydın yetkisine bağlıdır."
                actions={<Button data-intent="create" variant="primary" icon={Upload} onClick={() => { setUploadError(null); setUploadOpen(true); }}>Doküman Yükle</Button>}
            />
            {notice && <div className="mb-4"><Alert tone="success" onClose={() => setNotice(null)}>{notice.text} {notice.href && <Link href={notice.href} className="ml-1 underline">İlgili kaydı aç</Link>}</Alert></div>}
            {error && <div className="mb-4"><Alert tone="danger" onClose={() => setError(null)}>{error}</Alert></div>}

            <Card className="mb-4" padded={false}>
                <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-[1fr_200px_200px_auto]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                        <input aria-label="Ara" value={filters.search} onChange={(e) => { setPage(1); setFilters({ ...filters, search: e.target.value }); }} placeholder="Başlık veya dosya adı..." className={`${inputClass} pl-9`} />
                    </div>
                    <Select aria-label="Kategori" value={filters.category} onChange={(e) => { setPage(1); setFilters({ ...filters, category: e.target.value }); }} options={categories} placeholder="Tüm kategoriler" />
                    <Select aria-label="Kayıt türü" value={filters.entityType} onChange={(e) => { setPage(1); setFilters({ ...filters, entityType: e.target.value, entityId: '' }); }} options={entityTypes} placeholder="Tüm kayıtlar" />
                    <Toggle id="arch" checked={filters.includeArchived} onChange={(v) => setFilters({ ...filters, includeArchived: v })} label="Arşiv" />
                </div>
                {filters.entityId && <div className="border-t border-white/10 px-3 py-2 text-xs text-gray-400">Tek kayda ait belgeler gösteriliyor. <button type="button" className="text-primary underline" onClick={() => setFilters({ ...filters, entityId: '' })}>Filtreyi kaldır</button></div>}
            </Card>

            {loading ? <Skeleton rows={6} /> : docs.length === 0 ? (
                <EmptyState icon={FileStack} title="Henüz doküman yok." action={<Button variant="primary" icon={Upload} onClick={() => setUploadOpen(true)}>Doküman Yükle</Button>} />
            ) : (
                <Card padded={false} className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500">
                            <tr>{['Doküman', 'Kategori', 'İlgili kayıt', 'Yükleyen', 'Tarih', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {docs.map((d) => (
                                <tr key={d.id} className={d.isArchived ? 'opacity-50' : ''}>
                                    <td className="px-4 py-3">
                                        <a href={d.media.publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-white hover:text-primary"><FileText className="h-4 w-4" />{d.title}</a>
                                        <div className="text-[11px] text-gray-500">{d.media.originalName} · {size(d.media.fileSize)}</div>
                                        {d.visibility === 'RESTRICTED' && <Badge tone="warning"><Lock className="h-3 w-3" />Kısıtlı</Badge>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-300">{categories.find((c) => c.value === d.category)?.label || d.category}</td>
                                    <td className="px-4 py-3 text-xs">{d.entityHref ? <Link href={d.entityHref} className="text-primary hover:underline">{d.entityLabel}</Link> : d.entityLabel}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{d.uploadedBy || '—'}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(d.createdAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" variant="ghost" icon={d.isArchived ? RotateCcw : Archive} onClick={async () => { try { await api(`/api/admin/documents/${d.id}`, { method: 'PATCH', json: { isArchived: !d.isArchived } }); load(); } catch (e) { setError(e instanceof Error ? e.message : 'İşlem başarısız'); } }}>{d.isArchived ? 'Geri Yükle' : 'Arşivle'}</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-gray-400">
                        <span>{total} doküman</span>
                        <div className="flex gap-2"><Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Önceki</Button><Button size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sonraki</Button></div>
                    </div>
                </Card>
            )}

            <Modal
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                title="Doküman yükle"
                description="İzin verilen türler: PDF, Office belgeleri, görseller, CSV, ZIP. Çalıştırılabilir dosyalar kabul edilmez."
                footer={<><Button onClick={() => setUploadOpen(false)}>Vazgeç</Button><Button variant="primary" loading={uploading} disabled={!file || !form.entityType || !form.entityId} onClick={upload}>Yükle</Button></>}
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Dosya" htmlFor="u-file" required className="sm:col-span-2"><input id="u-file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-gray-300" /></Field>
                    <Field label="Başlık" htmlFor="u-title" className="sm:col-span-2"><TextInput id="u-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={file?.name} /></Field>
                    <Field label="Kategori" htmlFor="u-cat"><Select id="u-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categories} /></Field>
                    <Field label="Kayıt türü" htmlFor="u-type" required><Select id="u-type" value={form.entityType} onChange={(e) => { setForm({ ...form, entityType: e.target.value, entityId: '' }); setEntityResults([]); }} options={entityTypes} placeholder="Seçin" /></Field>
                    {form.entityType && !freeTextEntity && !form.entityId && (
                        <div className="sm:col-span-2">
                            <Field label="Kayıt ara" htmlFor="u-search"><TextInput id="u-search" value={entitySearch} onChange={(e) => setEntitySearch(e.target.value)} placeholder="En az 2 karakter" /></Field>
                            <ul className="mt-1 space-y-1">{(entitySearch.trim().length >= 2 ? entityResults : []).map((r) => <li key={r.id}><button type="button" onClick={() => setForm({ ...form, entityId: r.id })} className="w-full rounded-lg border border-white/10 px-3 py-1.5 text-left text-sm text-gray-200 hover:border-primary">{r.label}</button></li>)}</ul>
                        </div>
                    )}
                    {form.entityId && <div className="sm:col-span-2"><Alert tone="info">Kayıt seçildi. <button type="button" className="underline" onClick={() => setForm({ ...form, entityId: '' })}>Değiştir</button></Alert></div>}
                    {freeTextEntity && !form.entityId && <div className="sm:col-span-2"><Alert tone="info">Bu tür kayıtlara belge, kaydın kendi sayfasındaki &quot;Belge Ekle&quot; bağlantısından eklenir.</Alert></div>}
                    <Field label="Açıklama" htmlFor="u-desc" className="sm:col-span-2"><TextArea id="u-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                    <div className="sm:col-span-2"><Toggle id="u-restricted" checked={form.restricted} onChange={(v) => setForm({ ...form, restricted: v })} label="Kısıtlı (kimlik, finansal vb.; yalnız yetkili kullanıcılar görür)" /></div>
                    {uploadError && <div className="sm:col-span-2"><Alert tone="danger">{uploadError}</Alert></div>}
                </div>
            </Modal>
        </div>
    );
}
