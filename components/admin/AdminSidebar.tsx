"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NAV_SECTIONS } from './nav-config';
import {
    LogOut, ChevronLeft, ChevronRight, Star, Search, ChevronDown
} from 'lucide-react';

interface AdminSidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    user?: {
        name: string;
        email: string;
        isSuperAdmin: boolean;
        permissions?: string[];
    } | null;
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
}


export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, onToggle, user, mobileOpen = false, onCloseMobile }) => {
    const pathname = usePathname();
    const router = useRouter();

    const [menuSearch, setMenuSearch] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const savedCollapsed = localStorage.getItem('admin_sidebar_collapsed_groups');
                if (savedCollapsed) setCollapsedGroups(JSON.parse(savedCollapsed));

                const savedFavs = localStorage.getItem('admin_sidebar_favorites');
                if (savedFavs) setFavorites(JSON.parse(savedFavs));
            } catch {}
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const toggleGroup = (groupId: string) => {
        setCollapsedGroups(prev => {
            const next = { ...prev, [groupId]: !prev[groupId] };
            try {
                localStorage.setItem('admin_sidebar_collapsed_groups', JSON.stringify(next));
            } catch {}
            return next;
        });
    };

    const toggleFavorite = (e: React.MouseEvent, href: string) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorites(prev => {
            const next = prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href];
            try {
                localStorage.setItem('admin_sidebar_favorites', JSON.stringify(next));
            } catch {}
            return next;
        });
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/auth/logout', { method: 'POST' });
            router.push('/admin/login');
            router.refresh();
        } catch {
            window.location.href = '/admin/login';
        }
    };

    const isSuper = Boolean(user?.isSuperAdmin);
    const permissions = new Set(user?.permissions || []);
    /** Mirrors server-side hasPermission for menu visibility; the server still enforces access. */
    const can = (perm?: string) => {
        if (!perm || isSuper) return true;
        const [action, resource] = perm.split(':');
        return permissions.has(perm) || permissions.has(`*:${resource}`) || permissions.has(`${action}:*`) || permissions.has('*:*');
    };

    const rawNavSections = NAV_SECTIONS.map((section) => ({ ...section, items: section.items.filter((item) => can(item.perm)) }));

    const navSections = rawNavSections.filter(section => section.items.length > 0);

    // Find all items for search or favorites
    const allItems = navSections.flatMap(s => s.items);
    const favoriteItems = allItems.filter(item => favorites.includes(item.href));

    return (
        <aside
            aria-label="Yönetim menüsü"
            className={`glass-sidebar fixed top-0 left-0 h-dvh max-h-screen bg-[#090912] border-r border-white/10 flex flex-col z-40 transition-all duration-300 select-none ${
                mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            } ${
                isCollapsed ? 'w-64 lg:w-20' : 'w-64'
            }`}
        >
            {/* Header / Brand - Fixed, never compressed */}
            <div className="flex-shrink-0 h-16 px-4 border-b border-white/10 flex items-center justify-between bg-[#090912] z-10">
                {!isCollapsed ? (
                    <Link href="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-orbitron font-bold text-white shadow-lg shadow-primary/20 flex-shrink-0">
                            İK
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-orbitron font-bold text-xs text-white tracking-wider truncate">
                                İKÜANTS TEKMER
                            </div>
                            <div className="text-[10px] font-mono text-primary font-semibold truncate">
                                OPERASYON MERKEZİ
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-orbitron font-bold text-white text-xs flex-shrink-0">
                        İK
                    </div>
                )}
                <button
                    onClick={() => (mobileOpen && onCloseMobile ? onCloseMobile() : onToggle())}
                    aria-label={mobileOpen ? 'Menüyü kapat' : isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer flex-shrink-0"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Menu Search - Fixed, never compressed */}
            {!isCollapsed && (
                <div className="flex-shrink-0 p-3 border-b border-white/5 bg-[#090912] z-10">
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Menüde ara... (Ctrl+K)"
                            value={menuSearch}
                            onChange={(e) => setMenuSearch(e.target.value)}
                            className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
                        />
                    </div>
                </div>
            )}

            {/* Navigation items - The ONLY scrolling container */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10 min-h-0">
                {/* Favorites Group (if any) */}
                {!isCollapsed && favoriteItems.length > 0 && !menuSearch && (
                    <div className="space-y-1 pb-2 border-b border-white/5">
                        <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-wider text-amber-400/90 uppercase flex items-center gap-1.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Sık Kullanılanlar
                        </div>
                        {favoriteItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                        isActive
                                            ? 'bg-primary/20 text-white border border-primary/30'
                                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <Icon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                        <span className="truncate">{item.title}</span>
                                    </div>
                                    <button
                                        onClick={(e) => toggleFavorite(e, item.href)}
                                        className="text-amber-400 hover:text-gray-400 transition-colors"
                                    >
                                        <Star className="w-3 h-3 fill-amber-400" />
                                    </button>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Main Sections */}
                {navSections.map((section) => {
                    const isGroupCollapsed = collapsedGroups[section.id] && !menuSearch;
                    const filteredItems = section.items.filter(item =>
                        !menuSearch || item.title.toLowerCase().includes(menuSearch.toLowerCase())
                    );

                    if (filteredItems.length === 0) return null;

                    const isSectionActive = section.items.some(i => pathname === i.href || (i.href !== '/admin/dashboard' && pathname.startsWith(i.href)));

                    return (
                        <div key={section.id} className="space-y-1">
                            {!isCollapsed && (
                                <button
                                    onClick={() => toggleGroup(section.id)}
                                    className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-gray-500 hover:text-gray-300 uppercase transition-colors cursor-pointer"
                                >
                                    <span className={isSectionActive ? 'text-primary font-bold' : ''}>
                                        {section.title}
                                    </span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${isGroupCollapsed ? '-rotate-90 text-gray-600' : 'text-gray-400'}`} />
                                </button>
                            )}

                            {!isGroupCollapsed && (
                                <div className="space-y-0.5">
                                    {filteredItems.map((item) => {
                                        const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                                        const Icon = item.icon;
                                        const isFav = favorites.includes(item.href);

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                title={isCollapsed ? item.title : undefined}
                                                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                                    isActive
                                                        ? 'bg-gradient-to-r from-primary/25 to-purple-600/15 text-white border border-primary/40 shadow-sm shadow-primary/10 font-semibold'
                                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 truncate">
                                                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`} />
                                                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                                                </div>

                                                {!isCollapsed && (
                                                    <button
                                                        onClick={(e) => toggleFavorite(e, item.href)}
                                                        className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
                                                            isFav ? 'opacity-100 text-amber-400' : 'text-gray-500 hover:text-amber-400'
                                                        }`}
                                                        title="Sık kullanılanlara ekle"
                                                    >
                                                        <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400' : ''}`} />
                                                    </button>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* User profile & Logout footer - Fixed, never compressed */}
            <div className="flex-shrink-0 p-3 border-t border-white/10 bg-black/30">
                {!isCollapsed ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary font-mono flex-shrink-0">
                                {user?.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-xs font-semibold text-white truncate">
                                    {user?.name || 'Süper Yönetici'}
                                </div>
                                <div className="text-[10px] font-mono text-gray-400 truncate">
                                    {user?.email || 'bilgi@ikuantstekmer.com'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Güvenli Çıkış"
                            className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogout}
                        title="Güvenli Çıkış"
                        className="w-full p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex justify-center cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>
        </aside>
    );
};
