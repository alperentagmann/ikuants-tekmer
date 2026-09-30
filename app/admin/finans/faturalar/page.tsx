'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Receipt,
    Download,
    Search,
    Filter,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Building2,
    Layers,
    DollarSign,
    RefreshCw,
    ExternalLink,
    AlertTriangle
} from 'lucide-react';

export default function InvoiceRegisterPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [totals, setTotals] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [projectId, setProjectId] = useState('ALL');
    const [vendorName, setVendorName] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('ALL');
    const [currency, setCurrency] = useState('ALL');
    const [documentStatus, setDocumentStatus] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (search) query.append('search', search);
            if (projectId !== 'ALL') query.append('projectId', projectId);
            if (vendorName) query.append('vendorName', vendorName);
            if (paymentStatus !== 'ALL') query.append('paymentStatus', paymentStatus);
            if (currency !== 'ALL') query.append('currency', currency);
            if (documentStatus !== 'ALL') query.append('documentStatus', documentStatus);
            if (startDate) query.append('startDate', startDate);
            if (endDate) query.append('endDate', endDate);

            const res = await fetch(`/api/admin/finance/invoices?${query.toString()}`);
            const json = await res.json();
            if (json.success) {
                setInvoices(json.invoices || []);
                setTotals(json.totalsByCurrency || {});
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [projectId, paymentStatus, currency, documentStatus]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchInvoices();
    };

    const handleExport = async (format: 'CSV' | 'EXCEL') => {
        try {
            setExporting(true);
            const res = await fetch('/api/admin/finance/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format,
                    filters: {
                        search,
                        projectId,
                        vendorName,
                        paymentStatus,
                        currency,
                        documentStatus,
                        startDate,
                        endDate,
                    },
                }),
            });

            if (!res.ok) throw new Error('Dışa aktarma hatası');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fatura_kayitlari_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err: any) {
            alert(err.message || 'Export hatası');
        } finally {
            setExporting(false);
        }
    };

    const primaryCurrency = Object.keys(totals)[0] || 'TRY';
    const mainTotal = totals[primaryCurrency] || { net: 0, vat: 0, gross: 0, count: 0 };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>İKÜANTS TEKMER ERP — FATURA DEFTERİ</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Fatura Kayıtları & Denetim Listesi</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Tedarikçi faturaları, hibe kaynakları, KDV tutarları ve evrak doğrulama durumu.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        id="export-invoices-btn"
                        disabled={exporting}
                        onClick={() => handleExport('CSV')}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>{exporting ? 'İndiriliyor...' : 'Fatura Listesini İndir (CSV)'}</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards per currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Toplam Fatura Adedi</span>
                    <p className="text-2xl font-bold text-white mt-1">{invoices.length} Adet</p>
                    <div className="mt-2 text-[11px] text-slate-400">Tüm filtrelenen kayıtlar</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Toplam Net Tutar</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {mainTotal.net.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400">KDV Hariç Tutar</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Toplam Brüt Tutar & KDV</span>
                    <p className="text-2xl font-bold text-white mt-1">
                        {mainTotal.gross.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-amber-400">
                        KDV: {mainTotal.vat.toLocaleString('tr-TR')} {primaryCurrency}
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Tedarikçi veya Fatura No ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div>
                        <select
                            value={paymentStatus}
                            onChange={e => setPaymentStatus(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="ALL">Tüm Ödeme Durumları</option>
                            <option value="PAID">Ödendi (PAID)</option>
                            <option value="APPROVED">Onaylandı (APPROVED)</option>
                            <option value="RECORDED">Kaydedildi (RECORDED)</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="ALL">Tüm Para Birimleri</option>
                            <option value="TRY">TRY (₺)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={documentStatus}
                            onChange={e => setDocumentStatus(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="ALL">Tüm Belge Durumları</option>
                            <option value="HAS_DOCUMENT">Evrak Yüklü</option>
                            <option value="MISSING_DOCUMENT">Evrak Eksik</option>
                        </select>
                    </div>
                </form>
            </div>

            {/* Invoices Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Fatura Listesi ({invoices.length} Kayıt)</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                                <th className="py-2.5 px-3">Tedarikçi / Satıcı</th>
                                <th className="py-2.5 px-3">Fatura No & Tarih</th>
                                <th className="py-2.5 px-3">Proje & Hibe Kaynağı</th>
                                <th className="py-2.5 px-3 text-right">Net</th>
                                <th className="py-2.5 px-3 text-right">KDV</th>
                                <th className="py-2.5 px-3 text-right">Brüt Tutar</th>
                                <th className="py-2.5 px-3 text-center">Ödeme Durumu</th>
                                <th className="py-2.5 px-3 text-center">Belge</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                                        Kriterlere uygun fatura kaydı bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-800/30">
                                        <td className="py-3 px-3 font-sans font-bold text-white">
                                            {inv.supplier}
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="text-slate-200">{inv.invoiceNo}</div>
                                            <div className="text-[10px] text-slate-400 font-sans">
                                                {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('tr-TR') : '-'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 font-sans text-xs">
                                            <div className="text-slate-200 font-medium">{inv.projectTitle}</div>
                                            <div className="text-[11px] text-purple-400">{inv.fundingSource}</div>
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-300">
                                            {inv.net.toLocaleString('tr-TR')} {inv.currency}
                                        </td>
                                        <td className="py-3 px-3 text-right text-amber-400">
                                            {inv.VAT.toLocaleString('tr-TR')} {inv.currency}
                                        </td>
                                        <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                                            {inv.gross.toLocaleString('tr-TR')} {inv.currency}
                                        </td>
                                        <td className="py-3 px-3 text-center font-sans">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                inv.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                                                inv.paymentStatus === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-slate-800 text-slate-300'
                                            }`}>
                                                {inv.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-center font-sans">
                                            {inv.documentUrl ? (
                                                <a
                                                    href={inv.documentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span>Evrak</span>
                                                </a>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-400 text-[10px] font-semibold">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>Eksik</span>
                                                </span>
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
