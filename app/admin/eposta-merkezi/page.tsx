"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Mail, Send, Save, Clock, Eye, RefreshCw, RotateCcw, XCircle, Plus, Pencil, Trash2, Inbox, FileText, AlertTriangle, CheckCircle2, Link2, Search, X } from 'lucide-react';
import { PageHeader, Card, Button, Field, TextInput, TextArea, Select, Badge, Alert, EmptyState, Skeleton, Tabs, Modal, Drawer, KeyValue, formatDateTime, api } from '@/components/admin/ui';

type Tab = 'compose' | 'drafts' | 'outbox' | 'scheduled' | 'sent' | 'failed' | 'templates';
type Provider = { configured: boolean; status: string; from: string | null; message: string };
type OutboxItem = { id: string; recipientEmail: string; recipientName: string | null; ccEmails: string | null; subject: string; templateKey: string | null; status: string; retryCount: number; errorMessage: string | null; entityType: string | null; entityId: string | null; scheduledAt: string | null; sentAt: string | null; createdAt: string };
type FullItem = OutboxItem & { textBody: string | null; htmlBody: string };
type Template = { id: string; templateKey: string; name: string; subject: string; htmlBody: string; textBody: string | null; variables: string | null; isSystem: boolean };
type Counts = { drafts: number; outbox: number; scheduled: number; sent: number; failed: number; cancelled: number };
type LinkedRecord = { type: string; id: string; label: string };
type SearchHit = { id: string; type: string; category: string; title: string; subtitle?: string | null; email?: string | null };

const STATUS: Record<string, { label: string; tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }> = {
    DRAFT: { label: 'Taslak', tone: 'neutral' },
    PENDING: { label: 'Kuyrukta', tone: 'info' },
    PROCESSING: { label: 'İşleniyor', tone: 'info' },
    SENT: { label: 'Gönderildi', tone: 'success' },
    FAILED: { label: 'Başarısız', tone: 'danger' },
    CANCELLED: { label: 'İptal', tone: 'neutral' },
};
const ENTITY_LABEL: Record<string, string> = { Person: 'Kişi', Organization: 'Kurum', Entrepreneur: 'Girişim', Application: 'Başvuru', RentContract: 'Kira sözleşmesi', Reservation: 'Rezervasyon' };
const RECORD_TYPES = 'Person,Organization,Entrepreneur,Application,RentContract,Reservation';

const emptyCompose = { id: null as string | null, to: '', cc: '', subject: '', body: '', templateKey: '', scheduledAt: '' };

/** Interprets a datetime-local value as Europe/Istanbul time. */
const istanbulIso = (local: string) => (local ? `${local}:00+03:00` : '');

