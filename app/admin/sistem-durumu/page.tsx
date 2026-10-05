"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Database, HardDrive, ShieldCheck, Mail, RefreshCw, Activity, Server, Clock, Bot } from 'lucide-react';

type Service = { key: string; label: string; status: 'OK' | 'PENDING_EXTERNAL_CONFIGURATION' | 'WARNING' | 'ERROR'; detail: string; facts?: Record<string, string | number | null> };
type Health = { status: string; timestamp: string; services: Service[]; system: { nodeVersion: string; nextVersion: string; environment: string; uptimeSeconds: number; memoryUsageMb: number; platform: string } };

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = { database: Database, storage: HardDrive, security: ShieldCheck, email: Mail, scheduler: Clock, ai: Bot, integrations: Activity };
const STATUS: Record<Service['status'], { label: string; cls: string }> = {
    OK: { label: 'Çalışıyor', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
    PENDING_EXTERNAL_CONFIGURATION: { label: 'Yapılandırma bekliyor', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
    WARNING: { label: 'Uyarı', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
    ERROR: { label: 'Hata', cls: 'text-rose-300 bg-rose-500/10 border-rose-500/30' },
};

export default function AdminSistemDurumuPage() {
    const [data, setData] = useState<Health | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/admin/system/health', { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Sistem durumu alınamadı');
            setData(json);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Sistem durumu alınamadı');
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d0e1b] p-5 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className={`h-3 w-3 rounded-full ${data?.status === 'HEALTHY' ? 'bg-emerald-400' : data ? 'bg-rose-400' : 'bg-gray-500'}`} />
                        <h1 className="font-orbitron text-xl font-bold text-white sm:text-2xl">Sistem Sağlığı & Servis Durumu</h1>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">Veritabanı, depolama, güvenlik, e-posta, zamanlayıcı, AI ve dış entegrasyonların canlı durumu{data ? ` · ${new Date(data.timestamp).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}` : ''}</p>
                </div>
                <button type="button" onClick={load} disabled={refreshing} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Yeniden test et
                </button>
            </div>

            {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div>}

            {!data && !error ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/5" />)}</div>
            ) : data && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {data.services.map((s) => {
                        const Icon = ICONS[s.key] || Activity;
                        return (
                            <div key={s.key} className="rounded-2xl border border-white/10 bg-[#0e0e18] p-5">
                                <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-5 w-5 text-gray-300" />
                                        <h3 className="font-orbitron text-sm font-bold text-white">{s.label}</h3>
                                    </div>
                                    <span className={`whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-semibold ${STATUS[s.status].cls}`}>{STATUS[s.status].label}</span>
                                </div>
                                <p className="mb-3 text-xs text-gray-400">{s.detail}</p>
                                {s.facts && (
                                    <dl className="space-y-1.5 text-xs">
                                        {Object.entries(s.facts).map(([k, v]) => (
                                            <div key={k} className="flex justify-between gap-3">
                                                <dt className="text-gray-500">{k}</dt>
                                                <dd className="min-w-0 break-all text-right text-gray-200">{v === null || v === undefined || v === '' ? '—' : String(v)}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}
                            </div>
                        );
                    })}
                    <div className="rounded-2xl border border-white/10 bg-[#0e0e18] p-5">
                        <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
                            <Server className="h-5 w-5 text-gray-300" />
                            <h3 className="font-orbitron text-sm font-bold text-white">Çalışma Zamanı</h3>
                        </div>
                        <dl className="space-y-1.5 text-xs">
                            {[
                                ['Ortam', data.system.environment],
                                ['Node.js', data.system.nodeVersion],
                                ['Next.js', data.system.nextVersion],
                                ['Bellek', `${data.system.memoryUsageMb} MB`],
                                ['Çalışma süresi', `${Math.floor(data.system.uptimeSeconds / 60)} dakika`],
                                ['Platform', data.system.platform],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-3"><dt className="text-gray-500">{k}</dt><dd className="text-gray-200">{v}</dd></div>
                            ))}
                        </dl>
                    </div>
                </div>
            )}
        </div>
    );
}
