"use client";
import React, { useState, useEffect } from 'react';
import { Building2, Save, RefreshCw, CheckCircle2, Layers, Globe, FileEdit, LayoutTemplate } from 'lucide-react';

interface PageSection {
    id: string;
    key: string;
    value: string;
    description: string | null;
}

export default function PagesManagementPage() {
    const [sections, setSections] = useState<PageSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'hero' | 'about' | 'stats' | 'contact'>('hero');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);

    // Form state for sections
    const [heroData, setHeroData] = useState({
        badge: 'GELECEĞİN GİRİŞİMLERİ BURADA DOĞUYOR',
        title: 'Fikirlerinizi Geleceğe Taşıyın',
        highlightText: 'Geleceğe Taşıyın',
        subtitle: 'İKÜANTS TEKMER ile girişimcilik ekosisteminde yerinizi alın. Mentorluk, altyapı, ofis desteği ve yatırımcı ağı tek çatı altında.',
        ctaPrimaryText: 'Hemen Başvur',
        ctaPrimaryUrl: '/basvuru',
        ctaSecondaryText: 'Programları İncele',
        ctaSecondaryUrl: '/programlar',
    });

    const [aboutData, setAboutData] = useState({
        title: 'İKÜANTS TEKMER Hakkında',
        subtitle: 'İstanbul Kültür Üniversitesi Teknoloji Geliştirme ve Girişimcilik Merkezi',
        description: 'T.C. Sanayi ve Teknoloji Bakanlığı ve KOSGEB iş birliği ile kurulan İKÜANTS TEKMER, yenilikçi girişimlerin ticarileşmesini hızlandıran öncü bir teknoloji merkezidir.',
        features: [
            { title: '7/24 Açık Çalışma Alanları', desc: 'Modern ve donanımlı ortak çalışma ortamı.' },
            { title: 'Birebir Mentorluk & Danışmanlık', desc: 'Alanında uzman 20+ sektör lideri mentör.' },
            { title: 'Prototipleme ve Laboratuvar', desc: 'Teknik altyapı ve Ar-Ge desteği.' },
            { title: 'Yatırımcı Buluşmaları', desc: 'Melek yatırımcı ve VC fonları ile doğrudan erişim.' }
        ]
    });

    const [statsData, setStatsData] = useState({
        stat1_value: '24+',
        stat1_label: 'Aktif Girişim',
        stat2_value: '22+',
        stat2_label: 'Uzman Mentör',
        stat3_value: '15M+ ₺',
        stat3_label: 'Alınan Yatırım & Hibe',
        stat4_value: '500+ m²',
        stat4_label: 'Çalışma & Laboratuvar Alanı',
    });

    const fetchSections = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/pages');
            const data = await res.json();
            if (data.success && data.sections) {
                setSections(data.sections);
                data.sections.forEach((sec: PageSection) => {
                    try {
                        const parsed = JSON.parse(sec.value);
                        if (sec.key === 'page_hero') setHeroData(parsed);
                        if (sec.key === 'page_about') setAboutData(parsed);
                        if (sec.key === 'page_stats') setStatsData(parsed);
                    } catch {
                        // string value
                    }
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSections();
    }, []);

    const handleSaveSection = async (key: string, value: any, description: string) => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value, description }),
            });
            const data = await res.json();
            if (data.success) {
                setSavedMsg(true);
                setTimeout(() => setSavedMsg(false), 3000);
            } else {
                alert(data.error || 'Kaydedilemedi.');
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                        <LayoutTemplate className="w-7 h-7 text-primary" />
                        Sayfa & Bölüm Yönetimi
                    </h1>
                    <p className="text-gray-400 text-xs mt-1">
                        Ana sayfa ve kurumsal sayfalardaki Hero, İstatistik, Hakkımızda ve içerik bloklarını dinamik olarak düzenleyin.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {savedMsg && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-in fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Değişiklikler Canlıya Alındı!
                        </span>
                    )}
                    <button
                        onClick={fetchSections}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 transition-colors"
                        title="Yenile"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <button
                    onClick={() => setActiveTab('hero')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        activeTab === 'hero'
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Ana Sayfa Hero & Başlık
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        activeTab === 'stats'
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    İstatistik & Sayaçlar
                </button>
                <button
                    onClick={() => setActiveTab('about')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        activeTab === 'about'
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    Hakkımızda & Özellikler
                </button>
            </div>

            {/* Content Tab: Hero */}
            {activeTab === 'hero' && (
                <div className="bg-[#0d0e1a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <h2 className="text-base font-orbitron font-bold text-white mb-4">Hero Bölümü İçerik Ayarları</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Üst Rozet / Badge Metni</label>
                            <input
                                type="text"
                                value={heroData.badge}
                                onChange={(e) => setHeroData({ ...heroData, badge: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">Ana Başlık</label>
                            <input
                                type="text"
                                value={heroData.title}
                                onChange={(e) => setHeroData({ ...heroData, title: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Alt Açıklama Paragrafı</label>
                        <textarea
                            rows={3}
                            value={heroData.subtitle}
                            onChange={(e) => setHeroData({ ...heroData, subtitle: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                            <span className="text-xs font-semibold text-primary">Birincil Buton (Primary CTA)</span>
                            <input
                                type="text"
                                value={heroData.ctaPrimaryText}
                                onChange={(e) => setHeroData({ ...heroData, ctaPrimaryText: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
                                placeholder="Buton Metni"
                            />
                            <input
                                type="text"
                                value={heroData.ctaPrimaryUrl}
                                onChange={(e) => setHeroData({ ...heroData, ctaPrimaryUrl: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono"
                                placeholder="Hedef URL (/basvuru)"
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                            <span className="text-xs font-semibold text-gray-400">İkincil Buton (Secondary CTA)</span>
                            <input
                                type="text"
                                value={heroData.ctaSecondaryText}
                                onChange={(e) => setHeroData({ ...heroData, ctaSecondaryText: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
                                placeholder="Buton Metni"
                            />
                            <input
                                type="text"
                                value={heroData.ctaSecondaryUrl}
                                onChange={(e) => setHeroData({ ...heroData, ctaSecondaryUrl: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono"
                                placeholder="Hedef URL (/programlar)"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => handleSaveSection('page_hero', heroData, 'Hero Section Content')}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Kaydediliyor...' : 'Hero Bölümünü Kaydet'}
                        </button>
                    </div>
                </div>
            )}

            {/* Content Tab: Stats */}
            {activeTab === 'stats' && (
                <div className="bg-[#0d0e1a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <h2 className="text-base font-orbitron font-bold text-white mb-4">İstatistik Sayaçları</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                            <span className="text-xs font-mono text-gray-500">1. Sayaç</span>
                            <input
                                type="text"
                                value={statsData.stat1_value}
                                onChange={(e) => setStatsData({ ...statsData, stat1_value: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-primary font-bold text-base"
                                placeholder="24+"
                            />
                            <input
                                type="text"
                                value={statsData.stat1_label}
                                onChange={(e) => setStatsData({ ...statsData, stat1_label: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
                                placeholder="Aktif Girişim"
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                            <span className="text-xs font-mono text-gray-500">2. Sayaç</span>
                            <input
                                type="text"
                                value={statsData.stat2_value}
                                onChange={(e) => setStatsData({ ...statsData, stat2_value: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-primary font-bold text-base"
                                placeholder="22+"
                            />
                            <input
                                type="text"
                                value={statsData.stat2_label}
                                onChange={(e) => setStatsData({ ...statsData, stat2_label: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
                                placeholder="Uzman Mentör"
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                            <span className="text-xs font-mono text-gray-500">3. Sayaç</span>
                            <input
                                type="text"
                                value={statsData.stat3_value}
                                onChange={(e) => setStatsData({ ...statsData, stat3_value: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-primary font-bold text-base"
                                placeholder="15M+ ₺"
                            />
                            <input
                                type="text"
                                value={statsData.stat3_label}
                                onChange={(e) => setStatsData({ ...statsData, stat3_label: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
                                placeholder="Alınan Yatırım"
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                            <span className="text-xs font-mono text-gray-500">4. Sayaç</span>
                            <input
                                type="text"
                                value={statsData.stat4_value}
                                onChange={(e) => setStatsData({ ...statsData, stat4_value: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-primary font-bold text-base"
                                placeholder="500+ m²"
                            />
                            <input
                                type="text"
                                value={statsData.stat4_label}
                                onChange={(e) => setStatsData({ ...statsData, stat4_label: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
                                placeholder="Çalışma Alanı"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => handleSaveSection('page_stats', statsData, 'Stats Counters')}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Kaydediliyor...' : 'İstatistikleri Kaydet'}
                        </button>
                    </div>
                </div>
            )}

            {/* Content Tab: About */}
            {activeTab === 'about' && (
                <div className="bg-[#0d0e1a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <h2 className="text-base font-orbitron font-bold text-white mb-4">Hakkımızda & Özellik Blokları</h2>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Başlık</label>
                        <input
                            type="text"
                            value={aboutData.title}
                            onChange={(e) => setAboutData({ ...aboutData, title: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Alt Başlık</label>
                        <input
                            type="text"
                            value={aboutData.subtitle}
                            onChange={(e) => setAboutData({ ...aboutData, subtitle: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Tanıtım Metni</label>
                        <textarea
                            rows={3}
                            value={aboutData.description}
                            onChange={(e) => setAboutData({ ...aboutData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => handleSaveSection('page_about', aboutData, 'About Section Content')}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Kaydediliyor...' : 'Hakkımızda Bölümünü Kaydet'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
