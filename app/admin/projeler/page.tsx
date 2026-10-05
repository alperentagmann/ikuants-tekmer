"use client";
import React, { useState, useEffect } from 'react';
import {
    FolderKanban, Plus, Search, Calendar, DollarSign,
    AlertTriangle, CheckCircle2, FileText, ChevronRight, Download
} from 'lucide-react';

interface ProjectItem {
    id: string;
    title: string;
    code?: string;
    description?: string;
    projectType: string;
    budgetAmount?: number;
    currency?: string;
    fundingAgency?: string;
    startDate: string;
    endDate?: string;
    status: string;
    completionRate: number;
    program?: { name: string };
    entrepreneur?: { name: string };
    organization?: { name: string };
    milestones?: Array<{ id: string; title: string; targetDate: string; status: string }>;
    risks?: Array<{ id: string; riskTitle: string; riskLevel: string }>;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [projectType, setProjectType] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [type, setType] = useState('KOSGEB');
    const [fundingAgency, setFundingAgency] = useState('KOSGEB');
    const [budgetAmount, setBudgetAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [description, setDescription] = useState('');

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (projectType) params.append('projectType', projectType);

            const res = await fetch(`/api/admin/projects?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setProjects(data.projects);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [search, projectType]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !startDate) return;

        try {
            const res = await fetch('/api/admin/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    code,
                    projectType: type,
                    fundingAgency,
                    budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
                    startDate,
                    endDate: endDate || undefined,
                    description,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setIsCreateModalOpen(false);
                setTitle('');
                setCode('');
                setBudgetAmount('');
                setStartDate('');
                setEndDate('');
                setDescription('');
                fetchProjects();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-orbitron text-white flex items-center gap-3">
                        <FolderKanban className="w-7 h-7 text-primary" />
                        Kurumsal Projeler & Hibe Yönetimi
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        KOSGEB, TÜBİTAK, İSTKA, AB Ufuk ve TEKMER Ar-Ge projelerinin bütçe, kilometre taşı ve risk takibi.
                    </p>
                </div>
                <button data-intent="create"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Proje Tanımla
                </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#090912] p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {[
                        { id: '', label: 'Tüm Projeler' },
                        { id: 'KOSGEB', label: 'KOSGEB' },
                        { id: 'TUBITAK', label: 'TÜBİTAK' },
                        { id: 'ISTKA', label: 'İSTKA' },
                        { id: 'TEKMER', label: 'TEKMER İç' },
                        { id: 'EU_HORIZON', label: 'AB Ufuk' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setProjectType(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                                projectType === tab.id
                                    ? 'bg-primary/20 text-primary border border-primary/40'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Proje adı, kodu veya kurum..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-gray-400">Projeler yükleniyor...</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-20 bg-[#090912] border border-white/10 rounded-2xl space-y-3">
                    <FolderKanban className="w-10 h-10 text-gray-600 mx-auto" />
                    <div className="text-sm font-semibold text-white">Henüz kayıtlı proje bulunmuyor</div>
                    <p className="text-xs text-gray-500">KOSGEB veya TÜBİTAK hibe projelerini ekleyerek kilometre taşı takibini başlatın.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((p) => (
                        <div
                            key={p.id}
                            className="bg-[#090912] border border-white/10 rounded-2xl p-5 space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono bg-primary/20 text-primary border border-primary/30 font-bold">
                                        {p.projectType}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-400">
                                        {p.code || 'Kodsuz'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-sm text-white line-clamp-2">{p.title}</h3>
                                {p.description && (
                                    <p className="text-xs text-gray-400 line-clamp-2">{p.description}</p>
                                )}
                            </div>

                            <div className="space-y-2 pt-3 border-t border-white/5 text-xs">
                                <div className="flex items-center justify-between font-mono">
                                    <span className="text-gray-400">Bütçe:</span>
                                    <span className="text-emerald-400 font-bold">
                                        {p.budgetAmount ? `${p.budgetAmount.toLocaleString('tr-TR')} ${p.currency || 'TRY'}` : 'Belirtilmedi'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400 font-mono text-[11px]">
                                    <span>Tarih:</span>
                                    <span>{new Date(p.startDate).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="space-y-1 pt-1">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                        <span>İlerleme Oranı</span>
                                        <span>%{p.completionRate || 0}</span>
                                    </div>
                                    <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-primary h-full rounded-full transition-all"
                                            style={{ width: `${p.completionRate || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="font-orbitron font-bold text-white text-base">Yeni Proje & Hibe Tanımla</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">Proje Başlığı *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Yapay Zeka Tabanlı Otonom İnsansız Sistemler"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Proje / Hibe Türü</label>
                                    <select
                                        value={type}
                                        onChange={(e) => {
                                            setType(e.target.value);
                                            setFundingAgency(e.target.value);
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    >
                                        <option value="KOSGEB">KOSGEB</option>
                                        <option value="TUBITAK">TÜBİTAK</option>
                                        <option value="ISTKA">İSTKA</option>
                                        <option value="TEKMER">TEKMER İç Proje</option>
                                        <option value="EU_HORIZON">AB Ufuk Avrupa</option>
                                        <option value="INDUSTRIAL">Sanayi İş Birliği</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Proje Kodu</label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="Örn: KOSGEB-2026-041"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Hibe / Bütçe Tutarı (TL)</label>
                                    <input
                                        type="number"
                                        value={budgetAmount}
                                        onChange={(e) => setBudgetAmount(e.target.value)}
                                        placeholder="Örn: 1500000"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Başlangıç Tarihi *</label>
                                    <input
                                        type="date"
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Açıklama & Proje Hedefleri</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Projenin amacı, beklenen çıktılar..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
                                >
                                    Projeyi Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
