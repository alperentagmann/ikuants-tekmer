'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Receipt,
    TrendingUp,
    Calendar,
    Download,
    Building2,
    AlertCircle,
    CheckCircle2,
    Clock,
    UserCheck,
    FileText,
    RefreshCw,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    ShieldAlert,
    ChevronRight,
    Users
} from 'lucide-react';

export default function RentReportingPage() {
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [datePreset, setDatePreset] = useState<string>('THIS_YEAR');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
    const [selectedEntrepreneur, setSelectedEntrepreneur] = useState<string>('ALL');

    // UI States
    const [activeTab, setActiveTab] = useState<'AGING' | 'TREND' | 'ACCRUALS' | 'CONTRACTS'>('AGING');
    const [exporting, setExporting] = useState<boolean>(false);

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
            if (selectedCurrency !== 'ALL') query.append('currency', selectedCurrency);
            if (selectedEntrepreneur !== 'ALL') query.append('entrepreneurId', selectedEntrepreneur);

            const res = await fetch(`/api/admin/reports/rent?${query.toString()}`);
            const json = await res.json();

            if (!json.success) throw new Error(json.error || 'Kira raporu alınamadı');
            setReportData(json);
        } catch (err: any) {
            setError(err.message || 'Veri yükleme hatası');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [datePreset, selectedCurrency, selectedEntrepreneur]);

    const handleExport = async (format: 'CSV' | 'EXCEL' | 'PDF', reportType: 'AGING' | 'ACCRUALS' = 'ACCRUALS') => {
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

            const res = await fetch('/api/admin/reports/rent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format,
                    reportType,
                    filters: {
                        startDate: sDate,
                        endDate: eDate,
                        currency: selectedCurrency,
                        entrepreneurId: selectedEntrepreneur,
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
            a.download = `kira_raporu_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
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
        totalAccrued: 0,
        totalCollected: 0,
        remainingDue: 0,
        overdueDue: 0,
        collectionRate: 0,
        partialPaidAmount: 0,
        waivedAmount: 0,
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>İKÜANTS TEKMER ERP — KİRA & TAHSİLAT RAPORLAMA</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Kira Raporu & Borç Yaşlandırma</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Ofis tahakkukları, gerçekleşen tahsilatlar, vadesi geçmiş alacaklar ve yaşlandırma matrisi.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/admin/finans/kiralar"
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <span>Kira İşlemleri</span>
                    </Link>
                    <button
                        id="export-rent-report-btn"
                        disabled={exporting}
                        onClick={() => handleExport('CSV', 'ACCRUALS')}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>{exporting ? 'İndiriliyor...' : 'Excel / CSV İndir'}</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
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

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Para Birimi:</span>
                        <select
                            value={selectedCurrency}
                            onChange={e => setSelectedCurrency(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="ALL">Tümü</option>
                            <option value="TRY">TRY (₺)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
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

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Tahakkuk & Tahsilat */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Aylık Tahakkuk & Tahsilat</span>
                    <p className="text-2xl font-bold text-white mt-1">
                        {mainTotals.totalAccrued.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Tahsil Edilen: {mainTotals.totalCollected.toLocaleString('tr-TR')} {primaryCurrency}</span>
                    </div>
                </div>

                {/* 2. Tahsilat Oranı */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Tahsilat Başarı Oranı</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                        %{mainTotals.collectionRate}
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Kısmi Ödemeler:</span>
                        <strong className="text-slate-200">{reportData?.partialPaymentsCount || 0} Adet</strong>
                    </div>
                </div>

                {/* 3. Kalan & Gecikmiş Alacak */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Kalan & Gecikmiş Alacak</span>
                    <p className={`text-2xl font-bold mt-1 ${mainTotals.overdueDue > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                        {mainTotals.remainingDue.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-red-400 flex items-center justify-between">
                        <span>Gecikmiş Tutar:</span>
                        <strong>{mainTotals.overdueDue.toLocaleString('tr-TR')} {primaryCurrency}</strong>
                    </div>
                </div>

                {/* 4. Sözleşme Durumu */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Sözleşmeler & Muafiyet</span>
                    <p className="text-2xl font-bold text-teal-400 mt-1">
                        {reportData?.activeContractsCount || 0} <span className="text-xs text-slate-400">Aktif</span>
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Muaf / Ücretsiz: <strong className="text-purple-400">{(reportData?.waivedContractsCount || 0) + (reportData?.freePeriodContractsCount || 0)}</strong></span>
                        <span>Sona Yaklaşan: <strong className="text-amber-400">{reportData?.expiringContractsCount || 0}</strong></span>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                {[
                    { key: 'AGING', label: 'Borç Yaşlandırma Matrisi', icon: Clock },
                    { key: 'TREND', label: 'Tahakkuk vs Tahsilat Trendi', icon: BarChart3 },
                    { key: 'ACCRUALS', label: 'Tahakkuk Detay Tablosu', icon: Receipt },
                    { key: 'CONTRACTS', label: 'Sözleşme Durumları', icon: Building2 },
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

            {/* TAB CONTENT: 1. AGING REPORT (BORÇ YAŞLANDIRMA) */}
            {activeTab === 'AGING' && (
                <div className="space-y-6">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-400" />
                                    <span>Kira Borç Yaşlandırma Raporu (Aging Analysis)</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Vadesi geçmiş alacakların gün segmentlerine göre dağılımı ve girişimci sayıları.
                                </p>
                            </div>
                            <button
                                onClick={() => handleExport('CSV', 'AGING')}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Yaşlandırma Raporunu İndir</span>
                            </button>
                        </div>

                        {/* 6 Aging Buckets Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {reportData?.agingReport?.map((b: any, index: number) => {
                                const colors = [
                                    'border-teal-500/30 bg-teal-500/5 text-teal-400',
                                    'border-blue-500/30 bg-blue-500/5 text-blue-400',
                                    'border-amber-500/30 bg-amber-500/5 text-amber-400',
                                    'border-orange-500/30 bg-orange-500/5 text-orange-400',
                                    'border-red-500/30 bg-red-500/5 text-red-400',
                                    'border-rose-600/40 bg-rose-600/10 text-rose-400',
                                ];
                                const color = colors[index % colors.length];

                                return (
                                    <div key={b.key} className={`p-4 rounded-xl border ${color} space-y-2`}>
                                        <span className="text-xs font-bold text-slate-200 block">{b.label}</span>
                                        <div className="space-y-1">
                                            <div className="text-base font-bold font-mono text-white">
                                                {Object.entries(b.amountByCurrency).map(([c, a]: any) => `${a.toLocaleString('tr-TR')} ${c}`).join(' | ') || '0 TL'}
                                            </div>
                                            <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                                <span>Girişimci:</span>
                                                <strong className="text-slate-200">{b.entrepreneurCount}</strong>
                                            </div>
                                            <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                                <span>Kayıt:</span>
                                                <strong className="text-slate-200">{b.itemCount}</strong>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sona Yaklaşan Sözleşmeler */}
                    {reportData?.expiringContracts && reportData.expiringContracts.length > 0 && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>60 Gün İçinde Sona Erecek Sözleşmeler ({reportData.expiringContracts.length})</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {reportData.expiringContracts.map((c: any) => (
                                    <div key={c.id} className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/20 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-white">{c.entrepreneurName}</h4>
                                            <p className="text-[11px] text-slate-400">{c.spaceName} • {c.contractNo}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                                                {c.daysLeft} Gün Kaldı
                                            </span>
                                            <div className="text-[10px] text-slate-400 mt-1">{new Date(c.endDate).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: 2. TREND CHART */}
            {activeTab === 'TREND' && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                    <h3 className="text-lg font-bold text-white">Aylık Kira Tahakkuk vs Tahsilat Trendi</h3>
                    <div className="h-64 flex items-end gap-3 pt-6 pb-2 border-b border-slate-800">
                        {reportData?.monthlyTrend?.map((tr: any) => {
                            const acc = tr.accrualByCurrency[primaryCurrency] || 0;
                            const col = tr.collectionByCurrency[primaryCurrency] || 0;
                            const maxVal = Math.max(...reportData.monthlyTrend.map((x: any) => Math.max(x.accrualByCurrency[primaryCurrency] || 0, x.collectionByCurrency[primaryCurrency] || 0))) || 1;
                            const accHeight = Math.max(8, (acc / maxVal) * 190);
                            const colHeight = Math.max(8, (col / maxVal) * 190);

                            return (
                                <div key={tr.monthKey} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-20 bg-slate-950 border border-slate-700 text-white text-[11px] rounded-lg p-2.5 shadow-2xl pointer-events-none whitespace-nowrap">
                                        <div className="font-bold text-slate-200 mb-1">{tr.monthLabel}</div>
                                        <div className="text-blue-400">Tahakkuk: {acc.toLocaleString('tr-TR')} {primaryCurrency}</div>
                                        <div className="text-emerald-400">Tahsilat: {col.toLocaleString('tr-TR')} {primaryCurrency}</div>
                                    </div>

                                    <div className="w-full flex items-end justify-center gap-1">
                                        <div style={{ height: `${accHeight}px` }} className="w-1/2 bg-blue-500 rounded-t hover:bg-blue-400 transition-all cursor-pointer"></div>
                                        <div style={{ height: `${colHeight}px` }} className="w-1/2 bg-emerald-500 rounded-t hover:bg-emerald-400 transition-all cursor-pointer"></div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 truncate max-w-full">{tr.monthLabel}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 3. ACCRUALS TABLE */}
            {activeTab === 'ACCRUALS' && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold text-white">Tahakkuk & Tahsilat Kayıtları</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                                    <th className="py-2.5 px-3">Girişimci & Ofis</th>
                                    <th className="py-2.5 px-3">Dönem</th>
                                    <th className="py-2.5 px-3 text-right">Tahakkuk</th>
                                    <th className="py-2.5 px-3 text-right">Tahsil Edilen</th>
                                    <th className="py-2.5 px-3 text-right">Kalan Borç</th>
                                    <th className="py-2.5 px-3 text-center">Vade & Gecikme</th>
                                    <th className="py-2.5 px-3 text-center">Durum</th>
                                    <th className="py-2.5 px-3 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                                {reportData?.accruals?.map((acc: any) => (
                                    <tr key={acc.id} className="hover:bg-slate-800/30">
                                        <td className="py-3 px-3 font-sans">
                                            <div className="font-bold text-white">{acc.entrepreneurName}</div>
                                            <div className="text-[11px] text-slate-400">{acc.spaceName} • {acc.contractNo}</div>
                                        </td>
                                        <td className="py-3 px-3 font-sans text-slate-300">{acc.periodLabel}</td>
                                        <td className="py-3 px-3 text-right text-slate-200">{acc.totalDue.toLocaleString('tr-TR')} {acc.currency}</td>
                                        <td className="py-3 px-3 text-right text-emerald-400">{acc.paidAmount.toLocaleString('tr-TR')} {acc.currency}</td>
                                        <td className="py-3 px-3 text-right text-teal-400 font-bold">{acc.remainingAmount.toLocaleString('tr-TR')} {acc.currency}</td>
                                        <td className="py-3 px-3 text-center font-sans text-xs">
                                            <div className="text-slate-300">{new Date(acc.dueDate).toLocaleDateString('tr-TR')}</div>
                                            {acc.daysOverdue > 0 && (
                                                <span className="text-[10px] text-red-400 font-bold">{acc.daysOverdue} Gün Gecikme</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center font-sans">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                acc.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                                                acc.status === 'PARTIALLY_PAID' ? 'bg-amber-500/20 text-amber-400' :
                                                acc.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' :
                                                acc.status === 'WAIVED' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-slate-800 text-slate-300'
                                            }`}>
                                                {acc.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right font-sans">
                                            <Link
                                                href={`/admin/girisimciler/${acc.entrepreneurId}?tab=finance`}
                                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                                            >
                                                Ekstre
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 4. CONTRACTS */}
            {activeTab === 'CONTRACTS' && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold text-white">Sözleşme Özeti</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reportData?.contractsSummary?.map((c: any) => (
                            <div key={c.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">{c.contractNo}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                        {c.status}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-white truncate">{c.entrepreneurName}</h4>
                                <p className="text-xs text-slate-400">{c.spaceName}</p>
                                <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
                                    <span className="text-slate-400">Aylık Kira:</span>
                                    <strong className="text-emerald-400 font-mono">{c.monthlyRent.toLocaleString('tr-TR')} {c.currency}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
