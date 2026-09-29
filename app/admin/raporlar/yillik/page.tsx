'use client';

import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    Building2,
    Users,
    GraduationCap,
    Calendar,
    Briefcase,
    FileText,
    Share2,
    Download,
    TrendingUp,
    Shield,
    CheckCircle2,
    Layers
} from 'lucide-react';

export default function YillikKurumsalRaporPage() {
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState<any>(null);

    const fetchYearlyReport = async (targetYear: number) => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'YEARLY', year: targetYear }),
            });
            const data = await res.json();
            if (data.success) {
                setReportData(data.data);
            }
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYearlyReport(year);
    }, [year]);

    const handleExportCsv = async () => {
        if (!reportData) return;
        try {
            const res = await fetch('/api/admin/reports/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportTitle: reportData.title,
                    reportType: 'YEARLY',
                    format: 'CSV',
                    data: {
                        Yil: year,
                        Yonetici_Ozeti: reportData.executiveSummary,
                        Toplam_Girisimci: reportData.sections?.entrepreneurship?.totalEntrepreneurs,
                        Yeni_Girisimci_Sayisi: reportData.sections?.entrepreneurship?.newEntrepreneursThisYear,
                        Aktif_Mentor_Sayisi: reportData.sections?.mentorship?.totalActiveMentors,
                        Aktif_Program_Sayisi: reportData.sections?.programs?.activeProgramsCount,
                        Yillik_Egitim_Sayisi: reportData.sections?.trainings?.totalTrainingsThisYear,
                        Yillik_Etkinlik_Sayisi: reportData.sections?.events?.totalEventsThisYear,
                        Yillik_Basvuru_Sayisi: reportData.sections?.applications?.totalApplicationsThisYear,
                        Yayinlanan_Haber_Sayisi: reportData.sections?.digitalContent?.totalNewsPublished,
                        Sosyal_Medya_Gonderi: reportData.sections?.socialMedia?.totalPostsIngested,
                    },
                }),
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `yillik_kurumsal_rapor_${year}.csv`;
            a.click();
        } catch {
            // handle error
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Yönetim Zekâsı</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        {year} İKÜANTS TEKMER Faaliyet Raporu
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Tüm kurumsal operasyonlar, girişimcilik, mentörlük, eğitim ve etkinlik verilerinin tek rapor füzyonu.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value, 10))}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                    >
                        <option value={2026}>2026 Yılı</option>
                        <option value={2025}>2025 Yılı</option>
                        <option value={2024}>2024 Yılı</option>
                    </select>

                    <button
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-cyan-950/40"
                    >
                        <Download className="w-4 h-4" />
                        <span>Raporu İndir (CSV)</span>
                    </button>
                </div>
            </div>

            {/* Executive Summary Section */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <span>1. Yönetici Özeti</span>
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed bg-slate-950/50 p-5 rounded-xl border border-slate-800">
                    {reportData?.executiveSummary || 'Veriler hesaplanıyor...'}
                </p>
            </div>

            {/* 10 Structured Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 2. Girişimcilik */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-4">
                            <Building2 className="w-5 h-5" />
                            <span>2. Girişimcilik</span>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-slate-800">
                                <span className="text-slate-400">Toplam Girişimci:</span>
                                <span className="font-bold text-white">{reportData?.sections?.entrepreneurship?.totalEntrepreneurs || 0}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-800">
                                <span className="text-slate-400">Yıl İçinde Yeni Kabul:</span>
                                <span className="font-bold text-emerald-400">+{reportData?.sections?.entrepreneurship?.newEntrepreneursThisYear || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Mentörlük */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-4">
                            <Users className="w-5 h-5" />
                            <span>3. Mentörlük Havuzu</span>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-slate-800">
                                <span className="text-slate-400">Aktif Mentör Sayısı:</span>
                                <span className="font-bold text-white">{reportData?.sections?.mentorship?.totalActiveMentors || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Eğitimler */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-4">
                            <GraduationCap className="w-5 h-5" />
                            <span>4. Eğitim Faaliyetleri</span>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-slate-800">
                                <span className="text-slate-400">Düzenlenen Eğitimler:</span>
                                <span className="font-bold text-white">{reportData?.sections?.trainings?.totalTrainingsThisYear || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Etkinlikler */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-4">
                            <Calendar className="w-5 h-5" />
                            <span>5. Ekosistem Etkinlikleri</span>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-slate-800">
                                <span className="text-slate-400">Toplam Etkinlik:</span>
                                <span className="font-bold text-white">{reportData?.sections?.events?.totalEventsThisYear || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. Başvurular */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-4">
                            <Layers className="w-5 h-5" />
                            <span>6. Başvuru Süreçleri</span>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-slate-800">
                                <span className="text-slate-400">Yıllık Başvuru Hacmi:</span>
                                <span className="font-bold text-white">{reportData?.sections?.applications?.totalApplicationsThisYear || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7. Sosyal Medya & Medya */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-pink-400 font-bold text-sm mb-4">
                            <Share2 className="w-5 h-5" />
                            <span>7. Sosyal Medya & İçerik</span>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-slate-800">
                                <span className="text-slate-400">Instagram Gönderileri:</span>
                                <span className="font-bold text-white">{reportData?.sections?.socialMedia?.totalPostsIngested || 0}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-800">
                                <span className="text-slate-400">Habere Dönüştürülen:</span>
                                <span className="font-bold text-cyan-400">{reportData?.sections?.socialMedia?.convertedToNewsCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Freshness Footer */}
            <div className="text-xs text-slate-500 text-right">
                Veri Son Güncelleme: {reportData?.dataFreshness ? new Date(reportData.dataFreshness).toLocaleString('tr-TR') : 'Şimdi'} • Kaynak: Neon PostgreSQL Live Database
            </div>
        </div>
    );
}
