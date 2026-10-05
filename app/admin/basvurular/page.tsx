'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Inbox, Plus, Search, LayoutList, KanbanSquare, Megaphone, Download } from 'lucide-react';
import { PageHeader, Button, Card, Badge, Alert, Skeleton, EmptyState, Modal, Field, TextInput, TextArea, Select, Tabs, inputClass, api, formatDate, formatDateTime } from '@/components/admin/ui';
import { APPLICATION_STATUSES } from '@/lib/constants/application';
import { APPLICANT_TYPES, applicantTypeLabel, applicationTypeLabel } from '@/lib/forms/schema';
import { sanitizeCsvCellClient } from './csv';

type View = 'all' | 'program' | 'tekmer' | 'other';

interface AppRow {
    id: string;
    applicationNumber: string;
    applicantName: string;
    companyName: string | null;
    email: string;
    applicantType: string;
    applicationType: string;
    status: string;
    createdAt: string;
    program: { id: string; name: string } | null;
    campaign: { id: string; name: string; applicationType: string; workflowStages: string | null } | null;
    assignedTo: { id: string; name: string } | null;
    evaluations: { totalScore: number; isCompleted: boolean }[];
    statusHistory: { toStatus: string; createdAt: string; changedByName: string | null }[];
}

interface CampaignOption { id: string; name: string; applicationType: string; status: string; form: { isPublished: boolean } | null; workflowStages: { key: string; label: string; order: number }[] }

const statusLabel = (key: string, stages?: { key: string; label: string }[]) => stages?.find((s) => s.key === key)?.label || APPLICATION_STATUSES.find((s) => s.key === key)?.label || key;

function stageTone(key: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
    if (key === 'ACCEPTED' || key === 'ACTIVE') return 'success';
    if (key === 'REJECTED') return 'danger';
    if (key === 'WAITLIST' || key === 'MISSING_DOCS') return 'warning';
    if (key === 'NEW') return 'info';
    return 'neutral';
}

