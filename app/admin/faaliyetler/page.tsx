"use client";
import React, { useState, useEffect } from 'react';
import {
    Activity, Plus, Search, Filter, Calendar, Users, FileText,
    Download, ExternalLink, Paperclip, ChevronRight, CheckCircle2
} from 'lucide-react';

interface ActivityRecord {
    id: string;
    title: string;
    description?: string;
    activityDate: string;
    endDate?: string;
    location?: string;
    participantCount: number;
    status: string;
    budgetAmount?: number;
    currency?: string;
    category?: { name: string; colorCode?: string };
    program?: { name: string };
    entrepreneur?: { name: string };
    mentor?: { name: string; surname: string };
    _count?: { evidenceFiles: number; participants: number; tasks: number };
}

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create form state
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [activityDate, setActivityDate] = useState('');
    const [location, setLocation] = useState('');
    const [participantCount, setParticipantCount] = useState('0');
    const [budgetAmount, setBudgetAmount] = useState('');

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (selectedCategory) params.append('categoryId', selectedCategory);

            const res = await fetch(`/api/admin/activities?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setActivities(data.activities);
                setCategories(data.categories);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [search, selectedCategory]);

    const handleCreateActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !categoryId || !activityDate) return;

        try {
            const res = await fetch('/api/admin/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    categoryId,
                    description,
                    activityDate,
                    location,
                    participantCount: Number(participantCount) || 0,
                    budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setIsCreateModalOpen(false);
                setTitle('');
                setDescription('');
                setActivityDate('');
                setLocation('');
                setParticipantCount('0');
                setBudgetAmount('');
                fetchActivities();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleExportCSV = () => {
        if (activities.length === 0) return;
        const headers = ["Başlık", "Kategori", "Tarih", "Lokasyon", "Katılımcı Sayısı", "Bütçe", "Durum"];
        const rows = activities.map(a => [
            `"${a.title.replace(/"/g, '""')}"`,
            `"${a.category?.name || '-'}"`,
            `"${new Date(a.activityDate).toLocaleDateString('tr-TR')}"`,
            `"${a.location || '-'}"`,
            a.participantCount || 0,
            a.budgetAmount ? `${a.budgetAmount} ${a.currency || 'TRY'}` : '-',
            a.status
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `faaliyet-raporu-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-orbitron text-white flex items-center gap-3">
                        <Activity className="w-7 h-7 text-primary" />
                        Kurumsal Faaliyetler Portföyü
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Eğitim, atölye, mentorluk, üniversite-sanayi iş birliği, patent ve kamu projelerinin resmi kayıt & kanıt havuzu.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                        <Download className="w-4 h-4 text-primary" />
                        CSV / Excel Raporu
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Faaliyet Kaydet
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#090912] p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                            selectedCategory === ''
                                ? 'bg-primary/20 text-primary border border-primary/40'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Tüm Kategoriler
                    </button>
                    {categories.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedCategory(c.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                                selectedCategory === c.id
                                    ? 'bg-primary/20 text-primary border border-primary/40'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Faaliyet veya mekan ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* Activities Table */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-gray-400">Faaliyetler yükleniyor...</div>
            ) : activities.length === 0 ? (
                <div className="text-center py-20 bg-[#090912] border border-white/10 rounded-2xl space-y-3">
                    <Activity className="w-10 h-10 text-gray-600 mx-auto" />
                    <div className="text-sm font-semibold text-white">Henüz faaliyet kaydı bulunmuyor</div>
                    <p className="text-xs text-gray-500">Yeni bir kurumsal faaliyet ekleyerek kanıt ve raporlama sürecini başlatın.</p>
                </div>
            ) : (
                <div className="bg-[#090912] border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs text-gray-300">
                        <thead className="bg-black/40 text-gray-400 text-[10px] font-mono uppercase border-b border-white/10">
                            <tr>
                                <th className="p-4">Faaliyet</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4">Tarih</th>
                                <th className="p-4">Katılımcı</th>
                                <th className="p-4">Bütçe</th>
                                <th className="p-4">Kanıt / Ek</th>
                                <th className="p-4 text-right">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {activities.map((a) => (
                                <tr key={a.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 max-w-xs">
                                        <div className="font-semibold text-white truncate">{a.title}</div>
                                        <div className="text-[10px] text-gray-500 truncate">{a.location || 'Lokasyon belirtilmedi'}</div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className="px-2 py-0.5 rounded-lg text-[10px] font-mono border"
                                            style={{
                                                borderColor: a.category?.colorCode || 'rgba(255,255,255,0.1)',
                                                color: a.category?.colorCode || '#fff',
                                            }}
                                        >
                                            {a.category?.name || 'Genel'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-[11px]">
                                        {new Date(a.activityDate).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 font-mono text-white">
                                            <Users className="w-3.5 h-3.5 text-primary" />
                                            {a.participantCount} kişi
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-gray-300">
                                        {a.budgetAmount ? `${a.budgetAmount.toLocaleString('tr-TR')} ${a.currency || 'TRY'}` : '-'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <Paperclip className="w-3.5 h-3.5" />
                                            <span>{a._count?.evidenceFiles || 0} kanıt belgesi</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-mono">
                                            {a.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Activity Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="font-orbitron font-bold text-white text-base">Yeni Kurumsal Faaliyet Kaydı</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateActivity} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-gray-400 mb-1">Faaliyet Başlığı *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Sanayi İş Birliği: Otomotiv Sektör Buluşması"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Kategori *</label>
                                    <select
                                        required
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    >
                                        <option value="">Kategori Seçin</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Faaliyet Tarihi *</label>
                                    <input
                                        type="date"
                                        required
                                        value={activityDate}
                                        onChange={(e) => setActivityDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Lokasyon / Mekan</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Örn: İKÜ TEKMER Konferans Salonu"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Katılımcı Sayısı</label>
                                    <input
                                        type="number"
                                        value={participantCount}
                                        onChange={(e) => setParticipantCount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Harcama / Bütçe Tutarı (TL)</label>
                                <input
                                    type="number"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(e.target.value)}
                                    placeholder="Varsa bütçe tutarı..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Açıklama & Kazanımlar</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Faaliyetin içeriği, elde edilen çıktılar..."
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
                                    Faaliyeti Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
