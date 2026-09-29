"use client";
import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, Globe, Mail, Phone, MapPin, Instagram, Linkedin } from 'lucide-react';

export default function AdminAyarlarPage() {
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
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Merkezi Site Ayarları</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        İletişim adresleri, telefonlar, sosyal medya hesapları ve genel marka bilgileri
                    </p>
                </div>

                {savedSuccess && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-mono font-bold border border-emerald-500/20 animate-in fade-in">
                        <Check className="w-4 h-4" /> Değişiklikler Kaydedildi
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* General Brand Settings */}
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" /> Genel Bilgiler & SEO
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1.5">Site Başlığı (Title)</label>
                        <input
                            type="text"
                            value={settings['site_title'] || ''}
                            onChange={(e) => handleChange('site_title', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                        />
                    </div>
                </div>

                {/* Contact Settings */}
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" /> İletişim Bilgileri
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-1.5">Resmi Merkez Adresi</label>
                        <textarea
                            rows={2}
                            value={settings['contact_address'] || ''}
                            onChange={(e) => handleChange('contact_address', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-primary outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">E-Posta Adresi</label>
                            <input
                                type="email"
                                value={settings['contact_email'] || ''}
                                onChange={(e) => handleChange('contact_email', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Telefon Numarası</label>
                            <input
                                type="text"
                                value={settings['contact_phone'] || ''}
                                onChange={(e) => handleChange('contact_phone', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Media Settings */}
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="font-orbitron font-bold text-sm text-white pb-3 border-b border-white/10 flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-primary" /> Sosyal Medya Bağlantıları
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Instagram URL</label>
                            <input
                                type="url"
                                value={settings['social_instagram'] || ''}
                                onChange={(e) => handleChange('social_instagram', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">LinkedIn URL</label>
                            <input
                                type="url"
                                value={settings['social_linkedin'] || ''}
                                onChange={(e) => handleChange('social_linkedin', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">WhatsApp Kanal URL</label>
                            <input
                                type="url"
                                value={settings['social_whatsapp'] || ''}
                                onChange={(e) => handleChange('social_whatsapp', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
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
