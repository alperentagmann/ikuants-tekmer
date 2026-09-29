"use client";
import React, { useState, useEffect } from 'react';
import {
    Building2, Plus, Eye, EyeOff, MoveUp, MoveDown, Trash2,
    CheckCircle2, Image as ImageIcon, Video, Link as LinkIcon, Sparkles, Sliders
} from 'lucide-react';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';

interface HeroSlide {
    id: string;
    title: string;
    subtitle?: string;
    badgeText?: string;
    description?: string;
    mediaType: string;
    mediaUrl: string;
    primaryCtaText?: string;
    primaryCtaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    sortOrder: number;
    status: string;
    isActive: boolean;
}

interface HomepageSection {
    id: string;
    sectionKey: string;
    title: string;
    isVisible: boolean;
    sortOrder: number;
}

export default function HomepageStudioPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [sections, setSections] = useState<HomepageSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'banners' | 'sections'>('banners');

    // Slide create / edit modal
    const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
    const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [badgeText, setBadgeText] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [primaryCtaText, setPrimaryCtaText] = useState('HEMEN BAŞVUR');
    const [primaryCtaLink, setPrimaryCtaLink] = useState('/basvuru');
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/homepage');
            const data = await res.json();
            if (data.success) {
                setSlides(data.slides);
                setSections(data.sections);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveSlide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !mediaUrl.trim()) return;

        try {
            const method = editingSlideId ? 'PUT' : 'POST';
            const body = {
                id: editingSlideId || undefined,
                title,
                subtitle,
                badgeText,
                mediaUrl,
                primaryCtaText,
                primaryCtaLink,
                status: 'PUBLISHED',
                isActive: true,
            };

            const res = await fetch('/api/admin/homepage', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setIsSlideModalOpen(false);
                setEditingSlideId(null);
                setTitle('');
                setSubtitle('');
                setBadgeText('');
                setMediaUrl('');
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteSlide = async (id: string) => {
        if (!confirm('Bu banner slide silinsin mi?')) return;
        try {
            await fetch(`/api/admin/homepage?id=${id}`, { method: 'DELETE' });
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleSection = async (sectionKey: string, currentVisible: boolean) => {
        try {
            await fetch('/api/admin/homepage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle-section',
                    sectionKey,
                    isVisible: !currentVisible,
                }),
            });
            fetchData();
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
                        <Building2 className="w-7 h-7 text-primary" />
                        Ana Sayfa & Hero Banner Yönetimi
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Hero slider görselleri, butonlar, istatistikler ve ana sayfa modüllerinin yayın kontrol stüdyosu.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setEditingSlideId(null);
                            setTitle('');
                            setSubtitle('');
                            setBadgeText('İKÜ TEKNOLOJİ GELİŞTİRME MERKEZİ');
                            setMediaUrl('');
                            setIsSlideModalOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Hero Slide Ekle
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <button
                    onClick={() => setActiveTab('banners')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                        activeTab === 'banners'
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <ImageIcon className="w-4 h-4" />
                    Hero Banner Slider ({slides.length})
                </button>
                <button
                    onClick={() => setActiveTab('sections')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                        activeTab === 'sections'
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Sliders className="w-4 h-4" />
                    Bölüm Görünürlüğü & Sıralama
                </button>
            </div>

            {/* Content Tabs */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-gray-400">Veriler yükleniyor...</div>
            ) : activeTab === 'banners' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {slides.map((s, idx) => (
                        <div
                            key={s.id}
                            className="bg-[#090912] border border-white/10 rounded-2xl overflow-hidden hover:border-primary/40 transition-all group"
                        >
                            <div className="relative h-44 bg-black/60 overflow-hidden">
                                <img
                                    src={s.mediaUrl}
                                    alt={s.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#090912] via-transparent to-black/30" />
                                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-mono text-primary border border-white/10">
                                    Sıra #{idx + 1}
                                </div>
                                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                                        {s.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 space-y-2 text-xs">
                                {s.badgeText && (
                                    <div className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">
                                        {s.badgeText}
                                    </div>
                                )}
                                <h3 className="font-bold text-white text-sm line-clamp-1">{s.title}</h3>
                                {s.subtitle && <p className="text-gray-400 line-clamp-2 text-[11px]">{s.subtitle}</p>}

                                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px]">
                                    <div className="text-primary font-semibold truncate">
                                        CTA: {s.primaryCtaText || 'HEMEN BAŞVUR'}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSlide(s.id)}
                                        className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {slides.length === 0 && (
                        <div className="col-span-2 text-center py-20 bg-[#090912] border border-white/10 rounded-2xl text-xs text-gray-500">
                            Henüz slide eklenmedi. Yeni Hero Slide ekleyerek ana sayfa görünümünü özelleştirin.
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-[#090912] border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="font-orbitron font-bold text-white text-sm">Ana Sayfa Bölüm Görünürlükleri</h3>
                    <div className="divide-y divide-white/5">
                        {[
                            { key: 'hero', name: 'Hero Banner Slider' },
                            { key: 'stats', name: 'İstatistik Sayaçları' },
                            { key: 'programs', name: 'Program Kartları (ANTSPARK / ANTsFire)' },
                            { key: 'entrepreneurs', name: 'Öne Çıkan Girişimciler' },
                            { key: 'mentors', name: 'Mentör Havuzu' },
                            { key: 'news', name: 'Haberler & Duyurular' },
                            { key: 'events', name: 'Yaklaşan Etkinlikler' },
                            { key: 'supports', name: 'Destek & Teşvikler' },
                            { key: 'partners', name: 'İş Birlikleri & Partner Logoları' },
                            { key: 'cta', name: 'Harekete Geçirici Çağrı (CTA Bandı)' },
                        ].map((sec) => {
                            const found = sections.find(s => s.sectionKey === sec.key);
                            const isVisible = found ? found.isVisible : true;

                            return (
                                <div key={sec.key} className="py-3.5 flex items-center justify-between text-xs">
                                    <div>
                                        <div className="font-semibold text-white">{sec.name}</div>
                                        <div className="text-[10px] font-mono text-gray-500">{sec.key}</div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleSection(sec.key, isVisible)}
                                        className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                                            isVisible
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                        }`}
                                    >
                                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                        <span>{isVisible ? 'Yayında' : 'Gizli'}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Slide Modal */}
            {isSlideModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="font-orbitron font-bold text-white text-base">Hero Slide Düzenle / Ekle</h3>
                            <button onClick={() => setIsSlideModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSaveSlide} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">Üst Rozet / Etiket Metni</label>
                                <input
                                    type="text"
                                    value={badgeText}
                                    onChange={(e) => setBadgeText(e.target.value)}
                                    placeholder="Örn: İKÜ TEKNOLOJİ GELİŞTİRME MERKEZİ"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Ana Başlık *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Geleceğin Girişimlerini Birlikte İnşa Ediyoruz"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Alt Başlık / Açıklama</label>
                                <textarea
                                    rows={2}
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    placeholder="Banner altındaki açıklama..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Görsel URL *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        required
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        placeholder="https://... veya /uploads/..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsMediaPickerOpen(true)}
                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                                    >
                                        Medya Seç
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Buton Metni (CTA)</label>
                                    <input
                                        type="text"
                                        value={primaryCtaText}
                                        onChange={(e) => setPrimaryCtaText(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Buton Linki</label>
                                    <input
                                        type="text"
                                        value={primaryCtaLink}
                                        onChange={(e) => setPrimaryCtaLink(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsSlideModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
                                >
                                    Slide Kaydet
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
                onSelect={(url) => setMediaUrl(url)}
                aspectRatioPreset="16:9"
            />
        </div>
    );
}
