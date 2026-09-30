'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    DollarSign,
    Building2,
    Plus,
    Download,
    Search,
    Filter,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Receipt,
    RefreshCw,
    X,
    CreditCard,
    Layers,
    TrendingUp
} from 'lucide-react';

export default function ReceivablesCenterPage() {
    const [receivables, setReceivables] = useState<any[]>([]);
    const [totals, setTotals] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Filters
    const [source, setSource] = useState('ALL');
    const [status, setStatus] = useState('ALL');
    const [currency, setCurrency] = useState('ALL');
    const [search, setSearch] = useState('');

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedReceivable, setSelectedReceivable] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentNotes, setPaymentNotes] = useState<string>('');

    // Create Form State
    const [newReceivable, setNewReceivable] = useState({
        debtor: '',
        source: 'RENT',
        description: '',
        amount: 0,
        currency: 'TRY',
        dueDate: new Date().toISOString().slice(0, 10),
        paid: 0,
        exchangeRate: '',
        invoiceNumber: '',
        notes: '',
    });

    const fetchReceivables = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (source !== 'ALL') query.append('source', source);
            if (status !== 'ALL') query.append('status', status);
            if (currency !== 'ALL') query.append('currency', currency);
            if (search) query.append('search', search);

            const res = await fetch(`/api/admin/finance/receivables?${query.toString()}`);
            const json = await res.json();
            if (json.success) {
                setReceivables(json.receivables || []);
                setTotals(json.totalsByCurrency || {});
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceivables();
    }, [source, status, currency]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReceivables();
    };

    const handleCreateReceivable = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/finance/receivables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newReceivable,
                    amount: Number(newReceivable.amount),
                    paid: Number(newReceivable.paid || 0),
                    exchangeRate: newReceivable.exchangeRate ? Number(newReceivable.exchangeRate) : undefined,
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Oluşturulamadı');
            setIsCreateModalOpen(false);
            setNewReceivable({
                debtor: '',
                source: 'RENT',
                description: '',
                amount: 0,
                currency: 'TRY',
                dueDate: new Date().toISOString().slice(0, 10),
                paid: 0,
                exchangeRate: '',
                invoiceNumber: '',
                notes: '',
            });
            fetchReceivables();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReceivable) return;
        try {
            const res = await fetch(`/api/admin/finance/receivables/${selectedReceivable.id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentAmount: Number(paymentAmount),
                    notes: paymentNotes,
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Tahsilat kaydedilemedi');
            setIsPaymentModalOpen(false);
            setSelectedReceivable(null);
            setPaymentAmount(0);
            setPaymentNotes('');
            fetchReceivables();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleExport = async (format: 'CSV' | 'EXCEL') => {
        try {
            setExporting(true);
            const res = await fetch('/api/admin/finance/receivables?export=true', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format,
                    filters: { source, status, currency, search },
                }),
            });
            if (!res.ok) throw new Error('Dışa aktarma hatası');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `alacaklar_listesi_${new Date().toISOString().slice(0, 10)}.csv`;
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
    const mainTotal = totals[primaryCurrency] || { totalAmount: 0, totalPaid: 0, totalRemaining: 0, totalOverdue: 0, count: 0 };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>İKÜANTS TEKMER ERP — ALACAKLAR MERKEZİ</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Alacaklar & Tahsilat Takibi</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Kira, proje ödemeleri, hizmet bedelleri, sponsorluk ve etkinlik alacaklarının merkezi yönetimi.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        id="export-receivables-btn"
                        disabled={exporting}
                        onClick={() => handleExport('CSV')}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>CSV İndir</span>
                    </button>
                    <button
                        id="create-receivable-btn"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-950/40 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Yeni Alacak Kaydı</span>
                    </button>
                </div>
            </div>

            {/* KPI ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Toplam Alacak Portföyü</span>
                    <p className="text-2xl font-bold text-white mt-1">
                        {mainTotal.totalAmount.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400">{receivables.length} Alacak Kaydı</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Tahsil Edilen Tutar</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {mainTotal.totalPaid.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-emerald-400">Gerçekleşen Tahsilat</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Kalan Alacak</span>
                    <p className="text-2xl font-bold text-teal-400 mt-1">
                        {mainTotal.totalRemaining.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400">Bekleyen Bakiye</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Gecikmiş Alacaklar</span>
                    <p className={`text-2xl font-bold mt-1 ${mainTotal.totalOverdue > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                        {mainTotal.totalOverdue.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-red-400">Vadesi Geçmiş</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Borçlu veya açıklama ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <select
                            value={source}
                            onChange={e => setSource(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">Tüm Kaynak Türleri</option>
                            <option value="RENT">Kira (RENT)</option>
                            <option value="PROJECT_PAYMENT">Proje Hakedişi (PROJECT_PAYMENT)</option>
                            <option value="SERVICE_FEE">Hizmet Bedeli (SERVICE_FEE)</option>
                            <option value="SPONSORSHIP">Sponsorluk (SPONSORSHIP)</option>
                            <option value="EVENT">Etkinlik Katılımı (EVENT)</option>
                            <option value="OTHER">Diğer (OTHER)</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">Tüm Durumlar</option>
                            <option value="PENDING">Beklemede (PENDING)</option>
                            <option value="PARTIALLY_PAID">Kısmi Ödendi (PARTIALLY_PAID)</option>
                            <option value="PAID">Tamamı Ödendi (PAID)</option>
                            <option value="OVERDUE">Gecikmiş (OVERDUE)</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                            <option value="ALL">Tüm Para Birimleri</option>
                            <option value="TRY">TRY (₺)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                    </div>
                </form>
            </div>

            {/* Receivables Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Alacak Kayıtları ({receivables.length})</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                                <th className="py-2.5 px-3">Borçlu / Muhatap</th>
                                <th className="py-2.5 px-3">Kaynak</th>
                                <th className="py-2.5 px-3">Açıklama</th>
                                <th className="py-2.5 px-3 text-right">Toplam Tutar</th>
                                <th className="py-2.5 px-3 text-right">Tahsil Edilen</th>
                                <th className="py-2.5 px-3 text-right">Kalan Alacak</th>
                                <th className="py-2.5 px-3 text-center">Vade Tarihi</th>
                                <th className="py-2.5 px-3 text-center">Durum</th>
                                <th className="py-2.5 px-3 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                            {receivables.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                                        Kayıtlı alacak bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                receivables.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-800/30">
                                        <td className="py-3 px-3 font-sans font-bold text-white">
                                            {r.debtor}
                                        </td>
                                        <td className="py-3 px-3 font-sans">
                                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                                                {r.source}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 font-sans text-slate-400 max-w-[180px] truncate">
                                            {r.description || '-'}
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-200">
                                            {r.amount.toLocaleString('tr-TR')} {r.currency}
                                        </td>
                                        <td className="py-3 px-3 text-right text-emerald-400">
                                            {r.paid.toLocaleString('tr-TR')} {r.currency}
                                        </td>
                                        <td className="py-3 px-3 text-right text-teal-400 font-bold">
                                            {r.remaining.toLocaleString('tr-TR')} {r.currency}
                                        </td>
                                        <td className="py-3 px-3 text-center font-sans text-xs">
                                            <div className="text-slate-300">{new Date(r.dueDate).toLocaleDateString('tr-TR')}</div>
                                            {r.daysOverdue > 0 && (
                                                <span className="text-[10px] text-red-400 font-bold">{r.daysOverdue} Gün Gecikme</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center font-sans">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                r.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                                                r.status === 'PARTIALLY_PAID' ? 'bg-amber-500/20 text-amber-400' :
                                                r.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' :
                                                'bg-slate-800 text-slate-300'
                                            }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right font-sans">
                                            {r.remaining > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedReceivable(r);
                                                        setPaymentAmount(r.remaining);
                                                        setIsPaymentModalOpen(true);
                                                    }}
                                                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded text-xs transition-colors"
                                                >
                                                    Tahsilat Al
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

            {/* CREATE RECEIVABLE MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Yeni Alacak Kaydı</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateReceivable} className="space-y-3 text-xs">
                            <div>
                                <label className="text-slate-400 block mb-1">Borçlu Kişi / Kurum *</label>
                                <input
                                    type="text"
                                    required
                                    value={newReceivable.debtor}
                                    onChange={e => setNewReceivable({ ...newReceivable, debtor: e.target.value })}
                                    placeholder="Örn: ABC Teknoloji A.Ş."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1">Kaynak Türü *</label>
                                    <select
                                        value={newReceivable.source}
                                        onChange={e => setNewReceivable({ ...newReceivable, source: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                                    >
                                        <option value="RENT">Kira (RENT)</option>
                                        <option value="PROJECT_PAYMENT">Proje Hakedişi</option>
                                        <option value="SERVICE_FEE">Hizmet Bedeli</option>
                                        <option value="SPONSORSHIP">Sponsorluk</option>
                                        <option value="EVENT">Etkinlik</option>
                                        <option value="OTHER">Diğer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1">Para Birimi *</label>
                                    <select
                                        value={newReceivable.currency}
                                        onChange={e => setNewReceivable({ ...newReceivable, currency: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                                    >
                                        <option value="TRY">TRY (₺)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1">Toplam Alacak Tutarı *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={newReceivable.amount || ''}
                                        onChange={e => setNewReceivable({ ...newReceivable, amount: Number(e.target.value) })}
                                        placeholder="0.00"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1">Vade Tarihi *</label>
                                    <input
                                        type="date"
                                        required
                                        value={newReceivable.dueDate}
                                        onChange={e => setNewReceivable({ ...newReceivable, dueDate: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1">Açıklama</label>
                                <textarea
                                    value={newReceivable.description}
                                    onChange={e => setNewReceivable({ ...newReceivable, description: e.target.value })}
                                    placeholder="Alacak detayı..."
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RECORD PAYMENT MODAL */}
            {isPaymentModalOpen && selectedReceivable && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">Tahsilat Kaydet</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                                <div className="text-slate-400">Borçlu: <strong className="text-white">{selectedReceivable.debtor}</strong></div>
                                <div className="text-slate-400">Kalan Borç: <strong className="text-teal-400 font-mono">{selectedReceivable.remaining.toLocaleString('tr-TR')} {selectedReceivable.currency}</strong></div>
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1">Tahsil Edilen Tutar *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={selectedReceivable.remaining}
                                    value={paymentAmount || ''}
                                    onChange={e => setPaymentAmount(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1">Not / Banka Dekont No</label>
                                <input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={e => setPaymentNotes(e.target.value)}
                                    placeholder="Dekont no, ödeme yöntemi vb."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                                >
                                    Tahsilatı Onayla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
