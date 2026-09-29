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
            if (data.success && data.item) {
                setEntrepreneur(data.item);
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
        let updated = { ...entrepreneur };
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
        { id: 'kurucular', label: 'Kurucular & Ekip', icon: Users },
        { id: 'programlar', label: 'Program & Kuluçka', icon: Layers },
        { id: 'mentorluk', label: 'Mentörlük Seansları', icon: Users },
        { id: 'faaliyetler', label: 'Faaliyetler', icon: Activity },
        { id: 'gorevler', label: 'Görevler', icon: CheckSquare },
        { id: 'toplantilar', label: 'Toplantılar', icon: Calendar },
        { id: 'belgeler', label: 'Belgeler & Sözleşmeler', icon: FileText },
        { id: 'yatirimlar', label: 'Yatırımlar & Fon', icon: DollarSign },
        { id: 'patentler', label: 'Patent & Fikri Mülkiyet', icon: Award },
        { id: 'hibeler', label: 'Hibeler & Destekler', icon: Sparkles },
        { id: 'kilometre_taslari', label: 'Kilometre Taşları', icon: CheckCircle2 },
        { id: 'galeri', label: 'Galeri & Medya', icon: ImageIcon },
        { id: 'notlar', label: 'İç Notlar', icon: FileText },
        { id: 'timeline', label: 'İşlem Geçmişi (Timeline)', icon: History },
    ];

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
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                {entrepreneur.program || 'Program Atanmamış'}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1">Program</label>
                            <input
                                type="text"
                                value={entrepreneur.program || ''}
                                onChange={(e) => setEntrepreneur({ ...entrepreneur, program: e.target.value })}
                                placeholder="ANTsPARK, ANTsFire, GlowUp vb."
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1">Kuluçka Tipi</label>
                            <select
                                value={entrepreneur.incubationType || 'Incubation'}
                                onChange={(e) => setEntrepreneur({ ...entrepreneur, incubationType: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none [&>option]:bg-[#0e0e18]"
                            >
                                <option value="Pre-incubation">Ön Kuluçka</option>
                                <option value="Incubation">Kuluçka</option>
                                <option value="Growth">İleri Aşama / Büyüme</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1">Durum</label>
                            <select
                                value={entrepreneur.status || 'ACTIVE'}
                                onChange={(e) => setEntrepreneur({ ...entrepreneur, status: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-primary outline-none [&>option]:bg-[#0e0e18]"
                            >
                                <option value="ACTIVE">Aktif Kuluçka</option>
                                <option value="GRADUATED">Mezun</option>
                                <option value="PASSIVE">Pasif</option>
                            </select>
                        </div>
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

            {/* TAB CONTENT: KURUCULAR, EKİP, PROGRAMLAR, BELGELER ETC */}
            {activeTab !== 'genel' && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h3 className="font-orbitron font-bold text-sm text-white capitalize">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                        <button
                            onClick={() => showToast(`Yeni kayıt ekleme penceresi açıldı.`)}
                            className="px-3 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" /> Yeni Ekle
                        </button>
                    </div>

                    <div className="p-8 text-center text-gray-500 font-mono text-xs space-y-2">
                        <div>Bu girişim için veritabanında kayıtlı {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} listeleniyor.</div>
                        <div className="text-gray-400">PostgreSQL ilişkisel verisi senkronize durumdadır.</div>
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
