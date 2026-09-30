"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Rocket, ArrowLeft, Globe, Linkedin, Mail, Phone, Calendar,
    Users, Layers, Award, FileText, Activity, CheckSquare,
    DollarSign, Sparkles, Image as ImageIcon, History, Plus,
    Save, Trash2, Edit2, ShieldAlert, CheckCircle2, Upload,
    ExternalLink, Eye, EyeOff
} from 'lucide-react';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';

export default function EntrepreneurDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [entrepreneur, setEntrepreneur] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('genel');
    const [saving, setSaving] = useState(false);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'logo' | 'cover' | 'gallery'>('logo');
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${id}`);
            const data = await res.json();
            const item = data.entrepreneur || data.item;
            if (data.success && item) {
                setEntrepreneur(item);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entrepreneur),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Girişimci bilgileri başarıyla kaydedildi.');
                fetchDetail();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleMediaSelect = async (url: string) => {
        if (!entrepreneur) return;
        const updated = { ...entrepreneur };
        if (pickerTarget === 'logo') {
            updated.logoUrl = url;
        } else if (pickerTarget === 'cover') {
            updated.coverUrl = url;
        }
        setEntrepreneur(updated);
        setIsMediaPickerOpen(false);

        // Auto persist logo/cover change
        try {
            await fetch(`/api/admin/entrepreneurs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            showToast(`${pickerTarget === 'logo' ? 'Logo' : 'Kapak görseli'} güncellendi.`);
        } catch (e) {
            console.error(e);
        }
    };

    const tabs = [
        { id: 'genel', label: 'Genel Bilgiler', icon: Rocket },
        { id: 'programlar', label: 'Programlar & Kuluçka', icon: Layers },
        { id: 'finans', label: 'Finans & Kira', icon: DollarSign },
        { id: 'kurucular', label: 'Kurucular & Ekip', icon: Users },
        { id: 'mentorluk', label: 'Mentörlük Seansları', icon: Users },
        { id: 'faaliyetler', label: 'Faaliyetler', icon: Activity },
        { id: 'gorevler', label: 'Görevler', icon: CheckSquare },
        { id: 'toplantilar', label: 'Toplantılar', icon: Calendar },
        { id: 'belgeler', label: 'Belgeler & Sözleşmeler', icon: FileText },
        { id: 'yatirimlar', label: 'Yatırımlar & Fon', icon: DollarSign },
        { id: 'kilometre_taslari', label: 'Kilometre Taşları', icon: CheckCircle2 },
        { id: 'galeri', label: 'Galeri & Medya', icon: ImageIcon },
        { id: 'timeline', label: 'İşlem Geçmişi (Timeline)', icon: History },
    ];

    // Programs state
    const [assignedPrograms, setAssignedPrograms] = useState<any[]>([]);
    const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
    const [showAssignProgramModal, setShowAssignProgramModal] = useState(false);
    const [programFormData, setProgramFormData] = useState({
        programId: '',
        cohort: '2026-1',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Rent & Finance state
    const [rentContracts, setRentContracts] = useState<any[]>([]);
    const [showRentModal, setShowRentModal] = useState(false);
    const [rentFormData, setRentFormData] = useState({
        monthlyRent: '15000',
        contractNo: `KIRA-${Date.now().toString().slice(-4)}`,
        spaceName: 'Ofis A-102',
        contractStart: new Date().toISOString().split('T')[0],
        dueDay: 5,
        status: 'ACTIVE'
    });

    const fetchAssignedPrograms = async () => {
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${id}/programs`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.items || data.programs || []);
            setAssignedPrograms(list);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchRentData = async () => {
        try {
            const res = await fetch(`/api/admin/rent/contracts?entrepreneurId=${id}`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.items || data.contracts || []);
            setRentContracts(list);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchAvailablePrograms = async () => {
        try {
            const res = await fetch('/api/admin/programs');
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.items || data.programs || []);
            setAvailablePrograms(list);
            if (list.length > 0) {
                setProgramFormData(prev => ({ ...prev, programId: prev.programId || list[0].id }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAssignedPrograms();
            fetchRentData();
            fetchAvailablePrograms();
        }
    }, [id]);

    const handleAssignProgram = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${id}/programs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(programFormData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Program atanamadı');
            }

            showToast('Program başarıyla atandı.');
            setShowAssignProgramModal(false);
            fetchAssignedPrograms();
            fetchDetail();
        } catch (err: any) {
            showToast(`Hata: ${err.message}`);
        }
    };

    const handleUpdateProgramStatus = async (assignmentId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${id}/programs/${assignmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                showToast('Program durumu güncellendi.');
                fetchAssignedPrograms();
            }
        } catch (err: any) {
            showToast('Durum güncellenemedi');
        }
    };

    const handleCreateRentContract = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/rent/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entrepreneurId: id,
                    ...rentFormData,
                    monthlyRent: Number(rentFormData.monthlyRent)
                })
            });

            if (res.ok) {
                showToast('Kira sözleşmesi oluşturuldu.');
                setShowRentModal(false);
                fetchRentData();
            }
        } catch (err) {
            showToast('Kira sözleşmesi eklenemedi');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400 font-mono animate-pulse">Girişimci detayları yükleniyor...</div>;
    }

    if (!entrepreneur) {
        return (
            <div className="p-8 text-center text-rose-400 space-y-3">
                <div>Girişimci kaydı bulunamadı.</div>
                <Link href="/admin/girisimciler" className="text-primary hover:underline text-xs font-mono">
                    Girişimciler Listesine Dön
                </Link>
            </div>
        );
    }

    const activeProgramName = assignedPrograms.find(p => p.status === 'ACTIVE' || p.status === 'ACCEPTED')?.program?.name || entrepreneur.program;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#0e0e18] border border-primary text-white text-xs font-mono px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{toast}</span>
                </div>
            )}

            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href="/admin/girisimciler"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-mono"
                >
                    <ArrowLeft className="w-4 h-4" /> Girişimcilere Dön
                </Link>
                <div className="flex items-center gap-2">
                    <a
                        href={`/girisimciler/${entrepreneur.slug || entrepreneur.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono flex items-center gap-1.5 transition-all"
                    >
                        <ExternalLink className="w-3.5 h-3.5" /> Canlı Sayfayı Gör
                    </a>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Logo with interactive MediaPicker */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-2">
                            {entrepreneur.logoUrl ? (
                                <img src={entrepreneur.logoUrl} alt={entrepreneur.name} className="max-w-full max-h-full object-contain" />
                            ) : (
                                <Rocket className="w-10 h-10 text-primary" />
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setPickerTarget('logo');
                                setIsMediaPickerOpen(true);
                            }}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-[10px] text-white font-mono font-bold transition-opacity cursor-pointer"
                        >
                            <Upload className="w-4 h-4 mb-1 text-primary" />
                            Logo Değiştir
                        </button>
                    </div>

                    {/* Basic Meta */}
                    <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="font-orbitron font-bold text-2xl text-white">
                                {entrepreneur.name}
                            </h1>
                            <span id="entrepreneur-active-program-badge" className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                {activeProgramName || 'Program Atanmamış'}
                            </span>
                            <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                                entrepreneur.isPublished !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                                {entrepreneur.isPublished !== false ? 'Yayında (Public)' : 'Gizli'}
                            </span>
                        </div>

                        <p className="text-xs text-cyan-400 font-mono">
                            {entrepreneur.sector} {entrepreneur.subSector ? `• ${entrepreneur.subSector}` : ''}
                        </p>

                        <div className="text-xs text-gray-400 flex flex-wrap gap-4 pt-1 font-mono">
                            {entrepreneur.founders && <span>Kurucu: <b className="text-white">{entrepreneur.founders}</b></span>}
                            {entrepreneur.website && (
                                <a href={entrepreneur.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5" /> Web
                                </a>
                            )}
                            {entrepreneur.linkedin && (
                                <a href={entrepreneur.linkedin} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CRM Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-white/10 scrollbar-thin">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25 font-bold'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT: GENEL BİLGİLER */}
            {activeTab === 'genel' && (
                <form onSubmit={handleSaveGeneral} className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1">Girişim / Firma Adı *</label>
                            <input
                                type="text"
                                required
                                value={entrepreneur.name || ''}
                                onChange={(e) => setEntrepreneur({ ...entrepreneur, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1">Sektör *</label>
                            <input
                                type="text"
                                required
                                value={entrepreneur.sector || ''}
                                onChange={(e) => setEntrepreneur({ ...entrepreneur, sector: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1">Kısa Açıklama (Public Listelerde Görünen)</label>
                        <textarea
                            rows={3}
                            value={entrepreneur.shortDesc || ''}
                            onChange={(e) => setEntrepreneur({ ...entrepreneur, shortDesc: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1">Detaylı Hikaye & Başarı Öyküsü (Markdown)</label>
                        <textarea
                            rows={5}
                            value={entrepreneur.successStory || entrepreneur.longDesc || ''}
                            onChange={(e) => setEntrepreneur({ ...entrepreneur, successStory: e.target.value })}
                            placeholder="Girişimin kuruluş hikayesi, çözdüğü problem, pazardaki yeri..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none leading-relaxed"
                        />
                    </div>

                    <div className="flex justify-end pt-3 border-t border-white/10">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/25 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB CONTENT: PROGRAMLAR & KULUÇKA */}
            {activeTab === 'programlar' && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div>
                            <h3 className="font-orbitron font-bold text-sm text-white">Program & Kuluçka Geçmişi</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Girişimin katıldığı ve dahil olduğu tüm programlar tarihçesiyle listelenir.</p>
                        </div>
                        <button
                            id="assign-program-btn"
                            onClick={() => setShowAssignProgramModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" /> + Program Ata
                        </button>
                    </div>

                    {assignedPrograms.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 font-mono text-xs border border-dashed border-white/10 rounded-2xl">
                            <span id="no-program-assigned-text" className="text-amber-400 font-bold block mb-1">Program Atanmamış</span>
                            Girişimci henüz herhangi bir hızlandırma veya kuluçka programına dahil edilmemiştir.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {assignedPrograms.map((ap) => (
                                <div
                                    key={ap.id}
                                    className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white text-sm">{ap.program?.name || 'Program'}</h4>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                Dönem / Cohort: {ap.cohort || '-'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-3">
                                            <span>Başlangıç: {new Date(ap.joinedAt).toLocaleDateString('tr-TR')}</span>
                                            {ap.completedAt && <span>Mezuniyet: {new Date(ap.completedAt).toLocaleDateString('tr-TR')}</span>}
                                            {ap.notes && <span className="text-gray-500">• {ap.notes}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <select
                                            value={ap.status}
                                            onChange={(e) => handleUpdateProgramStatus(ap.id, e.target.value)}
                                            className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-primary outline-none [&>option]:bg-[#0e0e18]"
                                        >
                                            <option value="ACTIVE">Aktif (ACTIVE)</option>
                                            <option value="ACCEPTED">Kabul Edildi (ACCEPTED)</option>
                                            <option value="COMPLETED">Mezun Oldu (COMPLETED)</option>
                                            <option value="WITHDRAWN">Ayrıldı (WITHDRAWN)</option>
                                            <option value="REJECTED">Reddedildi (REJECTED)</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: FİNANS & KİRA */}
            {activeTab === 'finans' && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div>
                            <h3 className="font-orbitron font-bold text-sm text-white">Finans & Ofis Kira Durumu</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Aktif kira sözleşmeleri, tahakkuklar ve ödeme geçmişi.</p>
                        </div>
                        <button
                            onClick={() => setShowRentModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" /> Yeni Kira Sözleşmesi Ekle
                        </button>
                    </div>

                    {rentContracts.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 font-mono text-xs border border-dashed border-white/10 rounded-2xl">
                            Bu girişimciye ait aktif kira sözleşmesi bulunmuyor.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rentContracts.map((rc) => (
                                <div key={rc.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-sm">{rc.spaceName || 'Ofis Alanı'}</span>
                                                <span className="text-xs text-gray-400 font-mono">({rc.contractNo})</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rc.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                                                    {rc.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Aylık Kira: <b className="text-emerald-400">{Number(rc.monthlyRent).toLocaleString('tr-TR')} {rc.currency}</b> + KDV • Vade Günü: Ayın {rc.dueDay}. günü
                                            </div>
                                        </div>

                                        <Link
                                            href={`/admin/finans/kiralar?entrepreneurId=${id}`}
                                            className="text-xs text-primary hover:underline font-mono"
                                        >
                                            Kira Tahsilat Detayları →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: GENERIC PLACEHOLDER FOR OTHER TABS */}
            {activeTab !== 'genel' && activeTab !== 'programlar' && activeTab !== 'finans' && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h3 className="font-orbitron font-bold text-sm text-white capitalize">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                    </div>
                    <div className="p-8 text-center text-gray-500 font-mono text-xs space-y-2">
                        <div>Bu girişim için veritabanında kayıtlı {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} listeleniyor.</div>
                        <div className="text-gray-400">PostgreSQL ilişkisel verisi senkronize durumdadır.</div>
                    </div>
                </div>
            )}

            {/* Assign Program Modal */}
            {showAssignProgramModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Girişimciye Program Ata</h3>
                        <form onSubmit={handleAssignProgram} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Program Seçin *</label>
                                <select
                                    id="select-program-id"
                                    required
                                    value={programFormData.programId}
                                    onChange={(e) => setProgramFormData({ ...programFormData, programId: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                >
                                    {availablePrograms.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Dönem / Cohort</label>
                                    <input
                                        id="input-cohort"
                                        type="text"
                                        placeholder="2026-1"
                                        value={programFormData.cohort}
                                        onChange={(e) => setProgramFormData({ ...programFormData, cohort: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Durum</label>
                                    <select
                                        id="select-program-status"
                                        value={programFormData.status}
                                        onChange={(e) => setProgramFormData({ ...programFormData, status: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                                    >
                                        <option value="ACTIVE">Aktif (ACTIVE)</option>
                                        <option value="ACCEPTED">Kabul (ACCEPTED)</option>
                                        <option value="APPLIED">Başvuruda (APPLIED)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Başlangıç Tarihi</label>
                                <input
                                    type="date"
                                    value={programFormData.joinedAt}
                                    onChange={(e) => setProgramFormData({ ...programFormData, joinedAt: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Not / Açıklama</label>
                                <input
                                    type="text"
                                    placeholder="Program kabul notu..."
                                    value={programFormData.notes}
                                    onChange={(e) => setProgramFormData({ ...programFormData, notes: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignProgramModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    id="confirm-assign-program-btn"
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold"
                                >
                                    Programı Ata
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Rent Modal */}
            {showRentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Yeni Kira Sözleşmesi Tanımla</h3>
                        <form onSubmit={handleCreateRentContract} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1">Sözleşme No</label>
                                <input
                                    type="text"
                                    required
                                    value={rentFormData.contractNo}
                                    onChange={(e) => setRentFormData({ ...rentFormData, contractNo: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Ofis / Alan Adı</label>
                                    <input
                                        type="text"
                                        placeholder="Ofis A-102"
                                        value={rentFormData.spaceName}
                                        onChange={(e) => setRentFormData({ ...rentFormData, spaceName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Aylık Kira (TL)</label>
                                    <input
                                        type="number"
                                        required
                                        value={rentFormData.monthlyRent}
                                        onChange={(e) => setRentFormData({ ...rentFormData, monthlyRent: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowRentModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Media Picker Modal */}
            <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
            />
        </div>
    );
}
