"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, History, ListChecks, RotateCcw } from 'lucide-react';
import { AiConsole } from '@/components/admin/ai/AiConsole';
import { api, Badge, Card, EmptyState, formatDateTime, Skeleton, Tabs, Alert, Button } from '@/components/admin/ui';

type Capability = { id: string; name: string; description: string; domain: string; kind: string; risk: string; examples: string[]; undoable: boolean };
type Provider = { configured: boolean; provider: string | null; model: string | null; status: string };
type HistoryItem = { id: string; prompt: string; intent: string; actionName: string; risk: string; status: string; summary: string | null; userName: string | null; createdAt: string; undoable: boolean };

const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
    COMPLETED: { label: 'Tamamlandı', tone: 'success' },
    PENDING_CONFIRMATION: { label: 'Onay bekliyor', tone: 'info' },
    EXECUTING: { label: 'Çalışıyor', tone: 'info' },
    FAILED: { label: 'Başarısız', tone: 'danger' },
    ROLLED_BACK: { label: 'Geri alındı', tone: 'warning' },
    CANCELLED: { label: 'İptal', tone: 'neutral' },
    EXPIRED: { label: 'Süresi doldu', tone: 'neutral' },
};
const DOMAIN_LABEL: Record<string, string> = { CRM: 'CRM', PROGRAM: 'Program', APPLICATION: 'Başvuru', FORM: 'Form', TASK: 'Görev', EMAIL: 'E-posta', REPORT: 'Rapor', FINANCE: 'Finans', RESERVATION: 'Rezervasyon', CMS: 'Web/CMS', FACILITY: 'Alan', USER: 'Kullanıcı', NAVIGATION: 'Gezinme' };
const RISK_TONE: Record<string, 'neutral' | 'info' | 'warning' | 'danger'> = { LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'danger' };

export default function AiCommandCenterPage() {
    const [tab, setTab] = useState<'console' | 'history' | 'capabilities'>('console');
    const [caps, setCaps] = useState<{ actions: Capability[]; suggestions: string[]; provider: Provider } | null>(null);
    const [history, setHistory] = useState<HistoryItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [undoing, setUndoing] = useState<string | null>(null);

    useEffect(() => {
        api<{ actions: Capability[]; suggestions: string[]; provider: Provider }>('/api/admin/ai/chat').then(setCaps).catch((e) => setError(e instanceof Error ? e.message : 'AI yetenekleri yüklenemedi'));
    }, []);

    const loadHistory = useCallback(async () => {
        try {
            const d = await api<{ items: HistoryItem[] }>('/api/admin/ai/changesets?limit=100');
            setHistory(d.items);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Geçmiş yüklenemedi');
        }
    }, []);

    useEffect(() => {
        if (tab !== 'history') return;
        const t = setTimeout(loadHistory, 0);
        return () => clearTimeout(t);
    }, [tab, loadHistory]);

    const undo = async (id: string) => {
        setUndoing(id);
        try {
            await api('/api/admin/ai/undo', { method: 'POST', json: { changeSetId: id } });
            await loadHistory();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Geri alma başarısız');
        } finally {
            setUndoing(null);
        }
    };

    return (
        <div className="space-y-5 pb-12">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-purple-600">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-orbitron text-xl font-bold text-white">İKÜANTS AI Komuta & Operasyon Merkezi</h1>
                        <p className="text-sm text-gray-400">Bugün kurumda veya web sitesinde ne yapmak istiyorsunuz? Doğal Türkçe ile komut verin.</p>
                    </div>
                </div>
                {caps && (
                    <Badge tone={caps.provider.configured ? 'success' : 'neutral'}>
                        {caps.provider.configured ? `Dil modeli: ${caps.provider.provider} · ${caps.provider.model}` : 'Dil modeli bağlı değil — tanımlı Türkçe komutlar çalışır'}
                    </Badge>
                )}
            </div>

            {error && <Alert tone="danger" onClose={() => setError(null)}>{error}</Alert>}

            <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                    { value: 'console', label: 'Komut', icon: Sparkles },
                    { value: 'history', label: 'İşlem Geçmişi', icon: History },
                    { value: 'capabilities', label: 'Yapabildikleri', icon: ListChecks, count: caps?.actions.length ?? null },
                ]}
            />

            {tab === 'console' && (
                <Card>
                    <AiConsole variant="full" suggestions={caps?.suggestions || []} />
                    <p className="mt-4 text-[11px] text-gray-500">
                        Okuma ve arama komutları hemen çalışır. Kayıt değiştiren her işlem önce önizlenir ve onayınızla uygulanır; yetkileriniz her adımda sunucuda yeniden kontrol edilir ve işlem denetim kaydına yazılır.
                    </p>
                </Card>
            )}

            {tab === 'history' && (
                <Card padded={false}>
                    {!history ? <div className="p-4"><Skeleton /></div> : history.length === 0 ? (
                        <EmptyState icon={History} title="Henüz AI işlemi yok" description="Onaylanan veya hazırlanan AI işlemleri burada listelenir." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 text-xs text-gray-400">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Tarih</th>
                                        <th className="px-3 py-2 text-left font-medium">Komut</th>
                                        <th className="px-3 py-2 text-left font-medium">İşlem</th>
                                        <th className="px-3 py-2 text-left font-medium">Durum</th>
                                        <th className="px-3 py-2 text-left font-medium">Kullanıcı</th>
                                        <th className="px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.map((h) => (
                                        <tr key={h.id} className="text-gray-200">
                                            <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-400">{formatDateTime(h.createdAt)}</td>
                                            <td className="max-w-xs truncate px-3 py-2 text-xs" title={h.prompt}>{h.prompt}</td>
                                            <td className="px-3 py-2 text-xs">{h.actionName} <Badge tone={RISK_TONE[h.risk] || 'neutral'}>{h.risk}</Badge></td>
                                            <td className="px-3 py-2"><Badge tone={STATUS[h.status]?.tone || 'neutral'}>{STATUS[h.status]?.label || h.status}</Badge></td>
                                            <td className="px-3 py-2 text-xs text-gray-400">{h.userName || '—'}</td>
                                            <td className="px-3 py-2 text-right">
                                                {h.undoable && <Button size="sm" icon={RotateCcw} loading={undoing === h.id} onClick={() => undo(h.id)}>Geri al</Button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {tab === 'capabilities' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {!caps ? <Skeleton /> : caps.actions.map((a) => (
                        <Card key={a.id}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-sm font-semibold text-white">{a.name}</div>
                                <div className="flex gap-1">
                                    <Badge>{DOMAIN_LABEL[a.domain] || a.domain}</Badge>
                                    <Badge tone={RISK_TONE[a.risk] || 'neutral'}>{a.risk}</Badge>
                                    {['READ', 'SEARCH', 'ANALYZE', 'NAVIGATE'].includes(a.kind) ? <Badge tone="success">Okuma</Badge> : <Badge tone="info">{a.undoable ? 'Onaylı · geri alınabilir' : 'Onaylı · geri alınamaz'}</Badge>}
                                </div>
                            </div>
                            <p className="mt-1.5 text-xs text-gray-400">{a.description}</p>
                            {a.examples.length > 0 && <p className="mt-2 text-[11px] text-gray-500">Örnek: “{a.examples[0]}”</p>}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
