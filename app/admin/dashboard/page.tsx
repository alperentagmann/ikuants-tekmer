"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users, UserCheck, Rocket, FileText, Mail, Plus, AlertCircle,
    TrendingUp, Calendar, Clock, ArrowRight, ShieldCheck, Newspaper,
    CheckCircle2, Sparkles, Filter, Activity
} from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';

export default function AdminDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetch('/api/admin/dashboard');
                const result = await res.json();
                if (result.success) {
                    setData(result);
                }
            } catch (e) {
                console.error('Failed to load dashboard:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-white/5 rounded-xl w-64" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-white/5 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    const metrics = data?.metrics || {};
    const attentionItems = data?.attentionItems || [];
    const recentAuditLogs = data?.recentAuditLogs || [];
    const recentNews = data?.recentNews || [];

    const statsCards = [
        {
            title: 'Toplam Girişimci',
            value: metrics.totalEntrepreneurs || 0,
            sub: `${metrics.activeEntrepreneurs || 0} Aktif`,
            icon: Rocket,
            color: 'text-purple-400',
            bg: 'from-purple-500/10 to-indigo-500/5',
            border: 'border-purple-500/20',
            href: '/admin/girisimciler',
        },
        {
            title: 'Mentör Kadrosu',
            value: metrics.totalMentors || 0,
            sub: `${metrics.activeMentors || 0} Aktif`,
            icon: UserCheck,
            color: 'text-cyan-400',
            bg: 'from-cyan-500/10 to-blue-500/5',
            border: 'border-cyan-500/20',
            href: '/admin/mentorler',
        },
        {
            title: 'Girişim Başvuruları',
            value: metrics.totalApplications || 0,
            sub: `${metrics.newApplications || 0} Yeni • ${metrics.underReviewApplications || 0} İncelemede`,
            icon: FileText,
            color: 'text-emerald-400',
            bg: 'from-emerald-500/10 to-teal-500/5',
            border: 'border-emerald-500/20',
            href: '/admin/basvurular',
        },
        {
            title: 'İletişim & Talepler',
            value: metrics.totalContacts || 0,
            sub: `${metrics.newContacts || 0} Yanıt Bekliyor`,
            icon: Mail,
            color: 'text-amber-400',
            bg: 'from-amber-500/10 to-orange-500/5',
            border: 'border-amber-500/20',
            href: '/admin/iletisim',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header / Quick Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white tracking-wide">
                        Genel Yönetim Paneli
                    </h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        İKÜANTS TEKMER Operasyon, CMS ve CRM Yönetim Merkezi
                    </p>
                </div>

                {/* Quick Add Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/admin/girisimciler?action=create"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white border border-purple-500/20 text-xs font-semibold transition-all shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Girişimci Ekle
                    </Link>
                    <Link
                        href="/admin/mentorler?action=create"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-500/20 text-xs font-semibold transition-all shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Mentör Ekle
                    </Link>
                    <Link
                        href="/admin/haberler?action=create"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 text-xs font-semibold transition-all shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Haber Ekle
                    </Link>
                </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <Link
                            key={c.title}
                            href={c.href}
                            className={`p-5 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} hover:scale-[1.02] transition-all shadow-lg shadow-black/40 group relative overflow-hidden`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-gray-400">{c.title}</span>
                                <div className={`p-2.5 rounded-xl bg-black/40 border border-white/5 ${c.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="font-orbitron font-bold text-3xl text-white mb-1">
                                {c.value}
                            </div>
                            <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
                                <span>{c.sub}</span>
                                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-white" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Attention Needed Section ("Dikkat Gerektirenler") */}
            {attentionItems.length > 0 && (
                <div className="bg-[#0e0e18] border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-3 text-amber-400">
                        <AlertCircle className="w-5 h-5" />
                        <h2 className="font-orbitron font-bold text-sm text-white">Dikkat Gerektirenler</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {attentionItems.map((item: any, idx: number) => (
                            <Link
                                key={idx}
                                href={item.actionUrl}
                                className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/40 transition-all text-xs text-gray-300 hover:text-white"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                    <span>{item.title}</span>
                                </div>
                                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold">
                                    İncele →
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Two Column Grid: Pipeline Status & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Application Pipeline Overview (5 cols) */}
                <div className="lg:col-span-5 bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                <h3 className="font-orbitron font-bold text-sm text-white">Başvuru Durum Dağılımı</h3>
                            </div>
                            <Link href="/admin/basvurular" className="text-xs text-primary hover:underline font-mono">
                                Kanban Görünümü →
                            </Link>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                                <span className="text-blue-400 font-semibold">Yeni Başvurular</span>
                                <span className="font-orbitron font-bold text-sm text-white">{metrics.newApplications || 0}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                                <span className="text-amber-400 font-semibold">İnceleme & Değerlendirmede</span>
                                <span className="font-orbitron font-bold text-sm text-white">{metrics.underReviewApplications || 0}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                                <span className="text-emerald-400 font-semibold">Kabul Edilen Girişimler</span>
                                <span className="font-orbitron font-bold text-sm text-white">{metrics.acceptedApplications || 0}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                                <span className="text-rose-400 font-semibold">Reddedilenler</span>
                                <span className="font-orbitron font-bold text-sm text-white">{metrics.rejectedApplications || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5">
                        <Link
                            href="/admin/basvurular"
                            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-center block text-gray-300 hover:text-white transition-colors"
                        >
                            Tüm Başvuruları Yönet
                        </Link>
                    </div>
                </div>

                {/* Recent Audit & Activity Timeline (7 cols) */}
                <div className="lg:col-span-7 bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <h3 className="font-orbitron font-bold text-sm text-white">Son Yönetici Hareketleri (Audit Log)</h3>
                        </div>
                        <Link href="/admin/audit-log" className="text-xs text-primary hover:underline font-mono">
                            Tüm Loglar →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentAuditLogs.length === 0 ? (
                            <div className="text-xs text-gray-500 py-6 text-center">Henüz aktivite kaydı yok.</div>
                        ) : (
                            recentAuditLogs.map((log: any) => (
                                <div
                                    key={log.id}
                                    className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-primary/10 text-primary border border-primary/20">
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
            </div>
        </div>
    );
}
