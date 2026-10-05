'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Download, Inbox, ExternalLink, FileText } from 'lucide-react';
import { Card, Badge, EmptyState, Skeleton, Alert, Drawer, Button, Select, KeyValue, inputClass, api, formatDateTime } from '@/components/admin/ui';
import { applicationTypeLabel } from '@/lib/forms/schema';

interface SubmissionRow {
    id: string;
    submissionNumber: string;
    status: string;
    isTest: boolean;
    applicantName: string | null;
    applicantEmail: string | null;
    createdAt: string;
    versionNumber: number;
    campaign: { id: string; name: string; applicationType: string } | null;
    application: { id: string; applicationNumber: string; status: string } | null;
}

interface SubmissionDetail {
    id: string;
    submissionNumber: string;
    status: string;
    createdAt: string;
    applicantName: string | null;
    applicantEmail: string | null;
    versionNumber: number;
    form: { id: string; title: string };
    campaign: { id: string; name: string; applicationType: string; program: { id: string; name: string } | null } | null;
    application: { id: string; applicationNumber: string; status: string; applicationType: string } | null;
    person: { id: string; fullName: string } | null;
    organization: { id: string; name: string } | null;
    context: { entityType: string; entityId: string | null; label: string } | null;
    consent: { recordedAt: string; consents: { fieldKey: string; statement: string; kind: string; accepted: boolean; kvkkTextTitle: string | null; kvkkTextVersion: string | null }[]; channels: Record<string, unknown> } | null;
    documents: { id: string; title: string; media: { id: string; originalName: string; mimeType: string; fileSize: number; publicUrl: string } }[];
    sections: { stepNumber: number; title: string }[];
    answers: { fieldKey: string; label: string; fieldType: string; stepNumber?: number; value: unknown; isSensitive: boolean }[];
}

const STATUS_OPTIONS = [
    { value: 'SUBMITTED', label: 'Yeni' },
    { value: 'REVIEWED', label: 'İncelendi' },
    { value: 'SPAM', label: 'Spam' },
    { value: 'ARCHIVED', label: 'Arşiv' },
];
const statusLabel = (s: string) => STATUS_OPTIONS.find((o) => o.value === s)?.label || s;

function renderValue(value: unknown): React.ReactNode {
    if (value === null || value === undefined || value === '') return <span className="text-gray-600">Cevaplanmadı</span>;
    if (Array.isArray(value)) return value.length ? value.join(', ') : <span className="text-gray-600">Seçim yok</span>;
    if (value === true || value === 'true') return 'Evet';
    if (value === false || value === 'false') return 'Hayır';
    return <span className="whitespace-pre-wrap">{String(value)}</span>;
}

