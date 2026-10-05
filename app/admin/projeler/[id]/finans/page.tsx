'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    DollarSign,
    ArrowLeft,
    TrendingUp,
    CreditCard,
    Plus,
    FileText,
    PieChart,
    Layers,
    CheckCircle2,
    AlertCircle,
    Receipt,
    Building2,
    Clock,
    X,
    Filter
} from 'lucide-react';

export default function ProjectFinancePage() {
    const params = useParams();
    const projectId = params.id as string;

    const [ledger, setLedger] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FUNDING' | 'EXPENSES' | 'BUDGET_LINES'>('OVERVIEW');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Modals
    const [showFundingModal, setShowFundingModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showBudgetLineModal, setShowBudgetLineModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState<string | null>(null);

    // Forms
    const [fundingForm, setFundingForm] = useState({
        fundingSource: 'KOSGEB',
        organizationName: 'KOSGEB',
        programName: '',
        awardedAmount: '',
        currency: 'TRY',
        agreementNo: '',
        description: ''
    });

    const [receiptForm, setReceiptForm] = useState({
        amount: '',
        currency: 'TRY',
        receivedDate: new Date().toISOString().split('T')[0],
        status: 'RECEIVED',
        bankReferenceNo: '',
        description: ''
    });

    const [expenseForm, setExpenseForm] = useState({
        fundingSourceId: '',
        budgetLineId: '',
        expenseDate: new Date().toISOString().split('T')[0],
        category: '',
        vendorName: '',
        description: '',
        amount: '',
        vatRate: '20',
        vatAmount: '',
        totalAmount: '',
        currency: 'TRY',
        paymentStatus: 'PAID',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        invoiceNo: '',
        approvalStatus: 'APPROVED'
    });

    const [budgetLineForm, setBudgetLineForm] = useState({
        code: '',
        name: '',
        allocatedAmount: '',
        currency: 'TRY',
        description: ''
    });

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/finance/projects/${projectId}`);
            const data = await res.json();
            if (res.ok) {
                setLedger(data);
                if (data.fundingSources?.length > 0 && !expenseForm.fundingSourceId) {
                    setExpenseForm(prev => ({ ...prev, fundingSourceId: data.fundingSources[0].id }));
                }
                if (data.budgetLines?.length > 0 && !expenseForm.budgetLineId) {
                    setExpenseForm(prev => ({ ...prev, budgetLineId: data.budgetLines[0].id }));
                }
            }
        } catch {
            setFeedback({ type: 'error', message: 'Finans ledger verileri yüklenemedi.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) fetchLedger();
    }, [projectId]);

    const handleCreateFunding = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/finance/projects/${projectId}/funding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fundingForm)
            });

            if (!res.ok) throw new Error('Finansman kaynağı eklenemedi');
            setFeedback({ type: 'success', message: 'Finansman kaynağı başarıyla tanımlandı.' });
            setShowFundingModal(false);
            fetchLedger();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    const handleAddReceipt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showReceiptModal) return;

        try {
            const res = await fetch(`/api/admin/finance/projects/${projectId}/funding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ADD_RECEIPT',
                    fundingSourceId: showReceiptModal,
                    ...receiptForm
                })
            });

            if (!res.ok) throw new Error('Tahsilat/gelen dilim eklenemedi');
            setFeedback({ type: 'success', message: 'Gelen finansman dilimi başarıyla işlendi.' });
            setShowReceiptModal(null);
            fetchLedger();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/finance/projects/${projectId}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseForm)
            });

            if (!res.ok) throw new Error('Harcama kaydedilemedi');
            setFeedback({ type: 'success', message: 'Proje harcaması ve fatura kaydı oluşturuldu.' });
            setShowExpenseModal(false);
            fetchLedger();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    const handleCreateBudgetLine = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/finance/projects/${projectId}/budget-lines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(budgetLineForm)
            });

            if (!res.ok) throw new Error('Bütçe kalemi eklenemedi');
            setFeedback({ type: 'success', message: 'Bütçe kalemi tanımlandı.' });
            setShowBudgetLineModal(false);
            fetchLedger();
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-400 font-mono">Proje finans ledger verileri yükleniyor...</div>;
    }

    const summary = {
        totalBudget: ledger?.totalApprovedBudget ?? ledger?.summary?.totalBudget ?? 0,
        totalReceived: ledger?.totalReceivedFunding ?? ledger?.summary?.totalReceived ?? 0,
        totalSpent: ledger?.totalSpent ?? ledger?.summary?.totalSpent ?? 0,
        totalCommitted: ledger?.totalCommitted ?? ledger?.summary?.totalCommitted ?? 0,
        cashAvailable: ledger?.availableCash ?? ledger?.summary?.cashAvailable ?? 0,
        budgetRemaining: ledger?.remainingBudget ?? ledger?.summary?.budgetRemaining ?? 0,
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link
                        href="/admin/projeler"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Projelere Dön
                    </Link>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        {ledger?.project?.title || 'Proje'} — Finans & Bütçe Yönetimi
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">
                        Gerçek zamanlı nakit akışı, hibe dilimleri, onaylı bütçe ve harcama muhasebe ledger&apos;ı.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        id="add-funding-btn"
                        onClick={() => setShowFundingModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> + Finansman Kaynağı
                    </button>
                    <button
                        id="add-expense-btn"
                        onClick={() => setShowExpenseModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-950/20 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> + Harcama Ekle
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

            {/* REAL-TIME COMPUTED LEDGER KPIS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] text-slate-400 font-medium">Toplam Onaylı Bütçe</span>
                    <p id="kpi-total-budget" className="text-lg font-bold text-white mt-1">
                        {summary.totalBudget?.toLocaleString('tr-TR')} TL
                    </p>
                </div>

                <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] text-emerald-400 font-medium">Gelen / Tahsil Edilen</span>
                    <p id="kpi-total-received" className="text-lg font-bold text-emerald-300 mt-1">
                        {summary.totalReceived?.toLocaleString('tr-TR')} TL
                    </p>
                </div>

                <div className="bg-slate-900/80 border border-rose-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] text-rose-400 font-medium">Toplam Harcanan</span>
                    <p id="kpi-total-spent" className="text-lg font-bold text-rose-300 mt-1">
                        {summary.totalSpent?.toLocaleString('tr-TR')} TL
                    </p>
                </div>

                <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] text-amber-400 font-medium">Taahhüt Edilen</span>
                    <p id="kpi-total-committed" className="text-lg font-bold text-amber-300 mt-1">
                        {summary.totalCommitted?.toLocaleString('tr-TR')} TL
                    </p>
                </div>

                <div className="bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] text-cyan-400 font-medium">Kullanılabilir Nakit</span>
                    <p id="kpi-cash-available" className="text-lg font-bold text-cyan-300 mt-1">
                        {summary.cashAvailable?.toLocaleString('tr-TR')} TL
                    </p>
                </div>

                <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-[11px] text-purple-400 font-medium">Kalan Bütçe</span>
                    <p id="kpi-budget-remaining" className="text-lg font-bold text-purple-300 mt-1">
                        {summary.budgetRemaining?.toLocaleString('tr-TR')} TL
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'OVERVIEW' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                    <PieChart className="w-3.5 h-3.5" />
                    <span>Özet & Finansman Kaynakları</span>
                </button>
                <button
                    onClick={() => setActiveTab('EXPENSES')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'EXPENSES' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Harcamalar & Faturalar ({ledger?.expenses?.length || 0})</span>
                </button>
                <button
                    onClick={() => setActiveTab('BUDGET_LINES')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'BUDGET_LINES' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Bütçe Kalemleri ({ledger?.budgetLines?.length || 0})</span>
                </button>
            </div>

            {/* TAB CONTENT: OVERVIEW & FUNDING */}
            {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 className="font-bold text-white text-sm">Finansman Kaynakları & Tahsil Edilen Dilimler</h3>
                            <button
                                onClick={() => setShowFundingModal(true)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Kaynak Ekle
                            </button>
                        </div>

                        {ledger?.fundingSources?.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-xs">
                                Henüz tanımlanmış finansman kaynağı bulunmuyor.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {ledger.fundingSources.map((fs: any) => (
                                    <div key={fs.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white text-sm">{fs.fundingSource}</span>
                                                    <span className="text-xs text-slate-400">({fs.organizationName})</span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                                                        {fs.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">
                                                    Onaylanan Tutar: <b className="text-white">{Number(fs.awardedAmount).toLocaleString('tr-TR')} {fs.currency}</b> • Sözleşme No: {fs.agreementNo || '-'}
                                                </div>
                                            </div>

                                            <button
                                                id={`add-receipt-btn-${fs.id}`}
                                                onClick={() => setShowReceiptModal(fs.id)}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> + Ödeme / Dilim Ekle
                                            </button>
                                        </div>

                                        {/* Receipts */}
                                        {fs.receipts?.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-800/60">
                                                <span className="text-[11px] text-slate-400 font-semibold block mb-2">Gelen Taksitler & Ödemeler:</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                    {fs.receipts.map((rc: any) => (
                                                        <div key={rc.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
                                                            <div>
                                                                <span className="font-semibold text-white">{rc.description || 'Ödeme'}</span>
                                                                <span className="block text-[10px] text-slate-400">{rc.bankReferenceNo || '-'}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="font-bold text-emerald-400">{Number(rc.amount).toLocaleString('tr-TR')} {rc.currency}</span>
                                                                <span className="block text-[10px] text-slate-500">{rc.receivedDate ? new Date(rc.receivedDate).toLocaleDateString('tr-TR') : '-'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: EXPENSES */}
            {activeTab === 'EXPENSES' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm">Harcamalar ve Gider Faturaları</h3>
                        <button
                            onClick={() => setShowExpenseModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1"
                        >
                            <Plus className="w-3.5 h-3.5" /> + Yeni Harcama
                        </button>
                    </div>

                    {ledger?.expenses?.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-sm">
                            Bu projeye ait henüz harcama kaydı bulunmuyor.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-5 py-4">Tarih</th>
                                        <th className="px-5 py-4">Kategori / Tedarikçi</th>
                                        <th className="px-5 py-4">Açıklama & Fatura</th>
                                        <th className="px-5 py-4">Tutar (KDV Dahil)</th>
                                        <th className="px-5 py-4">Ödeme Durumu</th>
                                        <th className="px-5 py-4">Onay</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {ledger.expenses.map((exp: any) => (
                                        <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-400">
                                                {new Date(exp.expenseDate).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-white">{exp.category}</div>
                                                <div className="text-xs text-slate-400">{exp.vendorName || '-'}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-xs text-white">{exp.description}</div>
                                                {exp.invoiceNo && (
                                                    <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                                                        Fat: {exp.invoiceNo}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="font-bold text-rose-300">
                                                    {Number(exp.totalAmount).toLocaleString('tr-TR')} {exp.currency}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${exp.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                    {exp.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                                                    {exp.approvalStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: BUDGET LINES */}
            {activeTab === 'BUDGET_LINES' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h3 className="font-bold text-white text-sm">Bütçe Kalemleri Dağılımı</h3>
                        <button
                            onClick={() => setShowBudgetLineModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1"
                        >
                            <Plus className="w-3.5 h-3.5" /> + Bütçe Kalemi Ekle
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ledger?.budgetLines?.map((bl: any) => (
                            <div key={bl.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-white text-sm">{bl.name}</span>
                                    <span className="text-xs font-mono text-purple-400">{bl.code || '-'}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Ayrılan Bütçe:</span>
                                    <span className="font-bold text-white">{Number(bl.allocatedAmount).toLocaleString('tr-TR')} {bl.currency}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Harcanan:</span>
                                    <span className="font-bold text-rose-400">{Number(bl.spentAmount || 0).toLocaleString('tr-TR')} {bl.currency}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Funding Modal */}
            {showFundingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Finansman Kaynağı Ekle</h3>
                        <form onSubmit={handleCreateFunding} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Kaynak Türü / Kurum</label>
                                <select
                                    id="funding-source-type"
                                    value={fundingForm.fundingSource}
                                    onChange={(e) => setFundingForm({ ...fundingForm, fundingSource: e.target.value, organizationName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                >
                                    <option value="KOSGEB">KOSGEB</option>
                                    <option value="TUBITAK">TÜBİTAK</option>
                                    <option value="ISTKA">Kalkınma Ajansı (İSTKA)</option>
                                    <option value="UNIVERSITY">Üniversite Fonu</option>
                                    <option value="SPONSOR">Sponsor / Özel Şirket</option>
                                    <option value="INVESTOR">Yatırımcı</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Onaylanan Hibe / Bütçe Tutarı (TL) *</label>
                                <input
                                    id="funding-awarded-amount"
                                    type="number"
                                    required
                                    value={fundingForm.awardedAmount}
                                    onChange={(e) => setFundingForm({ ...fundingForm, awardedAmount: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Sözleşme / Protokol No</label>
                                <input
                                    id="funding-agreement-no"
                                    type="text"
                                    value={fundingForm.agreementNo}
                                    onChange={(e) => setFundingForm({ ...fundingForm, agreementNo: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowFundingModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="save-funding-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Receipt Modal */}
            {showReceiptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Gelen Dilim / Ödeme Kaydet</h3>
                        <form onSubmit={handleAddReceipt} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Tahsil Edilen Tutar (TL) *</label>
                                <input
                                    id="receipt-amount"
                                    type="number"
                                    required
                                    value={receiptForm.amount}
                                    onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Açıklama / Dilim</label>
                                <input
                                    id="receipt-desc"
                                    type="text"
                                    placeholder="1. Dilim Ödeme"
                                    value={receiptForm.description}
                                    onChange={(e) => setReceiptForm({ ...receiptForm, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Banka Dekont / Referans No</label>
                                <input
                                    id="receipt-ref-no"
                                    type="text"
                                    value={receiptForm.bankReferenceNo}
                                    onChange={(e) => setReceiptForm({ ...receiptForm, bankReferenceNo: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowReceiptModal(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="save-receipt-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                >
                                    Ödemeyi İşle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Proje Harcaması & Fatura Ekle</h3>
                        <form onSubmit={handleCreateExpense} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori</label>
                                    <select
                                        id="expense-category"
                                        value={expenseForm.category}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none"
                                    >
                                        <option value="Personel">Personel</option>
                                        <option value="Yazılım">Yazılım</option>
                                        <option value="Donanım">Donanım</option>
                                        <option value="Danışmanlık">Danışmanlık</option>
                                        <option value="Eğitim">Eğitim</option>
                                        <option value="Tanıtım">Tanıtım</option>
                                        <option value="Hizmet Alımı">Hizmet Alımı</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tedarikçi Firma *</label>
                                    <input
                                        id="expense-vendor"
                                        type="text"
                                        required
                                        value={expenseForm.vendorName}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Gider Açıklaması *</label>
                                <input
                                    id="expense-desc"
                                    type="text"
                                    required
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tutar (TL) *</label>
                                    <input
                                        id="expense-amount"
                                        type="number"
                                        required
                                        value={expenseForm.amount}
                                        onChange={(e) => {
                                            const amt = Number(e.target.value);
                                            const vat = amt * 0.2;
                                            setExpenseForm({
                                                ...expenseForm,
                                                amount: e.target.value,
                                                vatAmount: vat.toString(),
                                                totalAmount: (amt + vat).toString()
                                            });
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Fatura No</label>
                                    <input
                                        id="expense-invoice-no"
                                        type="text"
                                        value={expenseForm.invoiceNo}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, invoiceNo: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowExpenseModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="save-expense-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                                >
                                    Harcamayı Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
