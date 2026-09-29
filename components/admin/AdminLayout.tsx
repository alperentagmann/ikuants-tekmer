"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { CommandPalette } from './CommandPalette';
import { Search, Bell, Plus, ExternalLink, ShieldAlert, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // Global keyboard shortcut for Ctrl/Cmd + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsPaletteOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Check auth on mount
    useEffect(() => {
        if (pathname === '/admin/login') {
            setLoadingAuth(false);
            return;
        }

        const fetchMe = async () => {
            try {
                const res = await fetch('/api/admin/auth/me');
                const data = await res.json();
                if (data.success && data.user) {
                    setCurrentUser(data.user);
                } else {
                    router.push('/admin/login');
                }
            } catch {
                router.push('/admin/login');
            } finally {
                setLoadingAuth(false);
            }
        };

        fetchMe();
    }, [pathname, router]);

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center animate-pulse text-white font-bold font-orbitron text-lg shadow-xl shadow-primary/30">
                        İK
                    </div>
                    <div className="text-xs font-mono text-gray-400">Yönetim Paneli Yükleniyor...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#06060c] text-white flex">
            {/* Sidebar */}
            <AdminSidebar
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
                user={currentUser}
            />

            {/* Main Content Area */}
            <div
                className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
                    isCollapsed ? 'ml-20' : 'ml-64'
                }`}
            >
                {/* Topbar */}
                <header className="h-16 bg-[#090912]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 px-6 flex items-center justify-between">
                    {/* Left: Quick Search trigger */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsPaletteOpen(true)}
                            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/40 hover:bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white transition-all w-64 md:w-80 text-left"
                        >
                            <Search className="w-4 h-4 text-primary" />
                            <span className="flex-1 truncate">Ara veya komut yaz...</span>
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono text-gray-300">
                                Ctrl K
                            </kbd>
                        </button>
                    </div>

                    {/* Right: Quick actions, notifications, public site link */}
                    <div className="flex items-center gap-3">
                        {/* Quick Add Menu */}
                        <Link
                            href="/admin/haberler?action=create"
                            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/30 text-xs font-semibold transition-all shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Hızlı Haber Ekle
                        </Link>

                        {/* View Public Site */}
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-primary" />
                            <span className="hidden sm:inline">Web Sitesini Gör</span>
                        </a>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors relative"
                            >
                                <Bell className="w-4 h-4" />
                                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                            </button>

                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-[#0f0f1a] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 text-xs text-gray-300 animate-in fade-in">
                                    <div className="flex items-center justify-between pb-3 border-b border-white/10 font-orbitron font-bold text-white">
                                        <span>Bildirimler</span>
                                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Yeni</span>
                                    </div>
                                    <div className="py-3 space-y-2 max-h-60 overflow-y-auto">
                                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                            <div className="font-semibold text-white">Yeni Başvuru Alındı</div>
                                            <div className="text-[11px] text-gray-400">ANTSPARK için yeni girişim başvurusu geldi.</div>
                                            <div className="text-[9px] font-mono text-primary mt-1">10 dk önce</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content Container */}
                <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>

            {/* Command Palette */}
            <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
        </div>
    );
};
