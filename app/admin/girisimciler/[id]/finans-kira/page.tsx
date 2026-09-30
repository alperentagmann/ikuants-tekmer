'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Receipt,
    Download,
    DollarSign,
    Calendar,
    Building2,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText
} from 'lucide-react';

export default function EntrepreneurRentStatementPage() {
    const params = useParams();
    const id = params.id as string;

    const [statementData, setStatementData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const fetchStatement = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/entrepreneurs/${id}/statement`);
            const json = await res.json();
            if (json.success) {
                setStatementData(json);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchStatement();
    }, [id]);

    const handleExport = async () => {
        try {
            setExporting(true);
            const res = await fetch(`/api/admin/entrepreneurs/${id}/statement?export=true`);
            if (!res.ok) throw new Error('Dışa aktarma hatası');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ekstre_${id}_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e: any) {
            alert(e.message || 'Export hatası');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-400 font-mono">Girişimci kira ekstresi yükleniyor...</div>;
    }

    const entrepreneur = statementData?.entrepreneur;
    const summary = statementData?.summaryByCurrency || {};
    const primaryCurrency = Object.keys(summary)[0] || 'TRY';
    const mainSum = summary[primaryCurrency] || { totalAccrued: 0, totalPaid: 0, balanceDue: 0 };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <Link
                        href={`/admin/girisimciler/${id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Girişimci Detayına Dön</span>
                    </Link>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        {entrepreneur?.name} — Kira & Tahsilat Ekstresi
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">
                        Sözleşme geçmişi, tahakkuklar, yapılan tahsilatlar ve yürüyen bakiye dökümü.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        id="export-statement-btn"
                        disabled={exporting}
                        onClick={handleExport}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>{exporting ? 'İndiriliyor...' : 'Ekstre İndir (CSV)'}</span>
                    </button>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Toplam Kira Tahakkuku</span>
                    <p className="text-2xl font-bold text-white mt-1">
                        {mainSum.totalAccrued.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400">Tüm tahakkuk eden borç</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Toplam Tahsil Edilen</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {mainSum.totalPaid.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-emerald-400">Ödenen tutar</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <span className="text-xs font-medium text-slate-400">Mevcut Borç Bakiyesi</span>
                    <p className={`text-2xl font-bold mt-1 ${mainSum.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {mainSum.balanceDue.toLocaleString('tr-TR')} <span className="text-xs text-slate-400">{primaryCurrency}</span>
                    </p>
                    <div className="mt-2 text-[11px] text-slate-400">Kalan net bakiye</div>
                </div>
            </div>

            {/* Statement Ledger Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Kronolojik Hesap Hareketleri (Statement Ledger)</span>
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                                <th className="py-2.5 px-3">İşlem Tarihi</th>
                                <th className="py-2.5 px-3">İşlem Türü</th>
                                <th className="py-2.5 px-3">Açıklama</th>
                                <th className="py-2.5 px-3">Referans No</th>
                                <th className="py-2.5 px-3 text-right">Borç (Tahakkuk)</th>
                                <th className="py-2.5 px-3 text-right">Alacak (Tahsilat)</th>
                                <th className="py-2.5 px-3 text-right">Yürüyen Bakiye</th>
                                <th className="py-2.5 px-3 text-center">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                            {(!statementData?.statementItems || statementData.statementItems.length === 0) ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                                        Kayıtlı hesap hareketi bulunmuyor.
                                    </td>
                                </tr>
                            ) : (
                                statementData.statementItems.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-800/30">
                                        <td className="py-3 px-3 font-sans text-slate-300">
                                            {new Date(item.date).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="py-3 px-3 font-sans">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                item.type === 'ACCRUAL' ? 'bg-blue-500/10 text-blue-400' :
                                                item.type === 'PAYMENT' ? 'bg-emerald-500/10 text-emerald-400' :
                                                'bg-purple-500/10 text-purple-400'
                                            }`}>
                                                {item.type === 'ACCRUAL' ? 'Tahakkuk' : item.type === 'PAYMENT' ? 'Tahsilat' : 'Muafiyet'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 font-sans text-slate-200">
                                            {item.description}
                                        </td>
                                        <td className="py-3 px-3 text-slate-400">
                                            {item.referenceNo || '-'}
                                        </td>
                                        <td className="py-3 px-3 text-right text-slate-200">
                                            {item.debitAmount > 0 ? `${item.debitAmount.toLocaleString('tr-TR')} ${item.currency}` : '-'}
                                        </td>
                                        <td className="py-3 px-3 text-right text-emerald-400">
                                            {item.creditAmount > 0 ? `${item.creditAmount.toLocaleString('tr-TR')} ${item.currency}` : '-'}
                                        </td>
                                        <td className={`py-3 px-3 text-right font-bold ${item.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {item.balance.toLocaleString('tr-TR')} {item.currency}
                                        </td>
                                        <td className="py-3 px-3 text-center font-sans">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                item.status === 'PAID' || item.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                                                item.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' :
                                                'bg-slate-800 text-slate-300'
                                            }`}>
                                                {item.status}
                                            </span>
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
