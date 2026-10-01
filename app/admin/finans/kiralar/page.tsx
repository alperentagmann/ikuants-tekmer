'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Receipt,
    Building2,
    Calendar,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    Clock,
    DollarSign,
    Send,
    FileText,
    ArrowRight,
    X,
    CreditCard,
    ShieldAlert,
    Building,
    ExternalLink
} from 'lucide-react';

interface EntrepreneurRentItem {
    id: string;
    entrepreneurId: string;
    name: string;
    logoUrl?: string | null;
    companyName?: string | null;
    companyStatus: string;
    program: string;
    contractStatus: string;
    hasContract: boolean;
    contract?: {
        id: string;
        contractNo: string;
        spaceName: string;
        monthlyRent: number;
        totalMonthlyRent: number;
        currency: string;
        endDate: string;
        dueDay: number;
        isWaived: boolean;
    } | null;
    currentMonthAccrual?: {
        id: string;
        periodLabel: string;
        totalDue: number;
        paidAmount: number;
        remainingAmount: number;
        status: string;
        dueDate: string;
    } | null;
    totalOverdue: number;
    totalPaidAllTime: number;
}

export default function RentManagementPage() {
    const [viewMode, setViewMode] = useState<'ENTREPRENEURS' | 'ACCRUALS'>('ENTREPRENEURS');
    const [entrepreneurs, setEntrepreneurs] = useState<EntrepreneurRentItem[]>([]);
    const [accruals, setAccruals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Payment Modal
    const [paymentItem, setPaymentItem] = useState<{ accrualId: string; name: string; period: string; remaining: number } | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        bankReferenceNo: '',
        notes: ''
    });

    // Create Contract Modal
    const [contractModalItem, setContractModalItem] = useState<EntrepreneurRentItem | null>(null);
    const [contractForm, setContractForm] = useState({
        spaceName: 'AntsPark Açık Ofis - Masa 1',
        contractNo: `KIRA-${Date.now().toString().slice(-6)}`,
        monthlyRent: '15000',
        currency: 'TRY',
        vatRate: '20',
        dueDay: '5',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        isWaived: false,
        notes: ''
    });

    // Generate Accrual Modal
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [genPeriod, setGenPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'ALL') params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);

            const [entRes, accRes, dashRes] = await Promise.all([
                fetch(`/api/admin/rent/entrepreneurs?${params.toString()}`),
                fetch(`/api/admin/rent/accruals?${params.toString()}`),
                fetch('/api/admin/rent/dashboard')
            ]);

            const entData = await entRes.json();
            const accData = await accRes.json();
            const dashData = await dashRes.json();

            if (entData.success) setEntrepreneurs(entData.items || []);
            if (accData.success) setAccruals(accData.items || []);
            if (dashData.success) setSummary(dashData);
        } catch {
            setFeedback({ type: 'error', message: 'Kira verileri yüklenemedi.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter, searchQuery]);

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentItem) return;

        try {
            const res = await fetch(`/api/admin/rent/accruals/${paymentItem.accrualId}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...paymentForm,
                    amount: Number(paymentForm.amount)
                })
            });

            if (!res.ok) throw new Error('Ödeme kaydedilemedi');

            setFeedback({ type: 'success', message: 'Kira tahsilatı başarıyla işlendi.' });
            setPaymentItem(null);
            fetchData();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    const handleCreateContract = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contractModalItem) return;

        try {
            const res = await fetch('/api/admin/rent/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entrepreneurId: contractModalItem.id,
                    spaceName: contractForm.spaceName,
                    contractNo: contractForm.contractNo,
                    monthlyRent: Number(contractForm.monthlyRent),
                    currency: contractForm.currency,
                    vatRate: Number(contractForm.vatRate),
                    dueDay: Number(contractForm.dueDay),
                    startDate: contractForm.startDate,
                    endDate: contractForm.endDate,
                    isWaived: contractForm.isWaived,
                    notes: contractForm.notes
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Sözleşme oluşturulamadı');

            setFeedback({ type: 'success', message: `${contractModalItem.name} için kira sözleşmesi başarıyla oluşturuldu.` });
            setContractModalItem(null);
            fetchData();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    const handleGenerateAccruals = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/rent/accruals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(genPeriod)
            });

            const data = await res.json();
            if (res.ok) {
                setFeedback({ type: 'success', message: `${data.count || 0} adet yeni kira tahakkuku oluşturuldu.` });
                setShowGenerateModal(false);
                fetchData();
            }
        } catch {
            setFeedback({ type: 'error', message: 'Tahakkuklar oluşturulamadı.' });
        }
    };

    const handleProcessReminders = async () => {
        try {
            const res = await fetch('/api/admin/rent/process-reminders', {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                setFeedback({ type: 'success', message: `${data.count || 0} adet geciken kira hatırlatması kuyruğa eklendi.` });
                fetchData();
            }
        } catch {
            setFeedback({ type: 'error', message: 'Hatırlatmalar tetiklenemedi.' });
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Receipt className="w-4 h-4" />
                        <span>Merkezi Kira & Tahsilat Kokpiti</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Kira & Tahsilat Yönetimi</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Tüm aktif girişimcilerin sözleşme durumu, aylık tahakkuklar, kısmi ödemeler ve geciken alacaklar.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleProcessReminders}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                        <span>Otomatik Hatırlatmaları Çalıştır</span>
                    </button>
                    <button
                        id="generate-accruals-btn"
                        onClick={() => setShowGenerateModal(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>+ Aylık Tahakkuk Oluştur</span>
                    </button>
                </div>
            </div>

            {feedback && (
                <div className={`p-4 rounded-xl border text-sm flex items-center justify-between gap-2 ${feedback.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{feedback.message}</span>
                    </div>
                    <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* SUMMARY KPIS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs text-slate-400 font-medium">Toplam Girişimci</span>
                    <p className="text-2xl font-bold text-white mt-1">
                        {summary?.totalActiveEntrepreneurs || entrepreneurs.length}
                    </p>
                </div>

                <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs text-emerald-400 font-medium">Sözleşmeli Girişimci</span>
                    <p className="text-2xl font-bold text-emerald-300 mt-1">
                        {summary?.activeContractsCount || 0}
                    </p>
                </div>

                <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs text-amber-400 font-medium">Sözleşmesi Olmayan</span>
                    <p className="text-2xl font-bold text-amber-300 mt-1">
                        {summary?.withoutContractCount || 0}
                    </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs text-slate-400 font-medium">Bu Ay Tahakkuk</span>
                    <p className="text-xl font-bold text-white mt-1">
                        {(summary?.thisMonthTotalDue || 0).toLocaleString('tr-TR')} TL
                    </p>
                </div>

                <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs text-emerald-400 font-medium">Tahsil Edilen</span>
                    <p className="text-xl font-bold text-emerald-300 mt-1">
                        {(summary?.thisMonthPaid || 0).toLocaleString('tr-TR')} TL
                    </p>
                </div>

                <div className="bg-slate-900/60 border border-rose-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs text-rose-400 font-medium">Gecikmiş Alacak</span>
                    <p className="text-xl font-bold text-rose-300 mt-1">
                        {(summary?.totalOverdueAmount || 0).toLocaleString('tr-TR')} TL
                    </p>
                </div>
            </div>

            {/* Tabs + Filter and Search Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('ENTREPRENEURS')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'ENTREPRENEURS'
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                        Tüm Girişimciler ({entrepreneurs.length})
                    </button>
                    <button
                        onClick={() => setViewMode('ACCRUALS')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'ACCRUALS'
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                        Dönemsel Tahakkuklar ({accruals.length})
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                            id="rent-search"
                            type="text"
                            placeholder="Girişimci veya ofis ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="ALL">Tüm Durumlar</option>
                        <option value="ACTIVE">Sözleşmeli Aktifler</option>
                        <option value="NO_CONTRACT">Sözleşmesi Olmayanlar</option>
                        <option value="OVERDUE">Gecikenler (Borçlu)</option>
                        <option value="PAID">Bu Ay Ödeyenler</option>
                        <option value="PARTIALLY_PAID">Kısmi Ödeyenler</option>
                    </select>
                </div>
            </div>

            {/* TABLE: ALL ENTREPRENEURS RENT COCKPIT */}
            {viewMode === 'ENTREPRENEURS' ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 text-sm">Girişimci kira kayıtları yükleniyor...</div>
                    ) : entrepreneurs.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-sm">
                            Filtreye uygun girişimci bulunamadı.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-5 py-4">Girişimci & Şirket</th>
                                        <th className="px-5 py-4">Program & Ofis</th>
                                        <th className="px-5 py-4">Kira Durumu</th>
                                        <th className="px-5 py-4">Aylık Tutar</th>
                                        <th className="px-5 py-4">Bu Ay Durumu</th>
                                        <th className="px-5 py-4">Gecikmiş Borç</th>
                                        <th className="px-5 py-4 text-right">Aksiyon</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {entrepreneurs.map((ent) => (
                                        <tr key={ent.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <Link href={`/admin/girisimciler/${ent.id}`} className="font-semibold text-white hover:text-primary transition-colors flex items-center gap-2">
                                                    <span>{ent.name}</span>
                                                    <ExternalLink className="w-3 h-3 text-slate-500" />
                                                </Link>
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    {ent.companyName ? (
                                                        <span className="text-cyan-400">{ent.companyName}</span>
                                                    ) : (
                                                        <span className="text-amber-500/80">Henüz Şirket Kurulmadı</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-xs font-semibold text-slate-200">{ent.program}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    {ent.contract ? ent.contract.spaceName : '—'}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {ent.hasContract ? (
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                                                        ent.contractStatus === 'ACTIVE'
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                            : ent.contractStatus === 'WAIVED'
                                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                            : 'bg-slate-800 text-slate-300'
                                                    }`}>
                                                        {ent.contractStatus === 'ACTIVE' ? 'Sözleşme Aktif' : ent.contractStatus === 'WAIVED' ? 'Kira Muaf' : ent.contractStatus}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                        <ShieldAlert className="w-3 h-3" />
                                                        Sözleşme Yok
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {ent.contract ? (
                                                    <span className="font-bold text-white">
                                                        {Number(ent.contract.totalMonthlyRent || ent.contract.monthlyRent).toLocaleString('tr-TR')} {ent.contract.currency}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500">—</span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {ent.currentMonthAccrual ? (
                                                    <div>
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                            ent.currentMonthAccrual.status === 'PAID'
                                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                                : ent.currentMonthAccrual.status === 'PARTIALLY_PAID'
                                                                ? 'bg-amber-500/20 text-amber-400'
                                                                : ent.currentMonthAccrual.status === 'OVERDUE'
                                                                ? 'bg-rose-500/20 text-rose-400'
                                                                : 'bg-slate-800 text-slate-300'
                                                        }`}>
                                                            {ent.currentMonthAccrual.status === 'PAID' ? 'Ödendi' : ent.currentMonthAccrual.status === 'PARTIALLY_PAID' ? 'Kısmi Ödendi' : ent.currentMonthAccrual.status === 'OVERDUE' ? 'Gecikmiş' : 'Ödeme Bekleniyor'}
                                                        </span>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                                            Ödenen: {ent.currentMonthAccrual.paidAmount.toLocaleString('tr-TR')} TL
                                                        </div>
                                                    </div>
                                                ) : ent.hasContract ? (
                                                    <span className="text-xs text-slate-400">Bu ay tahakkuk yok</span>
                                                ) : (
                                                    <span className="text-slate-500">—</span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`font-bold ${ent.totalOverdue > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                                    {ent.totalOverdue.toLocaleString('tr-TR')} TL
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                {ent.hasContract ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        {ent.currentMonthAccrual && ent.currentMonthAccrual.status !== 'PAID' && (
                                                            <button
                                                                id={`rent-pay-btn-${ent.id}`}
                                                                onClick={() => {
                                                                    setPaymentItem({
                                                                        accrualId: ent.currentMonthAccrual!.id,
                                                                        name: ent.name,
                                                                        period: ent.currentMonthAccrual!.periodLabel,
                                                                        remaining: ent.currentMonthAccrual!.remainingAmount
                                                                    });
                                                                    setPaymentForm(prev => ({ ...prev, amount: ent.currentMonthAccrual!.remainingAmount.toString() }));
                                                                }}
                                                                className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
                                                            >
                                                                + Ödeme Al
                                                            </button>
                                                        )}
                                                        <Link
                                                            href={`/admin/girisimciler/${ent.id}`}
                                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                                                        >
                                                            Kira Detayı
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <button
                                                        id={`add-rent-contract-btn-${ent.id}`}
                                                        onClick={() => setContractModalItem(ent)}
                                                        className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-white text-xs font-semibold border border-primary/40 transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        <span>Kira Sözleşmesi Ekle</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                /* ACCRUALS VIEW */
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 text-sm">Tahakkuk kayıtları yükleniyor...</div>
                    ) : accruals.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-sm">
                            Kira tahakkuku bulunamadı.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-5 py-4">Girişimci & Ofis</th>
                                        <th className="px-5 py-4">Dönem & Vade</th>
                                        <th className="px-5 py-4">Toplam Tutar</th>
                                        <th className="px-5 py-4">Ödenen</th>
                                        <th className="px-5 py-4">Kalan Borç</th>
                                        <th className="px-5 py-4">Durum</th>
                                        <th className="px-5 py-4 text-right">Tahsilat İşlemi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {accruals.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="font-semibold text-white">{acc.entrepreneur?.name || acc.contract?.entrepreneur?.name}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    {acc.contract?.spaceName} • {acc.contract?.contractNo}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="font-semibold text-white">{acc.periodLabel || `${acc.month} / ${acc.year}`}</div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3 h-3 text-slate-500" />
                                                    <span>Son Ödeme: {new Date(acc.dueDate).toLocaleDateString('tr-TR')}</span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="font-bold text-white">
                                                    {Number(acc.totalDue || acc.totalAmount || 0).toLocaleString('tr-TR')} TL
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="font-bold text-emerald-400">
                                                    {Number(acc.paidAmount).toLocaleString('tr-TR')} TL
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`font-bold ${Number(acc.remainingAmount) > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                                    {Number(acc.remainingAmount).toLocaleString('tr-TR')} TL
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${
                                                    acc.status === 'PAID'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : acc.status === 'PARTIALLY_PAID'
                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        : acc.status === 'OVERDUE'
                                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                        : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {acc.status === 'PAID' ? 'Ödendi' : acc.status === 'PARTIALLY_PAID' ? 'Kısmi Ödeme' : acc.status === 'OVERDUE' ? 'Gecikmiş' : acc.status}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                {acc.status !== 'PAID' && (
                                                    <button
                                                        id={`record-payment-btn-${acc.id}`}
                                                        onClick={() => {
                                                            setPaymentItem({
                                                                accrualId: acc.id,
                                                                name: acc.entrepreneur?.name || 'Girişimci',
                                                                period: acc.periodLabel || `${acc.month}/${acc.year}`,
                                                                remaining: acc.remainingAmount
                                                            });
                                                            setPaymentForm(prev => ({ ...prev, amount: acc.remainingAmount.toString() }));
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
                                                    >
                                                        + Ödeme Al
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Record Payment Modal */}
            {paymentItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-1">Kira Tahsilatı İşle</h3>
                        <p className="text-xs text-slate-400 mb-4">
                            {paymentItem.name} — {paymentItem.period} (Kalan Borç: {paymentItem.remaining.toLocaleString('tr-TR')} TL)
                        </p>

                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Tahsil Edilen Tutar (TL) *</label>
                                <input
                                    id="payment-amount-input"
                                    type="number"
                                    required
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Ödeme Yöntemi</label>
                                    <select
                                        value={paymentForm.paymentMethod}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    >
                                        <option value="BANK_TRANSFER">Banka Havalesi / EFT</option>
                                        <option value="CREDIT_CARD">Kredi Kartı</option>
                                        <option value="CASH">Nakit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Dekont / Ref No</label>
                                    <input
                                        type="text"
                                        placeholder="DEK-9908"
                                        value={paymentForm.bankReferenceNo}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, bankReferenceNo: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setPaymentItem(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="confirm-payment-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                                >
                                    Tahsilatı Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Contract Modal */}
            {contractModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">Kira Sözleşmesi Ekle</h3>
                                <p className="text-xs text-slate-400">{contractModalItem.name} için yeni alan tahsisi ve sözleşme</p>
                            </div>
                            <button onClick={() => setContractModalItem(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateContract} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Ofis / Alan Adı *</label>
                                    <input
                                        type="text"
                                        required
                                        value={contractForm.spaceName}
                                        onChange={(e) => setContractForm({ ...contractForm, spaceName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Sözleşme No *</label>
                                    <input
                                        type="text"
                                        required
                                        value={contractForm.contractNo}
                                        onChange={(e) => setContractForm({ ...contractForm, contractNo: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Aylık Net Kira *</label>
                                    <input
                                        type="number"
                                        required
                                        value={contractForm.monthlyRent}
                                        onChange={(e) => setContractForm({ ...contractForm, monthlyRent: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Para Birimi</label>
                                    <select
                                        value={contractForm.currency}
                                        onChange={(e) => setContractForm({ ...contractForm, currency: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    >
                                        <option value="TRY">TRY</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Vade Günü</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={contractForm.dueDay}
                                        onChange={(e) => setContractForm({ ...contractForm, dueDay: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Başlangıç Tarihi *</label>
                                    <input
                                        type="date"
                                        required
                                        value={contractForm.startDate}
                                        onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bitiş Tarihi *</label>
                                    <input
                                        type="date"
                                        required
                                        value={contractForm.endDate}
                                        onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isWaived-cb"
                                    checked={contractForm.isWaived}
                                    onChange={(e) => setContractForm({ ...contractForm, isWaived: e.target.checked })}
                                    className="rounded border-slate-700 bg-slate-950 text-primary"
                                />
                                <label htmlFor="isWaived-cb" className="text-xs text-slate-300">
                                    Kira Muafiyeti (Ücretsiz Kuluçka / Destek Kapsamı)
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setContractModalItem(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="submit-contract-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/80 text-white text-xs font-bold cursor-pointer"
                                >
                                    Sözleşmeyi Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Accruals Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2">Aylık Tahakkuk Oluştur</h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Aktif kira sözleşmesi bulunan tüm girişimcilere seçilen ay için otomatik tahakkuk oluşturulur.
                        </p>

                        <form onSubmit={handleGenerateAccruals} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Ay</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={genPeriod.month}
                                        onChange={(e) => setGenPeriod({ ...genPeriod, month: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Yıl</label>
                                    <input
                                        type="number"
                                        value={genPeriod.year}
                                        onChange={(e) => setGenPeriod({ ...genPeriod, year: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowGenerateModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="confirm-generate-accruals-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                                >
                                    Tahakkukları Başlat
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
