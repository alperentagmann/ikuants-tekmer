'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    Download,
    Filter,
    Layers,
    PieChart,
    BarChart3,
    AlertCircle,
    CheckCircle2,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Building2,
    AlertTriangle,
    Eye,
    Receipt
} from 'lucide-react';

export default function FinanceReportingPage() {
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [datePreset, setDatePreset] = useState<string>('THIS_YEAR');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<string>('ALL');
    const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');

    // UI States
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROJECTS' | 'CASH_FLOW' | 'EXPENSES' | 'DOCUMENTS'>('OVERVIEW');
    const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
    const [hoveredChartBar, setHoveredChartBar] = useState<any>(null);
    const [exporting, setExporting] = useState<boolean>(false);

    // Calculate dates based on preset
    const calculateDates = (preset: string) => {
        const now = new Date();
        let start = '';
        let end = '';

        if (preset === 'THIS_MONTH') {
            start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        } else if (preset === 'LAST_MONTH') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
            end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        } else if (preset === 'THIS_QUARTER') {
            const quarter = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), quarter * 3, 1).toISOString().slice(0, 10);
            end = new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().slice(0, 10);
        } else if (preset === 'THIS_YEAR') {
            start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
            end = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
        }

        return { start, end };
    };

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError(null);

            let sDate = customStartDate;
            let eDate = customEndDate;

            if (datePreset !== 'CUSTOM') {
                const dates = calculateDates(datePreset);
                sDate = dates.start;
                eDate = dates.end;
            }

            const query = new URLSearchParams();
            if (sDate) query.append('startDate', sDate);
            if (eDate) query.append('endDate', eDate);
            if (selectedProject !== 'ALL') query.append('projectId', selectedProject);
            if (selectedCurrency !== 'ALL') query.append('currency', selectedCurrency);

            const res = await fetch(`/api/admin/reports/finance?${query.toString()}`);
            const json = await res.json();

            if (!json.success) throw new Error(json.error || 'Rapor verisi alınamadı');
            setReportData(json);
        } catch (err: any) {
            setError(err.message || 'Veri yükleme hatası');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [datePreset, selectedProject, selectedCurrency]);

    const handleCustomFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReport();
    };

    const toggleProjectExpand = (id: string) => {
        setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleExport = async (format: 'CSV' | 'EXCEL' | 'PDF', reportType: 'PROJECT_FINANCE' | 'BUDGET_LINES' = 'PROJECT_FINANCE') => {
        try {
            setExporting(true);
            let sDate = customStartDate;
            let eDate = customEndDate;
            if (datePreset !== 'CUSTOM') {
                const dates = calculateDates(datePreset);
                sDate = dates.start;
                eDate = dates.end;
            }

            if (format === 'PDF') {
                window.print();
                setExporting(false);
                return;
            }

            const res = await fetch('/api/admin/reports/finance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format,
                    reportType,
                    filters: {
                        startDate: sDate,
                        endDate: eDate,
                        projectId: selectedProject,
                        currency: selectedCurrency,
                    },
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Dışa aktarma başarısız');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finans_raporu_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err: any) {
            alert(err.message || 'Dışa aktarma hatası');
        } finally {
            setExporting(false);
        }
    };

    const totals = reportData?.totalsByCurrency || {};
    const currencyKeys = Object.keys(totals);
    const primaryCurrency = currencyKeys.includes('TRY') ? 'TRY' : currencyKeys[0] || 'TRY';
    const mainTotals = totals[primaryCurrency] || {
        totalBudget: 0,
        awardedFunding: 0,
        receivedFunding: 0,
        expectedFunding: 0,
        outstandingFunding: 0,
        spentExpenses: 0,
        committedExpenses: 0,
        paidExpenses: 0,
        pendingPayments: 0,
        remainingBudget: 0,
        availableCash: 0,
        utilizationRate: 0,
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header with quick actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>İKÜANTS TEKMER ERP — FİNANS RAPORLAMA MERKEZİ</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Finansal Raporlar & Nakit Akışı</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Gerçek zamanlı proje bütçeleri, hibe gerçekleşmeleri, taahhütler ve nakit pozisyonu analitiği.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/admin/finans/faturalar"
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                        <Receipt className="w-4 h-4 text-emerald-400" />
                        <span>Fatura Kayıtları</span>
                    </Link>
                    <Link
                        href="/admin/finans/alacaklar"
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span>Alacaklar</span>
                    </Link>
                    <div className="relative inline-block text-left">
                        <button
                            id="export-finance-report-btn"
                            disabled={exporting}
                            onClick={() => handleExport('CSV', 'PROJECT_FINANCE')}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>{exporting ? 'İndiriliyor...' : 'Excel / CSV İndir'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Date presets */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/80">
                        {[
                            { key: 'THIS_MONTH', label: 'Bu Ay' },
                            { key: 'LAST_MONTH', label: 'Geçen Ay' },
                            { key: 'THIS_QUARTER', label: 'Bu Çeyrek' },
                            { key: 'THIS_YEAR', label: 'Bu Yıl' },
                            { key: 'CUSTOM', label: 'Özel Aralık' },
                        ].map(p => (
                            <button
                                key={p.key}
                                onClick={() => setDatePreset(p.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    datePreset === p.key
                                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Currency & Project Selector */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Para Birimi:</span>
                            <select
                                value={selectedCurrency}
                                onChange={e => setSelectedCurrency(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                            >
                                <option value="ALL">Tüm Para Birimleri</option>
                                <option value="TRY">TRY (₺)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Proje:</span>
                            <select
                                value={selectedProject}
                                onChange={e => setSelectedProject(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 max-w-[200px] truncate"
                            >
                                <option value="ALL">Tüm Projeler</option>
                                {reportData?.projectFinancialSummaries?.map((p: any) => (
                                    <option key={p.projectId} value={p.projectId}>
                                        {p.projectCode !== '-' ? `[${p.projectCode}] ` : ''}{p.projectTitle}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={fetchReport}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                            title="Yenile"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Custom Date Form */}
                {datePreset === 'CUSTOM' && (
                    <form onSubmit={handleCustomFilterSubmit} className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">Başlangıç:</span>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={e => setCustomStartDate(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">Bitiş:</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={e => setCustomEndDate(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                        >
                            Uygula
                        </button>
                    </form>
                )}
            </div>

            {/* Currency Multi-Pill Tabs if multiple currencies exist */}
            {currencyKeys.length > 1 && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">Para Birimi Dağılımı:</span>
                    <div className="flex flex-wrap gap-2">
                        {currencyKeys.map(c => (
                            <span
                                key={c}
                                className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-emerald-400 flex items-center gap-1.5"
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {c}: {totals[c].spentExpenses.toLocaleString('tr-TR')} {c} Harcama / {totals[c].totalBudget.toLocaleString('tr-TR')} {c} Bütçe
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* EXECUTIVE SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Total Approved Budget */}
                <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Toplam Onaylı Bütçe</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">
                        {mainTotals.totalBudget.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                        <span>Taahhüt Edilen Hibe:</span>
                        <strong className="text-slate-200">{mainTotals.awardedFunding.toLocaleString('tr-TR')} {primaryCurrency}</strong>
                    </div>
                </div>

                {/* 2. Funding Received vs Outstanding */}
                <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Gelen / Beklenen Finansman</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <ArrowDownRight className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400 mt-2">
                        {mainTotals.receivedFunding.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-amber-400 flex items-center justify-between">
                        <span>Beklenen (Kalan):</span>
                        <strong>{mainTotals.outstandingFunding.toLocaleString('tr-TR')} {primaryCurrency}</strong>
                    </div>
                </div>

                {/* 3. Spent vs Committed */}
                <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Toplam Harcama & Taahhüt</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">
                        {mainTotals.spentExpenses.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Ödenen: <strong className="text-emerald-400">{mainTotals.paidExpenses.toLocaleString('tr-TR')}</strong></span>
                        <span>Bekleyen: <strong className="text-amber-400">{mainTotals.pendingPayments.toLocaleString('tr-TR')}</strong></span>
                    </div>
                </div>

                {/* 4. Cash Available & Utilization Rate */}
                <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Kullanılabilir Nakit & Oran</span>
                        <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <p className={`text-2xl font-bold mt-2 ${mainTotals.availableCash >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                        {mainTotals.availableCash.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Bütçe Kullanımı:</span>
                        <span className="font-bold text-emerald-400">%{mainTotals.utilizationRate}</span>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                {[
                    { key: 'OVERVIEW', label: 'Genel Görünüm & Grafikler', icon: BarChart3 },
                    { key: 'PROJECTS', label: 'Proje Finans Detayı', icon: Layers },
                    { key: 'CASH_FLOW', label: 'Aylık Nakit Akışı', icon: TrendingUp },
                    { key: 'EXPENSES', label: 'Gider Kategori Dağılımı', icon: PieChart },
                    { key: 'DOCUMENTS', label: `Eksik Belgeler (${reportData?.missingDocuments?.length || 0})`, icon: AlertTriangle },
                ].map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                                activeTab === t.key
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT: 1. OVERVIEW CHARTS */}
            {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CHART 1: Monthly Cash Flow (Inflow vs Outflow) */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        <span>Aylık Nakit Akışı (Giriş vs Çıkış)</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Gerçekleşen hibe tahsilatları ve ödenen giderler</p>
                                </div>
                                <div className="flex items-center gap-3 text-[11px]">
                                    <div className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                                        <span className="text-slate-300">Giriş (Hibe)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                                        <span className="text-slate-300">Çıkış (Gider)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Visual SVG Chart */}
                            {(!reportData?.monthlyCashFlow || reportData.monthlyCashFlow.length === 0) ? (
                                <div className="h-56 flex items-center justify-center text-slate-500 text-xs">
                                    Seçilen aralıkta nakit akış hareketi bulunmuyor.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="h-60 flex items-end gap-3 pt-6 pb-2 border-b border-slate-800">
                                        {reportData.monthlyCashFlow.map((cf: any) => {
                                            const inf = cf.inflow[primaryCurrency] || 0;
                                            const outf = cf.outflow[primaryCurrency] || 0;
                                            const maxVal = Math.max(...reportData.monthlyCashFlow.map((x: any) => Math.max(x.inflow[primaryCurrency] || 0, x.outflow[primaryCurrency] || 0))) || 1;
                                            const infHeight = Math.max(8, (inf / maxVal) * 180);
                                            const outfHeight = Math.max(8, (outf / maxVal) * 180);

                                            return (
                                                <div
                                                    key={cf.monthKey}
                                                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
                                                >
                                                    {/* Tooltip */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-20 bg-slate-950 border border-slate-700 text-white text-[11px] rounded-lg p-2.5 shadow-2xl pointer-events-none whitespace-nowrap">
                                                        <div className="font-bold text-slate-200 mb-1">{cf.monthLabel}</div>
                                                        <div className="text-emerald-400">Giriş: {inf.toLocaleString('tr-TR')} {primaryCurrency}</div>
                                                        <div className="text-amber-400">Çıkış: {outf.toLocaleString('tr-TR')} {primaryCurrency}</div>
                                                        <div className="text-slate-300 border-t border-slate-800 mt-1 pt-1 font-bold">
                                                            Net: {(inf - outf).toLocaleString('tr-TR')} {primaryCurrency}
                                                        </div>
                                                    </div>

                                                    <div className="w-full flex items-end justify-center gap-1">
                                                        <div
                                                            style={{ height: `${infHeight}px` }}
                                                            className="w-1/2 bg-emerald-500 rounded-t hover:bg-emerald-400 transition-all cursor-pointer"
                                                        ></div>
                                                        <div
                                                            style={{ height: `${outfHeight}px` }}
                                                            className="w-1/2 bg-amber-500 rounded-t hover:bg-amber-400 transition-all cursor-pointer"
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 truncate max-w-full">{cf.monthLabel}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CHART 2: Budget vs Actual per Project */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-blue-400" />
                                        <span>Bütçe vs Gerçekleşen (Proje Bazında)</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Tahsis edilen bütçe ve toplam yapılan harcama</p>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                                {reportData?.budgetVsActual?.map((p: any) => (
                                    <div key={p.projectId} className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-white truncate max-w-[200px]">{p.title}</span>
                                            <span className="font-mono text-slate-300">
                                                {p.spent.toLocaleString('tr-TR')} / {p.budget.toLocaleString('tr-TR')} {p.currency}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                                            <div
                                                style={{ width: `${Math.min(100, p.utilizationRate)}%` }}
                                                className={`h-full ${
                                                    p.utilizationRate > 90 ? 'bg-red-500' : p.utilizationRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                            ></div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                                            <span>Kullanım: %{p.utilizationRate}</span>
                                            <span>Kalan: {p.remaining.toLocaleString('tr-TR')} {p.currency}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Funding Sources Summary Row */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                            <Building2 className="w-4 h-4 text-purple-400" />
                            <span>Finansman & Hibe Kaynakları Dağılımı</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {reportData?.fundingSourcesBreakdown?.map((fs: any) => (
                                <div key={fs.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">{fs.organizationName}</span>
                                    <h4 className="text-sm font-bold text-white mt-1 truncate">{fs.programGrantName}</h4>
                                    <div className="mt-3 space-y-1 text-xs">
                                        <div className="flex justify-between text-slate-400">
                                            <span>Taahhüt:</span>
                                            <span className="text-slate-200 font-mono">
                                                {Object.entries(fs.awardedByCurrency).map(([c, a]: any) => `${a.toLocaleString('tr-TR')} ${c}`).join(' | ')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>Tahsil Edilen:</span>
                                            <span className="text-emerald-400 font-mono">
                                                {Object.entries(fs.receivedByCurrency).map(([c, a]: any) => `${a.toLocaleString('tr-TR')} ${c}`).join(' | ') || '0 TL'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 2. PROJECT FINANCIAL SUMMARY TABLE & BUDGET LINES */}
            {activeTab === 'PROJECTS' && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Proje Bazlı Finansal Gerçekleşme & Bütçe Kalemleri</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Her proje için onaylı bütçe, tahsil edilen fon, harcanan, taahhüt ve kalem bazlı kalanlar.
                            </p>
                        </div>
                        <button
                            onClick={() => handleExport('CSV', 'BUDGET_LINES')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Kalem Detayını İndir</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {reportData?.projectFinancialSummaries?.map((p: any) => {
                            const isExpanded = !!expandedProjects[p.projectId];
                            return (
                                <div key={p.projectId} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                                    <div
                                        onClick={() => toggleProjectExpand(p.projectId)}
                                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/50 transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                                                    {p.projectCode}
                                                </span>
                                                <h4 className="text-sm font-bold text-white">{p.projectTitle}</h4>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                                <span>Toplam Bütçe: <strong className="text-slate-200">{p.totalBudget.toLocaleString('tr-TR')} {p.currency}</strong></span>
                                                <span>Gelen Hibe: <strong className="text-emerald-400">{p.receivedFunding.toLocaleString('tr-TR')} {p.currency}</strong></span>
                                                <span>Harcanan: <strong className="text-amber-400">{p.spent.toLocaleString('tr-TR')} {p.currency}</strong></span>
                                                <span>Kalan: <strong className="text-teal-400">{p.remainingBudget.toLocaleString('tr-TR')} {p.currency}</strong></span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-emerald-400">%{p.utilizationRate}</div>
                                                <div className="text-[10px] text-slate-500">Bütçe Kullanımı</div>
                                            </div>
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                        </div>
                                    </div>

                                    {/* Expanded Budget Lines Table */}
                                    {isExpanded && (
                                        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
                                            <h5 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
                                                Bütçe Kalemleri Dağılımı ({p.budgetLines.length} Kalem)
                                            </h5>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                                                            <th className="py-2 px-3">Kod</th>
                                                            <th className="py-2 px-3">Kalem Başlığı</th>
                                                            <th className="py-2 px-3">Kategori</th>
                                                            <th className="py-2 px-3 text-right">Tahsis Edilen</th>
                                                            <th className="py-2 px-3 text-right">Taahhüt</th>
                                                            <th className="py-2 px-3 text-right">Harcanan</th>
                                                            <th className="py-2 px-3 text-right">Ödenen</th>
                                                            <th className="py-2 px-3 text-right">Kalan</th>
                                                            <th className="py-2 px-3 text-right">Kullanım %</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800/60 font-mono">
                                                        {p.budgetLines.map((bl: any) => (
                                                            <tr key={bl.id} className="hover:bg-slate-800/30">
                                                                <td className="py-2.5 px-3 text-slate-400">{bl.code}</td>
                                                                <td className="py-2.5 px-3 font-sans font-medium text-slate-200">{bl.title}</td>
                                                                <td className="py-2.5 px-3 font-sans text-slate-400">{bl.categoryLabel}</td>
                                                                <td className="py-2.5 px-3 text-right text-slate-200">{bl.allocated.toLocaleString('tr-TR')} {bl.currency}</td>
                                                                <td className="py-2.5 px-3 text-right text-amber-400">{bl.committed.toLocaleString('tr-TR')} {bl.currency}</td>
                                                                <td className="py-2.5 px-3 text-right text-slate-200">{bl.spent.toLocaleString('tr-TR')} {bl.currency}</td>
                                                                <td className="py-2.5 px-3 text-right text-emerald-400">{bl.paid.toLocaleString('tr-TR')} {bl.currency}</td>
                                                                <td className="py-2.5 px-3 text-right text-teal-400 font-bold">{bl.remaining.toLocaleString('tr-TR')} {bl.currency}</td>
                                                                <td className="py-2.5 px-3 text-right font-sans">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                        bl.utilizationRate > 90 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                                                                    }`}>
                                                                        %{bl.utilizationRate}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 3. CASH FLOW DETAIL */}
            {activeTab === 'CASH_FLOW' && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold text-white">Aylık Nakit Akışı Detay Tablosu</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                                    <th className="py-2.5 px-3">Dönem</th>
                                    <th className="py-2.5 px-3 text-right">Tahsil Edilen Fon (Giriş)</th>
                                    <th className="py-2.5 px-3 text-right">Ödenen Giderler (Çıkış)</th>
                                    <th className="py-2.5 px-3 text-right">Net Nakit Akışı</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                                {reportData?.monthlyCashFlow?.map((cf: any) => {
                                    const inf = cf.inflow[primaryCurrency] || 0;
                                    const outf = cf.outflow[primaryCurrency] || 0;
                                    const net = cf.net[primaryCurrency] || 0;

                                    return (
                                        <tr key={cf.monthKey} className="hover:bg-slate-800/30">
                                            <td className="py-3 px-3 font-sans font-bold text-white">{cf.monthLabel}</td>
                                            <td className="py-3 px-3 text-right text-emerald-400">+{inf.toLocaleString('tr-TR')} {primaryCurrency}</td>
                                            <td className="py-3 px-3 text-right text-amber-400">-{outf.toLocaleString('tr-TR')} {primaryCurrency}</td>
                                            <td className={`py-3 px-3 text-right font-bold ${net >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                                                {net >= 0 ? '+' : ''}{net.toLocaleString('tr-TR')} {primaryCurrency}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 4. EXPENSE CATEGORY BREAKDOWN */}
            {activeTab === 'EXPENSES' && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <h3 className="text-lg font-bold text-white">Gider Kategorileri & Harcama Kırılımı</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reportData?.expenseByCategory?.map((cat: any) => (
                            <div key={cat.category} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-200 text-sm">{cat.label}</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{cat.count} İşlem</span>
                                </div>
                                <div className="text-lg font-bold font-mono text-emerald-400">
                                    {Object.entries(cat.amountByCurrency).map(([c, a]: any) => `${a.toLocaleString('tr-TR')} ${c}`).join(' | ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 5. MISSING INVOICE / DOCUMENT REPORT */}
            {activeTab === 'DOCUMENTS' && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                <span>Eksik Fatura & Belge Raporu</span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Denetim ve hakediş öncesi faturası, dekontu veya numarası eksik olan harcama kalemleri.
                            </p>
                        </div>
                    </div>

                    {(!reportData?.missingDocuments || reportData.missingDocuments.length === 0) ? (
                        <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-emerald-400 text-xs flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-6 h-6" />
                            <span>Tüm harcama ve fatura kayıtlarının evrakları tam!</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reportData.missingDocuments.map((doc: any) => (
                                <div key={doc.id} className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white">{doc.vendor}</span>
                                            <span className="text-xs text-slate-400">• {doc.projectTitle}</span>
                                        </div>
                                        <p className="text-xs text-slate-400">{doc.description}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {doc.missingItems.map((m: string, i: number) => (
                                                <span key={i} className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-semibold">
                                                    {m}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-200 font-mono">{doc.amount.toLocaleString('tr-TR')} {doc.currency}</div>
                                        <div className="text-[10px] text-slate-400">{new Date(doc.date).toLocaleDateString('tr-TR')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
