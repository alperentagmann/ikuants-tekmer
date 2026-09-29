'use client';

import React, { useState } from 'react';
import {
    Filter,
    Database,
    Calendar,
    Layers,
    Play,
    Download,
    Save,
    CheckCircle2,
    FileText,
    TrendingUp,
    Table
} from 'lucide-react';

export default function OzelRaporBuilderPage() {
    const [source, setSource] = useState('tasks');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [status, setStatus] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [reportTitle, setReportTitle] = useState('Özel Operasyon Raporu');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleRunQuery = async () => {
        setLoading(true);
        setFeedback(null);
        try {
            const res = await fetch('/api/admin/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'CUSTOM',
                    customConfig: {
                        source,
                        dateFrom: dateFrom || undefined,
                        dateTo: dateTo || undefined,
                        status: status || undefined,
                    },
                }),
            });
            const data = await res.json();
            if (data.success) {
                setResults(data.data);
            }
        } catch {
            setFeedback({ type: 'error', message: 'Sorgu çalıştırılamadı.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReport = async () => {
        if (!results) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: reportTitle,
                    reportType: 'CUSTOM',
                    periodStart: dateFrom || new Date().toISOString(),
                    periodEnd: dateTo || new Date().toISOString(),
                    executiveSummary: `${source} veri kaynağından toplam ${results.totalCount} kayıt filtrelendi.`,
                    contentJson: results.items,
                    metricsJson: { totalCount: results.totalCount, source },
                }),
            });
            const data = await res.json();
            if (data.success) {
                setFeedback({ type: 'success', message: 'Özel rapor başarıyla kaydedildi.' });
            }
        } catch {
            setFeedback({ type: 'error', message: 'Kaydetme başarısız oldu.' });
        } finally {
            setSaving(false);
        }
    };

    const handleExportCsv = async () => {
        if (!results || !results.items) return;
        try {
            const res = await fetch('/api/admin/reports/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportTitle,
                    reportType: 'CUSTOM',
                    format: 'CSV',
                    data: results.items[0] || { Bilgi: 'Kayıt bulunamadı' },
                }),
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ozel_rapor_${source}.csv`;
            a.click();
        } catch {
            // handle error
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Filter className="w-7 h-7 text-purple-400" />
                    <span>Özel Rapor Builder (Management Intelligence)</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Veri kaynağını seçin, tarih ve durum filtreleri uygulayın, anlık rapor oluşturup dışa aktarın.
                </p>
            </div>

            {feedback && (
                <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Builder Filter Panel */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-cyan-400" />
                            <span>1. Veri Kaynağı</span>
                        </label>
                        <select
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="tasks">Görevler (Tasks)</option>
                            <option value="entrepreneurs">Girişimciler (Entrepreneurs)</option>
                            <option value="mentors">Mentörler (Mentors)</option>
                            <option value="applications">Başvurular (Applications)</option>
                            <option value="events">Etkinlikler (Events)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>2. Başlangıç Tarihi</span>
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>3. Bitiş Tarihi</span>
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleRunQuery}
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-purple-950/50"
                        >
                            <Play className="w-3.5 h-3.5" />
                            <span>{loading ? 'Çalıştırılıyor...' : 'Raporu Oluştur'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Table & Actions */}
            {results && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                            <span className="text-xs text-slate-400">Bulunan Kayıt: <strong className="text-white">{results.totalCount}</strong></span>
                            <h3 className="text-base font-bold text-white mt-0.5">{reportTitle}</h3>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportCsv}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                            >
                                <Download className="w-3.5 h-3.5 text-cyan-400" />
                                <span>CSV</span>
                            </button>
                            <button
                                onClick={handleSaveReport}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>{saving ? 'Kaydediliyor...' : 'Raporu Kaydet'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Başlık / İsim</th>
                                    <th className="p-3">Durum / Sektör</th>
                                    <th className="p-3">Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {results.items?.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-3 font-mono text-[10px] text-slate-500">{item.id.slice(0, 8)}...</td>
                                        <td className="p-3 font-semibold text-white">{item.title || item.name || item.applicationNumber}</td>
                                        <td className="p-3 text-cyan-400">{item.status || item.sector || '-'}</td>
                                        <td className="p-3 text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
