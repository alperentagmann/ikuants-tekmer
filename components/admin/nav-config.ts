import {
    ListTodo, Timer, PenTool, UsersRound, GanttChartSquare, Workflow, Plug, Calculator,
    LayoutDashboard, FileText, Users, UserCheck, Rocket, Newspaper, HelpCircle, Mail, Folder, Shield, Settings, Activity, History, Sparkles, Navigation, Globe, Calendar, Building2, CheckSquare, Layers, ShieldAlert, Sun, BarChart3, MessageSquare, Send, Inbox, DollarSign, Receipt, ShieldCheck, Bell, Megaphone, ClipboardList, GitBranch, KanbanSquare, CalendarDays, Wallet, FileStack, Home, Handshake, Image, Share2, Bot, Tag, SlidersHorizontal, type LucideIcon
} from 'lucide-react';

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
    perm?: string;
}

export interface NavSection {
    id: string;
    title: string;
    items: NavItem[];
}

/** Admin navigation shared by the sidebar and the Ctrl+K palette. `perm` is "action:resource". */
export const NAV_SECTIONS: NavSection[] = [
    {
        id: 'main',
        title: 'ANA MERKEZ',
        items: [
            { title: 'Operasyon Kontrol Merkezi', href: '/admin/dashboard', icon: LayoutDashboard },
            { title: 'Benim Günüm', href: '/admin/benim-gunum', icon: Sun },
            { title: 'Bildirimler', href: '/admin/bildirimler', icon: Bell },
        ],
    },
    {
        id: 'crm',
        title: 'CRM & EKOSİSTEM',
        items: [
            { title: 'Kişi & Kurum Rehberi', href: '/admin/rehber', icon: Users, perm: 'view:persons' },
            { title: 'Girişimciler', href: '/admin/girisimciler', icon: Rocket, perm: 'view:entrepreneurs' },
            { title: 'Mentörler', href: '/admin/mentorler', icon: UserCheck, perm: 'view:mentors' },
            { title: 'KVKK & Veri İzinleri', href: '/admin/kvkk', icon: ShieldCheck, perm: 'view:kvkk' },
        ],
    },
    {
        id: 'programs',
        title: 'PROGRAM & BAŞVURU',
        items: [
            { title: 'Programlar & Eğitim', href: '/admin/programlar', icon: Layers, perm: 'view:programs' },
            { title: 'Başvuru Merkezi', href: '/admin/basvurular', icon: FileText, perm: 'view:applications' },
            { title: 'Başvuru Kampanyaları', href: '/admin/basvuru-kampanyalari', icon: Megaphone, perm: 'view:applications' },
            { title: 'Form Merkezi', href: '/admin/form-builder', icon: ClipboardList, perm: 'view:forms' },
            { title: 'Pipeline Durumları', href: '/admin/durumlar', icon: GitBranch, perm: 'manage:pipelines' },
        ],
    },
    {
        id: 'operations',
        title: 'İŞ & OPERASYON',
        items: [
            { title: 'İş Takip Merkezi', href: '/admin/is-takip', icon: ListTodo, perm: 'view:tasks' },
            { title: 'Görevler', href: '/admin/gorevler', icon: CheckSquare, perm: 'view:tasks' },
            { title: 'Kanban', href: '/admin/gorevler/kanban', icon: KanbanSquare, perm: 'view:tasks' },
            { title: 'İş Planlama', href: '/admin/is-planlama', icon: GanttChartSquare, perm: 'view:tasks' },
            { title: 'Ekipler', href: '/admin/ekipler', icon: UsersRound, perm: 'view:tasks' },
            { title: 'Şablon & Otomasyon', href: '/admin/is-otomasyon', icon: Workflow, perm: 'view:tasks' },
            { title: 'Ortak Takvim', href: '/admin/takvim', icon: Calendar },
            { title: 'Günlük Görüşmeler', href: '/admin/gorusmeler', icon: MessageSquare, perm: 'view:interactions' },
            { title: 'Onay Bekleyenler', href: '/admin/onaylar', icon: ShieldAlert },
            { title: 'Kurumsal Faaliyetler', href: '/admin/faaliyetler', icon: Activity, perm: 'view:activities' },
        ],
    },
    {
        id: 'projects',
        title: 'PROJE & ETKİNLİK',
        items: [
            { title: 'Projeler & Hibe', href: '/admin/projeler', icon: Folder, perm: 'view:projects' },
            { title: 'Etkinlik Yönetimi', href: '/admin/etkinlikler', icon: CalendarDays, perm: 'view:events' },
            { title: 'Destek & Teşvikler', href: '/admin/destekler', icon: HelpCircle },
        ],
    },
    {
        id: 'finance',
        title: 'FİNANS & SÖZLEŞME',
        items: [
            { title: 'Finans Paneli', href: '/admin/finans', icon: DollarSign, perm: 'view:finance' },
            { title: 'Ön Muhasebe', href: '/admin/muhasebe', icon: Calculator, perm: 'view:finance' },
            { title: 'Kira & Sözleşmeler', href: '/admin/finans/kiralar', icon: Receipt, perm: 'view:rent' },
            { title: 'Faturalar', href: '/admin/finans/faturalar', icon: FileText, perm: 'view:finance' },
            { title: 'Alacaklar', href: '/admin/finans/alacaklar', icon: Wallet, perm: 'view:finance' },
            { title: 'Kira Hatırlatma Ayarları', href: '/admin/finans/kira-ayarlari', icon: Settings, perm: 'update:rent' },
        ],
    },
    {
        id: 'spaces',
        title: 'ALAN & REZERVASYON',
        items: [
            { title: 'Alanlar & Rezervasyonlar', href: '/admin/alanlar', icon: Building2, perm: 'view:facilities' },
        ],
    },
    {
        id: 'communication',
        title: 'İLETİŞİM',
        items: [
            { title: 'İletişim Talepleri', href: '/admin/iletisim', icon: Mail, perm: 'view:contacts' },
            { title: 'E-Posta Merkezi', href: '/admin/eposta-merkezi', icon: Send, perm: 'manage:email_outbox' },
            { title: 'E-Posta Şablonları', href: '/admin/eposta-sablonlari', icon: Mail, perm: 'manage:templates' },
            { title: 'Doküman Merkezi', href: '/admin/dokumanlar', icon: FileStack, perm: 'view:documents' },
            { title: 'Sosyal Medya Gelen Kutusu', href: '/admin/sosyal-medya/gelen-kutusu', icon: Inbox },
        ],
    },
    {
        id: 'reports',
        title: 'RAPORLAMA',
        items: [
            { title: 'Rapor Merkezi', href: '/admin/raporlar', icon: BarChart3, perm: 'view:reports' },
            { title: 'İş Takip Raporu', href: '/admin/raporlar/is-takip', icon: Timer, perm: 'view:tasks' },
            { title: 'Günlük Rapor', href: '/admin/raporlar/gunluk', icon: Calendar, perm: 'view:reports' },
            { title: 'Aylık Rapor', href: '/admin/raporlar/aylik', icon: Calendar, perm: 'view:reports' },
            { title: 'Yıllık Rapor', href: '/admin/raporlar/yillik', icon: FileText, perm: 'view:reports' },
            { title: 'Finans Raporu', href: '/admin/raporlar/finans', icon: DollarSign, perm: 'view:finance' },
            { title: 'Kira Raporu', href: '/admin/raporlar/kira', icon: Receipt, perm: 'view:rent' },
            { title: 'Ekip Raporu', href: '/admin/raporlar/ekip', icon: Users, perm: 'view:reports' },
            { title: 'Kullanıcı Raporu', href: '/admin/raporlar/kullanici', icon: Users, perm: 'view:reports' },
            { title: 'Sosyal Medya Raporu', href: '/admin/raporlar/sosyal-medya', icon: MessageSquare, perm: 'view:reports' },
            { title: 'Özel Rapor', href: '/admin/raporlar/ozel', icon: Sparkles, perm: 'create:reports' },
        ],
    },
    {
        id: 'cms',
        title: 'CMS & WEB',
        items: [
            { title: 'Tasarım Stüdyosu', href: '/admin/tasarim-studyosu', icon: PenTool, perm: 'edit:cms' },
            { title: 'Ana Sayfa & Banner', href: '/admin/anasayfa', icon: Home, perm: 'edit:cms' },
            { title: 'Sayfa Yönetimi', href: '/admin/sayfalar', icon: FileText, perm: 'edit:cms' },
            { title: 'Hakkımızda Studio', href: '/admin/hakkimizda', icon: Building2, perm: 'edit:cms' },
            { title: 'Haberler & Editör', href: '/admin/haberler', icon: Newspaper, perm: 'view:news' },
            { title: 'Menü & Footer', href: '/admin/menuler', icon: Navigation, perm: 'manage:menus' },
            { title: 'Partner & Logolar', href: '/admin/partnerler', icon: Handshake, perm: 'edit:cms' },
            { title: 'Medya Kütüphanesi', href: '/admin/medya', icon: Image, perm: 'view:media' },
            { title: 'SEO & Yönlendirmeler', href: '/admin/seo-redirects', icon: Globe, perm: 'manage:redirects' },
            { title: 'Sosyal Medya Entegrasyonu', href: '/admin/entegrasyonlar/sosyal-medya', icon: Share2, perm: 'manage:settings' },
        ],
    },
    {
        id: 'ai',
        title: 'AI',
        items: [
            { title: 'İKÜANTS AI Komuta Merkezi', href: '/admin/ai', icon: Bot, perm: 'use:ai' },
        ],
    },
    {
        id: 'system',
        title: 'YÖNETİM & SİSTEM',
        items: [
            { title: 'Kullanıcılar', href: '/admin/kullanicilar', icon: Users, perm: 'view:users' },
            { title: 'Roller & İzinler', href: '/admin/roller', icon: Shield, perm: 'manage:roles' },
            { title: 'Güvenlik Merkezi', href: '/admin/guvenlik', icon: ShieldAlert, perm: 'view:security_center' },
            { title: 'Sistem Sağlığı', href: '/admin/sistem-sagligi', icon: Activity, perm: 'view:system_health' },
            { title: 'Audit Log (Denetim)', href: '/admin/audit-log', icon: History, perm: 'view:audit_logs' },
            { title: 'Entegrasyon Merkezi', href: '/admin/entegrasyon-merkezi', icon: Plug, perm: 'view:integrations' },
            { title: 'Site Ayarları', href: '/admin/ayarlar', icon: Settings, perm: 'manage:settings' },
            { title: 'Terim & Etiketler', href: '/admin/terimler', icon: Tag, perm: 'manage:terminology' },
            { title: 'Özel Alanlar', href: '/admin/ozel-alanlar', icon: SlidersHorizontal, perm: 'manage:custom_fields' },
        ],
    },
];

/** Mirrors server-side hasPermission for menu visibility; the server still enforces access. */
export function canSee(user: { isSuperAdmin?: boolean; permissions?: string[] } | null | undefined, perm?: string): boolean {
    if (!perm || user?.isSuperAdmin) return true;
    const [action, resource] = perm.split(':');
    const p = new Set(user?.permissions || []);
    return p.has(perm) || p.has(`*:${resource}`) || p.has(`${action}:*`) || p.has('*:*');
}
