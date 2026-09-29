"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Users, Lock, Key, RefreshCw, CheckCircle2, Search, Filter } from 'lucide-react';

interface SecurityMetrics {
    totalUsers: number;
    superAdmins: number;
    mfaEnabledCount: number;
    lockedAccountsCount: number;
    unresolvedEventsCount: number;
    failedLoginsLast24h: number;
    activeSessionsCount: number;
}

interface SecurityEvent {
    id: string;
    type: string;
    severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    userId?: string | null;
    userEmail?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    details?: any;
    isResolved: boolean;
    resolvedAt?: string | null;
    createdAt: string;
}

export default function SecurityCenterPage() {
    const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [unresolvedOnly, setUnresolvedOnly] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchSecurityData = async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (severityFilter !== 'ALL') queryParams.append('severity', severityFilter);
            if (unresolvedOnly) queryParams.append('unresolved', 'true');

            const res = await fetch(`/api/admin/security?${queryParams.toString()}`);
            const data = await res.json();
            if (data.metrics) setMetrics(data.metrics);
            if (data.events) setEvents(data.events);
        } catch {
            setMessage({ type: 'error', text: 'Güvenlik verileri yüklenirken hata oluştu' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSecurityData();
    }, [severityFilter, unresolvedOnly]);

    const handleResolveEvent = async (id: string) => {
        try {
            const res = await fetch('/api/admin/security', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'resolve_event', eventId: id }),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Güvenlik olayı çözümlendi olarak işaretlendi' });
                fetchSecurityData();
            }
        } catch {
            setMessage({ type: 'error', text: 'İşlem başarısız' });
        }
    };

    const getSeverityBadge = (severity: SecurityEvent['severity']) => {
        switch (severity) {
            case 'CRITICAL':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                        CRITICAL
                    </span>
                );
            case 'HIGH':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        HIGH
                    </span>
                );
            case 'MEDIUM':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        MEDIUM
                    </span>
                );
            case 'LOW':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        LOW
                    </span>
                );
            case 'INFO':
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        INFO
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-orbitron text-white tracking-wide flex items-center gap-3">
                        <ShieldAlert className="w-7 h-7 text-rose-500" />
                        Güvenlik & Tehdit İzleme Merkezi
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Sistem çapındaki kimlik doğrulama anomalilerini, brute-force girişimlerini ve yetkilendirme olaylarını denetleyin.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchSecurityData}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 text-xs font-semibold flex items-center gap-2 transition"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Yenile
                    </button>
                </div>
            </div>

            {/* Alert Message */}
            {message && (
                <div
                    className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
                        message.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Metrics KPI */}
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="p-4 bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl">
                        <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-primary" /> Toplam Admin
                        </div>
                        <div className="text-2xl font-bold font-orbitron text-white mt-1">
                            {metrics.totalUsers}
                        </div>
                    </div>
                    <div className="p-4 bg-[#090912]/80 border border-purple-500/20 rounded-2xl backdrop-blur-xl">
                        <div className="text-[10px] font-mono text-purple-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Super Admin
                        </div>
                        <div className="text-2xl font-bold font-orbitron text-purple-300 mt-1">
                            {metrics.superAdmins}
                        </div>
                    </div>
                    <div className="p-4 bg-[#090912]/80 border border-emerald-500/20 rounded-2xl backdrop-blur-xl">
                        <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-emerald-400" /> 2FA/MFA Aktif
                        </div>
                        <div className="text-2xl font-bold font-orbitron text-emerald-300 mt-1">
                            {metrics.mfaEnabledCount}
                        </div>
                    </div>
                    <div className="p-4 bg-[#090912]/80 border border-blue-500/20 rounded-2xl backdrop-blur-xl">
                        <div className="text-[10px] font-mono text-blue-400 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-blue-400" /> Aktif Oturum
                        </div>
                        <div className="text-2xl font-bold font-orbitron text-blue-300 mt-1">
                            {metrics.activeSessionsCount}
                        </div>
                    </div>
                    <div className="p-4 bg-[#090912]/80 border border-amber-500/20 rounded-2xl backdrop-blur-xl">
                        <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Kilitli Hesap
                        </div>
                        <div className="text-2xl font-bold font-orbitron text-amber-300 mt-1">
                            {metrics.lockedAccountsCount}
                        </div>
                    </div>
                    <div className="p-4 bg-[#090912]/80 border border-rose-500/20 rounded-2xl backdrop-blur-xl">
                        <div className="text-[10px] font-mono text-rose-400 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Hatalı Giriş (24s)
                        </div>
                        <div className="text-2xl font-bold font-orbitron text-rose-300 mt-1">
                            {metrics.failedLoginsLast24h}
                        </div>
                    </div>
                    <div className="p-4 bg-[#090912]/80 border border-red-500/30 rounded-2xl backdrop-blur-xl">
                        <div className="text-[10px] font-mono text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Çözüm Bekleyen
                        </div>
                        <div className="text-2xl font-bold font-orbitron text-red-300 mt-1">
                            {metrics.unresolvedEventsCount}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="p-4 bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={unresolvedOnly}
                            onChange={(e) => setUnresolvedOnly(e.target.checked)}
                            className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                        />
                        Sadece Çözümlenmemiş Olayları Göster
                    </label>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                    <Filter className="w-4 h-4 text-gray-400" />
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => (
                        <button
                            key={sev}
                            onClick={() => setSeverityFilter(sev)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                severityFilter === sev
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {sev}
                        </button>
                    ))}
                </div>
            </div>

            {/* Security Events Table */}
            <div className="bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-gray-400 border-b border-white/10 font-mono uppercase text-[10px]">
                            <tr>
                                <th className="p-4">Seviye</th>
                                <th className="p-4">Olay Tipi</th>
                                <th className="p-4">Kullanıcı</th>
                                <th className="p-4">IP / Tarayıcı</th>
                                <th className="p-4">Detay</th>
                                <th className="p-4">Zaman</th>
                                <th className="p-4 text-right">Durum / İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : events.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Kayıtlı güvenlik olayı bulunmuyor.
                                    </td>
                                </tr>
                            ) : (
                                events.map((ev) => (
                                    <tr key={ev.id} className="hover:bg-white/[0.02] transition">
                                        <td className="p-4">{getSeverityBadge(ev.severity)}</td>
                                        <td className="p-4 font-mono font-bold text-white">
                                            {ev.type}
                                        </td>
                                        <td className="p-4 text-gray-300 font-mono text-[11px]">
                                            {ev.userEmail || ev.userId || '—'}
                                        </td>
                                        <td className="p-4 font-mono text-gray-400 text-[11px]">
                                            <div>{ev.ipAddress || '—'}</div>
                                            <div className="text-[10px] text-gray-500 max-w-xs truncate">
                                                {ev.userAgent || ''}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-300 text-[11px] max-w-xs truncate font-mono">
                                            {ev.details ? JSON.stringify(ev.details) : '—'}
                                        </td>
                                        <td className="p-4 font-mono text-gray-400 text-[11px]">
                                            {new Date(ev.createdAt).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="p-4 text-right">
                                            {ev.isResolved ? (
                                                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                                                    Çözümlendi
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleResolveEvent(ev.id)}
                                                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-[11px] font-semibold transition"
                                                >
                                                    Çözüldü İşaretle
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
