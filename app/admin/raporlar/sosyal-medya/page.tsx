'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Share2,
    Instagram,
    FileText,
    TrendingUp,
    ExternalLink,
    RefreshCw,
    Download,
    CheckCircle2
} from 'lucide-react';

export default function SosyalMedyaRaporPage() {
    const [loading, setLoading] = useState(true);
    const [socialData, setSocialData] = useState<any>(null);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'SOCIAL' }),
            });
            const data = await res.json();
            if (data.success) {
                setSocialData(data.data);
            }
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Share2 className="w-7 h-7 text-pink-400" />
                        <span>Sosyal Medya & İçerik Performans Raporu</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Bağlı sosyal medya hesapları, çekilen gönderiler ve web sitesine dönüştürülen haberlerin analizi.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchReport}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                        title="Yenile"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link
                        href="/admin/entegrasyonlar/sosyal-medya"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                    >
                        <Instagram className="w-4 h-4 text-pink-400" />
                        <span>Hesapları Yönet</span>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Bağlı Hesaplar</span>
                    <p className="text-3xl font-extrabold text-white mt-2">{socialData?.totalAccounts?.length || 0}</p>
                    <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">
                        {socialData?.totalAccounts?.filter((a: any) => a.isActive).length || 0} Aktif Hesap
                    </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                    <span className="text-xs text-pink-400 font-semibold uppercase tracking-wider">Çekilen Toplam Gönderi</span>
                    <p className="text-3xl font-extrabold text-white mt-2">{socialData?.totalPosts || 0}</p>
                    <span className="text-xs text-slate-400 font-medium mt-1 inline-block">Instagram Feed</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                    <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Dönüşüm Durumu</span>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {socialData?.statusBreakdown?.map((st: any) => (
                            <span key={st.status} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300">
                                {st.status}: <strong className="text-white">{st.count}</strong>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Posts Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    <span>Son Senkronize Edilen Gönderiler</span>
                </h3>

                <div className="space-y-3">
                    {socialData?.recentPosts?.map((post: any) => (
                        <div key={post.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                                    {post.mediaType}
                                </span>
                                <p className="text-xs text-slate-200 line-clamp-1 max-w-xl">
                                    {post.caption || '(Açıklama metni yok)'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 text-xs">
                                <span className="text-slate-500">{new Date(post.postDate).toLocaleDateString('tr-TR')}</span>
                                {post.permalink && (
                                    <a
                                        href={post.permalink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}

                    {(!socialData?.recentPosts || socialData.recentPosts.length === 0) && (
                        <p className="text-slate-500 text-xs text-center py-6">Henüz senkronize edilmiş gönderi bulunmuyor.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
