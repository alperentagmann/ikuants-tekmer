'use client';

import React, { useState, useEffect } from 'react';
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
    CheckSquare
} from 'lucide-react';

export default function GunlukRaporPage() {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Form fields
    const [title, setTitle] = useState('');
    const [completedWorks, setCompletedWorks] = useState('');
    const [inProgressWorks, setInProgressWorks] = useState('');
    const [meetings, setMeetings] = useState('');
    const [importantDevelopments, setImportantDevelopments] = useState('');
    const [risks, setRisks] = useState('');
    const [tomorrowPlans, setTomorrowPlans] = useState('');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const generateReport = async (date: string) => {
        try {
            setLoading(true);
            setFeedback(null);
            const res = await fetch('/api/admin/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'DAILY', date }),
            });
            const data = await res.json();
            if (data.success && data.data) {
                const d = data.data;
                setReportData(d);
                setTitle(`${d.date} - Günlük Faaliyet Raporu (${d.user?.name || ''} ${d.user?.surname || ''})`);
                setCompletedWorks(d.defaultDraft.completedWorks);
                setInProgressWorks(d.defaultDraft.inProgressWorks);
                setMeetings(d.defaultDraft.meetings);
                setImportantDevelopments(d.defaultDraft.importantDevelopments);
            }
        } catch {
            setFeedback({ type: 'error', message: 'Rapor verileri hesaplanırken hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateReport(selectedDate);
    }, [selectedDate]);

    const handleSave = async (status = 'DRAFT') => {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    reportType: 'DAILY',
                    periodStart: selectedDate,
                    periodEnd: selectedDate,
                    department: reportData?.department,
                    status,
                    executiveSummary: reportData?.autoSummaryText,
                    contentJson: {
                        completedWorks,
                        inProgressWorks,
                        meetings,
                        importantDevelopments,
                        risks,
                        tomorrowPlans,
                    },
                    metricsJson: {
                        completedTasksCount: reportData?.completedTasks?.length || 0,
                        todayEventsCount: reportData?.todayEvents?.length || 0,
                        activitiesCount: reportData?.activities?.length || 0,
                    },
                }),
            });
            const data = await res.json();
            if (data.success) {
                setFeedback({ type: 'success', message: `Günlük rapor başarıyla kaydedildi (${status}).` });
            } else {
                setFeedback({ type: 'error', message: data.error || 'Kaydetme başarısız oldu.' });
            }
        } catch {
            setFeedback({ type: 'error', message: 'Sunucuya bağlanırken hata oluştu.' });
        } finally {
            setSaving(false);
        }
    };

    const handleExportCsv = async () => {
        try {
            const res = await fetch('/api/admin/reports/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportTitle: title,
                    reportType: 'DAILY',
                    format: 'CSV',
                    data: {
                        Tarih: selectedDate,
                        Personel: `${reportData?.user?.name || ''} ${reportData?.user?.surname || ''}`,
                        Departman: reportData?.department,
                        Tamamlanan_Isler: completedWorks,
                        Devam_Eden_Isler: inProgressWorks,
                        Toplantilar: meetings,
                        Onemli_Gelismeler: importantDevelopments,
                        Riskler: risks,
                        Yarin_Yapilacaklar: tomorrowPlans,
                    },
                }),
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gunluk_rapor_${selectedDate}.csv`;
            a.click();
        } catch {
            setFeedback({ type: 'error', message: 'CSV dışa aktarılamadı.' });
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-cyan-400" />
                        <span>Kullanıcı Günlük Faaliyet Raporu</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Sistem gün içindeki tamamlanan görevlerinizi ve toplantılarınızı otomatik olarak rapora aktarır.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                    >
                        <Download className="w-4 h-4 text-cyan-400" />
                        <span>CSV</span>
                    </button>
                    <button
                        onClick={() => handleSave('APPROVED')}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-cyan-950/40 disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                        <span>{saving ? 'Kaydediliyor...' : 'Onaya Gönder'}</span>
                    </button>
                </div>
            </div>

            {feedback && (
                <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                    {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Auto Summary Banner */}
            {reportData?.autoSummaryText && (
                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Otomatik Sistem Özeti:</span>
                        <p className="text-sm text-slate-200 mt-0.5">{reportData.autoSummaryText}</p>
                    </div>
                </div>
            )}

            {/* Report Form */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Rapor Başlığı</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-cyan-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                            <CheckSquare className="w-4 h-4" />
                            <span>1. Tamamlanan İşler & Görevler</span>
                        </label>
                        <textarea
                            rows={4}
                            value={completedWorks}
                            onChange={(e) => setCompletedWorks(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>2. Devam Eden İşler</span>
                        </label>
                        <textarea
                            rows={4}
                            value={inProgressWorks}
                            onChange={(e) => setInProgressWorks(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>3. Toplantılar & Oturumlar</span>
                        </label>
                        <textarea
                            rows={4}
                            value={meetings}
                            onChange={(e) => setMeetings(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            <span>4. Önemli Gelişmeler & Faaliyetler</span>
                        </label>
                        <textarea
                            rows={4}
                            value={importantDevelopments}
                            onChange={(e) => setImportantDevelopments(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            <span>5. Riskler, Engeller veya Sorunlar</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Varsa karşılaşılan engel veya riskleri belirtin..."
                            value={risks}
                            onChange={(e) => setRisks(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-purple-400 mb-1 flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            <span>6. Yarın Yapılacak Öncelikli İşler</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Yarın için planlanan öncelikli aksiyonlar..."
                            value={tomorrowPlans}
                            onChange={(e) => setTomorrowPlans(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                        onClick={() => handleSave('DRAFT')}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                        Taslak Olarak Kaydet
                    </button>
                    <button
                        onClick={() => handleSave('APPROVED')}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                        Kaydet & Onayla
                    </button>
                </div>
            </div>
        </div>
    );
}
