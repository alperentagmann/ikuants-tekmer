'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Building2, CheckCircle2, Copy, KeyRound, Landmark, Link2, MessageSquare, Plug, Plus, RefreshCw, Shield, Trash2, Webhook, XCircle } from 'lucide-react';
import { api, Alert, Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Select, Skeleton, Tabs, TextInput, Toggle, formatDateTime } from '@/components/admin/ui';

interface ProviderField { key: string; label: string; secret?: boolean; placeholder?: string }
interface Provider { key: string; name: string; category: string; description: string; defaultAuth: string; fields: ProviderField[]; note?: string }
interface Connection { id: string; provider: string; name: string; category: string; baseUrl: string | null; authType: string; config: Record<string, string>; secretHints: Record<string, string>; secretError: string | null; status: string; lastTestAt: string | null; lastTestOk: boolean | null; lastError: string | null }
interface Hook { id: string; name: string; url: string; events: string[]; isActive: boolean; lastStatus: number | null; lastDeliveredAt: string | null; failureCount: number }
interface Key { id: string; name: string; prefix: string; scopes: string[]; lastUsedAt: string | null; expiresAt: string | null; revokedAt: string | null; createdAt: string }
interface Log { id: string; direction: string; method: string; url: string; statusCode: number | null; durationMs: number | null; ok: boolean; error: string | null; summary: string | null; createdAt: string; connectionId: string | null; webhookId: string | null }
interface Data {
    catalog: Provider[]; categories: Record<string, string>; authTypes: Record<string, string>; webhookEvents: Record<string, string>; apiScopes: Record<string, string>;
    connections: Connection[]; webhooks: Hook[]; apiKeys: Key[]; logs: Log[];
}
type Tab = 'connections' | 'webhooks' | 'keys' | 'logs' | 'developer';

const CAT_ICON: Record<string, typeof Plug> = { PUBLIC_AGENCY: Landmark, ACCOUNTING: Building2, BANK: Landmark, MESSAGING: MessageSquare, PRODUCTIVITY: Activity, CUSTOM: Link2 };
const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
    ACTIVE: { label: 'Bağlı', tone: 'success' }, CONFIGURED: { label: 'Yapılandırıldı (test edilmedi)', tone: 'info' }, ERROR: { label: 'Hata', tone: 'danger' }, NOT_CONFIGURED: { label: 'Eksik bilgi', tone: 'warning' }, DISABLED: { label: 'Devre dışı', tone: 'neutral' },
};

