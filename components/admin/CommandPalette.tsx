"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, LayoutDashboard, Rocket, Users, BookOpen, Calendar,
    FileText, CheckSquare, Activity, Image, Settings, Sparkles,
    Shield, Briefcase, Plus, ExternalLink, X
} from 'lucide-react';

interface CommandPaletteProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen: controlledOpen, onClose }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const [query, setQuery] = useState('');
    const router = useRouter();

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen = (val: boolean | ((prev: boolean) => boolean)) => {
        if (typeof val === 'function') {
            const next = val(isOpen);
            if (onClose && !next) onClose();
            setInternalOpen(next);
        } else {
            if (onClose && !val) onClose();
            setInternalOpen(val);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    interface PaletteItem {
        label: string;
        url: string;
        icon: any;
        group: string;
        external?: boolean;
    }

    const navigationItems: PaletteItem[] = [
        { label: 'Dashboard / Genel Bakış', url: '/admin/dashboard', icon: LayoutDashboard, group: 'Navigasyon' },
        { label: 'Girişimciler Portföyü', url: '/admin/girisimciler', icon: Rocket, group: 'Operasyon' },
        { label: 'Görevler & To-Do', url: '/admin/gorevler', icon: CheckSquare, group: 'Operasyon' },
        { label: 'Kurumsal Takvim', url: '/admin/takvim', icon: Calendar, group: 'Operasyon' },
        { label: 'Başvuru Pipeline (CRM)', url: '/admin/basvurular', icon: Briefcase, group: 'CRM' },
        { label: 'Programlar & Müfredat', url: '/admin/programlar', icon: BookOpen, group: 'Eğitim & Program' },
        { label: 'Projeler & Hibe Yönetimi', url: '/admin/projeler', icon: Briefcase, group: 'Operasyon' },
        { label: 'Etkinlik Yönetimi', url: '/admin/etkinlikler', icon: Sparkles, group: 'Eğitim & Program' },
        { label: 'Kurumsal Faaliyetler', url: '/admin/faaliyetler', icon: Activity, group: 'Raporlama' },
        { label: 'Paydaş & Kişi Rehberi', url: '/admin/rehber', icon: Users, group: 'CRM' },
        { label: 'Onayımı Bekleyenler', url: '/admin/onaylar', icon: Shield, group: 'İçerik & Onay' },
        { label: 'Haber & İçerik Stüdyosu', url: '/admin/haberler', icon: FileText, group: 'İçerik & Onay' },
        { label: 'Ana Sayfa & Banner Stüdyosu', url: '/admin/anasayfa', icon: Image, group: 'İçerik & Onay' },
        { label: 'Mentör Havuzu', url: '/admin/mentorler', icon: Users, group: 'CRM' },
        { label: 'Form Builder (Evrensel Formlar)', url: '/admin/form-builder', icon: FileText, group: 'Sistem' },
        { label: 'Medya Kütüphanesi', url: '/admin/medya', icon: Image, group: 'Sistem' },
        { label: 'Sistem Ayarları', url: '/admin/ayarlar', icon: Settings, group: 'Sistem' },
    ];

    const quickActions: PaletteItem[] = [
        { label: 'Yeni Görev Oluştur', url: '/admin/gorevler?action=new', icon: Plus, group: 'Hızlı Eylemler' },
        { label: 'Yeni Haber / İçerik Yaz', url: '/admin/haberler', icon: Plus, group: 'Hızlı Eylemler' },
        { label: 'Yeni Faaliyet Kaydet', url: '/admin/faaliyetler?action=new', icon: Plus, group: 'Hızlı Eylemler' },
        { label: 'Public Siteyi Aç', url: '/', icon: ExternalLink, group: 'Hızlı Eylemler', external: true },
    ];

    const allItems = [...navigationItems, ...quickActions];
    const filtered = allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.group.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = (item: typeof allItems[0]) => {
        setIsOpen(false);
        setQuery('');
        if (item.external) {
            window.open(item.url, '_blank');
        } else {
            router.push(item.url);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#0e0e18] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden font-sans">
                {/* Search Bar */}
                <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
                    <Search className="w-5 h-5 text-cyan-400 shrink-0" />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Modül, görev veya eylem arayın... (Örn: Görev, Müfredat, Faaliyet)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
                    />
                    <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-white/5 border border-white/10 rounded">
                        ESC
                    </kbd>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white p-1 rounded-lg"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Results List */}
                <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/5">
                    {filtered.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">
                            Sonuç bulunamadı. Farklı bir arama terimi deneyin.
                        </div>
                    ) : (
                        filtered.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(item)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/20 border border-transparent transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white group-hover:text-cyan-300">
                                                {item.label}
                                            </div>
                                            <div className="text-[11px] text-gray-500 font-mono">
                                                {item.group}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono group-hover:text-cyan-400">
                                        Git &rarr;
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                    <span>İKÜANTS TEKMER Operasyon Portalı</span>
                    <span>Aç/Kapat: <kbd className="text-cyan-400">Ctrl+K</kbd></span>
                </div>
            </div>
        </div>
    );
};
