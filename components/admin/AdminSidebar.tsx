"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, FileText, Users, UserCheck, Rocket, Newspaper,
    HelpCircle, Mail, Folder, Shield, Settings, Activity, History,
    LogOut, ChevronLeft, ChevronRight, Sparkles, Navigation, Globe,
    Calendar, Building2, CheckSquare, Layers, ShieldAlert
} from 'lucide-react';

interface AdminSidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    user?: {
        name: string;
        email: string;
        isSuperAdmin: boolean;
    } | null;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, onToggle, user }) => {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/auth/logout', { method: 'POST' });
            router.push('/admin/login');
            router.refresh();
        } catch {
            window.location.href = '/admin/login';
        }
    };

    const navSections = [
        {
            title: 'GENEL & İŞ BİRLİĞİ',
            items: [
                { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
                { title: 'Görevler & To-Do', href: '/admin/gorevler', icon: CheckSquare },
                { title: 'Ortak Takvim', href: '/admin/takvim', icon: Calendar },
                { title: 'Onay Bekleyenler', href: '/admin/onaylar', icon: ShieldAlert },
            ],
        },
        {
            title: 'CRM & BAŞVURU',
            items: [
                { title: 'Başvuru Pipeline', href: '/admin/basvurular', icon: FileText },
                { title: 'Form Builder', href: '/admin/form-builder', icon: Sparkles },
                { title: 'Paydaş & Kişi Rehberi', href: '/admin/rehber', icon: Users },
                { title: 'İletişim & Randevular', href: '/admin/iletisim', icon: Mail },
            ],
        },
        {
            title: 'İÇERİK & OPERASYON (CMS)',
            items: [
                { title: 'Girişimciler', href: '/admin/girisimciler', icon: Rocket },
                { title: 'Mentörler', href: '/admin/mentorler', icon: UserCheck },
                { title: 'Programlar & Eğitim', href: '/admin/programlar', icon: Layers },
                { title: 'Projeler & Hibe', href: '/admin/projeler', icon: Folder },
                { title: 'Kurumsal Faaliyetler', href: '/admin/faaliyetler', icon: Activity },
                { title: 'Haberler & Editör', href: '/admin/haberler', icon: Newspaper },
                { title: 'Etkinlik Yönetimi', href: '/admin/etkinlikler', icon: Calendar },
                { title: 'Ana Sayfa & Banner', href: '/admin/anasayfa', icon: Building2 },
                { title: 'Destek & Teşvikler', href: '/admin/destekler', icon: HelpCircle },
                { title: 'Medya Kütüphanesi', href: '/admin/medya', icon: Folder },
                { title: 'Sayfa Yönetimi', href: '/admin/sayfalar', icon: FileText },
                { title: 'Partner & Logolar', href: '/admin/partnerler', icon: Sparkles },
            ],
        },
        {
            title: 'SİSTEM & GÜVENLİK',
            items: [
                { title: 'Site Ayarları', href: '/admin/ayarlar', icon: Settings },
                { title: 'Menü Yönetimi', href: '/admin/menuler', icon: Navigation },
                { title: 'SEO & Redirects', href: '/admin/seo-redirects', icon: Globe },
                { title: 'Kullanıcı & Roller', href: '/admin/kullanicilar', icon: Shield },
                { title: 'Audit Log (Denetim)', href: '/admin/audit-log', icon: History },
                { title: 'Sistem Durumu', href: '/admin/sistem-durumu', icon: Activity },
            ],
        },
    ];

    return (
        <aside
            className={`fixed top-0 left-0 h-screen bg-[#090912] border-r border-white/10 flex flex-col z-40 transition-all duration-300 ${
                isCollapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Header / Brand */}
            <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between">
                {!isCollapsed ? (
                    <Link href="/admin/dashboard" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-orbitron font-bold text-white shadow-lg shadow-primary/20">
                            İK
                        </div>
                        <div>
                            <div className="font-orbitron font-bold text-xs text-white tracking-wider">
                                İKÜANTS TEKMER
                            </div>
                            <div className="text-[10px] font-mono text-primary font-semibold">
                                CMS + CRM v2.0
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-orbitron font-bold text-white text-xs">
                        İK
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation items */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                {navSections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        {!isCollapsed && (
                            <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-wider text-gray-500 uppercase">
                                {section.title}
                            </div>
                        )}
                        {section.items.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={isCollapsed ? item.title : undefined}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                        isActive
                                            ? 'bg-gradient-to-r from-primary/20 to-purple-600/10 text-white border border-primary/30 shadow-sm shadow-primary/10'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* User profile & Logout footer */}
            <div className="p-3 border-t border-white/10 bg-black/30">
                {!isCollapsed ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary font-mono flex-shrink-0">
                                {user?.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-xs font-semibold text-white truncate">
                                    {user?.name || 'Yönetici'}
                                </div>
                                <div className="text-[10px] font-mono text-gray-400 truncate">
                                    {user?.email || 'admin@ikuants.com'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Güvenli Çıkış"
                            className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogout}
                        title="Güvenli Çıkış"
                        className="w-full p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex justify-center"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>
        </aside>
    );
};
