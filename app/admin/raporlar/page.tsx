'use client';

import React from 'react';
import { ReportList } from './ReportList';
import Link from 'next/link';
import {
    BarChart3, Calendar, TrendingUp, Share2, Plus, Filter, ArrowRight, Sparkles
} from 'lucide-react';

export default function ReportingDashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-cyan-400" />
                        <span>Merkezi Raporlama & Yönetim Zekâsı</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Operasyonel faaliyetler, girişimcilik metrikleri, eğitimler, etkinlikler ve sosyal medya performans raporları.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Link
                        href="/admin/raporlar/ozel"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                    >
                        <Plus className="w-4 h-4 text-cyan-400" />
                        <span>Özel Rapor Oluştur</span>
                    </Link>
                    <Link
                        href="/admin/raporlar/yillik"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-cyan-950/40"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Yıllık Kurumsal Rapor</span>
                    </Link>
                </div>
            </div>

            {/* Quick Report Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                    href="/admin/raporlar/gunluk"
                    className="bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl transition-all group flex flex-col justify-between"
                >
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                            Günlük Faaliyet Raporu
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">
                            Tamamlanan görevler ve toplantılardan otomatik taslak üretir.
                        </p>
                    </div>
                    <span className="text-cyan-400 text-xs font-semibold inline-flex items-center gap-1 mt-4">
                        <span>Raporu Aç</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>

                <Link
                    href="/admin/raporlar/sosyal-medya"
                    className="bg-slate-900/60 border border-slate-800 hover:border-pink-500/50 p-5 rounded-2xl transition-all group flex flex-col justify-between"
                >
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-base group-hover:text-pink-400 transition-colors">
                            Sosyal Medya Raporu
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">
                            Instagram gönderileri, etkileşimler ve haber dönüşümleri.
                        </p>
                    </div>
                    <span className="text-pink-400 text-xs font-semibold inline-flex items-center gap-1 mt-4">
                        <span>Raporu Aç</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>

                <Link
                    href="/admin/raporlar/yillik"
                    className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl transition-all group flex flex-col justify-between"
                >
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                            Yıllık Kurumsal Rapor
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">
                            Girişimcilik, mentörlük, eğitim ve etkinlik 10-bölümlü kurumsal özet.
                        </p>
                    </div>
                    <span className="text-amber-400 text-xs font-semibold inline-flex items-center gap-1 mt-4">
                        <span>Raporu Aç</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>

                <Link
                    href="/admin/raporlar/ozel"
                    className="bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl transition-all group flex flex-col justify-between"
                >
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                            <Filter className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-base group-hover:text-purple-400 transition-colors">
                            Özel Rapor Builder
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">
                            Görev, başvuru, girişim, mentör ve etkinlik verilerinden filtreli rapor.
                        </p>
                    </div>
                    <span className="text-purple-400 text-xs font-semibold inline-flex items-center gap-1 mt-4">
                        <span>Raporu Aç</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </Link>
            </div>

            <ReportList />
        </div>
    );
}
