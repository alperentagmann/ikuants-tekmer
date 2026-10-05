'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    MessageSquare,
    Users,
    Building2,
    Calendar,
    Clock,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    CheckSquare,
    Activity,
    FileText,
    Phone,
    Video,
    UserCheck,
    Tag,
    X,
    ExternalLink
} from 'lucide-react';

interface Interaction {
    id: string;
    type: string;
    date: string;
    startTime?: string;
    endTime?: string;
    personName: string;
    organizationName?: string;
    phone?: string;
    email?: string;
    otherParticipants?: string;
    subject: string;
    meetingNotes?: string;
    decisions?: string;
    nextSteps?: string;
    followUpDate?: string;
    status: string;
    tags?: string[];
    user?: { id: string; name: string; email: string };
    convertedTaskId?: string;
    convertedActivityId?: string;
    entrepreneur?: { id: string; name: string; companyName?: string };
    mentor?: { id: string; name: string; title?: string };
    program?: { id: string; name: string };
    hasKvkkConsent?: boolean;
}

export default function GorusmelerPage() {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [summaryStats, setSummaryStats] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        type: 'MEETING',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        personName: '',
        organizationName: '',
        phone: '',
        email: '',
        otherParticipants: '',
        subject: '',
        meetingNotes: '',
        decisions: '',
        nextSteps: '',
        followUpDate: '',
        tags: '',
        status: 'COMPLETED'
    });

    const fetchInteractions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedType !== 'ALL') params.append('type', selectedType);
            if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

            const res = await fetch(`/api/admin/interactions?${params.toString()}`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.items || []);
            setInteractions(list);

            const sumRes = await fetch('/api/admin/interactions/summary');
            const sumData = await sumRes.json();
            setSummaryStats(sumData);
        } catch {
            setFeedback({ type: 'error', message: 'Görüşme kayıtları yüklenirken hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInteractions();
    }, [selectedType, selectedStatus]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Kayıt eklenemedi');
            }

            setFeedback({ type: 'success', message: 'Görüşme / Ziyaret kaydı başarıyla oluşturuldu.' });
            setShowCreateModal(false);
            setFormData({
                type: 'MEETING',
                date: new Date().toISOString().split('T')[0],
                startTime: '10:00',
                endTime: '11:00',
                personName: '',
                organizationName: '',
                phone: '',
                email: '',
                otherParticipants: '',
                subject: '',
                meetingNotes: '',
                decisions: '',
                nextSteps: '',
                followUpDate: '',
                tags: '',
                status: 'COMPLETED'
            });
            fetchInteractions();
        } catch (error: any) {
            setFeedback({ type: 'error', message: error.message || 'Kayıt başarısız.' });
        }
    };

    const handleConvertToTask = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/interactions/${id}/convert-task`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                setFeedback({ type: 'success', message: 'Görüşmeden yeni görev oluşturuldu ve ilişkilendirildi.' });
                fetchInteractions();
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Göreve dönüştürülemedi.' });
        }
    };

    const handleConvertToActivity = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/interactions/${id}/convert-activity`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                setFeedback({ type: 'success', message: 'Görüşmeden kurumsal faaliyet kaydı oluşturuldu.' });
                fetchInteractions();
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Faaliyete dönüştürülemedi.' });
        }
    };

    const filteredInteractions = interactions.filter(i => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            i.personName?.toLowerCase().includes(q) ||
            i.organizationName?.toLowerCase().includes(q) ||
            i.subject?.toLowerCase().includes(q) ||
            i.meetingNotes?.toLowerCase().includes(q)
        );
    });

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'VISITOR':
                return { label: 'Ziyaret', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
            case 'MEETING':
                return { label: 'Yüz Yüze Görüşme', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
            case 'ONLINE':
                return { label: 'Online Toplantı', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
            case 'PHONE':
                return { label: 'Telefon Görüşmesi', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
            case 'MENTOR_MEETING':
                return { label: 'Mentor Görüşmesi', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
            case 'ENTREPRENEUR_MEETING':
                return { label: 'Girişimci Görüşmesi', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
            case 'INVESTOR_MEETING':
                return { label: 'Yatırımcı Görüşmesi', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
            case 'CORPORATE_MEETING':
                return { label: 'Kurumsal İş Birliği', bg: 'bg-teal-500/20 text-teal-400 border-teal-500/30' };
            default:
                return { label: type, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Operasyon Takip Modülü</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Günlük Görüşmeler & Ziyaretler</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        TEKMER&apos;e gelen ziyaretçiler, toplantılar, telefon ve yatırımcı görüşmelerinin günlük operasyonel kayıtları.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button data-intent="create"
                        id="new-interaction-btn"
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-cyan-950/40 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Yeni Görüşme / Ziyaret Kaydı</span>
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

            {/* KPI Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-xs text-cyan-400 font-medium">Bugünkü Toplam Görüşme</span>
                    <p className="text-2xl font-bold text-white mt-1">{summaryStats?.todayTotal || 0}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-xs text-emerald-400 font-medium">Bugünkü Ziyaretçiler</span>
                    <p className="text-2xl font-bold text-emerald-300 mt-1">{summaryStats?.todayVisitors || 0}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-xs text-amber-400 font-medium">Takip Bekleyenler</span>
                    <p className="text-2xl font-bold text-amber-300 mt-1">{summaryStats?.pendingFollowUps || 0}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
                    <span className="text-xs text-purple-400 font-medium">Bu Ayki Toplam Kayıt</span>
                    <p className="text-2xl font-bold text-purple-300 mt-1">{summaryStats?.monthTotal || 0}</p>
                </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                        id="interaction-search"
                        type="text"
                        placeholder="Kişi, kurum veya konu ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                        <option value="ALL">Tüm Görüşme Türleri</option>
                        <option value="VISITOR">Ziyaret</option>
                        <option value="MEETING">Yüz Yüze Görüşme</option>
                        <option value="ONLINE">Online Toplantı</option>
                        <option value="PHONE">Telefon Görüşmesi</option>
                        <option value="MENTOR_MEETING">Mentor Görüşmesi</option>
                        <option value="ENTREPRENEUR_MEETING">Girişimci Görüşmesi</option>
                        <option value="INVESTOR_MEETING">Yatırımcı Görüşmesi</option>
                        <option value="CORPORATE_MEETING">Kurumsal İş Birliği</option>
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                        <option value="ALL">Tüm Durumlar</option>
                        <option value="COMPLETED">Tamamlandı</option>
                        <option value="PLANNED">Planlandı</option>
                        <option value="FOLLOW_UP_NEEDED">Takip Gerekiyor</option>
                        <option value="CANCELLED">İptal Edildi</option>
                    </select>
                </div>
            </div>

            {/* Interactions List Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 text-sm">Görüşmeler yükleniyor...</div>
                ) : filteredInteractions.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm">
                        Henüz kayıtlı görüşme veya ziyaret bulunmuyor.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-5 py-4">Tarih / Saat</th>
                                    <th className="px-5 py-4">Tür</th>
                                    <th className="px-5 py-4">Kişi / Kurum</th>
                                    <th className="px-5 py-4">Görüşen Personel</th>
                                    <th className="px-5 py-4">Konu & Notlar</th>
                                    <th className="px-5 py-4">Takip / Durum</th>
                                    <th className="px-5 py-4 text-right">Aksiyonlar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {filteredInteractions.map((item: any) => {
                                    const badge = getTypeBadge(item.interactionType || item.type || 'MEETING');
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="font-semibold text-white">
                                                    {new Date(item.date).toLocaleDateString('tr-TR')}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {item.startTime || '00:00'} - {item.endTime || '00:00'}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.bg}`}>
                                                    {badge.label}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-white">{item.contactName || item.personName}</div>
                                                {item.organizationName && (
                                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <Building2 className="w-3 h-3 text-slate-500" />
                                                        <span>{item.organizationName}</span>
                                                    </div>
                                                )}
                                                {item.email && (
                                                    <div className="text-xs text-slate-500 mt-0.5">{item.email}</div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-300">{item.user?.name || 'İKÜ Personeli'}</div>
                                                {item.otherParticipants && (
                                                    <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                                        + {item.otherParticipants}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-white text-sm">{item.subject}</div>
                                                {item.meetingNotes && (
                                                    <div className="text-xs text-slate-400 line-clamp-2 mt-1">
                                                        {item.meetingNotes}
                                                    </div>
                                                )}
                                                {item.decisions && (
                                                    <div className="text-xs text-emerald-400/80 line-clamp-1 mt-1">
                                                        <span className="font-semibold">Karar:</span> {item.decisions}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {item.followUpDate ? (
                                                    <div className="text-xs text-amber-400 flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{new Date(item.followUpDate).toLocaleDateString('tr-TR')}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500">-</span>
                                                )}
                                                <div className="mt-1">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${item.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : item.status === 'FOLLOW_UP_NEEDED' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                                                        {item.status === 'COMPLETED' ? 'Tamamlandı' : item.status === 'FOLLOW_UP_NEEDED' ? 'Takip Gerekiyor' : item.status}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!item.convertedTaskId && (
                                                        <button
                                                            id={`convert-task-${item.id}`}
                                                            onClick={() => handleConvertToTask(item.id)}
                                                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 hover:border-cyan-500/50 transition-colors flex items-center gap-1 cursor-pointer"
                                                            title="Göreve Dönüştür"
                                                        >
                                                            <CheckSquare className="w-3.5 h-3.5" />
                                                            <span>Görev Yap</span>
                                                        </button>
                                                    )}
                                                    {!item.convertedActivityId && (
                                                        <button
                                                            id={`convert-activity-${item.id}`}
                                                            onClick={() => handleConvertToActivity(item.id)}
                                                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 hover:border-emerald-500/50 transition-colors flex items-center gap-1 cursor-pointer"
                                                            title="Kurumsal Faaliyete Dönüştür"
                                                        >
                                                            <Activity className="w-3.5 h-3.5" />
                                                            <span>Faaliyet Yap</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Drawer / Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full my-8 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">Yeni Görüşme / Ziyaret Kaydı</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Operasyonel görüşme veya ziyaret detaylarını kaydedin.</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form id="interaction-form" onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Görüşme Türü</label>
                                    <select
                                        id="form-type"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="VISITOR">Ziyaret</option>
                                        <option value="MEETING">Yüz Yüze Görüşme</option>
                                        <option value="ONLINE">Online Toplantı</option>
                                        <option value="PHONE">Telefon Görüşmesi</option>
                                        <option value="MENTOR_MEETING">Mentor Görüşmesi</option>
                                        <option value="ENTREPRENEUR_MEETING">Girişimci Görüşmesi</option>
                                        <option value="INVESTOR_MEETING">Yatırımcı Görüşmesi</option>
                                        <option value="CORPORATE_MEETING">Kurumsal İş Birliği</option>
                                        <option value="OTHER">Diğer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tarih</label>
                                    <input
                                        id="form-date"
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Başlangıç</label>
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1">Bitiş</label>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Gelen / Görüşülen Kişi *</label>
                                    <input
                                        id="form-person-name"
                                        type="text"
                                        required
                                        placeholder="Ad Soyad"
                                        value={formData.personName}
                                        onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Firma / Kurum Adı</label>
                                    <input
                                        id="form-org-name"
                                        type="text"
                                        placeholder="Şirket veya Kurum"
                                        value={formData.organizationName}
                                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Telefon</label>
                                    <input
                                        type="text"
                                        placeholder="+90 5XX XXX XX XX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">E-Posta</label>
                                    <input
                                        type="email"
                                        placeholder="ornek@sirket.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Görüşme Konusu *</label>
                                <input
                                    id="form-subject"
                                    type="text"
                                    required
                                    placeholder="Görüşmenin ana konusu / gündemi"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Toplantı / Görüşme Notu</label>
                                <textarea
                                    id="form-meeting-notes"
                                    rows={3}
                                    placeholder="Görüşmede konuşulan detaylar..."
                                    value={formData.meetingNotes}
                                    onChange={(e) => setFormData({ ...formData, meetingNotes: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Alınan Kararlar</label>
                                    <input
                                        id="form-decisions"
                                        type="text"
                                        placeholder="Mutabık kalınan kararlar"
                                        value={formData.decisions}
                                        onChange={(e) => setFormData({ ...formData, decisions: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Takip Tarihi</label>
                                    <input
                                        id="form-followup-date"
                                        type="date"
                                        value={formData.followUpDate}
                                        onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    id="save-interaction-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-cyan-950/40"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
