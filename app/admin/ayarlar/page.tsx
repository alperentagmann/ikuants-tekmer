"use client";
import React, { useState, useEffect } from 'react';
import {
    Settings, Save, Check, Globe, Mail, Phone, MapPin, Instagram, Linkedin,
    Palette, Layout, Bell, Sparkles, Navigation, Layers, Shield, Eye
} from 'lucide-react';

export default function AdminAyarlarPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'brand' | 'form_texts' | 'sidebar' | 'notifications'>('general');
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.success && data.settings) {
                const map: Record<string, string> = {};
                data.settings.forEach((s: any) => {
                    map[s.key] = s.value;
                });
                setSettings(map);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSavedSuccess(false);
        try {
            for (const [key, value] of Object.entries(settings)) {
                await fetch('/api/admin/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, value }),
                });
            }
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
        } catch {
            alert('Ayarlar kaydedilemedi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Sistem & Görünüm Ayarları</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        Marka, Form Metinleri, Menü Yapılandırması ve Bildirim Yönlendirme Merkezi
                    </p>
                </div>

                {savedSuccess && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-mono font-bold border border-emerald-500/20 animate-in fade-in">
                        <Check className="w-4 h-4" /> Değişiklikler Kaydedildi
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'general'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Globe className="w-3.5 h-3.5" /> Genel & İletişim
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('brand')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'brand'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Palette className="w-3.5 h-3.5" /> Marka & Tasarım (Madde 57)
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('form_texts')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'form_texts'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Sparkles className="w-3.5 h-3.5" /> Form Metinleri (Madde 53)
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('sidebar')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'sidebar'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Navigation className="w-3.5 h-3.5" /> Admin Sidebar (Madde 55)
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'notifications'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Bell className="w-3.5 h-3.5" /> Bildirimler & Digest (Madde 64-71)
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* 1. GENERAL & CONTACT */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary" /> Genel Bilgiler & SEO
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Site Başlığı (Title)</label>
                                <input
                                    type="text"
                                    value={settings['site_title'] || 'İKÜANTS TEKMER — Girişimcilik & Kuluçka Merkezi'}
                                    onChange={(e) => handleChange('site_title', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary" /> İletişim Bilgileri
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Resmi Merkez Adresi</label>
                                <textarea
                                    rows={2}
                                    value={settings['contact_address'] || 'İstanbul Kültür Üniversitesi, Ataköy Yerleşkesi, Bakırköy / İstanbul'}
                                    onChange={(e) => handleChange('contact_address', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">E-Posta Adresi</label>
                                    <input
                                        type="email"
                                        value={settings['contact_email'] || 'tekmer@iku.edu.tr'}
                                        onChange={(e) => handleChange('contact_email', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Telefon Numarası</label>
                                    <input
                                        type="text"
                                        value={settings['contact_phone'] || '+90 (212) 498 41 41'}
                                        onChange={(e) => handleChange('contact_phone', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. BRAND SETTINGS (Madde 57) */}
                {activeTab === 'brand' && (
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                        <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-primary" /> Kurumsal Marka ve Tema Özelleştirme
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Kurum Adı</label>
                                <input
                                    type="text"
                                    value={settings['brand_institution_name'] || 'İKÜANTS TEKMER'}
                                    onChange={(e) => handleChange('brand_institution_name', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Vurgu Rengi (Accent Hex)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={settings['brand_accent_color'] || '#6366f1'}
                                        onChange={(e) => handleChange('brand_accent_color', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                                    />
                                    <input
                                        type="text"
                                        value={settings['brand_accent_color'] || '#6366f1'}
                                        onChange={(e) => handleChange('brand_accent_color', e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Genel Logo URL</label>
                                <input
                                    type="text"
                                    value={settings['brand_logo_url'] || '/images/logo.png'}
                                    onChange={(e) => handleChange('brand_logo_url', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Admin Panel Logo URL</label>
                                <input
                                    type="text"
                                    value={settings['brand_admin_logo_url'] || '/images/admin-logo.png'}
                                    onChange={(e) => handleChange('brand_admin_logo_url', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Favicon URL</label>
                                <input
                                    type="text"
                                    value={settings['brand_favicon_url'] || '/favicon.ico'}
                                    onChange={(e) => handleChange('brand_favicon_url', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Giriş Ekranı Arka Planı (URL)</label>
                                <input
                                    type="text"
                                    value={settings['brand_login_background_url'] || '/images/login-bg.jpg'}
                                    onChange={(e) => handleChange('brand_login_background_url', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Giriş Karşılama Mesajı (Welcome Text)</label>
                            <input
                                type="text"
                                value={settings['brand_welcome_text'] || 'İKÜANTS TEKMER Yönetim Merkezi Sistemine Hoş Geldiniz'}
                                onChange={(e) => handleChange('brand_welcome_text', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Altbilgi (Footer) Metni</label>
                            <input
                                type="text"
                                value={settings['brand_footer_text'] || '© 2026 İKÜANTS TEKMER. Tüm hakları saklıdır.'}
                                onChange={(e) => handleChange('brand_footer_text', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* 3. FORM TEXTS (Madde 53) */}
                {activeTab === 'form_texts' && (
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                        <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" /> Dinamik Form Metinleri & Buton Özelleştirme
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">İleri Butonu Etiketi</label>
                                <input
                                    type="text"
                                    value={settings['form_btn_next'] || 'İleri →'}
                                    onChange={(e) => handleChange('form_btn_next', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Geri Butonu Etiketi</label>
                                <input
                                    type="text"
                                    value={settings['form_btn_back'] || '← Geri'}
                                    onChange={(e) => handleChange('form_btn_back', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Gönder (CTA) Butonu Etiketi</label>
                                <input
                                    type="text"
                                    value={settings['form_btn_submit'] || 'Başvurumu Tamamla'}
                                    onChange={(e) => handleChange('form_btn_submit', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Taslak Kaydet Butonu Etiketi</label>
                                <input
                                    type="text"
                                    value={settings['form_btn_save_draft'] || 'Taslak Olarak Kaydet'}
                                    onChange={(e) => handleChange('form_btn_save_draft', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Başarı Bildirim Mesajı</label>
                            <input
                                type="text"
                                value={settings['form_msg_success'] || 'Başvurunuz başarıyla sisteme kaydedildi ve değerlendirme sürecine alındı.'}
                                onChange={(e) => handleChange('form_msg_success', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Hata Bildirim Mesajı</label>
                            <input
                                type="text"
                                value={settings['form_msg_error'] || 'Lütfen formdaki zorunlu alanları eksiksiz ve geçerli biçimde doldurunuz.'}
                                onChange={(e) => handleChange('form_msg_error', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">KVKK & Açık Rıza Onay Metni</label>
                            <textarea
                                rows={2}
                                value={settings['form_text_kvkk'] || 'Kişisel verilerimin KVKK Aydınlatma Metni kapsamında işlenmesini ve program değerlendirmesinde kullanılmasını onaylıyorum.'}
                                onChange={(e) => handleChange('form_text_kvkk', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* 4. SIDEBAR BUILDER (Madde 55) */}
                {activeTab === 'sidebar' && (
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                        <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-primary" /> Admin Menü & Sidebar Özelleştirici
                        </div>
                        <p className="text-xs text-gray-400">
                            Super Admin yetkisiyle sol menü başlıklarını ve modül etiketlerini dinamik olarak yeniden adlandırabilirsiniz (Örn: Görevler → İş Takibi).
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Görevler Menü Başlığı</label>
                                <input
                                    type="text"
                                    value={settings['sidebar_label_tasks'] || 'İş Takibi & Görevler'}
                                    onChange={(e) => handleChange('sidebar_label_tasks', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Başvurular Menü Başlığı</label>
                                <input
                                    type="text"
                                    value={settings['sidebar_label_applications'] || 'Başvuru Pipeline'}
                                    onChange={(e) => handleChange('sidebar_label_applications', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Girişimciler Menü Başlığı</label>
                                <input
                                    type="text"
                                    value={settings['sidebar_label_entrepreneurs'] || 'Girişimciler & Portföy'}
                                    onChange={(e) => handleChange('sidebar_label_entrepreneurs', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Mentörler Menü Başlığı</label>
                                <input
                                    type="text"
                                    value={settings['sidebar_label_mentors'] || 'Mentör Kadrosu'}
                                    onChange={(e) => handleChange('sidebar_label_mentors', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. NOTIFICATIONS & DIGEST (Madde 64-71) */}
                {activeTab === 'notifications' && (
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                        <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-primary" /> Bildirim Kanalları, Yönlendirme ve Digest Ayarları
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
                                <div className="text-xs font-semibold text-white">Bildirim Kanalları & Gönderim Sıklığı (Digest)</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="flex items-center gap-2 text-xs text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={settings['notify_channel_inapp'] !== 'false'}
                                            onChange={(e) => handleChange('notify_channel_inapp', String(e.target.checked))}
                                            className="rounded border-white/20 bg-black/40 text-primary"
                                        />
                                        Uygulama İçi (In-App)
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={settings['notify_channel_email'] !== 'false'}
                                            onChange={(e) => handleChange('notify_channel_email', String(e.target.checked))}
                                            className="rounded border-white/20 bg-black/40 text-primary"
                                        />
                                        E-Posta (Email)
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={settings['notify_channel_teams'] === 'true'}
                                            onChange={(e) => handleChange('notify_channel_teams', String(e.target.checked))}
                                            className="rounded border-white/20 bg-black/40 text-primary"
                                        />
                                        Microsoft Teams Webhook
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Varsayılan Gönderim Modu (Digest Frequency)</label>
                                <select
                                    value={settings['notify_digest_mode'] || 'IMMEDIATE'}
                                    onChange={(e) => handleChange('notify_digest_mode', e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                >
                                    <option value="IMMEDIATE">Anında Bildirim (Immediate Delivery)</option>
                                    <option value="DAILY_DIGEST">Günlük Özet (Daily Digest - Saat 18:00)</option>
                                    <option value="WEEKLY_DIGEST">Haftalık Özet (Weekly Digest - Pazartesi 09:00)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">ANTsPARK Başvuru Yönlendirme Grubu (E-Posta Listesi / Rol)</label>
                                <input
                                    type="text"
                                    value={settings['notify_group_antspark'] || 'program-managers, application-managers'}
                                    onChange={(e) => handleChange('notify_group_antspark', e.target.value)}
                                    placeholder="Rol adları veya virgülle ayrılmış yönlendirme anahtarları"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 transition-all"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
}

