'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Save,
    Download,
    Send,
    Sparkles,
    AlertCircle,
    Building2,
    Users,
    Activity,
    ChevronRight,
    TrendingUp,
    FolderKanban
} from 'lucide-react';

export default function AylikRaporPage() {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [selectedMonth, setSelectedMonth] = useState('2026-09');

    // Form fields
    const [title, setTitle] = useState('');
    const [executiveSummary, setExecutiveSummary] = useState('');
    const [kpiAnalysis, setKpiAnalysis] = useState('');
    const [risksAndBlockers, setRisksAndBlockers] = useState('');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const generateMonthlyReport = async (monthStr: string) => {
        try {
            setLoading(true);
            setFeedback(null);
            const [year, month] = monthStr.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

            const res = await fetch('/api/admin/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'MONTHLY', startDate, endDate }),
            });
            const data = await res.json();
            if (data.success && data.data) {
                const d = data.data;
                setReportData(d);
                setTitle(`${year} Yılı ${month}. Ay - Aylık Operasyon & Yönetim Raporu`);
                setExecutiveSummary(d.autoSummaryText || `${monthStr} dönemi kurumsal faaliyet, girişimci başvuru ve mentörlük seansları özeti.`);
                setKpiAnalysis(`Tamamlanan Görevler: ${d.facts?.tasksCompletedCount || 0}, Faaliyetler: ${d.facts?.activitiesCount || 0}, Başvurular: ${d.facts?.applicationsCount || 0}`);
            }
        } catch {
            setFeedback({ type: 'error', message: 'Aylık rapor verileri hesaplanırken hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateMonthlyReport(selectedMonth);
    }, [selectedMonth]);

    const handleSave = async (status = 'DRAFT') => {
        setSaving(true);
        setFeedback(null);
        try {
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

            const res = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    reportType: 'MONTHLY',
                    periodStart: startDate,
                    periodEnd: endDate,
                    status,
                    executiveSummary,
                    contentJson: {
                        kpiAnalysis,
                        risksAndBlockers,
                    },
                    metricsJson: reportData?.facts || {},
                }),
            });
            const data = await res.json();
            if (data.success) {
                setFeedback({ type: 'success', message: `Aylık rapor ${status === 'PUBLISHED' ? 'yayınlandı' : 'kaydedildi'}.` });
            } else {
                setFeedback({ type: 'error', message: data.message || 'Kayıt başarısız.' });
            }
        } catch {
            setFeedback({ type: 'error', message: 'Sunucu hatası oluştu.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                        <Link href="/admin/raporlar" className="hover:text-white transition-colors">
                            Rapor Merkezi
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-primary font-bold">Aylık Operasyon Raporu</span>
                    </div>
                    <h1 className="text-2xl font-bold font-orbitron text-white mt-1 flex items-center gap-2.5">
                        <Calendar className="w-6 h-6 text-primary" />
                        Aylık Faaliyet & Performans Raporu
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-[#0e0e18] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary"
                    />
                    <button
                        onClick={() => handleSave('DRAFT')}
                        disabled={saving || loading}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                        <Save className="w-4 h-4" /> Taslak Kaydet
                    </button>
                    <button
                        onClick={() => handleSave('PUBLISHED')}
                        disabled={saving || loading}
                        className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                        <Send className="w-4 h-4" /> Yayınla
                    </button>
                </div>
            </div>

            {feedback && (
                <div className={`p-4 rounded-xl text-xs font-mono border flex items-center gap-2 ${
                    feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                    <AlertCircle className="w-4 h-4" />
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Live Monthly KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#0e0e18] border border-white/10 p-4 rounded-2xl">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-xs font-mono">Tamamlanan Görev</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold font-orbitron text-white">
                        {reportData?.facts?.tasksCompletedCount || 0}
                    </div>
                </div>

                <div className="bg-[#0e0e18] border border-white/10 p-4 rounded-2xl">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-xs font-mono">Kurumsal Faaliyet</span>
                        <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold font-orbitron text-white">
                        {reportData?.facts?.activitiesCount || 0}
                    </div>
                </div>

                <div className="bg-[#0e0e18] border border-white/10 p-4 rounded-2xl">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-xs font-mono">Yeni Başvuru</span>
                        <FolderKanban className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold font-orbitron text-white">
                        {reportData?.facts?.applicationsCount || 0}
                    </div>
                </div>

                <div className="bg-[#0e0e18] border border-white/10 p-4 rounded-2xl">
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                        <span className="text-xs font-mono">Mentörlük Seansı</span>
                        <Users className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold font-orbitron text-white">
                        {reportData?.facts?.mentorSessionsCount || 0}
                    </div>
                </div>
            </div>

            {/* Monthly Report Editor */}
            <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 space-y-4">
                <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">Rapor Başlığı</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary font-semibold"
                    />
                </div>

                <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">Yönetici Özeti (Executive Summary)</label>
                    <textarea
                        rows={4}
                        value={executiveSummary}
                        onChange={(e) => setExecutiveSummary(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary leading-relaxed"
                    />
                </div>

                <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">Aylık KPI ve Çıktı Analizi</label>
                    <textarea
                        rows={3}
                        value={kpiAnalysis}
                        onChange={(e) => setKpiAnalysis(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary leading-relaxed"
                    />
                </div>

                <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1">Riskler, İyileştirme Alanları & Gelecek Ay Hedefleri</label>
                    <textarea
                        rows={3}
                        value={risksAndBlockers}
                        onChange={(e) => setRisksAndBlockers(e.target.value)}
                        placeholder="Önümüzdeki ay planlanan eğitimler, yatırım turları ve KOSGEB hibe çağrıları..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary leading-relaxed"
                    />
                </div>
            </div>
        </div>
    );
}
