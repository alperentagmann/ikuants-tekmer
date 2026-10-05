"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, Plus, ExternalLink, Sparkles, Menu, CheckCheck, ChevronDown } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { CommandPalette } from './CommandPalette';
import { AiAssistantDrawer } from './AiAssistantDrawer';
import { ActionIntentListener } from './ActionIntentListener';
import { NAV_SECTIONS } from './nav-config';

/** Section and page title of the current admin route (longest matching menu link). */
function locate(pathname: string) {
    let best: { section: string; title: string; len: number } | null = null;
    for (const section of NAV_SECTIONS) {
        for (const item of section.items) {
            if ((pathname === item.href || pathname.startsWith(`${item.href}/`)) && (!best || item.href.length > best.len)) best = { section: section.title, title: item.title, len: item.href.length };
        }
    }
    return best;
}

interface AdminLayoutProps {
    children: React.ReactNode;
}

interface CurrentUser {
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
    roles: string[];
    permissions: string[];
}

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    targetUrl: string | null;
    createdAt: string;
    isRead: boolean;
}

/** Role-aware "+ Yeni" menu. Each entry opens the entity's own create dialog via ?action=. */
const QUICK_CREATE: { label: string; href: string; perm?: string }[] = [
    { label: 'Kişi', href: '/admin/rehber?action=create-person', perm: 'create:persons' },
    { label: 'Kurum / Şirket', href: '/admin/rehber?action=create-org', perm: 'create:persons' },
    { label: 'Girişimci', href: '/admin/girisimciler?action=create', perm: 'create:entrepreneurs' },
    { label: 'Mentör', href: '/admin/mentorler?action=create', perm: 'create:mentors' },
    { label: 'Program', href: '/admin/programlar?action=create', perm: 'create:programs' },
    { label: 'Başvuru Kampanyası', href: '/admin/basvuru-kampanyalari?action=create', perm: 'edit:applications' },
    { label: 'Başvuru', href: '/admin/basvurular?action=create', perm: 'edit:applications' },
    { label: 'Form', href: '/admin/form-builder?action=create', perm: 'create:forms' },
    { label: 'Görev', href: '/admin/gorevler?action=create', perm: 'create:tasks' },
    { label: 'Görüşme', href: '/admin/gorusmeler?action=create', perm: 'create:interactions' },
    { label: 'Proje', href: '/admin/projeler?action=create', perm: 'create:projects' },
    { label: 'Etkinlik', href: '/admin/etkinlikler?action=create', perm: 'create:events' },
    { label: 'Rezervasyon', href: '/admin/alanlar?tab=rezervasyonlar&action=create', perm: 'create:reservations' },
    { label: 'Kira Sözleşmesi', href: '/admin/finans/kiralar', perm: 'create:rent' },
    { label: 'Doküman', href: '/admin/dokumanlar?action=create', perm: 'upload:documents' },
    { label: 'Haber', href: '/admin/haberler?action=create', perm: 'create:news' },
    { label: 'E-posta', href: '/admin/eposta-merkezi?action=compose', perm: 'view:email_outbox' },
];

