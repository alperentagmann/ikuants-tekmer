"use client";
import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { RevisionViewer } from '@/components/admin/RevisionViewer';
import {
    Plus, Edit2, Trash2, Layers, History, ArrowLeft, Save, X, Sparkles,
    ExternalLink, Calendar, Users, Clock, Target, CheckCircle2, HelpCircle,
    FileText, Image as ImageIcon, MoveUp, MoveDown, Layout
} from 'lucide-react';

export default function AdminProgramlarPage() {
    const [programs, setPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeEditorTab, setActiveEditorTab] = useState<'general' | 'audience' | 'media' | 'dates' | 'sections' | 'blocks' | 'seo'>('general');
    const [viewingRevisionsId, setViewingRevisionsId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/programs');
            const data = await res.json();
            if (data.success) {
                setPrograms(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = isCreating ? '/api/admin/programs' : `/api/admin/programs/${editingItem.id}`;
            const method = isCreating ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingItem),
            });

            const data = await res.json();
            if (data.success) {
                setIsCreating(false);
                setEditingItem(null);
                await fetchPrograms();
            } else {
                alert(data.message || 'Hata oluştu');
            }
        } catch {
            alert('Bağlantı hatası oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`/api/admin/programs/${deleteTarget.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setDeleteTarget(null);
                await fetchPrograms();
            }
        } catch {
            alert('Silme işlemi başarısız');
        }
    };

    // Helper to add a block
    const addBlock = (type: string) => {
        const blocks = editingItem.contentBlocksJson || editingItem.contentBlocks || [];
        const newBlock = {
            id: `b-${Date.now()}`,
            type,
            title: type === 'richText' ? 'Yeni Başlık' : type === 'benefits' ? 'Avantajlar' : type === 'timeline' ? 'Aşamalar' : type === 'faq' ? 'SSS' : 'CTA',
            content: '',
            isVisible: true,
        };
        setEditingItem({ ...editingItem, contentBlocksJson: [...blocks, newBlock] });
    };

    const removeBlock = (index: number) => {
        const blocks = [...(editingItem.contentBlocksJson || editingItem.contentBlocks || [])];
        blocks.splice(index, 1);
        setEditingItem({ ...editingItem, contentBlocksJson: blocks });
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const blocks = [...(editingItem.contentBlocksJson || editingItem.contentBlocks || [])];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= blocks.length) return;
        const temp = blocks[index];
        blocks[index] = blocks[target];
        blocks[target] = temp;
        setEditingItem({ ...editingItem, contentBlocksJson: blocks });
    };

    const columns: Column<any>[] = [
        {
            key: 'name',
            header: 'Program Adı',
            render: (item) => (
                <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{item.tagline || item.slug}</div>
                </div>
            ),
        },
        {
            key: 'programType',
            header: 'Tür',
            render: (item) => <span className="text-purple-400 font-mono text-xs">{item.programType || 'Kuluçka'}</span>,
        },
        {
            key: 'duration',
            header: 'Süre / Kontenjan',
            render: (item) => (
                <span className="text-gray-300 font-mono text-xs">
                    {item.duration || '-'} / {item.quota || '-'}
                </span>
            ),
        },
        {
            key: 'applyStatus',
            header: 'Başvuru Durumu',
            render: (item) => <StatusBadge status={item.applyStatus || 'OPEN'} />,
        },
        {
            key: 'actions',
            header: 'İşlemler',
            sortable: false,
            render: (item) => (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <a
                        href={`/programlar/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        title="Sayfayı Önizle"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                        onClick={() => {
                            setEditingItem({
                                ...item,
                                timelineJson: item.timelineJson || item.timeline || [],
                                benefitsJson: item.benefitsJson || item.benefits || [],
                                faqsJson: item.faqsJson || item.faqs || [],
                                documentsJson: item.documentsJson || item.documents || [],
                                contentBlocksJson: item.contentBlocksJson || item.contentBlocks || [],
                            });
                            setIsCreating(false);
                            setActiveEditorTab('general');
                        }}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Düzenle"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewingRevisionsId(item.id)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Sürüm Geçmişi"
                    >
                        <History className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Arşivle / Sil"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Program Yönetimi</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        ANTSPARK, ANTSFire, Glow Up ve kuluçka programlarının tüm alanları ve blok içerik oluşturucusu
                    </p>
                </div>

                {!editingItem && !isCreating && (
                    <button
                        onClick={() => {
                            setEditingItem({
                                name: '',
                                slug: '',
                                programType: 'PRE_INCUBATION',
                                tagline: '',
                                shortDesc: '',
                                detailedDesc: '',
                                duration: '12 Hafta',
                                quota: '20 Girişim',
                                mentorHours: '70+ Saat',
                                applyStatus: 'OPEN',
                                heroUrl: '/images/hero-slide-2.jpg',
                                coverUrl: '/images/hero-slide-2.jpg',
                                mobileHeroUrl: '/images/hero-slide-2.jpg',
                                colorCode: 'from-purple-500 to-pink-500',
                                targetAudience: 'Erken aşama fikir sahibi girişimciler.',
                                whoCanApply: 'Teknoloji odaklı iş fikri olan kurucu ekipler.',
                                applicationCriteria: 'Teknolojik yapılabilirlik ve pazar potansiyeli.',
                                timelineJson: [
                                    { stepNumber: 1, title: 'Başvuru & Seçim', period: 'Hafta 1-2', description: 'Online başvuru süreci.' },
                                    { stepNumber: 2, title: 'Eğitim & Mentörlük', period: 'Hafta 3-10', description: 'Haftalık seanslar.' },
                                    { stepNumber: 3, title: 'Demo Day & Ödüller', period: 'Hafta 11-12', description: 'Yatırımcı sunumları.' }
                                ],
                                benefitsJson: [
                                    { title: 'Ücretsiz Ofis', description: '7/24 co-working ve laboratuvar erişimi.', icon: 'Building' },
                                    { title: 'Birebir Mentörlük', description: 'Kıdemli sektör liderleriyle haftalık oturumlar.', icon: 'Users' }
                                ],
                                faqsJson: [
                                    { question: 'Programa kimler başvurabilir?', answer: 'Tüm teknoloji odaklı girişimci adayları başvurabilir.' }
                                ],
                                documentsJson: [],
                                contentBlocksJson: [
                                    { id: 'b-1', type: 'richText', title: 'Geleceği Birlikte İnşa Edelim', content: 'Program detayları burada yer alır.', isVisible: true },
                                    { id: 'b-2', type: 'benefits', title: 'Sağlanan Avantajlar', isVisible: true },
                                    { id: 'b-3', type: 'timeline', title: 'Program Aşamaları', isVisible: true },
                                    { id: 'b-4', type: 'faq', title: 'Sıkça Sorulan Sorular', isVisible: true },
                                    { id: 'b-5', type: 'cta', title: 'Hemen Başvurun', isVisible: true }
                                ],
                                ctaTitle: 'Hemen Başvurun',
                                ctaDescription: 'Kontenjanlar dolmadan yerinizi alın.',
                                ctaText: 'HEMEN BAŞVUR',
                                ctaLink: '/basvuru',
                                sortOrder: programs.length + 1,
                                isPublished: true,
                            });
                            setIsCreating(true);
                            setActiveEditorTab('general');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold text-xs shadow-lg shadow-primary/25 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Program Ekle
                    </button>
                )}
            </div>

            {/* Program Full Editor */}
            {editingItem && (
                <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 space-y-6 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <h2 className="font-orbitron font-bold text-lg text-white">
                                {isCreating ? 'Yeni Program Oluştur' : `Programı Düzenle: ${editingItem.name}`}
                            </h2>
                            <p className="text-xs text-gray-400 font-mono">Tüm alanlar, medya, aşamalar ve dinamik blok içerikler</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setIsCreating(false);
                            }}
                            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Editor Tab Navigation */}
                    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                        {[
                            { key: 'general', label: '1. Genel Bilgiler', icon: Sparkles },
                            { key: 'audience', label: '2. Hedef Kitle & Şartlar', icon: Target },
                            { key: 'media', label: '3. Medya & Görseller', icon: ImageIcon },
                            { key: 'dates', label: '4. Tarihler & CTA', icon: Calendar },
                            { key: 'sections', label: '5. Aşamalar & SSS', icon: Layers },
                            { key: 'blocks', label: '6. Blok İçerik Oluşturucu', icon: Layout },
                            { key: 'seo', label: '7. SEO & Yayın', icon: Clock },
                        ].map((t) => {
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setActiveEditorTab(t.key as any)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                                        activeEditorTab === t.key
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30 font-bold'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        {/* TAB 1: GENERAL */}
                        {activeEditorTab === 'general' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Program Adı *</label>
                                        <input
                                            type="text"
                                            required
                                            value={editingItem.name || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                            placeholder="Örn: ANTSPARK Ön Kuluçka"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Slug (URL Yolu)</label>
                                        <input
                                            type="text"
                                            value={editingItem.slug || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                                            placeholder="antspark-on-kulucka"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Program Türü</label>
                                        <select
                                            value={editingItem.programType || 'PRE_INCUBATION'}
                                            onChange={(e) => setEditingItem({ ...editingItem, programType: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        >
                                            <option value="PRE_INCUBATION">Ön Kuluçka (Pre-Incubation)</option>
                                            <option value="INCUBATION">Kuluçka (Incubation)</option>
                                            <option value="ACCELERATION">Hızlandırma (Acceleration)</option>
                                            <option value="IDEATHON">Ideathon / Hackathon</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Başvuru Durumu</label>
                                        <select
                                            value={editingItem.applyStatus || 'OPEN'}
                                            onChange={(e) => setEditingItem({ ...editingItem, applyStatus: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        >
                                            <option value="OPEN">Başvurular Açık</option>
                                            <option value="UPCOMING">Yakında Başlayacak</option>
                                            <option value="CLOSED">Başvurular Kapandı</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Sıralama Önceliği</label>
                                        <input
                                            type="number"
                                            value={editingItem.sortOrder ?? 0}
                                            onChange={(e) => setEditingItem({ ...editingItem, sortOrder: Number(e.target.value) })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Slogan / Tagline</label>
                                    <input
                                        type="text"
                                        value={editingItem.tagline || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, tagline: e.target.value })}
                                        placeholder="Fikirden Girişime, Girişimden Geleceğe"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Program Süresi</label>
                                        <input
                                            type="text"
                                            value={editingItem.duration || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                                            placeholder="12 Hafta"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Kontenjan</label>
                                        <input
                                            type="text"
                                            value={editingItem.quota || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, quota: e.target.value })}
                                            placeholder="20 Girişim"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Mentörlük Saati</label>
                                        <input
                                            type="text"
                                            value={editingItem.mentorHours || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, mentorHours: e.target.value })}
                                            placeholder="70+ Saat"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: AUDIENCE & CRITERIA */}
                        {activeEditorTab === 'audience' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Kısa Açıklama *</label>
                                    <textarea
                                        rows={2}
                                        required
                                        value={editingItem.shortDesc || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, shortDesc: e.target.value })}
                                        placeholder="Kartlarda ve özet alanlarda görünen 1-2 cümlelik açıklama..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Detaylı Açıklama (Rich Description) *</label>
                                    <textarea
                                        rows={5}
                                        value={editingItem.detailedDesc || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, detailedDesc: e.target.value })}
                                        placeholder="Programın kapsamı, metodolojisi, sağlanan destekler..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Hedef Kitle</label>
                                        <textarea
                                            rows={3}
                                            value={editingItem.targetAudience || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, targetAudience: e.target.value })}
                                            placeholder="Erken aşama fikir sahibi öğrenciler, araştırmacılar..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Kimler Başvurabilir?</label>
                                        <textarea
                                            rows={3}
                                            value={editingItem.whoCanApply || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, whoCanApply: e.target.value })}
                                            placeholder="Yazılım, Ar-Ge ve derin teknoloji kurucu ekipleri..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Başvuru Şartları & Kriterler</label>
                                        <textarea
                                            rows={3}
                                            value={editingItem.applicationCriteria || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, applicationCriteria: e.target.value })}
                                            placeholder="TRL 4+ prototip, ölçeklenebilir iş modeli..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: MEDIA & VISUALS */}
                        {activeEditorTab === 'media' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Hero / Banner Görseli URL</label>
                                        <input
                                            type="text"
                                            value={editingItem.heroUrl || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, heroUrl: e.target.value, coverUrl: e.target.value })}
                                            placeholder="/images/hero-slide-2.jpg"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Mobil Hero Görseli URL</label>
                                        <input
                                            type="text"
                                            value={editingItem.mobileHeroUrl || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, mobileHeroUrl: e.target.value })}
                                            placeholder="/images/hero-slide-2.jpg"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Program Logo URL</label>
                                        <input
                                            type="text"
                                            value={editingItem.logoUrl || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, logoUrl: e.target.value })}
                                            placeholder="/images/logo-tekmer.png"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Renk Gradyanı / Teması</label>
                                        <input
                                            type="text"
                                            value={editingItem.colorCode || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, colorCode: e.target.value })}
                                            placeholder="from-purple-500 to-pink-500"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: DATES & CTA */}
                        {activeEditorTab === 'dates' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Başvuru Başlangıç Tarihi</label>
                                        <input
                                            type="date"
                                            value={editingItem.applyStartDate ? new Date(editingItem.applyStartDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, applyStartDate: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Başvuru Bitiş Tarihi</label>
                                        <input
                                            type="date"
                                            value={editingItem.applyEndDate ? new Date(editingItem.applyEndDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, applyEndDate: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">CTA Başlığı</label>
                                        <input
                                            type="text"
                                            value={editingItem.ctaTitle || ''}
                                            onChange={(e) => setEditingItem({ ...editingItem, ctaTitle: e.target.value })}
                                            placeholder="Hemen Başvurun"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">CTA Buton Metni</label>
                                        <input
                                            type="text"
                                            value={editingItem.ctaText || 'HEMEN BAŞVUR'}
                                            onChange={(e) => setEditingItem({ ...editingItem, ctaText: e.target.value })}
                                            placeholder="HEMEN BAŞVUR"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">CTA Bağlantı URL'i</label>
                                    <input
                                        type="text"
                                        value={editingItem.ctaLink || '/basvuru'}
                                        onChange={(e) => setEditingItem({ ...editingItem, ctaLink: e.target.value })}
                                        placeholder="/basvuru"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 5: SECTIONS (TIMELINE, BENEFITS, FAQ) */}
                        {activeEditorTab === 'sections' && (
                            <div className="space-y-6 animate-in fade-in">
                                {/* Timeline JSON / Array */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-mono font-bold text-white">Program Aşamaları / Fazlar (Timeline)</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const list = editingItem.timelineJson || [];
                                                setEditingItem({
                                                    ...editingItem,
                                                    timelineJson: [...list, { stepNumber: list.length + 1, title: 'Yeni Aşama', period: 'Hafta X', description: '' }]
                                                });
                                            }}
                                            className="px-2.5 py-1 rounded bg-white/10 text-[11px] text-white hover:bg-white/20 font-mono"
                                        >
                                            + Aşama Ekle
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {(editingItem.timelineJson || []).map((step: any, sIdx: number) => (
                                            <div key={sIdx} className="p-3 bg-black/30 border border-white/10 rounded-xl space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-primary font-bold">#{step.stepNumber || sIdx + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={step.title || ''}
                                                        onChange={(e) => {
                                                            const list = [...editingItem.timelineJson];
                                                            list[sIdx].title = e.target.value;
                                                            setEditingItem({ ...editingItem, timelineJson: list });
                                                        }}
                                                        placeholder="Aşama Başlığı"
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={step.period || ''}
                                                        onChange={(e) => {
                                                            const list = [...editingItem.timelineJson];
                                                            list[sIdx].period = e.target.value;
                                                            setEditingItem({ ...editingItem, timelineJson: list });
                                                        }}
                                                        placeholder="Dönem (örn: Hafta 1-2)"
                                                        className="w-32 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const list = [...editingItem.timelineJson];
                                                            list.splice(sIdx, 1);
                                                            setEditingItem({ ...editingItem, timelineJson: list });
                                                        }}
                                                        className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    value={step.description || ''}
                                                    onChange={(e) => {
                                                        const list = [...editingItem.timelineJson];
                                                        list[sIdx].description = e.target.value;
                                                        setEditingItem({ ...editingItem, timelineJson: list });
                                                    }}
                                                    placeholder="Aşama açıklaması ve çıktıları..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Benefits JSON / Array */}
                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-mono font-bold text-white">Avantajlar & Destekler (Benefits)</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const list = editingItem.benefitsJson || [];
                                                setEditingItem({
                                                    ...editingItem,
                                                    benefitsJson: [...list, { title: 'Yeni Avantaj', description: '', icon: 'Sparkles' }]
                                                });
                                            }}
                                            className="px-2.5 py-1 rounded bg-white/10 text-[11px] text-white hover:bg-white/20 font-mono"
                                        >
                                            + Avantaj Ekle
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {(editingItem.benefitsJson || []).map((ben: any, bIdx: number) => (
                                            <div key={bIdx} className="p-3 bg-black/30 border border-white/10 rounded-xl flex items-start gap-2">
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={ben.title || ''}
                                                        onChange={(e) => {
                                                            const list = [...editingItem.benefitsJson];
                                                            list[bIdx].title = e.target.value;
                                                            setEditingItem({ ...editingItem, benefitsJson: list });
                                                        }}
                                                        placeholder="Avantaj Başlığı"
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={ben.description || ''}
                                                        onChange={(e) => {
                                                            const list = [...editingItem.benefitsJson];
                                                            list[bIdx].description = e.target.value;
                                                            setEditingItem({ ...editingItem, benefitsJson: list });
                                                        }}
                                                        placeholder="Açıklama"
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const list = [...editingItem.benefitsJson];
                                                        list.splice(bIdx, 1);
                                                        setEditingItem({ ...editingItem, benefitsJson: list });
                                                    }}
                                                    className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded mt-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* FAQ JSON / Array */}
                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-mono font-bold text-white">Programa Özel SSS</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const list = editingItem.faqsJson || [];
                                                setEditingItem({
                                                    ...editingItem,
                                                    faqsJson: [...list, { question: 'Yeni Soru', answer: 'Cevap...' }]
                                                });
                                            }}
                                            className="px-2.5 py-1 rounded bg-white/10 text-[11px] text-white hover:bg-white/20 font-mono"
                                        >
                                            + Soru Ekle
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {(editingItem.faqsJson || []).map((faq: any, fIdx: number) => (
                                            <div key={fIdx} className="p-3 bg-black/30 border border-white/10 rounded-xl space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={faq.question || ''}
                                                        onChange={(e) => {
                                                            const list = [...editingItem.faqsJson];
                                                            list[fIdx].question = e.target.value;
                                                            setEditingItem({ ...editingItem, faqsJson: list });
                                                        }}
                                                        placeholder="Soru"
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const list = [...editingItem.faqsJson];
                                                            list.splice(fIdx, 1);
                                                            setEditingItem({ ...editingItem, faqsJson: list });
                                                        }}
                                                        className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <textarea
                                                    rows={2}
                                                    value={faq.answer || ''}
                                                    onChange={(e) => {
                                                        const list = [...editingItem.faqsJson];
                                                        list[fIdx].answer = e.target.value;
                                                        setEditingItem({ ...editingItem, faqsJson: list });
                                                    }}
                                                    placeholder="Cevap..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 6: BLOCK BUILDER */}
                        {activeEditorTab === 'blocks' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-black/40 border border-white/10 rounded-xl">
                                    <span className="text-xs font-mono font-bold text-white">Dinamik Blok Ekle:</span>
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => addBlock('richText')} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-xs rounded text-white font-mono">+ Rich Text</button>
                                        <button type="button" onClick={() => addBlock('textImage')} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-xs rounded text-white font-mono">+ Text + Image</button>
                                        <button type="button" onClick={() => addBlock('benefits')} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-xs rounded text-white font-mono">+ Kazanımlar</button>
                                        <button type="button" onClick={() => addBlock('timeline')} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-xs rounded text-white font-mono">+ Timeline</button>
                                        <button type="button" onClick={() => addBlock('faq')} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-xs rounded text-white font-mono">+ SSS</button>
                                        <button type="button" onClick={() => addBlock('cta')} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-xs rounded text-white font-mono">+ CTA Banner</button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {(editingItem.contentBlocksJson || editingItem.contentBlocks || []).map((block: any, bIdx: number) => (
                                        <div key={block.id || bIdx} className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-3">
                                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono text-[10px] font-bold uppercase">
                                                        {block.type}
                                                    </span>
                                                    <span className="text-xs font-semibold text-white">Blok #{bIdx + 1}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button type="button" onClick={() => moveBlock(bIdx, 'up')} disabled={bIdx === 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-30">
                                                        <MoveUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button type="button" onClick={() => moveBlock(bIdx, 'down')} disabled={bIdx === (editingItem.contentBlocksJson?.length || 1) - 1} className="p-1 text-gray-400 hover:text-white disabled:opacity-30">
                                                        <MoveDown className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button type="button" onClick={() => removeBlock(bIdx)} className="p-1 text-rose-400 hover:bg-rose-500/20 rounded">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-mono text-gray-400 mb-1">Blok Başlığı</label>
                                                <input
                                                    type="text"
                                                    value={block.title || ''}
                                                    onChange={(e) => {
                                                        const blocks = [...(editingItem.contentBlocksJson || [])];
                                                        blocks[bIdx].title = e.target.value;
                                                        setEditingItem({ ...editingItem, contentBlocksJson: blocks });
                                                    }}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                                                />
                                            </div>

                                            {(block.type === 'richText' || block.type === 'textImage' || block.type === 'cta') && (
                                                <div>
                                                    <label className="block text-[10px] font-mono text-gray-400 mb-1">İçerik Metni</label>
                                                    <textarea
                                                        rows={3}
                                                        value={block.content || ''}
                                                        onChange={(e) => {
                                                            const blocks = [...(editingItem.contentBlocksJson || [])];
                                                            blocks[bIdx].content = e.target.value;
                                                            setEditingItem({ ...editingItem, contentBlocksJson: blocks });
                                                        }}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white"
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'textImage' && (
                                                <div>
                                                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Görsel URL</label>
                                                    <input
                                                        type="text"
                                                        value={block.imageUrl || ''}
                                                        onChange={(e) => {
                                                            const blocks = [...(editingItem.contentBlocksJson || [])];
                                                            blocks[bIdx].imageUrl = e.target.value;
                                                            setEditingItem({ ...editingItem, contentBlocksJson: blocks });
                                                        }}
                                                        placeholder="/images/hero-slide-3.jpg"
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 7: SEO & PUBLISHING */}
                        {activeEditorTab === 'seo' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">SEO Sayfa Başlığı</label>
                                    <input
                                        type="text"
                                        value={editingItem.seoTitle || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, seoTitle: e.target.value })}
                                        placeholder="ANTSPARK Ön Kuluçka Programı | İKÜANTS TEKMER"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Meta Açıklama (Description)</label>
                                    <textarea
                                        rows={3}
                                        value={editingItem.seoDescription || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, seoDescription: e.target.value })}
                                        placeholder="Arama motorları için 150-160 karakterlik özet..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-primary outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingItem.isPublished !== false}
                                            onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                                            className="w-4 h-4 rounded text-primary"
                                        />
                                        <span className="text-xs font-mono text-white">Public Sitede Yayınla (isPublished)</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Form Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingItem(null);
                                    setIsCreating(false);
                                }}
                                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Revision Viewer */}
            {viewingRevisionsId && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                        <h3 className="font-orbitron font-bold text-sm text-white">Sürüm Geçmişi ve Geri Yükleme</h3>
                        <button
                            onClick={() => setViewingRevisionsId(null)}
                            className="text-xs text-gray-400 hover:text-white font-mono flex items-center gap-1"
                        >
                            <ArrowLeft className="w-4 h-4" /> Listeye Dön
                        </button>
                    </div>
                    <RevisionViewer
                        entityType="Program"
                        entityId={viewingRevisionsId}
                        onRollbackSuccess={() => {
                            fetchPrograms();
                        }}
                    />
                </div>
            )}

            {/* Programs Data Table */}
            {!editingItem && !viewingRevisionsId && (
                <DataTable
                    columns={columns}
                    data={programs}
                    searchPlaceholder="Program ara..."
                />
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Programı Arşivle"
                message={`"${deleteTarget?.name}" programını arşivlemek istediğinize emin misiniz?`}
                confirmLabel="Evet, Arşivle"
                cancelLabel="Vazgeç"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
