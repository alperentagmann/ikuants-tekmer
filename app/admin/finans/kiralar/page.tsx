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
    CreditCard
} from 'lucide-react';

interface RentAccrual {
    id: string;
    contractId: string;
    month: number;
    year: number;
    amount: number;
    vatAmount: number;
    totalDue?: number;
    totalAmount?: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    status: string;
    isWaived: boolean;
    lastReminderSentAt?: string;
    contract: {
        contractNo: string;
        spaceName: string;
        entrepreneur: { id: string; name: string; email?: string; companyName?: string };
    };
    payments?: any[];
}

export default function RentManagementPage() {
    const [accruals, setAccruals] = useState<RentAccrual[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Payment Modal
    const [paymentAccrual, setPaymentAccrual] = useState<RentAccrual | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        bankReferenceNo: '',
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

            const [accRes, dashRes] = await Promise.all([
                fetch(`/api/admin/rent/accruals?${params.toString()}`),
                fetch('/api/admin/rent/dashboard')
            ]);

            const accData = await accRes.json();
            const dashData = await dashRes.json();

            const list = Array.isArray(accData) ? accData : (accData.items || []);
            setAccruals(list);
            if (dashData?.summary) setSummary(dashData.summary);
        } catch {
            setFeedback({ type: 'error', message: 'Kira verileri yüklenemedi.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentAccrual) return;

        try {
            const res = await fetch(`/api/admin/rent/accruals/${paymentAccrual.id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...paymentForm,
                    amount: Number(paymentForm.amount)
                })
            });

            if (!res.ok) throw new Error('Ödeme kaydedilemedi');

            setFeedback({ type: 'success', message: 'Kira tahsilatı başarıyla işlendi.' });
            setPaymentAccrual(null);
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
                setFeedback({ type: 'success', message: `${data.createdCount} adet yeni kira tahakkuku oluşturuldu.` });
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
                setFeedback({ type: 'success', message: `${data.processed} adet geciken kira hatırlatması Outbox kuyruğuna eklendi.` });
                fetchData();
            }
        } catch {
            setFeedback({ type: 'error', message: 'Hatırlatmalar tetiklenemedi.' });
        }
    };

    const filteredAccruals = accruals.filter(a => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            a.contract?.entrepreneur?.name?.toLowerCase().includes(q) ||
            a.contract?.spaceName?.toLowerCase().includes(q) ||
            a.contract?.contractNo?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Receipt className="w-4 h-4" />
                        <span>Kira & Aidat Takip Modülü</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Kira & Tahsilat Yönetimi</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Girişimcilerin ofis ve alan tahakkukları, kısmi ödemeler, geciken borçlar ve otomatik hatırlatma kuyruğu.
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs text-slate-400 font-medium">Bu Ay Toplam Tahakkuk</span>
                    <p className="text-2xl font-bold text-white mt-1">
                        {(summary?.totalAccrued || 0).toLocaleString('tr-TR')} TL
                    </p>
                </div>

                <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs text-emerald-400 font-medium">Tahsil Edilen Tutar</span>
                    <p className="text-2xl font-bold text-emerald-300 mt-1">
                        {(summary?.totalPaid || 0).toLocaleString('tr-TR')} TL
                    </p>
                </div>

                <div className="bg-slate-900/60 border border-rose-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs text-rose-400 font-medium">Gecikmiş Toplam Borç</span>
                    <p className="text-2xl font-bold text-rose-300 mt-1">
                        {(summary?.totalOverdue || 0).toLocaleString('tr-TR')} TL
                    </p>
                </div>

                <div className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4 shadow-xl">
                    <span className="text-xs text-cyan-400 font-medium">Tahsilat Başarı Oranı</span>
                    <p className="text-2xl font-bold text-cyan-300 mt-1">
                        %{summary?.collectionRate || 0}
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                        id="rent-search"
                        type="text"
                        placeholder="Girişimci adı veya ofis ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="ALL">Tüm Kira Durumları</option>
                        <option value="PAID">Tam Ödeyenler (PAID)</option>
                        <option value="PARTIALLY_PAID">Kısmi Ödeyenler (PARTIALLY_PAID)</option>
                        <option value="OVERDUE">Gecikmişler (OVERDUE)</option>
                        <option value="DUE">Vadesi Gelenler (DUE)</option>
                        <option value="UPCOMING">Vadesi Gelmeyenler (UPCOMING)</option>
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 text-sm">Kira kayıtları yükleniyor...</div>
                ) : filteredAccruals.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm">
                        Seçilen filtrede kira tahakkuku bulunamadı.
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
                                {filteredAccruals.map((acc) => (
                                    <tr key={acc.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-white">{acc.contract?.entrepreneur?.name}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {acc.contract?.spaceName} • {acc.contract?.contractNo}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-white">{acc.month} / {acc.year}</div>
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
                                            <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${acc.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : acc.status === 'PARTIALLY_PAID' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : acc.status === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'}`}>
                                                {acc.status === 'PAID' ? 'Ödendi' : acc.status === 'PARTIALLY_PAID' ? 'Kısmi Ödeme' : acc.status === 'OVERDUE' ? 'Gecikmiş' : acc.status}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-right whitespace-nowrap">
                                            {acc.status !== 'PAID' && (
                                                <button
                                                    id={`record-payment-btn-${acc.id}`}
                                                    onClick={() => {
                                                        setPaymentAccrual(acc);
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

            {/* Record Payment Modal */}
            {paymentAccrual && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-1">Kira Tahsilatı İşle</h3>
                        <p className="text-xs text-slate-400 mb-4">
                            {paymentAccrual.contract?.entrepreneur?.name} — {paymentAccrual.month}/{paymentAccrual.year} Dönemi (Kalan: {paymentAccrual.remainingAmount} TL)
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
                                    onClick={() => setPaymentAccrual(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="confirm-payment-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                >
                                    Tahsilatı Kaydet
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
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
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
