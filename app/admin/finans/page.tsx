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
    CreditCard
} from 'lucide-react';

export default function FinanceCenterDashboardPage() {
    const [financeData, setFinanceData] = useState<any>(null);
    const [rentData, setRentData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [finRes, rentRes] = await Promise.all([
                fetch('/api/admin/finance/dashboard'),
                fetch('/api/admin/rent/dashboard')
            ]);
            const finJson = await finRes.json();
            const rentJson = await rentRes.json();
            setFinanceData(finJson);
            setRentData(rentJson);
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

    const finSum = financeData?.summary || {};
    const rentSum = rentData?.summary || {};

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span>İKÜANTS TEKMER ERP / FİNANS MERKEZİ</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Finans & Tahsilat Yönetimi</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Proje bütçeleri, gelen hibeler, harcamalar, faturalar ve ofis kira tahsilatlarının tek kontrol noktası.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/finans/kiralar"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
                    >
                        <Receipt className="w-4 h-4 text-emerald-400" />
                        <span>Kira & Tahsilatlar</span>
                    </Link>
                    <Link
                        href="/admin/projeler"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2"
                    >
                        <Layers className="w-4 h-4" />
                        <span>Proje Bütçeleri</span>
                    </Link>
                </div>
            </div>

            {/* HIGH LEVEL KPI ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs text-slate-400 font-medium">Toplam Onaylı Proje Bütçeleri</span>
                    <p className="text-2xl font-bold text-white mt-1">
                        {(finSum.totalProjectBudget || 0).toLocaleString('tr-TR')} TL
                    </p>
                    <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Tahsil Edilen: {(finSum.totalFundingReceived || 0).toLocaleString('tr-TR')} TL</span>
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-rose-500/20 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs text-rose-400 font-medium">Toplam Gerçekleşen Harcama</span>
                    <p className="text-2xl font-bold text-rose-300 mt-1">
                        {(finSum.totalExpenses || 0).toLocaleString('tr-TR')} TL
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400">
                        {financeData?.recentExpenses?.length || 0} faturalı işlem kaydedildi
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs text-emerald-400 font-medium">Bu Ay Kira Tahsilat Oranı</span>
                    <p className="text-2xl font-bold text-emerald-300 mt-1">
                        %{rentSum.collectionRate || 0}
                    </p>
                    <div className="mt-2 text-[11px] text-emerald-400/80">
                        Tahsil Edilen: {(rentSum.totalPaid || 0).toLocaleString('tr-TR')} TL
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs text-amber-400 font-medium">Kira / Alacak Gecikmesi</span>
                    <p className="text-2xl font-bold text-amber-300 mt-1">
                        {(rentSum.totalOverdue || 0).toLocaleString('tr-TR')} TL
                    </p>
                    <div className="mt-2 text-[11px] text-amber-400/80">
                        {rentSum.overdueCount || 0} adet geciken kira tahakkuku
                    </div>
                </div>
            </div>

            {/* MAIN TWO-COLUMN DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Col: Projects & Funding */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cyan-400" />
                            <span>Proje Bütçe ve Finansman Durumu</span>
                        </h3>
                        <Link href="/admin/projeler" className="text-xs text-cyan-400 hover:underline">
                            Tüm Projeler →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {financeData?.projectFinances?.slice(0, 5).map((pf: any) => (
                            <Link
                                key={pf.projectId}
                                href={`/admin/projeler/${pf.projectId}/finans`}
                                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors block"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-white text-sm truncate">{pf.projectTitle}</span>
                                    <span className="text-xs font-mono text-cyan-400">{pf.currency}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] text-slate-400">
                                    <div>Bütçe: <b className="text-white">{Number(pf.budget).toLocaleString('tr-TR')}</b></div>
                                    <div>Gelen: <b className="text-emerald-400">{Number(pf.received).toLocaleString('tr-TR')}</b></div>
                                    <div>Harcanan: <b className="text-rose-400">{Number(pf.spent).toLocaleString('tr-TR')}</b></div>
                                </div>
                            </Link>
                        ))}

                        {(!financeData?.projectFinances || financeData.projectFinances.length === 0) && (
                            <div className="text-center py-8 text-slate-500 text-xs">
                                Henüz bütçe tanımlanmış proje bulunmuyor.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Col: Rent Management & Collection */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-400" />
                            <span>Girişimci Ofis Kira Tahsilatları</span>
                        </h3>
                        <Link href="/admin/finans/kiralar" className="text-xs text-emerald-400 hover:underline">
                            Kira Listesi →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {rentData?.accruals?.slice(0, 5).map((acc: any) => (
                            <div
                                key={acc.id}
                                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-semibold text-white text-sm">{acc.contract?.entrepreneur?.name || 'Girişimci'}</div>
                                    <div className="text-xs text-slate-400">{acc.contract?.spaceName || 'Ofis'} • Vade: {new Date(acc.dueDate).toLocaleDateString('tr-TR')}</div>
                                </div>

                                <div className="text-right">
                                    <div className="font-bold text-white text-sm">{Number(acc.totalAmount).toLocaleString('tr-TR')} TL</div>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${acc.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : acc.status === 'PARTIALLY_PAID' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {acc.status === 'PAID' ? 'Ödendi' : acc.status === 'PARTIALLY_PAID' ? 'Kısmi Ödeme' : 'Bekliyor'}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {(!rentData?.accruals || rentData.accruals.length === 0) && (
                            <div className="text-center py-8 text-slate-500 text-xs">
                                Bu ay için henüz kira tahakkuku oluşturulmamış.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
