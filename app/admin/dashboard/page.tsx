"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users, UserCheck, Rocket, FileText, Mail, Plus, AlertCircle,
    TrendingUp, Calendar, Clock, ArrowRight, ShieldCheck, Newspaper,
    CheckCircle2, Sparkles, Filter, Activity, RefreshCw, Receipt,
    Layers, Search, CheckSquare, Eye, ExternalLink, HelpCircle
} from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';

export default function AdminDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeframe, setTimeframe] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchDashboard = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setRefreshing(true);
        try {
            const res = await fetch('/api/admin/dashboard');
            const result = await res.json();
            if (result.success) {
                setData(result);
                setLastUpdated(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            }
        } catch (e) {
            console.error('Failed to load dashboard:', e);
        } finally {
            setLoading(false);
            if (showRefreshIndicator) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex justify-between items-center bg-[#0d0e1b]/90 border border-white/10 p-5 rounded-2xl">
                    <div>
                        <h1 className="font-orbitron font-bold text-xl sm:text-2xl text-white tracking-wide">
                            Operasyon & Yönetim Merkezi
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">Veriler yükleniyor...</p>
                    </div>
                    <div className="h-8 bg-white/5 rounded-xl w-32" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-28 bg-white/5 rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 h-64 bg-white/5 rounded-2xl" />
                    <div className="lg:col-span-8 h-64 bg-white/5 rounded-2xl" />
                </div>
            </div>
        );
    }

    const metrics = data?.metrics || {};
    const attentionItems = data?.attentionItems || [];
    const recentAuditLogs = data?.recentAuditLogs || [];
    const recentNews = data?.recentNews || [];
    const recentApplications = data?.recentApplications || [];

    const statsCards = [
        {
            title: 'Girişimciler',
            value: metrics.totalEntrepreneurs || 0,
            sub: `${metrics.activeEntrepreneurs || 0} Aktif Girişim`,
            icon: Rocket,
            color: 'text-purple-400',
            bg: 'from-purple-500/15 via-purple-500/5 to-transparent',
            border: 'border-purple-500/25',
            badgeBg: 'bg-purple-500/10 text-purple-300',
            href: '/admin/girisimciler',
        },
        {
            title: 'Mentörler',
            value: metrics.totalMentors || 0,
            sub: `${metrics.activeMentors || 0} Aktif Rehber`,
            icon: UserCheck,
            color: 'text-cyan-400',
            bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
            border: 'border-cyan-500/25',
            badgeBg: 'bg-cyan-500/10 text-cyan-300',
            href: '/admin/mentorler',
        },
        {
            title: 'Başvurular',
            value: metrics.totalApplications || 0,
            sub: `${metrics.newApplications || 0} Yeni • ${metrics.underReviewApplications || 0} İncelemede`,
            icon: FileText,
            color: 'text-emerald-400',
            bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
            border: 'border-emerald-500/25',
            badgeBg: 'bg-emerald-500/10 text-emerald-300',
            href: '/admin/basvurular',
        },
        {
            title: 'Kira & Sözleşme',
            value: metrics.activeRentContracts || 0,
            sub: 'Aktif Tahakkuk Sözleşmesi',
            icon: Receipt,
            color: 'text-amber-400',
            bg: 'from-amber-500/15 via-amber-500/5 to-transparent',
            border: 'border-amber-500/25',
            badgeBg: 'bg-amber-500/10 text-amber-300',
            href: '/admin/finans/kiralar',
        },
        {
            title: 'Programlar',
            value: metrics.totalPrograms || 0,
            sub: `${metrics.activePrograms || 0} Aktif Süreç`,
            icon: Layers,
            color: 'text-indigo-400',
            bg: 'from-indigo-500/15 via-indigo-500/5 to-transparent',
            border: 'border-indigo-500/25',
            badgeBg: 'bg-indigo-500/10 text-indigo-300',
            href: '/admin/programlar',
        },
        {
            title: 'İletişim & Talep',
            value: metrics.totalContacts || 0,
            sub: `${metrics.newContacts || 0} Bekleyen Mesaj`,
            icon: Mail,
            color: 'text-rose-400',
            bg: 'from-rose-500/15 via-rose-500/5 to-transparent',
            border: 'border-rose-500/25',
            badgeBg: 'bg-rose-500/10 text-rose-300',
            href: '/admin/iletisim',
        },
    ];

    const quickShortcuts = [
        { label: 'Girişimci Ekle', href: '/admin/girisimciler?action=create', icon: Rocket, color: 'hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-300' },
        { label: 'Mentör Ekle', href: '/admin/mentorler?action=create', icon: UserCheck, color: 'hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-300' },
        { label: 'Program Başlat', href: '/admin/programlar', icon: Layers, color: 'hover:border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-300' },
        { label: 'Kira Yönetimi', href: '/admin/finans/kiralar', icon: Receipt, color: 'hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-300' },
        { label: 'Haber & Duyuru', href: '/admin/haberler?action=create', icon: Newspaper, color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-300' },
        { label: 'Görevler & Kanban', href: '/admin/gorevler/kanban', icon: CheckSquare, color: 'hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-300' },
    ];

    return (
        <div className="space-y-6 pb-12">
            {/* Top Control Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#0d0e1b]/90 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-xl shadow-xl">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50" />
                        <h1 className="font-orbitron font-bold text-xl sm:text-2xl text-white tracking-wide">
                            Operasyon & Yönetim Merkezi
                        </h1>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                        <span>İKÜANTS TEKMER Girişimcilik & Finans Portalı</span>
                        {lastUpdated && (
                            <span className="text-[10px] font-mono text-gray-500 border-l border-white/10 pl-2">
                                Son Güncelleme: {lastUpdated}
                            </span>
                        )}
                    </p>
                </div>

                {/* Right Side: Refresh & Timeframe & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
                    <button
                        onClick={() => fetchDashboard(true)}
                        disabled={refreshing}
                        title="Verileri Yenile"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
                    </button>

                    {/* Timeframe Selector Pills */}
                    <div className="inline-flex items-center bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
                        {(['all', 'today', 'week', 'month'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                                    timeframe === t
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {t === 'all' ? 'Tümü' : t === 'today' ? 'Bugün' : t === 'week' ? 'Bu Hafta' : 'Bu Ay'}
                            </button>
                        ))}
                    </div>

                    <Link
                        href="/admin/basvurular"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-bold transition-all shadow-md shadow-primary/20 hover:scale-105 active:scale-95"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Başvuru Pipeline</span>
                    </Link>
                </div>
            </div>

            {/* Attention Needed Section ("Dikkat Gerektirenler") */}
            {attentionItems.length > 0 && (
                <div className="bg-gradient-to-r from-amber-950/40 via-[#151210] to-[#0e0e18] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 text-amber-400">
                            <AlertCircle className="w-4 h-4" />
                            <h2 className="font-orbitron font-bold text-xs uppercase tracking-wider text-amber-300">
                                Acil Dikkat Gerektiren Maddeler ({attentionItems.length})
                            </h2>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Aksiyon Bekliyor
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {attentionItems.map((item: any, idx: number) => (
                            <Link
                                key={idx}
                                href={item.actionUrl}
                                className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-amber-500/20 hover:border-amber-400/60 hover:bg-amber-950/20 transition-all text-xs text-gray-200 hover:text-white group"
                            >
                                <div className="flex items-center gap-2.5 truncate pr-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                </div>
                                <span className="text-[10px] font-mono text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                                    İncele →
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Key Metrics Overview Grid (6 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                {statsCards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <Link
                            key={c.title}
                            href={c.href}
                            className={`p-4 rounded-2xl bg-gradient-to-br ${c.bg} bg-[#0e0f1e]/80 border ${c.border} hover:border-white/30 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-black/40 group relative overflow-hidden flex flex-col justify-between`}
                        >
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">
                                    {c.title}
                                </span>
                                <div className={`p-2 rounded-xl bg-black/40 border border-white/5 ${c.color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="font-orbitron font-black text-2xl sm:text-3xl text-white mb-1.5">
                                {c.value}
                            </div>
                            <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
                                <span className="truncate">{c.sub}</span>
                                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-white flex-shrink-0 ml-1" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Middle Two-Column Grid: Pipeline Status & Recent Applications */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Application Pipeline Breakdown (5 cols) */}
                <div className="lg:col-span-5 bg-[#0e0f1e] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                <h3 className="font-orbitron font-bold text-sm text-white">Başvuru Huni Dağılımı</h3>
                            </div>
                            <Link href="/admin/basvurular" className="text-xs text-primary hover:underline font-mono">
                                Kanban Görünümü →
                            </Link>
                        </div>

                        <div className="space-y-2.5">
                            <Link
                                href="/admin/basvurular?status=NEW"
                                className="p-3 rounded-xl bg-black/40 border border-blue-500/20 hover:border-blue-500/40 flex items-center justify-between text-xs transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                                    <span className="text-gray-200 group-hover:text-white font-medium">Yeni Başvurular</span>
                                </div>
                                <span className="font-orbitron font-bold text-sm text-blue-400">{metrics.newApplications || 0}</span>
                            </Link>

                            <Link
                                href="/admin/basvurular?status=UNDER_EVALUATION"
                                className="p-3 rounded-xl bg-black/40 border border-amber-500/20 hover:border-amber-500/40 flex items-center justify-between text-xs transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span className="text-gray-200 group-hover:text-white font-medium">İnceleme & Değerlendirme</span>
                                </div>
                                <span className="font-orbitron font-bold text-sm text-amber-400">{metrics.underReviewApplications || 0}</span>
                            </Link>

                            <Link
                                href="/admin/basvurular?status=ACCEPTED"
                                className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-between text-xs transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-gray-200 group-hover:text-white font-medium">Kabul Edilen Girişimler</span>
                                </div>
                                <span className="font-orbitron font-bold text-sm text-emerald-400">{metrics.acceptedApplications || 0}</span>
                            </Link>

                            <Link
                                href="/admin/basvurular?status=REJECTED"
                                className="p-3 rounded-xl bg-black/40 border border-rose-500/20 hover:border-rose-500/40 flex items-center justify-between text-xs transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                                    <span className="text-gray-200 group-hover:text-white font-medium">Reddedilen Başvurular</span>
                                </div>
                                <span className="font-orbitron font-bold text-sm text-rose-400">{metrics.rejectedApplications || 0}</span>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
                        <Link
                            href="/admin/basvurular"
                            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-center text-gray-300 hover:text-white transition-colors"
                        >
                            Tüm Başvuruları Yönet
                        </Link>
                        <Link
                            href="/admin/durumlar"
                            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-center text-gray-300 hover:text-white transition-colors"
                            title="Pipeline Aşamalarını Yapılandır"
                        >
                            Aşama Ayarları
                        </Link>
                    </div>
                </div>

                {/* Right: Son Gelen Başvurular Listesi (7 cols) */}
                <div className="lg:col-span-7 bg-[#0e0f1e] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-400" />
                                <h3 className="font-orbitron font-bold text-sm text-white">Son Başvurular</h3>
                            </div>
                            <Link href="/admin/basvurular" className="text-xs text-primary hover:underline font-mono">
                                Listeye Git →
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {recentApplications.length === 0 ? (
                                <div className="text-xs text-gray-500 py-8 text-center bg-black/20 rounded-xl">
                                    Henüz kayıtlı başvuru bulunmuyor.
                                </div>
                            ) : (
                                recentApplications.map((app: any) => (
                                    <Link
                                        key={app.id}
                                        href={`/admin/basvurular?id=${app.id}`}
                                        className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-primary/40 flex items-center justify-between text-xs transition-all group"
                                    >
                                        <div className="flex items-center gap-3 truncate pr-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-orbitron font-bold text-primary text-xs flex-shrink-0">
                                                {app.companyName ? app.companyName.charAt(0).toUpperCase() : app.applicantName?.charAt(0).toUpperCase() || 'B'}
                                            </div>
                                            <div className="truncate">
                                                <div className="font-semibold text-gray-200 group-hover:text-white truncate">
                                                    {app.companyName || app.applicantName || 'Başvuru'}
                                                </div>
                                                <div className="text-[11px] text-gray-400 truncate">
                                                    {app.programName || app.program?.title || app.applicantEmail || 'Genel Başvuru'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <StatusBadge status={app.status || 'NEW'} />
                                            <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
                                                {new Date(app.createdAt).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5">
                        <Link
                            href="/admin/girisimciler"
                            className="w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-xs font-semibold text-center block text-purple-300 transition-colors"
                        >
                            Kayıtlı Girişimcileri Görüntüle ({metrics.totalEntrepreneurs || 0})
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions Shortcuts Bar */}
            <div className="bg-[#0e0f1e] border border-white/10 rounded-2xl p-5 shadow-xl">
                <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">
                    Hızlı İşlem Kısayolları
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {quickShortcuts.map((q) => {
                        const Icon = q.icon;
                        return (
                            <Link
                                key={q.label}
                                href={q.href}
                                className={`p-3 rounded-xl bg-black/40 border border-white/5 transition-all text-xs flex items-center gap-2 font-medium ${q.color} shadow-sm active:scale-95`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{q.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Row: Audit Logs & Recent News */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Audit Logs (7 cols) */}
                <div className="lg:col-span-7 bg-[#0e0f1e] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            <h3 className="font-orbitron font-bold text-sm text-white">Yönetici Hareketleri (Audit Log)</h3>
                        </div>
                        <Link href="/admin/audit-log" className="text-xs text-primary hover:underline font-mono">
                            Tüm Loglar →
                        </Link>
                    </div>

                    <div className="space-y-2.5">
                        {recentAuditLogs.length === 0 ? (
                            <div className="text-xs text-gray-500 py-6 text-center">Henüz aktivite kaydı yok.</div>
                        ) : (
                            recentAuditLogs.map((log: any) => (
                                <div
                                    key={log.id}
                                    className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                            {log.action}
                                        </span>
                                        <div>
                                            <div className="font-medium text-gray-200">
                                                {log.entityType} {log.diff ? `• ${log.diff}` : ''}
                                            </div>
                                            <div className="text-[10px] font-mono text-gray-500">
                                                {log.actorName || log.actorEmail || 'Sistem'}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-500">
                                        {new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* News & CMS Overview (5 cols) */}
                <div className="lg:col-span-5 bg-[#0e0f1e] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Newspaper className="w-4 h-4 text-purple-400" />
                                <h3 className="font-orbitron font-bold text-sm text-white">Haberler & Yayınlar</h3>
                            </div>
                            <Link href="/admin/haberler" className="text-xs text-primary hover:underline font-mono">
                                Haberler →
                            </Link>
                        </div>

                        <div className="space-y-2.5">
                            {recentNews.length === 0 ? (
                                <div className="text-xs text-gray-500 py-6 text-center">Henüz haber eklenmemiş.</div>
                            ) : (
                                recentNews.map((n: any) => (
                                    <Link
                                        key={n.id}
                                        href={`/admin/haberler?id=${n.id}`}
                                        className="p-3 rounded-xl bg-black/30 border border-white/5 hover:border-purple-500/30 flex items-center justify-between text-xs transition-colors group"
                                    >
                                        <div className="truncate pr-2">
                                            <div className="font-medium text-gray-200 group-hover:text-white truncate">
                                                {n.title}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono">
                                                {n.category?.name || 'Genel'} • {new Date(n.createdAt).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                        <StatusBadge status={n.status || 'PUBLISHED'} />
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
                        <Link
                            href="/admin/haberler?action=create"
                            className="w-full py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-xs font-semibold text-center block text-primary transition-colors"
                        >
                            + Yeni Haber Oluştur
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