export function SubmissionsPanel({ formId, campaigns }: { formId: string; campaigns: { id: string; name: string }[] }) {
    const [rows, setRows] = useState<SubmissionRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [campaignId, setCampaignId] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [openId, setOpenId] = useState<string | null>(null);
    const [detail, setDetail] = useState<SubmissionDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const query = useCallback(() => {
        const p = new URLSearchParams();
        if (search) p.set('search', search);
        if (status) p.set('status', status);
        if (campaignId) p.set('campaignId', campaignId);
        if (from) p.set('from', from);
        if (to) p.set('to', to);
        return p;
    }, [search, status, campaignId, from, to]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const p = query();
            p.set('page', String(page));
            const data = await api<{ items: SubmissionRow[]; total: number; totalPages: number }>(`/api/admin/forms/${formId}/submissions?${p.toString()}`);
            setRows(data.items);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Gönderimler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [formId, page, query]);

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [load]);

    const openDetail = async (id: string) => {
        setOpenId(id);
        setDetail(null);
        setDetailLoading(true);
        try {
            const data = await api<{ submission: SubmissionDetail }>(`/api/admin/submissions/${id}`);
            setDetail(data.submission);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Gönderim yüklenemedi');
        } finally {
            setDetailLoading(false);
        }
    };

    const changeStatus = async (value: string) => {
        if (!detail) return;
        const data = await api<{ submission: SubmissionDetail }>(`/api/admin/submissions/${detail.id}`, { method: 'PATCH', json: { status: value } });
        setDetail(data.submission);
        load();
    };

    return (
        <div className="space-y-4">
            {error && <Alert tone="danger" onClose={() => setError(null)}>{error}</Alert>}
            <Card padded={false}>
                <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-[1fr_160px_200px_150px_150px_auto]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                        <input aria-label="Gönderimlerde ara" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="No, ad veya e-posta..." className={`${inputClass} pl-9`} />
                    </div>
                    <Select aria-label="Durum" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} options={STATUS_OPTIONS} placeholder="Tüm durumlar" />
                    <Select aria-label="Kampanya" value={campaignId} onChange={(e) => { setPage(1); setCampaignId(e.target.value); }} options={campaigns.map((c) => ({ value: c.id, label: c.name }))} placeholder="Tüm kampanyalar" />
                    <input aria-label="Başlangıç tarihi" type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} className={inputClass} />
                    <input aria-label="Bitiş tarihi" type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} className={inputClass} />
                    <a href={`/api/admin/forms/${formId}/submissions?export=csv&${query().toString()}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10">
                        <Download className="h-4 w-4" /> CSV
                    </a>
                </div>
            </Card>

            {loading ? (
                <Skeleton rows={5} />
            ) : rows.length === 0 ? (
                <EmptyState icon={Inbox} title="Henüz gönderim yok." description="Form yayında olduğunda public sayfadan gelen gönderimler burada listelenir." />
            ) : (
                <Card padded={false} className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Gönderim</th>
                                <th className="px-4 py-3 font-medium">Gönderen</th>
                                <th className="px-4 py-3 font-medium">Kampanya</th>
                                <th className="px-4 py-3 font-medium">Başvuru</th>
                                <th className="px-4 py-3 font-medium">Durum</th>
                                <th className="px-4 py-3 font-medium">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rows.map((r) => (
                                <tr key={r.id} className="cursor-pointer hover:bg-white/[0.02]" onClick={() => openDetail(r.id)}>
                                    <td className="px-4 py-3">
                                        <button type="button" className="font-mono text-xs text-white hover:text-primary" onClick={(e) => { e.stopPropagation(); openDetail(r.id); }}>{r.submissionNumber}</button>
                                        <div className="text-[11px] text-gray-500">v{r.versionNumber}{r.isTest ? ' · test' : ''}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-100">{r.applicantName || '—'}</div>
                                        <div className="text-[11px] text-gray-500">{r.applicantEmail || ''}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-300">{r.campaign ? `${applicationTypeLabel(r.campaign.applicationType)} · ${r.campaign.name}` : '—'}</td>
                                    <td className="px-4 py-3 text-xs">
                                        {r.application ? <Link onClick={(e) => e.stopPropagation()} href={`/admin/basvurular/${r.application.id}`} className="font-mono text-primary hover:underline">{r.application.applicationNumber}</Link> : <span className="text-gray-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3"><Badge tone={r.status === 'SUBMITTED' ? 'info' : r.status === 'SPAM' ? 'danger' : 'neutral'}>{statusLabel(r.status)}</Badge></td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(r.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-gray-400">
                        <span>Toplam {total} gönderim</span>
                        <div className="flex items-center gap-2">
                            <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Önceki</Button>
                            <span>{page} / {totalPages}</span>
                            <Button size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sonraki</Button>
                        </div>
                    </div>
                </Card>
            )}

            <Drawer
                open={Boolean(openId)}
                onClose={() => setOpenId(null)}
                title={detail ? `Gönderim ${detail.submissionNumber}` : 'Gönderim'}
                subtitle={detail ? `${detail.form.title} · v${detail.versionNumber} · ${formatDateTime(detail.createdAt)}` : undefined}
                footer={detail ? (
                    <div className="flex w-full flex-wrap items-center justify-between gap-2">
                        <Select aria-label="Gönderim durumu" value={detail.status} onChange={(e) => changeStatus(e.target.value)} options={STATUS_OPTIONS} className="w-44" />
                        {detail.application && <Link href={`/admin/basvurular/${detail.application.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-primary/90"><ExternalLink className="h-4 w-4" />Başvuruyu Aç</Link>}
                    </div>
                ) : undefined}
            >
                {detailLoading || !detail ? (
                    <Skeleton rows={8} />
                ) : (
                    <div className="space-y-6">
                        <KeyValue
                            items={[
                                { label: 'Gönderen', value: detail.applicantName },
                                { label: 'E-posta', value: detail.applicantEmail },
                                { label: 'Kampanya', value: detail.campaign ? `${applicationTypeLabel(detail.campaign.applicationType)} · ${detail.campaign.name}` : 'Kampanyasız form' },
                                { label: 'Başvuru', value: detail.application ? detail.application.applicationNumber : '—' },
                                { label: 'CRM kişi bağlantısı', value: detail.person ? <Link className="text-primary hover:underline" href={`/admin/rehber?personId=${detail.person.id}`}>{detail.person.fullName}</Link> : 'Bağlı değil' },
                                { label: 'Bağlam', value: detail.context ? `${detail.context.entityType}: ${detail.context.label}` : '—' },
                            ]}
                        />

                        {detail.sections.map((section) => {
                            const answers = detail.answers.filter((a) => (a.stepNumber ?? 1) === section.stepNumber);
                            if (answers.length === 0) return null;
                            return (
                                <div key={section.stepNumber}>
                                    <h3 className="mb-2 border-b border-white/10 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</h3>
                                    <dl className="space-y-3">
                                        {answers.map((a) => (
                                            <div key={a.fieldKey}>
                                                <dt className="text-xs text-gray-500">{a.label}{a.isSensitive && <span className="ml-1 text-amber-400">(maskeli)</span>}</dt>
                                                <dd className="mt-0.5 text-sm text-gray-100">{renderValue(a.value)}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            );
                        })}

                        {detail.documents.length > 0 && (
                            <div>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Dosyalar</h3>
                                <ul className="space-y-1">
                                    {detail.documents.map((d) => (
                                        <li key={d.id}><a href={d.media.publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><FileText className="h-4 w-4" />{d.media.originalName}</a></li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {detail.consent && (
                            <div>
                                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">KVKK ve onaylar</h3>
                                <ul className="space-y-2">
                                    {detail.consent.consents.map((c) => (
                                        <li key={c.fieldKey} className="rounded-lg border border-white/10 p-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <Badge tone={c.accepted ? 'success' : 'neutral'}>{c.accepted ? 'Onaylandı' : 'Onaylanmadı'}</Badge>
                                                {c.kvkkTextTitle && <span className="text-gray-400">{c.kvkkTextTitle} · {c.kvkkTextVersion}</span>}
                                            </div>
                                            <p className="mt-1 text-gray-300">{c.statement}</p>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-2 text-[11px] text-gray-500">Kayıt zamanı: {formatDateTime(detail.consent.recordedAt)}</p>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
}