function timeAgo(value: string): string {
    const diff = Math.max(0, Date.now() - new Date(value).getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'şimdi';
    if (m < 60) return `${m} dk önce`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} sa önce`;
    return new Date(value).toLocaleDateString('tr-TR');
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const createRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsPaletteOpen((prev) => !prev);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                setIsAiOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsNotifOpen(false);
                setIsCreateOpen(false);
                setMobileOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
            if (createRef.current && !createRef.current.contains(e.target as Node)) setIsCreateOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (pathname === '/admin/login' || pathname.startsWith('/admin/invite') || pathname.startsWith('/admin/reset-password')) {
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

    const loadNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/notifications?limit=8', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.items);
                setUnreadCount(data.unreadCount);
            }
        } catch {
            // Notification polling is best-effort
        }
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        loadNotifications();
        const timer = window.setInterval(loadNotifications, 60000);
        return () => window.clearInterval(timer);
    }, [currentUser, loadNotifications]);

    const markAllRead = async () => {
        await fetch('/api/admin/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
        loadNotifications();
    };

    const openNotification = async (n: NotificationItem) => {
        if (!n.isRead) {
            await fetch('/api/admin/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [n.id] }) });
        }
        setIsNotifOpen(false);
        loadNotifications();
        if (n.targetUrl) router.push(n.targetUrl);
    };

    const can = (perm?: string) => {
        if (!perm || currentUser?.isSuperAdmin) return true;
        const [action, resource] = perm.split(':');
        const p = new Set(currentUser?.permissions || []);
        return p.has(perm) || p.has(`*:${resource}`) || p.has(`${action}:*`) || p.has('*:*');
    };

    if (pathname === '/admin/login' || pathname.startsWith('/admin/invite') || pathname.startsWith('/admin/reset-password')) {
        return <>{children}</>;
    }

    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-[#06060c] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center animate-pulse text-white font-bold font-orbitron text-lg">İK</div>
                    <div className="text-xs font-mono text-gray-400">Yönetim Paneli Yükleniyor...</div>
                </div>
            </div>
        );
    }

    const quickCreate = QUICK_CREATE.filter((q) => can(q.perm));

    return (
        <div className="admin-glass min-h-screen text-white flex">
            <div className="admin-glass-field" aria-hidden="true"><span /><span /><span /></div>
            <ActionIntentListener />

            {mobileOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
            <AdminSidebar
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
                user={currentUser}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div className={`relative z-10 flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <header className="glass-chrome h-16 border-b border-white/10 sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-gray-300 hover:bg-white/5 lg:hidden" aria-label="Menüyü aç">
                            <Menu className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setIsPaletteOpen(true)}
                            className="inline-flex min-w-0 items-center gap-2.5 px-3 sm:px-4 py-2 rounded-xl bg-black/40 hover:bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white transition-all sm:w-64 md:w-80 text-left"
                            aria-label="Ara veya komut yaz (Ctrl+K)"
                        >
                            <Search className="w-4 h-4 shrink-0 text-primary" />
                            <span className="hidden flex-1 truncate sm:inline">Ara veya komut yaz...</span>
                            <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono text-gray-300">Ctrl K</kbd>
                        </button>
                        {(() => {
                            const here = locate(pathname);
                            return here ? (
                                <nav aria-label="Konum" className="hidden min-w-0 items-center gap-1.5 text-xs xl:flex">
                                    <span className="truncate font-mono text-[10px] uppercase tracking-wider text-gray-500">{here.section}</span>
                                    <span className="text-gray-600">/</span>
                                    <span className="truncate font-semibold text-gray-200">{here.title}</span>
                                </nav>
                            ) : null;
                        })()}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {can('use:ai') && (
                            <button
                                id="global-ai-assistant-btn"
                                onClick={() => setIsAiOpen(true)}
                                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors cursor-pointer"
                                aria-label="İKÜANTS AI (Ctrl+J)"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">İKÜANTS AI</span>
                            </button>
                        )}

                        {quickCreate.length > 0 && (
                            <div className="relative" ref={createRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen((o) => !o)}
                                    aria-expanded={isCreateOpen}
                                    aria-haspopup="menu"
                                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold"
                                >
                                    <Plus className="w-3.5 h-3.5 text-primary" />
                                    <span className="hidden sm:inline">Yeni</span>
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                                {isCreateOpen && (
                                    <div role="menu" className="absolute right-0 mt-2 grid w-64 grid-cols-1 gap-0.5 rounded-xl border border-white/10 bg-[#0f0f1a] p-1.5 shadow-2xl z-50 sm:w-80 sm:grid-cols-2">
                                        {quickCreate.map((q) => (
                                            <Link key={q.href} role="menuitem" href={q.href} onClick={() => setIsCreateOpen(false)} className="rounded-lg px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white">
                                                {q.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <a href="/" target="_blank" rel="noopener noreferrer" className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all">
                            <ExternalLink className="w-3.5 h-3.5 text-primary" />
                            <span>Web Sitesi</span>
                        </a>

                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors relative"
                                aria-label={`Bildirimler${unreadCount ? ` (${unreadCount} okunmamış)` : ''}`}
                                aria-expanded={isNotifOpen}
                            >
                                <Bell className="w-4 h-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold leading-[18px] text-white text-center">{unreadCount > 99 ? '99+' : unreadCount}</span>
                                )}
                            </button>

                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-1.5rem))] bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl z-50 text-xs text-gray-300">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                        <span className="font-semibold text-white">Bildirimler</span>
                                        {unreadCount > 0 && (
                                            <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                                                <CheckCheck className="h-3.5 w-3.5" /> Tümünü okundu yap
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto p-2">
                                        {notifications.length === 0 ? (
                                            <p className="px-3 py-6 text-center text-gray-500">Bildirim yok.</p>
                                        ) : (
                                            notifications.map((n) => (
                                                <button key={n.id} type="button" onClick={() => openNotification(n)} className={`block w-full rounded-xl px-3 py-2.5 text-left hover:bg-white/5 ${n.isRead ? 'opacity-70' : ''}`}>
                                                    <div className="flex items-center gap-2">
                                                        {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Okunmamış" />}
                                                        <span className="truncate font-semibold text-white">{n.title}</span>
                                                    </div>
                                                    <div className="mt-0.5 line-clamp-2 text-[11px] text-gray-400">{n.message}</div>
                                                    <div className="mt-1 text-[10px] text-gray-500">{timeAgo(n.createdAt)}</div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <Link href="/admin/bildirimler" onClick={() => setIsNotifOpen(false)} className="block border-t border-white/10 px-4 py-2.5 text-center text-[11px] text-primary hover:bg-white/5">Tüm bildirimler</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className={`flex-1 w-full mx-auto p-4 sm:p-6 md:p-8 min-w-0 ${pathname.startsWith('/admin/tasarim-studyosu') || pathname.startsWith('/admin/gorevler/kanban') ? 'max-w-[1720px]' : 'max-w-7xl'}`}>{children}</main>
            </div>

            <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} user={currentUser} />
            {can('use:ai') && <AiAssistantDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />}
        </div>
    );
};
