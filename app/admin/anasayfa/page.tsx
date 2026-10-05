"use client";
import React, { useState, useEffect } from 'react';
import { HomepageDesignStudio } from '@/components/admin/homepage/HomepageDesignStudio';
import { isPageKey, type PageKey } from '@/lib/homepage-layout';
import {
    Building2, Plus, Eye, EyeOff, MoveUp, MoveDown, Trash2, Edit3,
    CheckCircle2, Image as ImageIcon, Video, Link as LinkIcon, Sparkles, Sliders,
    Monitor, Tablet, Smartphone, ExternalLink, RefreshCw, Layout, Layers, Grid
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
    mobileMediaUrl?: string;
    videoEmbedUrl?: string;
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
    subtitle?: string;
    description?: string;
    customConfig?: string;
    isVisible: boolean;
    sortOrder: number;
}

export default function HomepageStudioPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [sections, setSections] = useState<HomepageSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'banners' | 'sections' | 'preview'>('banners');

    // Slide create / edit modal state
    const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
    const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [badgeText, setBadgeText] = useState('');
    const [mediaType, setMediaType] = useState('IMAGE');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mobileMediaUrl, setMobileMediaUrl] = useState('');
    const [videoEmbedUrl, setVideoEmbedUrl] = useState('');
    const [primaryCtaText, setPrimaryCtaText] = useState('HEMEN BAŞVUR');
    const [primaryCtaLink, setPrimaryCtaLink] = useState('/basvuru');
    const [secondaryCtaText, setSecondaryCtaText] = useState('PROGRAMLARI İNCELE');
    const [secondaryCtaLink, setSecondaryCtaLink] = useState('/programlar');
    const [status, setStatus] = useState('PUBLISHED');
    const [isActive, setIsActive] = useState(true);

    // Media picker targeting
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [mediaPickerTarget, setMediaPickerTarget] = useState<'desktop' | 'mobile'>('desktop');

    // Section edit modal state
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [designPage, setDesignPage] = useState<PageKey>('home');
    const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
    const [secTitle, setSecTitle] = useState('');
    const [secSubtitle, setSecSubtitle] = useState('');
    const [secDesc, setSecDesc] = useState('');

    // Preview mode
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/homepage');
            const data = await res.json();
            if (data.success) {
                setSlides(data.slides || []);
                setSections(data.sections || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Deep link from the homepage preview banner: /admin/anasayfa?tab=design
        const t = setTimeout(() => {
            const q = new URLSearchParams(window.location.search);
            const p = q.get('page');
            if (isPageKey(p)) setDesignPage(p);
            if (q.get('tab') === 'design') setActiveTab('sections');
        }, 0);
        return () => clearTimeout(t);
    }, []);

    const openCreateSlide = () => {
        setEditingSlideId(null);
        setTitle('');
        setSubtitle('');
        setBadgeText('TEKNOLOJİ & İNOVASYON');
        setMediaType('IMAGE');
        setMediaUrl('/images/hero-slide-1.jpg');
        setMobileMediaUrl('');
        setVideoEmbedUrl('');
        setPrimaryCtaText('HEMEN BAŞVUR');
        setPrimaryCtaLink('/basvuru');
        setSecondaryCtaText('PROGRAMLARI İNCELE');
        setSecondaryCtaLink('/programlar');
        setStatus('PUBLISHED');
        setIsActive(true);
        setIsSlideModalOpen(true);
    };

    const openEditSlide = (s: HeroSlide) => {
        setEditingSlideId(s.id);
        setTitle(s.title || '');
        setSubtitle(s.subtitle || '');
        setBadgeText(s.badgeText || '');
        setMediaType(s.mediaType || 'IMAGE');
        setMediaUrl(s.mediaUrl || '');
        setMobileMediaUrl(s.mobileMediaUrl || '');
        setVideoEmbedUrl(s.videoEmbedUrl || '');
        setPrimaryCtaText(s.primaryCtaText || 'HEMEN BAŞVUR');
        setPrimaryCtaLink(s.primaryCtaLink || '/basvuru');
        setSecondaryCtaText(s.secondaryCtaText || 'PROGRAMLARI İNCELE');
        setSecondaryCtaLink(s.secondaryCtaLink || '/programlar');
        setStatus(s.status || 'PUBLISHED');
        setIsActive(s.isActive);
        setIsSlideModalOpen(true);
    };

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
                mediaType,
                mediaUrl,
                mobileMediaUrl,
                videoEmbedUrl,
                primaryCtaText,
                primaryCtaLink,
                secondaryCtaText,
                secondaryCtaLink,
                status,
                isActive,
            };

            const res = await fetch('/api/admin/homepage', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setIsSlideModalOpen(false);
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

    const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const newSections = [...sections];
        const temp = newSections[index];
        newSections[index] = newSections[targetIndex];
        newSections[targetIndex] = temp;

        setSections(newSections);

        try {
            await fetch('/api/admin/homepage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reorder-sections',
                    orderedKeys: newSections.map(s => s.sectionKey),
                }),
            });
        } catch (e) {
            console.error(e);
            fetchData();
        }
    };

    const openEditSection = (s: HomepageSection) => {
        setEditingSectionKey(s.sectionKey);
        setSecTitle(s.title || '');
        setSecSubtitle(s.subtitle || '');
        setSecDesc(s.description || '');
        setIsSectionModalOpen(true);
    };

    const handleSaveSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSectionKey) return;

        try {
            await fetch('/api/admin/homepage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update-section',
                    sectionKey: editingSectionKey,
                    title: secTitle,
                    subtitle: secSubtitle,
                    description: secDesc,
                }),
            });
            setIsSectionModalOpen(false);
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
                        Ana Sayfa & Hero Banner Yönetim Merkezi
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Hero slider görselleri, butonlar, modül sıralaması ve ana sayfa bileşenlerinin tam kontrol stüdyosu.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openCreateSlide}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Hero Slide Ekle
                    </button>
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Canlı Site
                    </a>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <button
                    onClick={() => setActiveTab('banners')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        activeTab === 'banners'
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <ImageIcon className="w-4 h-4" />
                    Hero Slider ({slides.length})
                </button>
                <button
                    onClick={() => setActiveTab('sections')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        activeTab === 'sections'
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Sliders className="w-4 h-4" />
                    Tasarım Stüdyosu (bölümler & tema)
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        activeTab === 'preview'
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Monitor className="w-4 h-4" />
                    Canlı Önizleme Stüdyosu
                </button>
            </div>

            {/* Content Tabs */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-gray-400">Veriler yükleniyor...</div>
            ) : activeTab === 'banners' ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {slides.map((s, idx) => (
                            <div
                                key={s.id}
                                data-testid="hero-slide-card"
                                className="bg-[#090912] border border-white/10 rounded-2xl overflow-hidden hover:border-primary/40 transition-all group flex flex-col justify-between"
                            >
                                <div>
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
                                            <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono ${
                                                s.isActive
                                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                            }`}>
                                                {s.isActive ? 'YAYINDA' : 'PASİF'}
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
                                    </div>
                                </div>

                                <div className="p-4 pt-0">
                                    <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px]">
                                        <div className="text-primary font-semibold truncate max-w-[150px]">
                                            CTA: {s.primaryCtaText || 'BAŞVUR'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditSlide(s)}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSlide(s.id)}
                                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {slides.length === 0 && (
                        <div className="text-center py-20 bg-[#090912] border border-white/10 rounded-2xl text-xs text-gray-500">
                            Henüz slide eklenmedi. Yeni Hero Slide ekleyerek ana sayfa görünümünü özelleştirin.
                        </div>
                    )}
                </div>
            ) : activeTab === 'sections' ? (
                <HomepageDesignStudio initialPage={designPage} />
            ) : (
                /* Live Preview Studio */
                <div className="bg-[#090912] border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
                        <div>
                            <h3 className="font-orbitron font-bold text-white text-sm">Canlı Önizleme Stüdyosu</h3>
                            <p className="text-[11px] text-gray-400">Yaptığınız değişikliklerin canlı ana sayfada nasıl göründüğünü farklı cihaz boyutlarında test edin.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                            <button
                                onClick={() => setPreviewDevice('desktop')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    previewDevice === 'desktop' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Monitor className="w-3.5 h-3.5" /> Masaüstü
                            </button>
                            <button
                                onClick={() => setPreviewDevice('tablet')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    previewDevice === 'tablet' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Tablet className="w-3.5 h-3.5" /> Tablet
                            </button>
                            <button
                                onClick={() => setPreviewDevice('mobile')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    previewDevice === 'mobile' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Smartphone className="w-3.5 h-3.5" /> Mobil
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center bg-black/60 p-4 rounded-xl overflow-hidden min-h-[600px]">
                        <iframe
                            title="Ana sayfa canlı önizleme"
                            src="/?embed=1"
                            className={`border border-white/10 rounded-xl transition-all duration-300 bg-white dark:bg-[#050510] ${
                                previewDevice === 'desktop'
                                    ? 'w-full h-[700px]'
                                    : previewDevice === 'tablet'
                                    ? 'w-[768px] h-[700px]'
                                    : 'w-[375px] h-[700px]'
                            }`}
                        />
                    </div>
                </div>
            )}

            {/* Slide Modal */}
            {isSlideModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="font-orbitron font-bold text-white text-base">
                                {editingSlideId ? 'Hero Slide Düzenle' : 'Yeni Hero Slide Ekle'}
                            </h3>
                            <button onClick={() => setIsSlideModalOpen(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
                        </div>

                        <form onSubmit={handleSaveSlide} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Üst Rozet / Etiket Metni</label>
                                    <input
                                        type="text"
                                        value={badgeText}
                                        onChange={(e) => setBadgeText(e.target.value)}
                                        placeholder="Örn: TEKNOLOJİ & İNOVASYON"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Yayın Durumu</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="PUBLISHED">PUBLISHED (Yayında)</option>
                                        <option value="DRAFT">DRAFT (Taslak)</option>
                                        <option value="ARCHIVED">ARCHIVED (Arşiv)</option>
                                    </select>
                                </div>
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
                                <label className="block text-gray-400 mb-1">Alt Başlık / Vurgu</label>
                                <input
                                    type="text"
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    placeholder="Örn: İKÜANTS TEKMER ile Fikirlerinizi Küresel Başarıya Dönüştürün"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Masaüstü Görsel URL *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        placeholder="/images/hero-slide-1.jpg veya https://..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMediaPickerTarget('desktop');
                                            setIsMediaPickerOpen(true);
                                        }}
                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                                    >
                                        Medya Seç
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Mobil Görsel URL (Opsiyonel)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={mobileMediaUrl}
                                        onChange={(e) => setMobileMediaUrl(e.target.value)}
                                        placeholder="Mobil cihazlar için özel görsel..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMediaPickerTarget('mobile');
                                            setIsMediaPickerOpen(true);
                                        }}
                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                                    >
                                        Medya Seç
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">Birincil Buton Metni (CTA 1)</label>
                                    <input
                                        type="text"
                                        value={primaryCtaText}
                                        onChange={(e) => setPrimaryCtaText(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">Birincil Buton Linki</label>
                                    <input
                                        type="text"
                                        value={primaryCtaLink}
                                        onChange={(e) => setPrimaryCtaLink(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-400 mb-1">İkincil Buton Metni (CTA 2)</label>
                                    <input
                                        type="text"
                                        value={secondaryCtaText}
                                        onChange={(e) => setSecondaryCtaText(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1">İkincil Buton Linki</label>
                                    <input
                                        type="text"
                                        value={secondaryCtaLink}
                                        onChange={(e) => setSecondaryCtaLink(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="slideActive"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="rounded border-white/20 bg-black/40 text-primary focus:ring-0"
                                />
                                <label htmlFor="slideActive" className="text-gray-300 font-semibold cursor-pointer">
                                    Aktif olarak ana sayfada göster
                                </label>
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
                                    {editingSlideId ? 'Değişiklikleri Kaydet' : 'Slide Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Section Modal */}
            {isSectionModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="font-orbitron font-bold text-white text-base">Bölüm Bilgilerini Düzenle</h3>
                            <button onClick={() => setIsSectionModalOpen(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
                        </div>

                        <form onSubmit={handleSaveSection} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">Bölüm Ana Başlığı *</label>
                                <input
                                    type="text"
                                    required
                                    value={secTitle}
                                    onChange={(e) => setSecTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Alt Başlık</label>
                                <input
                                    type="text"
                                    value={secSubtitle}
                                    onChange={(e) => setSecSubtitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">Açıklama</label>
                                <textarea
                                    rows={3}
                                    value={secDesc}
                                    onChange={(e) => setSecDesc(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsSectionModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
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
                onSelect={(url) => {
                    if (mediaPickerTarget === 'desktop') {
                        setMediaUrl(url);
                    } else {
                        setMobileMediaUrl(url);
                    }
                }}
                aspectRatioPreset="16:9"
            />
        </div>
    );
}
