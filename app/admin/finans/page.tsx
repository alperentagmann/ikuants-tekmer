'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    DollarSign,
    TrendingUp,
    Receipt,
    Building2,
    Calendar,
    ArrowRight,
    PieChart,
    Layers,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock,
    Plus,
    CreditCard,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3
} from 'lucide-react';

export default function FinanceCenterDashboardPage() {
    const [finReport, setFinReport] = useState<any>(null);
    const [rentReport, setRentReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [finRes, rentRes] = await Promise.all([
                fetch('/api/admin/reports/finance'),
                fetch('/api/admin/reports/rent')
            ]);
            const finJson = await finRes.json();
            const rentJson = await rentRes.json();
            if (finJson.success) setFinReport(finJson);
            if (rentJson.success) setRentReport(rentJson);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-400 font-mono">Finans merkezi verileri yükleniyor...</div>;
    }

    const finTotals = finReport?.totalsByCurrency || {};
    const rentTotals = rentReport?.totalsByCurrency || {};
    const primaryCurrency = Object.keys(finTotals)[0] || 'TRY';

    const finSum = finTotals[primaryCurrency] || {
        totalBudget: 0,
        awardedFunding: 0,
        receivedFunding: 0,
        expectedFunding: 0,
        spentExpenses: 0,
        committedExpenses: 0,
        paidExpenses: 0,
        pendingPayments: 0,
        availableCash: 0,
    };

    const rentSum = rentTotals[primaryCurrency] || {
        totalAccrued: 0,
        totalCollected: 0,
        remainingDue: 0,
        overdueDue: 0,
        collectionRate: 0,
    };

    const missingDocsCount = finReport?.missingDocuments?.length || 0;
    const upcomingRentDueCount = rentReport?.upcomingDueCount || 0;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>İKÜANTS TEKMER ERP — FİNANS YÖNETİMİ</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Finans & Tahsilat Merkezi</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Proje bütçeleri, hibe gerçekleşmeleri, kira tahakkukları, faturalar ve alacakların birleşik kokpiti.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/admin/raporlar/finans"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2"
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>Finans Raporu</span>
                    </Link>
                    <Link
                        href="/admin/raporlar/kira"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
                    >
                        <Receipt className="w-4 h-4 text-emerald-400" />
                        <span>Kira & Yaşlandırma</span>
                    </Link>
                    <Link
                        href="/admin/finans/faturalar"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
                    >
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span>Faturalar</span>
                    </Link>
                    <Link
                        href="/admin/finans/alacaklar"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
                    >
                        <Building2 className="w-4 h-4 text-purple-400" />
                        <span>Alacaklar</span>
                    </Link>
                </div>
            </div>

            {/* 10 KPI SUMMARY CARDS (Item 9) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                {/* 1. Toplam Onaylı Bütçe */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] font-medium text-slate-400">Onaylı Proje Bütçesi</span>
                    <p className="text-xl font-bold text-white mt-1">
                        {finSum.totalBudget.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-1.5 text-[10px] text-slate-400">Tüm aktif projeler</div>
                </div>

                {/* 2. Gelen Finansman */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] font-medium text-slate-400">Gelen Finansman</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">
                        {finSum.receivedFunding.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-1.5 text-[10px] text-emerald-400">Tahsil edilen hibe</div>
                </div>

                {/* 3. Beklenen Finansman */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] font-medium text-slate-400">Beklenen Finansman</span>
                    <p className="text-xl font-bold text-amber-400 mt-1">
                        {(finSum.awardedFunding - finSum.receivedFunding > 0 ? finSum.awardedFunding - finSum.receivedFunding : finSum.expectedFunding).toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-1.5 text-[10px] text-amber-400">Kalan hakedişler</div>
                </div>

                {/* 4. Bu Ay Harcanan */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] font-medium text-slate-400">Gerçekleşen Harcama</span>
                    <p className="text-xl font-bold text-rose-300 mt-1">
                        {finSum.spentExpenses.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-1.5 text-[10px] text-slate-400">Proje giderleri</div>
                </div>

                {/* 5. Bekleyen Ödemeler */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] font-medium text-slate-400">Bekleyen Ödemeler</span>
                    <p className="text-xl font-bold text-amber-300 mt-1">
                        {finSum.pendingPayments.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-1.5 text-[10px] text-slate-400">Onaylı taahhütler</div>
                </div>

                {/* 6. Bu Ay Kira Tahakkuku */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] font-medium text-slate-400">Kira Tahakkuku</span>
                    <p className="text-xl font-bold text-blue-400 mt-1">
                        {rentSum.totalAccrued.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-1.5 text-[10px] text-slate-400">{rentReport?.contractsSummary?.length || 0} Sözleşme</div>
                </div>

                {/* 7. Bu Ay Kira Tahsilatı */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] font-medium text-slate-400">Kira Tahsilatı</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">
                        {rentSum.totalCollected.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-1.5 text-[10px] text-emerald-400 font-bold">Oran: %{rentSum.collectionRate}</div>
                </div>

                {/* 8. Gecikmiş Alacaklar */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] font-medium text-slate-400">Gecikmiş Alacaklar</span>
                    <p className={`text-xl font-bold mt-1 ${rentSum.overdueDue > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                        {rentSum.overdueDue.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-1.5 text-[10px] text-red-400">Vadesi geçmiş kira</div>
                </div>

                {/* 9. Yaklaşan Vadeler */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] font-medium text-slate-400">Yaklaşan Vadeler</span>
                    <p className="text-xl font-bold text-teal-400 mt-1">
                        {upcomingRentDueCount} <span className="text-[10px] text-slate-400">Kayıt</span>
                    </p>
                    <div className="mt-1.5 text-[10px] text-teal-400">7 gün içinde vade</div>
                </div>

                {/* 10. Eksik Finans Belgeleri */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] font-medium text-slate-400">Eksik Finans Belgeleri</span>
                    <p className={`text-xl font-bold mt-1 ${missingDocsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {missingDocsCount} <span className="text-[10px] text-slate-400">Evrak</span>
                    </p>
                    <div className="mt-1.5 text-[10px] text-slate-400">Fatura/Fiş eksikleri</div>
                </div>
            </div>

            {/* Quick Link Modules & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Project Budgets Quick View */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-400" />
                            <span>Proje Bütçe ve Gerçekleşme Durumu</span>
                        </h3>
                        <Link href="/admin/raporlar/finans" className="text-xs text-emerald-400 hover:underline">
                            Rapor Detayı →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {finReport?.projectFinancialSummaries?.slice(0, 4).map((p: any) => (
                            <div key={p.projectId} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-white">{p.projectTitle}</span>
                                    <span className="text-emerald-400 font-mono font-bold">%{p.utilizationRate} Kullanım</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${Math.min(100, p.utilizationRate)}%` }}
                                        className="h-full bg-emerald-500 rounded-full"
                                    ></div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                    <span>Harcama: {p.spent.toLocaleString('tr-TR')} {p.currency}</span>
                                    <span>Kalan: {p.remainingBudget.toLocaleString('tr-TR')} {p.currency}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Rent Aging & Quick Links */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>Kira Yaşlandırma & Alacak Takibi</span>
                        </h3>
                        <Link href="/admin/raporlar/kira" className="text-xs text-amber-400 hover:underline">
                            Yaşlandırma Raporu →
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {rentReport?.agingReport?.slice(0, 4).map((b: any) => (
                            <div key={b.key} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                                <span className="text-xs font-semibold text-slate-300 block">{b.label}</span>
                                <div className="text-sm font-bold font-mono text-white">
                                    {Object.entries(b.amountByCurrency).map(([c, a]: any) => `${a.toLocaleString('tr-TR')} ${c}`).join(' | ') || '0 TL'}
                                </div>
                                <div className="text-[10px] text-slate-500">{b.entrepreneurCount} Girişimci</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