/** Integration Hub: connect public agencies, accounting / e-invoice providers, banks and messaging tools without code. */
export default function IntegrationHubPage() {
    const [tab, setTab] = useState<Tab>('connections');
    const [data, setData] = useState<Data | null>(null);
    const [conn, setConn] = useState<{ id?: string; provider: string; name: string; baseUrl: string; authType: string; config: Record<string, string>; secrets: Record<string, string>; disabled: boolean } | null>(null);
    const [hook, setHook] = useState<{ id?: string; name: string; url: string; events: string[]; isActive: boolean } | null>(null);
    const [keyForm, setKeyForm] = useState<{ name: string; scopes: string[]; expiresInDays: string } | null>(null);
    const [revealed, setRevealed] = useState<{ title: string; value: string } | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ tone: 'success' | 'danger' | 'info'; text: string } | null>(null);

    const load = useCallback(async () => {
        try {
            setData(await api<Data>('/api/admin/integrations'));
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'Yüklenemedi' });
        }
    }, []);
    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const post = async (key: string, json: Record<string, unknown>, ok?: string) => {
        setBusy(key);
        try {
            const res = await api<Record<string, unknown>>('/api/admin/integrations', { method: 'POST', json });
            if (ok) setNotice({ tone: 'success', text: ok });
            await load();
            return res;
        } catch (e) {
            setNotice({ tone: 'danger', text: e instanceof Error ? e.message : 'İşlem başarısız' });
            return null;
        } finally {
            setBusy(null);
        }
    };

    const provider = useMemo(() => (conn && data ? data.catalog.find((p) => p.key === conn.provider) : null), [conn, data]);

    if (!data) return <Skeleton rows={8} />;
    const byProvider = (key: string) => data.connections.filter((c) => c.provider === key);

    return (
        <div className="space-y-5">
            <PageHeader title="Entegrasyon Merkezi" icon={Plug} description="KOSGEB, TÜBİTAK, e-Fatura entegratörü, muhasebe yazılımı, banka, SMS ve iş birliği araçlarını kod yazmadan bağlayın. Anahtarlar şifreli saklanır; tüm çağrılar kayıt altına alınır." />
            {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
            <Tabs<Tab> value={tab} onChange={setTab} tabs={[
                { value: 'connections', label: 'Bağlantılar', icon: Plug, count: data.connections.length || null },
                { value: 'webhooks', label: "Webhook'lar", icon: Webhook, count: data.webhooks.length || null },
                { value: 'keys', label: 'API anahtarları', icon: KeyRound, count: data.apiKeys.filter((k) => !k.revokedAt).length || null },
                { value: 'logs', label: 'Çağrı kayıtları', icon: Activity },
                { value: 'developer', label: 'Geliştirici', icon: Shield },
            ]} />

            {tab === 'connections' && (
                <div className="space-y-6">
                    {Object.entries(data.categories).map(([cat, label]) => {
                        const items = data.catalog.filter((p) => p.category === cat);
                        if (!items.length) return null;
                        const Icon = CAT_ICON[cat] || Plug;
                        return (
                            <section key={cat}>
                                <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400"><Icon className="h-4 w-4" /> {label}</h2>
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {items.map((p) => {
                                        const saved = byProvider(p.key);
                                        return (
                                            <Card key={p.key} className="flex flex-col">
                                                <div className="mb-2 flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-semibold text-white">{p.name}</h3>
                                                        <p className="text-xs text-gray-400">{p.description}</p>
                                                    </div>
                                                    <Plug className={`h-5 w-5 ${saved.some((c) => c.status === 'ACTIVE') ? 'text-emerald-400' : 'text-gray-600'}`} />
                                                </div>
                                                {saved.map((c) => (
                                                    <div key={c.id} className="mb-2 rounded-lg border border-white/10 bg-black/20 p-2 text-xs">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="truncate font-medium text-gray-200">{c.name}</span>
                                                            <Badge tone={STATUS[c.status]?.tone || 'neutral'}>{STATUS[c.status]?.label || c.status}</Badge>
                                                        </div>
                                                        <div className="mt-1 truncate font-mono text-[10px] text-gray-500">{c.baseUrl || 'Servis adresi girilmedi'}</div>
                                                        {c.lastError && <div className="mt-1 text-[11px] text-rose-300">{c.lastError}</div>}
                                                        {c.secretError && <div className="mt-1 text-[11px] text-rose-300">Kayıtlı sır çözülemedi: {c.secretError}. Anahtarı yeniden girin.</div>}
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            <Button size="sm" icon={RefreshCw} loading={busy === `test-${c.id}`} disabled={!c.baseUrl} onClick={async () => { const r = await post(`test-${c.id}`, { action: 'test_connection', id: c.id }); const res = r?.result as { ok?: boolean; status?: number; error?: string } | undefined; if (res) setNotice({ tone: res.ok ? 'success' : 'danger', text: res.ok ? `Bağlantı başarılı (HTTP ${res.status}).` : `Bağlantı başarısız: ${res.error || `HTTP ${res.status}`}` }); }}>Test et</Button>
                                                            <Button size="sm" variant="ghost" onClick={() => setConn({ id: c.id, provider: c.provider, name: c.name, baseUrl: c.baseUrl || '', authType: c.authType, config: c.config, secrets: {}, disabled: c.status === 'DISABLED' })}>Düzenle</Button>
                                                            <Button size="sm" variant="ghost" icon={Trash2} aria-label="Sil" onClick={() => window.confirm(`"${c.name}" bağlantısı silinsin mi?`) && post(`del-${c.id}`, { action: 'delete_connection', id: c.id }, 'Bağlantı silindi.')} />
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="mt-auto pt-2">
                                                    <Button size="sm" variant={saved.length ? 'ghost' : 'primary'} icon={Plus} onClick={() => setConn({ provider: p.key, name: p.name, baseUrl: '', authType: p.defaultAuth, config: {}, secrets: {}, disabled: false })}>{saved.length ? 'Başka bağlantı' : 'Bağla'}</Button>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

            {tab === 'webhooks' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-400">Seçtiğiniz olaylarda dış sisteme imzalı bildirim gönderilir (Slack/Teams dahil herhangi bir HTTPS adres).</p>
                        <Button variant="primary" icon={Plus} onClick={() => setHook({ name: '', url: '', events: [], isActive: true })}>Yeni webhook</Button>
                    </div>
                    {data.webhooks.length === 0 ? <Card><EmptyState icon={Webhook} title="Webhook yok" description="Örn: yeni başvuru geldiğinde kurumun sistemine bildirim gönderin." /></Card> : data.webhooks.map((w) => (
                        <Card key={w.id}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2"><h3 className="font-semibold text-white">{w.name}</h3>{!w.isActive && <Badge tone="neutral">Pasif</Badge>}{w.failureCount > 0 && <Badge tone="danger">{w.failureCount} hata</Badge>}</div>
                                    <div className="truncate font-mono text-[11px] text-gray-500">{w.url}</div>
                                    <div className="mt-1 flex flex-wrap gap-1">{w.events.map((e) => <Badge key={e} tone="primary">{data.webhookEvents[e] || e}</Badge>)}</div>
                                    <div className="mt-1 text-[11px] text-gray-500">{w.lastDeliveredAt ? `Son gönderim: ${formatDateTime(w.lastDeliveredAt)} · HTTP ${w.lastStatus ?? '—'}` : 'Henüz gönderim yok'}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setHook({ id: w.id, name: w.name, url: w.url, events: w.events, isActive: w.isActive })}>Düzenle</Button>
                                    <Button size="sm" variant="ghost" icon={Trash2} aria-label="Sil" onClick={() => window.confirm('Webhook silinsin mi?') && post(`dw-${w.id}`, { action: 'delete_webhook', id: w.id }, 'Webhook silindi.')} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {tab === 'keys' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-400">Dış sistemlerin İKÜANTS verisini okuyabilmesi için kapsamlı, iptal edilebilir anahtarlar. Anahtar yalnızca oluşturulduğunda bir kez gösterilir.</p>
                        <Button variant="primary" icon={Plus} onClick={() => setKeyForm({ name: '', scopes: [], expiresInDays: '365' })}>Yeni anahtar</Button>
                    </div>
                    {data.apiKeys.length === 0 ? <Card><EmptyState icon={KeyRound} title="API anahtarı yok" /></Card> : (
                        <Card padded={false}>
                            <ul className="divide-y divide-white/5">
                                {data.apiKeys.map((k) => (
                                    <li key={k.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                                        <KeyRound className={`h-4 w-4 ${k.revokedAt ? 'text-gray-600' : 'text-amber-300'}`} />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm text-white">{k.name} <span className="font-mono text-[11px] text-gray-500">ik_{k.prefix}_…</span></div>
                                            <div className="flex flex-wrap gap-1 text-[11px]">{k.scopes.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}</div>
                                            <div className="text-[11px] text-gray-500">{k.revokedAt ? `İptal: ${formatDateTime(k.revokedAt)}` : `${k.lastUsedAt ? `Son kullanım ${formatDateTime(k.lastUsedAt)}` : 'Henüz kullanılmadı'}${k.expiresAt ? ` · bitiş ${formatDateTime(k.expiresAt)}` : ''}`}</div>
                                        </div>
                                        {!k.revokedAt && <Button size="sm" variant="danger" icon={XCircle} onClick={() => window.confirm('Anahtar iptal edilsin mi? Bu anahtarı kullanan sistemler erişimini kaybeder.') && post(`rk-${k.id}`, { action: 'revoke_api_key', id: k.id }, 'Anahtar iptal edildi.')}>İptal et</Button>}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            )}

            {tab === 'logs' && (
                <Card padded={false} className="overflow-x-auto">
                    {data.logs.length === 0 ? <EmptyState icon={Activity} title="Henüz çağrı yok" /> : (
                        <table className="w-full min-w-[760px] text-left text-xs">
                            <thead className="border-b border-white/10 text-[11px] uppercase text-gray-500"><tr><th className="px-3 py-2">Zaman</th><th className="px-3 py-2">Yön</th><th className="px-3 py-2">İstek</th><th className="px-3 py-2">Sonuç</th><th className="px-3 py-2">Süre</th></tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {data.logs.map((l) => (
                                    <tr key={l.id}>
                                        <td className="px-3 py-2 text-gray-400">{formatDateTime(l.createdAt)}</td>
                                        <td className="px-3 py-2"><Badge tone={l.direction === 'WEBHOOK' ? 'primary' : 'neutral'}>{l.direction === 'WEBHOOK' ? 'Webhook' : l.direction === 'INBOUND' ? 'Gelen' : 'Giden'}</Badge></td>
                                        <td className="px-3 py-2 font-mono text-[11px] text-gray-300">{l.method} {l.url}{l.summary && l.direction === 'WEBHOOK' ? ` · ${l.summary}` : ''}</td>
                                        <td className="px-3 py-2">{l.ok ? <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />{l.statusCode}</span> : <span className="inline-flex items-center gap-1 text-rose-300"><XCircle className="h-3.5 w-3.5" />{l.statusCode || ''} {l.error}</span>}</td>
                                        <td className="px-3 py-2 text-gray-500">{l.durationMs ?? '—'} ms</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            )}

            {tab === 'developer' && (
                <Card className="space-y-3 text-sm text-gray-300">
                    <h3 className="font-semibold text-white">Dış sistemler için API (salt okunur)</h3>
                    <p>İstekler <code className="text-primary">Authorization: Bearer ik_…</code> başlığıyla gönderilir. Dakikada en fazla 120 istek; yanıtlarda kimlik numarası gibi kişisel veriler yer almaz.</p>
                    <ul className="space-y-1 font-mono text-xs">
                        <li>GET /api/v1/ping — bağlantı testi</li>
                        <li>GET /api/v1/applications?since=2026-01-01&limit=50 — applications:read</li>
                        <li>GET /api/v1/tasks — tasks:read</li>
                        <li>GET /api/v1/reservations — reservations:read</li>
                        <li>GET /api/v1/invoices — finance:read</li>
                    </ul>
                    <h3 className="pt-2 font-semibold text-white">Webhook imzası</h3>
                    <p>Her gönderimde <code className="text-primary">X-Ikuants-Signature: t=&lt;unix&gt;,v1=&lt;hex&gt;</code> başlığı bulunur. Alıcı, <code>HMAC-SHA256(gizli_anahtar, &quot;t.gövde&quot;)</code> değerini hesaplayıp karşılaştırmalı ve 5 dakikadan eski zaman damgalarını reddetmelidir.</p>
                </Card>
            )}

            <Modal open={Boolean(conn)} onClose={() => setConn(null)} title={conn?.id ? 'Bağlantıyı düzenle' : `Bağlantı: ${provider?.name || ''}`} size="lg"
                footer={<><Button onClick={() => setConn(null)}>Vazgeç</Button><Button variant="primary" loading={busy === 'save-conn'} onClick={async () => { if (!conn) return; const r = await post('save-conn', { action: 'save_connection', ...conn }, 'Bağlantı kaydedildi.'); if (r) setConn(null); }}>Kaydet</Button></>}>
                {conn && provider && (
                    <div className="space-y-3">
                        {provider.note && <Alert tone="info">{provider.note}</Alert>}
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Bağlantı adı" htmlFor="c-name"><TextInput id="c-name" value={conn.name} onChange={(e) => setConn({ ...conn, name: e.target.value })} /></Field>
                            <Field label="Kimlik doğrulama" htmlFor="c-auth"><Select id="c-auth" value={conn.authType} onChange={(e) => setConn({ ...conn, authType: e.target.value })} options={Object.entries(data.authTypes).map(([value, label]) => ({ value, label }))} /></Field>
                            <Field label="Servis adresi (https)" htmlFor="c-url" className="md:col-span-2" hint="Kurumun / sağlayıcının verdiği API kök adresi. İç ağ adresleri güvenlik nedeniyle engellenir."><TextInput id="c-url" value={conn.baseUrl} placeholder="https://api.ornek.gov.tr/v1" onChange={(e) => setConn({ ...conn, baseUrl: e.target.value })} /></Field>
                            <Field label="Test yolu (opsiyonel)" htmlFor="c-test"><TextInput id="c-test" value={conn.config.testPath || ''} placeholder="/health" onChange={(e) => setConn({ ...conn, config: { ...conn.config, testPath: e.target.value } })} /></Field>
                            {conn.authType === 'API_KEY_HEADER' && <Field label="Anahtar başlığı" htmlFor="c-header"><TextInput id="c-header" value={conn.config.headerName || ''} placeholder="X-API-Key" onChange={(e) => setConn({ ...conn, config: { ...conn.config, headerName: e.target.value } })} /></Field>}
                            {conn.authType === 'QUERY_KEY' && <Field label="Parametre adı" htmlFor="c-q"><TextInput id="c-q" value={conn.config.queryParam || ''} placeholder="api_key" onChange={(e) => setConn({ ...conn, config: { ...conn.config, queryParam: e.target.value } })} /></Field>}
                            {provider.fields.map((f) => {
                                const existing = data.connections.find((c) => c.id === conn.id);
                                return f.secret ? (
                                    <Field key={f.key} label={f.label} htmlFor={`c-${f.key}`} hint={existing?.secretHints[f.key] ? `Kayıtlı: ${existing.secretHints[f.key]} · boş bırakırsanız korunur, "-" yazarsanız silinir` : undefined}>
                                        <TextInput id={`c-${f.key}`} type="password" autoComplete="new-password" value={conn.secrets[f.key] || ''} onChange={(e) => setConn({ ...conn, secrets: { ...conn.secrets, [f.key]: e.target.value } })} />
                                    </Field>
                                ) : (
                                    <Field key={f.key} label={f.label} htmlFor={`c-${f.key}`}><TextInput id={`c-${f.key}`} value={conn.config[f.key] || ''} onChange={(e) => setConn({ ...conn, config: { ...conn.config, [f.key]: e.target.value } })} /></Field>
                                );
                            })}
                            <Field label="Notlar" htmlFor="c-notes" className="md:col-span-2"><TextInput id="c-notes" value={conn.config.notes || ''} placeholder="Sözleşme no, sorumlu kişi, kullanım amacı…" onChange={(e) => setConn({ ...conn, config: { ...conn.config, notes: e.target.value } })} /></Field>
                        </div>
                        <Toggle id="c-disabled" checked={conn.disabled} onChange={(v) => setConn({ ...conn, disabled: v })} label="Bağlantıyı devre dışı bırak" />
                    </div>
                )}
            </Modal>

            <Modal open={Boolean(hook)} onClose={() => setHook(null)} title={hook?.id ? 'Webhook düzenle' : 'Yeni webhook'}
                footer={<><Button onClick={() => setHook(null)}>Vazgeç</Button><Button variant="primary" loading={busy === 'save-hook'} onClick={async () => { if (!hook) return; const r = await post('save-hook', { action: 'save_webhook', ...hook }, 'Webhook kaydedildi.'); if (r) { setHook(null); if (typeof r.secret === 'string' && r.secret) setRevealed({ title: 'Webhook imza anahtarı', value: r.secret }); } }}>Kaydet</Button></>}>
                {hook && (
                    <div className="space-y-3">
                        <Field label="Ad" htmlFor="h-name"><TextInput id="h-name" value={hook.name} onChange={(e) => setHook({ ...hook, name: e.target.value })} /></Field>
                        <Field label="Adres (https)" htmlFor="h-url"><TextInput id="h-url" value={hook.url} placeholder="https://…" onChange={(e) => setHook({ ...hook, url: e.target.value })} /></Field>
                        <Field label="Olaylar">
                            <div className="grid gap-1.5 sm:grid-cols-2">
                                {Object.entries(data.webhookEvents).map(([k, label]) => (
                                    <label key={k} className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" checked={hook.events.includes(k)} onChange={(e) => setHook({ ...hook, events: e.target.checked ? [...hook.events, k] : hook.events.filter((x) => x !== k) })} />{label} <span className="font-mono text-[10px] text-gray-500">{k}</span></label>
                                ))}
                            </div>
                        </Field>
                        <Toggle id="h-active" checked={hook.isActive} onChange={(v) => setHook({ ...hook, isActive: v })} label="Aktif" />
                    </div>
                )}
            </Modal>

            <Modal open={Boolean(keyForm)} onClose={() => setKeyForm(null)} title="Yeni API anahtarı"
                footer={<><Button onClick={() => setKeyForm(null)}>Vazgeç</Button><Button variant="primary" loading={busy === 'key'} onClick={async () => { if (!keyForm) return; const r = await post('key', { action: 'create_api_key', name: keyForm.name, scopes: keyForm.scopes, expiresInDays: Number(keyForm.expiresInDays) || null }); if (r && typeof r.token === 'string') { setKeyForm(null); setRevealed({ title: 'API anahtarı', value: r.token }); } }}>Oluştur</Button></>}>
                {keyForm && (
                    <div className="space-y-3">
                        <Field label="Ad" htmlFor="k-name" hint="Kim / hangi sistem kullanacak?"><TextInput id="k-name" value={keyForm.name} placeholder="Örn: KOSGEB senkronizasyonu" onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })} /></Field>
                        <Field label="Yetki kapsamları">
                            <div className="space-y-1.5">
                                {Object.entries(data.apiScopes).map(([k, label]) => (
                                    <label key={k} className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" checked={keyForm.scopes.includes(k)} onChange={(e) => setKeyForm({ ...keyForm, scopes: e.target.checked ? [...keyForm.scopes, k] : keyForm.scopes.filter((x) => x !== k) })} /><span className="font-mono">{k}</span> — {label}</label>
                                ))}
                            </div>
                        </Field>
                        <Field label="Geçerlilik (gün, boşsa süresiz)" htmlFor="k-exp"><TextInput id="k-exp" type="number" min={1} max={730} value={keyForm.expiresInDays} onChange={(e) => setKeyForm({ ...keyForm, expiresInDays: e.target.value })} /></Field>
                    </div>
                )}
            </Modal>

            <Modal open={Boolean(revealed)} onClose={() => setRevealed(null)} title={revealed?.title || ''} footer={<Button variant="primary" onClick={() => setRevealed(null)}>Kaydettim, kapat</Button>}>
                {revealed && (
                    <div className="space-y-3">
                        <Alert tone="warning">Bu değer yalnızca şimdi gösterilir. Güvenli bir yere kaydedin; daha sonra görüntülenemez.</Alert>
                        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-emerald-200 break-all">{revealed.value}</div>
                        <Button icon={Copy} onClick={() => navigator.clipboard?.writeText(revealed.value).then(() => setNotice({ tone: 'info', text: 'Panoya kopyalandı.' }))}>Kopyala</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
