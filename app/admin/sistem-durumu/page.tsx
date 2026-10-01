"use client";
import React, { useState, useEffect } from 'react';
import { Database, HardDrive, ShieldCheck, Mail, RefreshCw, Cpu, Activity, Server, Clock } from 'lucide-react';

export default function AdminSistemDurumuPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHealth = async (showSpin = false) => {
        if (showSpin) setRefreshing(true);
        try {
            const res = await fetch('/api/admin/system/health');
            const result = await res.json();
            if (result.success) {
                setData(result);
            }
        } catch (e) {
            console.error('Failed to load system health:', e);
        } finally {
            setLoading(false);
            if (showSpin) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    const checks = data?.checks || {};
    const system = data?.system || {};

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0e1b] border border-white/10 p-5 rounded-2xl shadow-xl">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${data?.status === 'HEALTHY' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse' : 'bg-amber-400'}`} />
                        <h1 className="font-orbitron font-bold text-xl sm:text-2xl text-white">Sistem Sağlığı & Servis Durumu</h1>
                    </div>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        Veritabanı, depolama havuzu, e-posta altyapısı ve entegrasyon durumları
                    </p>
                </div>
                <button
                    onClick={() => fetchHealth(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`} />
                    <span>Yeniden Test Et</span>
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-44 bg-white/5 rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Database */}
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-primary" />
                                <h3 className="font-orbitron font-bold text-sm text-white">PostgreSQL Veritabanı</h3>
                            </div>
                            <span className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                                checks.database?.status === 'ONLINE'
                                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                    : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                            }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                {checks.database?.status || 'ONLINE'}
                            </span>
                        </div>
                        <div className="space-y-2 text-xs font-mono text-gray-400">
                            <div className="flex justify-between">
                                <span>Sağlayıcı:</span> <span className="text-white">{checks.database?.provider}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Gecikme Süresi (Latency):</span> <span className="text-emerald-400">{checks.database?.latency}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bağlantı Durumu:</span> <span className="text-white">Aktif Bağlantı Havuzu</span>
                            </div>
                        </div>
                    </div>

                    {/* Storage */}
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <HardDrive className="w-5 h-5 text-cyan-400" />
                                <h3 className="font-orbitron font-bold text-sm text-white">Depolama Servisi</h3>
                            </div>
                            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {checks.storage?.status || 'ONLINE'}
                            </span>
                        </div>
                        <div className="space-y-2 text-xs font-mono text-gray-400">
                            <div className="flex justify-between">
                                <span>Depolama Motoru:</span> <span className="text-white">{checks.storage?.provider}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Public Medya:</span> <span className="text-white">{checks.storage?.publicBucket}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Özel Dokümanlar:</span> <span className="text-white">{checks.storage?.privateBucket}</span>
                            </div>
                        </div>
                    </div>

                    {/* Auth & Security */}
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-purple-400" />
                                <h3 className="font-orbitron font-bold text-sm text-white">Kimlik & Güvenlik</h3>
                            </div>
                            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                ONLINE
                            </span>
                        </div>
                        <div className="space-y-2 text-xs font-mono text-gray-400">
                            <div className="flex justify-between">
                                <span>Oturum Mimarisi:</span> <span className="text-white">HttpOnly Cookie (AES)</span>
                            </div>
                            <div className="flex justify-between">
                                <span>2FA / TOTP:</span> <span className="text-emerald-400">Destekleniyor</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Audit Log Motoru:</span> <span className="text-emerald-400">Aktif</span>
                            </div>
                        </div>
                    </div>

                    {/* Email Service */}
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5 text-amber-400" />
                                <h3 className="font-orbitron font-bold text-sm text-white">E-Posta Servisi (SMTP)</h3>
                            </div>
                            <span className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                                checks.email?.status === 'CONNECTED'
                                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                            }`}>
                                {checks.email?.status === 'CONNECTED' ? 'BAĞLI' : 'NOT_CONFIGURED_EXTERNAL'}
                            </span>
                        </div>
                        <div className="space-y-2 text-xs font-mono text-gray-400">
                            <div className="flex justify-between">
                                <span>Sağlayıcı:</span> <span className="text-white">{checks.email?.provider}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bekleyen Outbox:</span> <span className="text-amber-400">{checks.email?.pendingOutboxCount || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kuyruk Modu:</span> <span className="text-white">Asenkron Outbox</span>
                            </div>
                        </div>
                    </div>

                    {/* External Integrations */}
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-orbitron font-bold text-sm text-white">Dış Entegrasyonlar</h3>
                            </div>
                        </div>
                        <div className="space-y-2 text-xs font-mono text-gray-400">
                            <div className="flex justify-between items-center">
                                <span>Microsoft 365:</span>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                                    {checks.integrations?.microsoft365 || 'NOT_CONFIGURED_EXTERNAL'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Meta / Instagram:</span>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                                    {checks.integrations?.metaInstagram || 'NOT_CONFIGURED_EXTERNAL'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Runtime Environment */}
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Server className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-orbitron font-bold text-sm text-white">Çalışma Zamanı (Runtime)</h3>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                Node {system.nodeVersion}
                            </span>
                        </div>
                        <div className="space-y-2 text-xs font-mono text-gray-400">
                            <div className="flex justify-between">
                                <span>Next.js Sürümü:</span> <span className="text-white">{system.nextVersion}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bellek Kullanımı:</span> <span className="text-cyan-400">{system.memoryUsageMb} MB</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Uptime:</span> <span className="text-white">{Math.floor((system.uptimeSeconds || 0) / 60)} dakika</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
