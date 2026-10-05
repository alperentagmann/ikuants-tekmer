"use client";
import React, { useState, useEffect } from 'react';
import { SETTING_DEFAULTS, DEFAULT_COOKIE_POLICY, type SettingKey } from '@/lib/site-settings';
import {
    Settings, Save, Check, Globe, Mail, Phone, MapPin, Instagram, Linkedin,
    Layout, Bell, Sparkles, Shield, Eye, Rocket, PartyPopper, CircleCheck
} from 'lucide-react';
import { AlertRulesPanel } from '@/components/admin/settings/AlertRulesPanel';
import { HrDefinitionsPanel } from '@/components/admin/settings/HrDefinitionsPanel';

export default function AdminAyarlarPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'footer' | 'cookie' | 'animation' | 'alerts' | 'hr'>('general');
    // Only edited keys are saved (other settings, e.g. page layouts, are never rewritten)
    const [dirty, setDirty] = useState<Set<string>>(new Set());
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
        setDirty((prev) => new Set(prev).add(key));
    };
    const val = (key: SettingKey) => settings[key] ?? SETTING_DEFAULTS[key];

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSavedSuccess(false);
        try {
            for (const key of Array.from(dirty)) {
                const res = await fetch('/api/admin/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, value: settings[key] ?? '' }),
                });
                if (!res.ok) throw new Error(key);
            }
            setDirty(new Set());
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
                        Site bilgileri, footer, çerez bildirimi, animasyonlar ve admin bildirim kuralları
                    </p>
                </div>

                {savedSuccess && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-mono font-bold border border-emerald-500/20 animate-in fade-in">
                        <Check className="w-4 h-4" /> Değişiklikler Kaydedildi
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto" role="tablist">
                {([['general', 'Genel, İletişim & Sosyal', Globe], ['footer', 'Footer', Layout], ['cookie', 'Çerez Uyarısı', Shield], ['animation', 'Animasyonlar', Sparkles], ['alerts', 'Bildirim Kuralları', Bell], ['hr', 'İK Tanımları', Settings]] as const).map(([key, label, Icon]) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === key}
                        onClick={() => setActiveTab(key)}
                        className={`flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* 1. GENERAL & CONTACT */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary" /> Genel Bilgiler & SEO
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Site adı</label>
                                    <input type="text" value={val('site_name')} onChange={(e) => handleChange('site_name', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Site başlığı (tarayıcı sekmesi)</label>
                                    <input type="text" value={val('site_title')} onChange={(e) => handleChange('site_title', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Site açıklaması (arama motorları)</label>
                                    <textarea rows={2} value={val('site_desc')} onChange={(e) => handleChange('site_desc', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary" /> İletişim Bilgileri
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Telefon</label>
                                    <input type="text" value={val('site_phone')} onChange={(e) => handleChange('site_phone', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Genel e-posta (footer)</label>
                                    <input type="email" value={val('site_email')} onChange={(e) => handleChange('site_email', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">İletişim sayfası e-postası</label>
                                    <input type="email" value={val('contact_email')} onChange={(e) => handleChange('contact_email', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Çalışma saatleri</label>
                                    <input type="text" value={val('contact_hours')} onChange={(e) => handleChange('contact_hours', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Adres</label>
                                    <textarea rows={2} value={val('contact_address')} onChange={(e) => handleChange('contact_address', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                                <Instagram className="w-4 h-4 text-primary" /> Sosyal Medya
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Instagram</label>
                                    <input type="url" value={val('social_instagram')} onChange={(e) => handleChange('social_instagram', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">LinkedIn</label>
                                    <input type="url" value={val('social_linkedin')} onChange={(e) => handleChange('social_linkedin', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">WhatsApp topluluk / iletişim linki</label>
                                    <input type="url" value={val('social_whatsapp')} onChange={(e) => handleChange('social_whatsapp', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">YouTube (opsiyonel)</label>
                                    <input type="url" value={val('social_youtube')} onChange={(e) => handleChange('social_youtube', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">X / Twitter (opsiyonel)</label>
                                    <input type="url" value={val('social_x')} onChange={(e) => handleChange('social_x', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'footer' && (
                    <div className="space-y-6">
                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                                <Layout className="w-4 h-4 text-primary" /> Footer
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Footer açıklama metni</label>
                                    <textarea rows={3} value={val('footer_text')} onChange={(e) => handleChange('footer_text', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Telif metni</label>
                                    <textarea rows={2} value={val('footer_copyright')} onChange={(e) => handleChange('footer_copyright', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" /><p className="mt-1 text-[11px] text-gray-500">{'{yıl}'} yazarsanız her yıl otomatik güncellenir. Tasarımcı kredisi (Design By Alperen Tağman) sabittir; buradan değiştirilemez veya kaldırılamaz.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'cookie' && (
                    <div className="space-y-6">
                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary" /> Çerez Uyarısı
                            </div>
                            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white">
                                <span>Çerez uyarısını göster</span>
                                <input type="checkbox" checked={val('cookie_enabled') !== 'false'} onChange={(e) => handleChange('cookie_enabled', e.target.checked ? 'true' : 'false')} className="h-4 w-4" />
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Başlık</label>
                                    <input type="text" value={val('cookie_title')} onChange={(e) => handleChange('cookie_title', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Çerez politikası linki</label>
                                    <input type="text" value={val('cookie_policy_url')} onChange={(e) => handleChange('cookie_policy_url', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Uyarı metni</label>
                                    <textarea rows={3} value={val('cookie_text')} onChange={(e) => handleChange('cookie_text', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Kabul butonu</label>
                                    <input type="text" value={val('cookie_accept_text')} onChange={(e) => handleChange('cookie_accept_text', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Red butonu</label>
                                    <input type="text" value={val('cookie_reject_text')} onChange={(e) => handleChange('cookie_reject_text', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Tercihler butonu</label>
                                    <input type="text" value={val('cookie_settings_text')} onChange={(e) => handleChange('cookie_settings_text', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Sürüm</label>
                                    <input type="text" value={val('cookie_version')} onChange={(e) => handleChange('cookie_version', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" /><p className="mt-1 text-[11px] text-gray-500">Metni önemli ölçüde değiştirdiğinizde sürümü artırın; ziyaretçilere uyarı yeniden gösterilir.</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Çerez politikası sayfası metni (/cerez-politikasi)</label>
                                    <textarea rows={12} value={settings['cookie_policy_text'] ?? DEFAULT_COOKIE_POLICY} onChange={(e) => handleChange('cookie_policy_text', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ANIMATIONS */}
                {activeTab === 'animation' && (
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                        <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" /> Site Animasyonları
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2">Genel hareket seviyesi</label>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {([['full', 'Tam', 'Tüm geçiş ve hareketler açık.'], ['reduced', 'Azaltılmış', 'Büyük kayma / büyüme hareketleri kapalı, solma efektleri açık.'], ['off', 'Kapalı', 'Hareket yok; içerik doğrudan görünür.']] as const).map(([v, label, desc]) => (
                                    <button key={v} type="button" onClick={() => handleChange('animation_motion', v)} className={`rounded-xl border p-3 text-left transition-colors ${val('animation_motion') === v ? 'border-primary bg-primary/10' : 'border-white/10 bg-black/30 hover:border-white/30'}`}>
                                        <div className="text-sm font-semibold text-white">{label}</div>
                                        <div className="text-[11px] text-gray-400">{desc}</div>
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-[11px] text-gray-500">İşletim sisteminde &quot;hareketi azalt&quot; tercihi açık olan ziyaretçilere her durumda sakin görünüm gösterilir.</p>
                        </div>

                        <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-white">Form gönderim kutlaması</div>
                                    <p className="text-[11px] text-gray-400">Başvuru, iletişim, rezervasyon ve teklif formları başarıyla gönderildiğinde gösterilir.</p>
                                </div>
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                    <input type="checkbox" checked={val('animation_success_enabled') !== 'false'} onChange={(e) => handleChange('animation_success_enabled', String(e.target.checked))} className="rounded border-white/20 bg-black/40 text-primary" />
                                    Açık
                                </label>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {([['rocket', 'Uçan roket', Rocket], ['confetti', 'Konfeti', PartyPopper], ['check', 'Sade onay', CircleCheck]] as const).map(([v, label, Icon]) => (
                                    <button key={v} type="button" onClick={() => handleChange('animation_success_style', v)} className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold text-white transition-colors ${val('animation_success_style') === v ? 'border-primary bg-primary/10' : 'border-white/10 bg-black/30 hover:border-white/30'}`}>
                                        <Icon className="h-4 w-4 text-primary" /> {label}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Başlık</label>
                                    <input type="text" value={val('animation_success_title')} onChange={(e) => handleChange('animation_success_title', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Ekranda kalma süresi (saniye, 2–10)</label>
                                    <input type="number" min={2} max={10} value={val('animation_success_seconds')} onChange={(e) => handleChange('animation_success_seconds', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Açıklama (formun kendi başarı mesajı varsa o gösterilir)</label>
                                    <textarea rows={2} value={val('animation_success_text')} onChange={(e) => handleChange('animation_success_text', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                                </div>
                            </div>
                            <a href="/iletisim" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                                <Eye className="h-3.5 w-3.5" /> Kaydettikten sonra iletişim formundan deneyebilirsiniz
                            </a>
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && <AlertRulesPanel />}
                {activeTab === 'hr' && <HrDefinitionsPanel />}

                {activeTab !== 'alerts' && activeTab !== 'hr' && <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 transition-all"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
                    </button>
                </div>}
            </form>
        </div>
    );
}