export default function EmailCenterPage() {
    const [tab, setTab] = useState<Tab>('compose');
    const [provider, setProvider] = useState<Provider | null>(null);
    const [variables, setVariables] = useState<{ tag: string; label: string }[]>([]);
    const [counts, setCounts] = useState<Counts | null>(null);
    const [items, setItems] = useState<OutboxItem[] | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [notice, setNotice] = useState<{ tone: 'success' | 'warning' | 'danger' | 'info'; text: string } | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const [compose, setCompose] = useState(emptyCompose);
    const [record, setRecord] = useState<LinkedRecord | null>(null);
    const [recordQuery, setRecordQuery] = useState('');
    const [recordHits, setRecordHits] = useState<SearchHit[]>([]);
    const [preview, setPreview] = useState<{ subject: string; body: string; missing: string[] } | null>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);

    const [detail, setDetail] = useState<FullItem | null>(null);
    const [tplEdit, setTplEdit] = useState<(Partial<Template> & { body?: string; isNew?: boolean }) | null>(null);
    const [testTo, setTestTo] = useState('');

    const loadList = useCallback(async () => {
        if (tab === 'compose' || tab === 'templates') return;
        setItems(null);
        try {
            const p = new URLSearchParams({ tab, page: String(page) });
            if (search) p.set('search', search);
            const d = await api<{ items: OutboxItem[]; counts: Counts; provider: Provider; totalPages: number; variables: { tag: string; label: string }[] }>(`/api/admin/email-outbox?${p.toString()}`);
            setItems(d.items);
            setCounts(d.counts);
            setProvider(d.provider);
            setTotalPages(d.totalPages);
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Liste alınamadı' });
            setItems([]);
        }
    }, [tab, page, search]);

    const loadMeta = useCallback(async () => {
        try {
            const [d, t] = await Promise.all([
                api<{ counts: Counts; provider: Provider; variables: { tag: string; label: string }[] }>('/api/admin/email-outbox?tab=drafts'),
                api<{ templates: Template[] }>('/api/admin/email-templates'),
            ]);
            setCounts(d.counts);
            setProvider(d.provider);
            setVariables(d.variables);
            setTemplates(t.templates);
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'E-posta merkezi yüklenemedi' });
        }
    }, []);

    // Deep links: ?to=&name=&entityType=&entityId=&subject=&templateKey=&draftId=&tab=
    useEffect(() => {
        const qp = new URLSearchParams(window.location.search);
        const t = setTimeout(async () => {
            await loadMeta();
            const qTab = qp.get('tab') as Tab | null;
            if (qTab && ['compose', 'drafts', 'outbox', 'scheduled', 'sent', 'failed', 'templates'].includes(qTab)) setTab(qTab);
            if (qp.get('to') || qp.get('subject')) setCompose((c) => ({ ...c, to: qp.get('to') || c.to, subject: qp.get('subject') || c.subject }));
            const entityType = qp.get('entityType');
            const entityId = qp.get('entityId');
            if (entityType && entityId && ENTITY_LABEL[entityType]) setRecord({ type: entityType, id: entityId, label: qp.get('name') || ENTITY_LABEL[entityType] });
            const draftId = qp.get('draftId');
            if (draftId) {
                try {
                    const d = await api<{ item: FullItem }>(`/api/admin/email-outbox?id=${draftId}`);
                    if (d.item.status === 'DRAFT') openDraft(d.item);
                } catch {
                    /* draft no longer exists */
                }
            }
        }, 0);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const t = setTimeout(loadList, 200);
        return () => clearTimeout(t);
    }, [loadList]);

    useEffect(() => {
        const q = recordQuery.trim();
        if (q.length < 2) return;
        const t = setTimeout(async () => {
            try {
                const d = await api<{ results: SearchHit[] }>(`/api/admin/search?q=${encodeURIComponent(q)}&types=${RECORD_TYPES}`);
                setRecordHits(d.results);
            } catch {
                setRecordHits([]);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [recordQuery]);

    function openDraft(item: FullItem) {
        setCompose({ id: item.id, to: item.recipientEmail, cc: item.ccEmails || '', subject: item.subject, body: item.textBody || '', templateKey: item.templateKey || '', scheduledAt: '' });
        setRecord(item.entityType && item.entityId ? { type: item.entityType, id: item.entityId, label: ENTITY_LABEL[item.entityType] || item.entityType } : null);
        setPreview(null);
        setDetail(null);
        setTab('compose');
    }

    const applyTemplate = (key: string) => {
        const tpl = templates.find((t) => t.templateKey === key);
        setCompose((c) => ({ ...c, templateKey: key, subject: tpl ? tpl.subject : c.subject, body: tpl ? tpl.textBody || c.body : c.body }));
        setPreview(null);
    };

    const pickRecord = (hit: SearchHit) => {
        setRecord({ type: hit.type, id: hit.id, label: hit.title });
        if (hit.email && !compose.to) setCompose((c) => ({ ...c, to: hit.email || '' }));
        setRecordQuery('');
        setRecordHits([]);
        setPreview(null);
    };

    const payload = () => ({ to: compose.to, cc: compose.cc, subject: compose.subject, body: compose.body, templateKey: compose.templateKey || null, entityType: record?.type || null, entityId: record?.id || null });

    const runPreview = async () => {
        setBusy('preview');
        try {
            const d = await api<{ subject: string; body: string; missing: string[]; recipient: { email: string | null } }>('/api/admin/email-outbox', { method: 'POST', json: { action: 'preview', ...payload() } });
            setPreview(d);
            if (!compose.to && d.recipient.email) setCompose((c) => ({ ...c, to: d.recipient.email || '' }));
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Önizleme oluşturulamadı' });
        } finally {
            setBusy(null);
        }
    };

    const submit = async (mode: 'draft' | 'send' | 'schedule') => {
        setBusy(mode);
        setNotice(null);
        try {
            if (mode === 'draft' && compose.id) {
                await api('/api/admin/email-outbox', { method: 'POST', json: { action: 'updateDraft', id: compose.id, ...payload() } });
                setNotice({ tone: 'success', text: 'Taslak güncellendi.' });
            } else if (compose.id && mode !== 'draft') {
                await api('/api/admin/email-outbox', { method: 'POST', json: { action: 'updateDraft', id: compose.id, ...payload() } });
                const r = await api<{ sent: number; queued: number; provider: Provider }>('/api/admin/email-outbox', { method: 'POST', json: { action: 'sendDraft', id: compose.id, scheduledAt: mode === 'schedule' ? istanbulIso(compose.scheduledAt) : null } });
                reportSend(mode, r);
                setCompose(emptyCompose);
                setRecord(null);
            } else {
                const r = await api<{ sent: number; queued: number; items: { id: string }[]; provider: Provider }>('/api/admin/email-outbox', { method: 'POST', json: { action: 'compose', mode, ...payload(), scheduledAt: mode === 'schedule' ? istanbulIso(compose.scheduledAt) : null } });
                if (mode === 'draft') {
                    setCompose((c) => ({ ...c, id: r.items[0]?.id || null }));
                    setNotice({ tone: 'success', text: 'Taslak kaydedildi.' });
                } else {
                    reportSend(mode, r);
                    setCompose(emptyCompose);
                    setRecord(null);
                }
            }
            setPreview(null);
            setScheduleOpen(false);
            loadMeta();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'İşlem başarısız' });
        } finally {
            setBusy(null);
        }
    };

    const reportSend = (mode: string, r: { sent: number; queued: number; provider: Provider }) => {
        if (mode === 'schedule') setNotice({ tone: 'success', text: `E-posta zamanlandı (${r.queued} alıcı). Zamanı geldiğinde gönderim kuyruğuna alınır.` });
        else if (r.sent > 0 && r.queued === 0) setNotice({ tone: 'success', text: `E-posta gönderildi (${r.sent} alıcı).` });
        else setNotice({ tone: 'warning', text: r.provider.configured ? `${r.sent} gönderildi, ${r.queued} kuyrukta bekliyor.` : `E-posta sağlayıcısı yapılandırılmadığı için ${r.queued} ileti outbox'ta bekliyor. Gönderildi olarak işaretlenmedi.` });
    };

    const rowAction = async (action: 'cancel' | 'retry' | 'sendDraft', id: string) => {
        setBusy(id);
        try {
            const r = await api<{ item?: { status: string }; sent?: number; queued?: number; provider?: Provider }>('/api/admin/email-outbox', { method: 'POST', json: { action, id } });
            if (action === 'cancel') setNotice({ tone: 'info', text: 'E-posta iptal edildi.' });
            else if (action === 'retry') setNotice({ tone: r.item?.status === 'SENT' ? 'success' : 'warning', text: r.item?.status === 'SENT' ? 'E-posta gönderildi.' : r.item?.status === 'PENDING' ? 'Sağlayıcı yapılandırılmadığı için e-posta kuyrukta bekliyor.' : 'Gönderim yine başarısız oldu.' });
            else if (r.provider) reportSend('send', { sent: r.sent || 0, queued: r.queued || 0, provider: r.provider });
            setDetail(null);
            loadList();
            loadMeta();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'İşlem başarısız' });
        } finally {
            setBusy(null);
        }
    };

    const processQueue = async () => {
        setBusy('queue');
        try {
            const d = await api<{ result: { succeeded: number; failed: number; pendingProvider: number; providerStatus: string } }>('/api/admin/email-outbox', { method: 'POST', json: { action: 'processQueue' } });
            const r = d.result;
            setNotice({ tone: r.providerStatus === 'CONFIGURED' ? 'success' : 'warning', text: r.providerStatus === 'CONFIGURED' ? `Kuyruk işlendi: ${r.succeeded} gönderildi, ${r.failed} başarısız.` : `Sağlayıcı yapılandırılmadı; ${r.pendingProvider} ileti bekliyor.` });
            loadList();
            loadMeta();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Kuyruk işlenemedi' });
        } finally {
            setBusy(null);
        }
    };

    const openDetail = async (id: string) => {
        try {
            const d = await api<{ item: FullItem }>(`/api/admin/email-outbox?id=${id}`);
            setDetail(d.item);
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'E-posta açılamadı' });
        }
    };

    const saveTemplate = async () => {
        if (!tplEdit) return;
        setBusy('tpl');
        try {
            if (tplEdit.isNew) await api('/api/admin/email-templates', { method: 'POST', json: { templateKey: tplEdit.templateKey, name: tplEdit.name, subject: tplEdit.subject, body: tplEdit.body } });
            else await api('/api/admin/email-templates', { method: 'PUT', json: { id: tplEdit.id, name: tplEdit.name, subject: tplEdit.subject, body: tplEdit.body, htmlBody: tplEdit.htmlBody } });
            setTplEdit(null);
            setNotice({ tone: 'success', text: 'Şablon kaydedildi.' });
            loadMeta();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Şablon kaydedilemedi' });
        } finally {
            setBusy(null);
        }
    };

    const deleteTemplate = async (t: Template) => {
        if (!window.confirm(`"${t.name}" şablonu silinsin mi?`)) return;
        try {
            await api(`/api/admin/email-templates?id=${t.id}`, { method: 'DELETE' });
            loadMeta();
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Şablon silinemedi' });
        }
    };

    const sendTest = async () => {
        if (!tplEdit?.templateKey) return;
        setBusy('test');
        try {
            const r = await api<{ message: string; status: string }>('/api/admin/email-templates', { method: 'POST', json: { action: 'test', templateKey: tplEdit.templateKey, recipientEmail: testTo } });
            setNotice({ tone: r.status === 'SENT' ? 'success' : 'warning', text: r.message });
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Test gönderilemedi' });
        } finally {
            setBusy(null);
        }
    };

    const composeTemplates = templates.filter((t) => !t.isSystem);

    return (
        <div className="mx-auto max-w-7xl space-y-5 pb-12">
            <PageHeader
                title="E-Posta Merkezi"
                description="E-posta oluşturun, taslakları yönetin, zamanlayın ve gönderim durumunu izleyin. Değişkenler bağlı kaydın gerçek verisiyle doldurulur."
                actions={
                    <div className="flex items-center gap-2">
                        {provider && <Badge tone={provider.configured ? 'success' : 'warning'}>{provider.configured ? `SMTP aktif${provider.from ? ` · ${provider.from}` : ''}` : 'Sağlayıcı yapılandırılmadı — outbox modu'}</Badge>}
                        <Button icon={RefreshCw} loading={busy === 'queue'} onClick={processQueue}>Kuyruğu işle</Button>
                    </div>
                }
            />

            {provider && !provider.configured && <Alert tone="warning" title="E-posta sağlayıcısı bağlı değil">{provider.message} Kurulum: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM ortam değişkenleri.</Alert>}
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}

            <Tabs
                value={tab}
                onChange={(v) => {
                    setTab(v);
                    setPage(1);
                }}
                tabs={[
                    { value: 'compose', label: 'Oluştur', icon: Pencil },
                    { value: 'drafts', label: 'Taslaklar', icon: FileText, count: counts?.drafts ?? null },
                    { value: 'outbox', label: 'Giden kutusu', icon: Inbox, count: counts?.outbox ?? null },
                    { value: 'scheduled', label: 'Zamanlanmış', icon: Clock, count: counts?.scheduled ?? null },
                    { value: 'sent', label: 'Gönderilen', icon: CheckCircle2, count: counts?.sent ?? null },
                    { value: 'failed', label: 'Başarısız', icon: AlertTriangle, count: counts?.failed ?? null },
                    { value: 'templates', label: 'Şablonlar', icon: Mail, count: templates.length || null },
                ]}
            />

            {tab === 'compose' && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <Card className="space-y-4 lg:col-span-2">
                        {compose.id && <Alert tone="info">Kayıtlı bir taslağı düzenliyorsunuz.</Alert>}
                        <Field label="Bağlı kayıt" hint="Seçilen kaydın verileri değişkenlere doldurulur ve e-posta kaydın geçmişinde görünür.">
                            {record ? (
                                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                                    <span className="flex items-center gap-2 text-gray-200"><Link2 className="h-4 w-4 text-gray-400" />{ENTITY_LABEL[record.type] || record.type}: {record.label}</span>
                                    <button type="button" onClick={() => { setRecord(null); setPreview(null); }} className="text-gray-400 hover:text-white" aria-label="Bağlantıyı kaldır"><X className="h-4 w-4" /></button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                    <TextInput value={recordQuery} onChange={(e) => { setRecordQuery(e.target.value); if (e.target.value.trim().length < 2) setRecordHits([]); }} placeholder="Kişi, kurum, girişim, başvuru, sözleşme veya rezervasyon arayın" className="pl-9" />
                                    {recordHits.length > 0 && (
                                        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#11111c] shadow-xl">
                                            {recordHits.map((h) => (
                                                <li key={`${h.type}:${h.id}`}>
                                                    <button type="button" onClick={() => pickRecord(h)} className="flex w-full justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/5">
                                                        <span className="truncate text-gray-100">{h.title}</span>
                                                        <span className="shrink-0 text-xs text-gray-500">{h.category}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Alıcı(lar)" htmlFor="mail-to" required hint="Birden fazla adresi virgülle ayırın; her alıcıya ayrı ileti gönderilir.">
                                <TextInput id="mail-to" value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} placeholder="ornek@kurum.com" />
                            </Field>
                            <Field label="Bilgi (CC)" htmlFor="mail-cc">
                                <TextInput id="mail-cc" value={compose.cc} onChange={(e) => setCompose({ ...compose, cc: e.target.value })} />
                            </Field>
                        </div>
                        <Field label="Şablon" htmlFor="mail-template">
                            <Select id="mail-template" value={compose.templateKey} onChange={(e) => applyTemplate(e.target.value)} placeholder="Şablonsuz" options={composeTemplates.map((t) => ({ value: t.templateKey, label: t.name }))} />
                        </Field>
                        <Field label="Konu" htmlFor="mail-subject" required>
                            <TextInput id="mail-subject" value={compose.subject} onChange={(e) => { setCompose({ ...compose, subject: e.target.value }); setPreview(null); }} />
                        </Field>
                        <Field label="İçerik" htmlFor="mail-body" required>
                            <TextArea id="mail-body" rows={12} value={compose.body} onChange={(e) => { setCompose({ ...compose, body: e.target.value }); setPreview(null); }} />
                        </Field>
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
                            <Button icon={Eye} loading={busy === 'preview'} onClick={runPreview}>Önizle</Button>
                            <Button icon={Save} loading={busy === 'draft'} onClick={() => submit('draft')}>Taslak kaydet</Button>
                            <Button icon={Clock} onClick={() => setScheduleOpen(true)}>Zamanla</Button>
                            <Button data-intent="compose" variant="primary" icon={Send} loading={busy === 'send'} onClick={() => submit('send')}>Gönder</Button>
                        </div>
                    </Card>
                    <div className="space-y-5">
                        <Card>
                            <div className="mb-2 text-sm font-semibold text-white">Değişkenler</div>
                            <p className="mb-3 text-xs text-gray-400">Tıklayınca içeriğe eklenir. Bağlı kayıtta karşılığı olmayan değişken varsa gönderim engellenir.</p>
                            <div className="flex flex-wrap gap-1.5">
                                {variables.map((v) => (
                                    <button key={v.tag} type="button" title={v.label} onClick={() => setCompose((c) => ({ ...c, body: `${c.body}{{${v.tag}}}` }))} className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-gray-300 hover:text-white">
                                        {`{{${v.tag}}}`}
                                    </button>
                                ))}
                            </div>
                        </Card>
                        {preview && (
                            <Card>
                                <div className="mb-2 text-sm font-semibold text-white">Önizleme</div>
                                {preview.missing.length > 0 && <Alert tone="warning">Doldurulamayan değişkenler: {preview.missing.map((m) => `{{${m}}}`).join(', ')}</Alert>}
                                <div className="mt-2 text-xs text-gray-400">Konu</div>
                                <div className="text-sm text-white">{preview.subject}</div>
                                <div className="mt-3 text-xs text-gray-400">İçerik</div>
                                <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-sm text-gray-200">{preview.body}</div>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {['drafts', 'outbox', 'scheduled', 'sent', 'failed'].includes(tab) && (
                <Card padded={false}>
                    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
                        <div className="relative w-full max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <TextInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Alıcı veya konu ara" className="pl-9" />
                        </div>
                    </div>
                    {!items ? <div className="p-4"><Skeleton /></div> : items.length === 0 ? (
                        <EmptyState icon={Inbox} title="Kayıt yok" description={tab === 'outbox' && provider && !provider.configured ? 'Kuyrukta bekleyen e-posta yok.' : 'Bu görünümde listelenecek e-posta bulunmuyor.'} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 text-xs text-gray-400">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Alıcı</th>
                                        <th className="px-3 py-2 text-left font-medium">Konu</th>
                                        <th className="px-3 py-2 text-left font-medium">Durum</th>
                                        <th className="px-3 py-2 text-left font-medium">{tab === 'scheduled' ? 'Zaman' : tab === 'sent' ? 'Gönderim' : 'Oluşturma'}</th>
                                        <th className="px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map((m) => (
                                        <tr key={m.id} className="text-gray-200 hover:bg-white/[0.02]">
                                            <td className="max-w-[220px] truncate px-3 py-2">{m.recipientName ? `${m.recipientName} · ` : ''}{m.recipientEmail || '—'}</td>
                                            <td className="max-w-xs px-3 py-2">
                                                <button type="button" onClick={() => openDetail(m.id)} className="block max-w-full truncate text-left text-blue-300 hover:underline">{m.subject || '(konusuz)'}</button>
                                                {m.errorMessage && <span className="block truncate text-[11px] text-amber-300/80" title={m.errorMessage}>{m.errorMessage}</span>}
                                            </td>
                                            <td className="px-3 py-2"><Badge tone={STATUS[m.status]?.tone || 'neutral'}>{STATUS[m.status]?.label || m.status}</Badge></td>
                                            <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-400">{formatDateTime(tab === 'scheduled' ? m.scheduledAt : tab === 'sent' ? m.sentAt : m.createdAt)}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    {m.status === 'DRAFT' && <Button size="sm" icon={Pencil} onClick={async () => { const d = await api<{ item: FullItem }>(`/api/admin/email-outbox?id=${m.id}`); openDraft(d.item); }}>Düzenle</Button>}
                                                    {m.status === 'FAILED' && <Button size="sm" icon={RotateCcw} loading={busy === m.id} onClick={() => rowAction('retry', m.id)}>Yeniden dene</Button>}
                                                    {['DRAFT', 'PENDING', 'FAILED'].includes(m.status) && <Button size="sm" variant="ghost" icon={XCircle} disabled={busy === m.id} onClick={() => rowAction('cancel', m.id)}>İptal</Button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 border-t border-white/10 p-3 text-xs text-gray-400">
                            <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Önceki</Button>
                            <span>{page} / {totalPages}</span>
                            <Button size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sonraki</Button>
                        </div>
                    )}
                </Card>
            )}

            {tab === 'templates' && (
                <div className="space-y-3">
                    <div className="flex justify-end">
                        <Button variant="primary" icon={Plus} onClick={() => setTplEdit({ isNew: true, templateKey: '', name: '', subject: '', body: '' })}>Yeni şablon</Button>
                    </div>
                    {templates.length === 0 ? <EmptyState icon={Mail} title="Şablon yok" /> : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {templates.map((t) => (
                                <Card key={t.id}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-white">{t.name}</div>
                                            <div className="truncate font-mono text-[11px] text-gray-500">{t.templateKey}</div>
                                        </div>
                                        <Badge tone={t.isSystem ? 'info' : 'neutral'}>{t.isSystem ? 'Sistem (otomatik)' : 'İletişim'}</Badge>
                                    </div>
                                    <p className="mt-2 truncate text-xs text-gray-400">{t.subject}</p>
                                    <div className="mt-3 flex justify-end gap-1.5">
                                        {!t.isSystem && <Button size="sm" icon={Send} onClick={() => { applyTemplate(t.templateKey); setTab('compose'); }}>Kullan</Button>}
                                        <Button size="sm" icon={Pencil} onClick={() => { setTplEdit({ ...t, body: t.textBody || '' }); setTestTo(''); }}>Düzenle</Button>
                                        {!t.isSystem && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => deleteTemplate(t)}>Sil</Button>}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="E-postayı zamanla" description="Saat Türkiye saatine (Europe/Istanbul) göre yorumlanır." footer={<><Button onClick={() => setScheduleOpen(false)}>Vazgeç</Button><Button variant="primary" icon={Clock} loading={busy === 'schedule'} disabled={!compose.scheduledAt} onClick={() => submit('schedule')}>Zamanla</Button></>}>
                <Field label="Gönderim zamanı" htmlFor="mail-schedule" required>
                    <TextInput id="mail-schedule" type="datetime-local" value={compose.scheduledAt} onChange={(e) => setCompose({ ...compose, scheduledAt: e.target.value })} />
                </Field>
            </Modal>

            <Drawer open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.subject || 'E-posta'} subtitle={detail ? <Badge tone={STATUS[detail.status]?.tone || 'neutral'}>{STATUS[detail.status]?.label || detail.status}</Badge> : null}
                footer={detail && (
                    <div className="flex justify-end gap-2">
                        {detail.status === 'DRAFT' && <Button variant="primary" icon={Pencil} onClick={() => openDraft(detail)}>Düzenle / Gönder</Button>}
                        {detail.status === 'FAILED' && <Button icon={RotateCcw} onClick={() => rowAction('retry', detail.id)}>Yeniden dene</Button>}
                        {['DRAFT', 'PENDING', 'FAILED'].includes(detail.status) && <Button variant="ghost" icon={XCircle} onClick={() => rowAction('cancel', detail.id)}>İptal et</Button>}
                    </div>
                )}>
                {detail && (
                    <div className="space-y-4">
                        <KeyValue items={[
                            { label: 'Alıcı', value: detail.recipientEmail },
                            { label: 'CC', value: detail.ccEmails || '—' },
                            { label: 'Şablon', value: detail.templateKey || '—' },
                            { label: 'Bağlı kayıt', value: detail.entityType ? `${ENTITY_LABEL[detail.entityType] || detail.entityType}` : '—' },
                            { label: 'Oluşturma', value: formatDateTime(detail.createdAt) },
                            { label: 'Zamanlanan', value: formatDateTime(detail.scheduledAt) },
                            { label: 'Gönderim', value: formatDateTime(detail.sentAt) },
                            { label: 'Deneme', value: String(detail.retryCount) },
                        ]} />
                        {detail.errorMessage && <Alert tone="warning">{detail.errorMessage}</Alert>}
                        <div className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-sm text-gray-200">{detail.textBody || detail.htmlBody.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')}</div>
                    </div>
                )}
            </Drawer>

            <Modal open={Boolean(tplEdit)} onClose={() => setTplEdit(null)} size="lg" title={tplEdit?.isNew ? 'Yeni şablon' : 'Şablonu düzenle'} description={tplEdit?.isSystem ? 'Sistem şablonu otomatik e-postalarda kullanılır; HTML içerik güvenlik filtresinden geçirilir.' : 'İletişim şablonu düz metindir; {{değişken}} etiketleri bağlı kayıttan doldurulur.'}
                footer={<><Button onClick={() => setTplEdit(null)}>Vazgeç</Button><Button variant="primary" icon={Save} loading={busy === 'tpl'} onClick={saveTemplate}>Kaydet</Button></>}>
                {tplEdit && (
                    <div className="space-y-4">
                        {tplEdit.isNew && (
                            <Field label="Anahtar" htmlFor="tpl-key" required hint="Büyük harf, rakam ve alt çizgi (ör. ETKINLIK_DAVETI)">
                                <TextInput id="tpl-key" value={tplEdit.templateKey || ''} onChange={(e) => setTplEdit({ ...tplEdit, templateKey: e.target.value.toUpperCase() })} />
                            </Field>
                        )}
                        <Field label="Ad" htmlFor="tpl-name" required><TextInput id="tpl-name" value={tplEdit.name || ''} onChange={(e) => setTplEdit({ ...tplEdit, name: e.target.value })} /></Field>
                        <Field label="Konu" htmlFor="tpl-subject" required><TextInput id="tpl-subject" value={tplEdit.subject || ''} onChange={(e) => setTplEdit({ ...tplEdit, subject: e.target.value })} /></Field>
                        {tplEdit.isSystem ? (
                            <Field label="HTML içerik" htmlFor="tpl-html"><TextArea id="tpl-html" rows={12} className="font-mono text-xs" value={tplEdit.htmlBody || ''} onChange={(e) => setTplEdit({ ...tplEdit, htmlBody: e.target.value })} /></Field>
                        ) : (
                            <Field label="İçerik" htmlFor="tpl-body" required><TextArea id="tpl-body" rows={12} value={tplEdit.body || ''} onChange={(e) => setTplEdit({ ...tplEdit, body: e.target.value })} /></Field>
                        )}
                        {!tplEdit.isNew && (
                            <div className="flex items-end gap-2 border-t border-white/10 pt-4">
                                <Field label="Test alıcısı" htmlFor="tpl-test" className="flex-1"><TextInput id="tpl-test" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="ornek@kurum.com" /></Field>
                                <Button icon={Send} loading={busy === 'test'} disabled={!testTo} onClick={sendTest}>Test gönder</Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