export default function ApplicationCenterPage() {
    const [view, setView] = useState<View>('all');
    const [display, setDisplay] = useState<'list' | 'pipeline'>('list');
    const [rows, setRows] = useState<AppRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [campaignId, setCampaignId] = useState('');
    const [status, setStatus] = useState('');
    const [applicantType, setApplicantType] = useState('');
    const [assignedToId, setAssignedToId] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const [counts, setCounts] = useState<Record<View, number | null>>({ all: null, program: null, tekmer: null, other: null });

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ campaignId: '', applicantName: '', email: '', phone: '', companyName: '', applicantType: 'PERSON', note: '' });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const qp = new URLSearchParams(window.location.search);
            if (qp.get('campaignId')) setCampaignId(String(qp.get('campaignId')));
            if (qp.get('view')) setView(qp.get('view') as View);
            if (qp.get('status')) setStatus(String(qp.get('status')));
        }
        api<{ campaigns: CampaignOption[] }>('/api/admin/campaigns?includeArchived=true').then((d) => setCampaigns(d.campaigns)).catch(() => setCampaigns([]));
        api<{ users: { id: string; name: string }[] }>('/api/admin/users').then((d) => setUsers(d.users || [])).catch(() => setUsers([]));
    }, []);

    const params = useCallback(() => {
        const p = new URLSearchParams();
        p.set('view', view);
        if (search) p.set('search', search);
        if (campaignId) p.set('campaignId', campaignId);
        if (status) p.set('status', status);
        if (applicantType) p.set('applicantType', applicantType);
        if (assignedToId) p.set('assignedToId', assignedToId);
        if (from) p.set('from', from);
        if (to) p.set('to', to);
        return p;
    }, [view, search, campaignId, status, applicantType, assignedToId, from, to]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const p = params();
            p.set('page', String(display === 'pipeline' ? 1 : page));
            p.set('limit', display === 'pipeline' ? '200' : '25');
            const data = await api<{ items: AppRow[]; total: number; totalPages: number }>(`/api/admin/applications?${p.toString()}`);
            setRows(data.items);
            setTotal(data.total);
            setTotalPages(data.totalPages || 1);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Başvurular yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [params, page, display]);

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [load]);

    useEffect(() => {
        (['all', 'program', 'tekmer', 'other'] as View[]).forEach((v) => {
            api<{ total: number }>(`/api/admin/applications?view=${v}&limit=1`).then((d) => setCounts((c) => ({ ...c, [v]: d.total }))).catch(() => undefined);
        });
    }, [notice]);

    const visibleCampaigns = campaigns.filter((c) => view === 'all' || (view === 'program' ? c.applicationType === 'PROGRAM' : view === 'tekmer' ? c.applicationType === 'TEKMER' : !['PROGRAM', 'TEKMER'].includes(c.applicationType)));
    const selectedCampaign = campaigns.find((c) => c.id === campaignId) || null;
    const pipelineStages = selectedCampaign ? selectedCampaign.workflowStages : APPLICATION_STATUSES.filter((s) => s.key !== 'ARCHIVED').map((s, i) => ({ key: s.key, label: s.label, order: i }));

    const stageMap = useMemo(() => {
        const map = new Map<string, AppRow[]>();
        pipelineStages.forEach((s) => map.set(s.key, []));
        rows.forEach((r) => {
            if (!map.has(r.status)) map.set(r.status, []);
            map.get(r.status)!.push(r);
        });
        return map;
    }, [rows, pipelineStages]);

    const exportCsv = () => {
        const header = ['Referans', 'Başvuran', 'Başvuran Türü', 'Başvuru Türü', 'Kampanya', 'Hedef', 'Aşama', 'Sorumlu', 'Puan', 'Başvuru Tarihi', 'Son İşlem'];
        const lines = rows.map((r) => [
            r.applicationNumber,
            r.applicantName,
            applicantTypeLabel(r.applicantType),
            applicationTypeLabel(r.applicationType),
            r.campaign?.name || '',
            r.applicationType === 'TEKMER' ? 'TEKMER yer edinme' : r.program?.name || '',
            statusLabel(r.status),
            r.assignedTo?.name || '',
            r.evaluations.filter((e) => e.isCompleted).length ? String(Math.round(r.evaluations.filter((e) => e.isCompleted).reduce((s, e) => s + e.totalScore, 0) / r.evaluations.filter((e) => e.isCompleted).length)) : '',
            r.createdAt,
            r.statusHistory[0]?.createdAt || '',
        ]);
        const csv = '﻿' + [header, ...lines].map((l) => l.map(sanitizeCsvCellClient).join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `basvurular-${view}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const submitCreate = async () => {
        setCreating(true);
        setCreateError(null);
        try {
            const data = await api<{ application: { id: string; applicationNumber: string } }>('/api/admin/applications', { method: 'POST', json: createForm });
            setCreateOpen(false);
            setNotice(`${data.application.applicationNumber} oluşturuldu.`);
            setCreateForm({ campaignId: '', applicantName: '', email: '', phone: '', companyName: '', applicantType: 'PERSON', note: '' });
            load();
        } catch (e) {
            setCreateError(e instanceof Error ? e.message : 'Başvuru oluşturulamadı');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Başvuru Merkezi"
                icon={Inbox}
                description="Program başvuruları ve TEKMER yer edinme başvuruları ayrı kampanyalarda, kendi iş akışlarıyla yönetilir."
                actions={
                    <>
                        <Link href="/admin/basvuru-kampanyalari" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10"><Megaphone className="h-4 w-4" />Kampanyalar</Link>
                        <Button icon={Download} onClick={exportCsv} disabled={rows.length === 0}>Dışa Aktar</Button>
                        <Button data-intent="create" variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>Başvuru Ekle</Button>
                    </>
                }
            />
            {notice && <div className="mb-4"><Alert tone="success" onClose={() => setNotice(null)}>{notice}</Alert></div>}
            {error && <div className="mb-4"><Alert tone="danger" onClose={() => setError(null)}>{error}</Alert></div>}

            <Tabs<View>
                value={view}
                onChange={(v) => { setView(v); setCampaignId(''); setPage(1); }}
                tabs={[
                    { value: 'all', label: 'Tüm Başvurular', count: counts.all },
                    { value: 'program', label: 'Program Başvuruları', count: counts.program },
                    { value: 'tekmer', label: 'TEKMER Yer Edinme', count: counts.tekmer },
                    { value: 'other', label: 'Diğer Türler', count: counts.other },
                ]}
            />

            <Card className="mb-4" padded={false}>
                <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-4 xl:grid-cols-8">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                        <input aria-label="Başvurularda ara" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="No, ad, şirket, e-posta..." className={`${inputClass} pl-9`} />
                    </div>
                    <Select aria-label="Kampanya" value={campaignId} onChange={(e) => { setPage(1); setCampaignId(e.target.value); setStatus(''); }} options={visibleCampaigns.map((c) => ({ value: c.id, label: c.name }))} placeholder="Tüm kampanyalar" />
                    <Select aria-label="Aşama" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} options={pipelineStages.map((s) => ({ value: s.key, label: s.label }))} placeholder="Tüm aşamalar" />
                    <Select aria-label="Başvuran türü" value={applicantType} onChange={(e) => { setPage(1); setApplicantType(e.target.value); }} options={APPLICANT_TYPES} placeholder="Tüm başvuranlar" />
                    <Select aria-label="Sorumlu" value={assignedToId} onChange={(e) => { setPage(1); setAssignedToId(e.target.value); }} options={users.map((u) => ({ value: u.id, label: u.name }))} placeholder="Tüm sorumlular" />
                    <input aria-label="Başlangıç tarihi" type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} className={inputClass} />
                    <input aria-label="Bitiş tarihi" type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} className={inputClass} />
                </div>
                <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
                    <span className="text-xs text-gray-400">{total} başvuru</span>
                    <div className="flex rounded-lg border border-white/10 p-0.5" role="group" aria-label="Görünüm">
                        <button type="button" onClick={() => setDisplay('list')} aria-pressed={display === 'list'} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs ${display === 'list' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><LayoutList className="h-3.5 w-3.5" />Liste</button>
                        <button type="button" onClick={() => setDisplay('pipeline')} aria-pressed={display === 'pipeline'} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs ${display === 'pipeline' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><KanbanSquare className="h-3.5 w-3.5" />Pipeline</button>
                    </div>
                </div>
            </Card>

            {display === 'pipeline' && !selectedCampaign && view === 'all' && (
                <div className="mb-3"><Alert tone="info">Pipeline her kampanyanın kendi aşamalarına göre en doğru biçimde görünür. Kampanya seçerek o kampanyanın iş akışını görüntüleyebilirsiniz.</Alert></div>
            )}

            {loading ? (
                <Skeleton rows={6} />
            ) : rows.length === 0 ? (
                <EmptyState icon={Inbox} title="Bu görünümde başvuru yok." description="Filtreleri değiştirebilir veya manuel başvuru ekleyebilirsiniz." action={<Button data-intent="create" variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>Başvuru Ekle</Button>} />
            ) : display === 'list' ? (
                <Card padded={false} className="overflow-x-auto">
                    <table className="w-full min-w-[1150px] text-left text-sm">
                        <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500">
                            <tr>
                                {['Referans', 'Başvuran', 'Başvuran Türü', 'Başvuru Türü', 'Kampanya', 'Hedef', 'Aşama', 'Sorumlu', 'Puan', 'Başvuru Tarihi', 'Son İşlem'].map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rows.map((r) => {
                                const completed = r.evaluations.filter((e) => e.isCompleted);
                                const score = completed.length ? Math.round(completed.reduce((s, e) => s + e.totalScore, 0) / completed.length) : null;
                                return (
                                    <tr key={r.id} className="hover:bg-white/[0.02]">
                                        <td className="px-3 py-3"><Link href={`/admin/basvurular/${r.id}`} className="font-mono text-xs text-primary hover:underline">{r.applicationNumber}</Link></td>
                                        <td className="px-3 py-3"><Link href={`/admin/basvurular/${r.id}`} className="text-gray-100 hover:text-primary">{r.applicantName}</Link>{r.companyName && <div className="text-[11px] text-gray-500">{r.companyName}</div>}</td>
                                        <td className="px-3 py-3 text-xs text-gray-300">{applicantTypeLabel(r.applicantType)}</td>
                                        <td className="px-3 py-3"><Badge tone={r.applicationType === 'TEKMER' ? 'warning' : 'primary'}>{applicationTypeLabel(r.applicationType)}</Badge></td>
                                        <td className="px-3 py-3 text-xs text-gray-300">{r.campaign?.name || <span className="text-gray-600">Kampanyasız</span>}</td>
                                        <td className="px-3 py-3 text-xs text-gray-300">{r.applicationType === 'TEKMER' ? 'TEKMER yer edinme' : r.program?.name || '—'}</td>
                                        <td className="px-3 py-3"><Badge tone={stageTone(r.status)}>{statusLabel(r.status)}</Badge></td>
                                        <td className="px-3 py-3 text-xs text-gray-300">{r.assignedTo?.name || <span className="text-gray-600">Atanmadı</span>}</td>
                                        <td className="px-3 py-3 text-xs text-gray-300">{score !== null ? `${score}/100` : '—'}</td>
                                        <td className="px-3 py-3 text-xs text-gray-400">{formatDate(r.createdAt)}</td>
                                        <td className="px-3 py-3 text-xs text-gray-400">{r.statusHistory[0] ? `${formatDateTime(r.statusHistory[0].createdAt)}${r.statusHistory[0].changedByName ? ` · ${r.statusHistory[0].changedByName}` : ''}` : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-gray-400">
                        <span>Sayfa {page} / {totalPages}</span>
                        <div className="flex gap-2">
                            <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Önceki</Button>
                            <Button size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sonraki</Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-3">
                    {Array.from(stageMap.entries()).map(([key, items]) => (
                        <div key={key} className="w-72 shrink-0 rounded-xl border border-white/10 bg-white/[0.02]">
                            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                                <span className="text-xs font-semibold text-gray-200">{statusLabel(key, pipelineStages)}</span>
                                <Badge>{items.length}</Badge>
                            </div>
                            <ul className="max-h-[65vh] space-y-2 overflow-y-auto p-2">
                                {items.length === 0 && <li className="p-3 text-center text-[11px] text-gray-600">Başvuru yok</li>}
                                {items.map((r) => (
                                    <li key={r.id}>
                                        <Link href={`/admin/basvurular/${r.id}`} className="block rounded-lg border border-white/10 bg-black/20 p-2.5 hover:border-primary/40">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-[10px] text-gray-500">{r.applicationNumber}</span>
                                                <Badge tone={r.applicationType === 'TEKMER' ? 'warning' : 'primary'}>{applicationTypeLabel(r.applicationType)}</Badge>
                                            </div>
                                            <div className="mt-1 truncate text-sm text-gray-100">{r.applicantName}</div>
                                            <div className="truncate text-[11px] text-gray-500">{r.campaign?.name || 'Kampanyasız'}</div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Manuel başvuru ekle"
                description="Telefon, e-posta veya yüz yüze alınan başvurular için. Başvuru seçilen kampanyanın iş akışıyla başlar."
                footer={<><Button onClick={() => setCreateOpen(false)}>Vazgeç</Button><Button variant="primary" loading={creating} onClick={submitCreate} disabled={!createForm.campaignId || !createForm.applicantName || !createForm.email}>Başvuruyu Oluştur</Button></>}
            >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Kampanya" htmlFor="m-camp" required className="sm:col-span-2">
                        <Select id="m-camp" value={createForm.campaignId} onChange={(e) => setCreateForm({ ...createForm, campaignId: e.target.value })} placeholder="Kampanya seçin" options={campaigns.filter((c) => c.status !== 'ARCHIVED' && c.form?.isPublished).map((c) => ({ value: c.id, label: `${applicationTypeLabel(c.applicationType)} · ${c.name}` }))} />
                    </Field>
                    <Field label="Başvuran adı" htmlFor="m-name" required><TextInput id="m-name" value={createForm.applicantName} onChange={(e) => setCreateForm({ ...createForm, applicantName: e.target.value })} /></Field>
                    <Field label="Başvuran türü" htmlFor="m-type"><Select id="m-type" value={createForm.applicantType} onChange={(e) => setCreateForm({ ...createForm, applicantType: e.target.value })} options={APPLICANT_TYPES} /></Field>
                    <Field label="E-posta" htmlFor="m-email" required><TextInput id="m-email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} /></Field>
                    <Field label="Telefon" htmlFor="m-phone"><TextInput id="m-phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} /></Field>
                    <Field label="Şirket / takım" htmlFor="m-company" className="sm:col-span-2"><TextInput id="m-company" value={createForm.companyName} onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })} /></Field>
                    <Field label="Not" htmlFor="m-note" className="sm:col-span-2"><TextArea id="m-note" value={createForm.note} onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })} /></Field>
                    {createError && <div className="sm:col-span-2"><Alert tone="danger">{createError}</Alert></div>}
                </div>
            </Modal>
        </div>
    );
}
