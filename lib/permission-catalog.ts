/**
 * Turkish labels and module grouping for the permission matrix (roles and per-user overrides).
 * Purely presentational: authorization itself is enforced by lib/rbac.ts on the server.
 */

export const PERMISSION_MODULES: { key: string; label: string; resources: string[] }[] = [
    { key: 'core', label: 'Genel', resources: ['dashboard', 'analytics', 'calendar', 'search'] },
    { key: 'work', label: 'İş Yönetimi', resources: ['tasks', 'teams', 'automations', 'projects', 'activities', 'interactions', 'documents'] },
    { key: 'crm', label: 'CRM & Ekosistem', resources: ['persons', 'directory', 'entrepreneurs', 'mentors', 'contacts', 'kvkk'] },
    { key: 'programs', label: 'Program & Başvuru', resources: ['programs', 'applications', 'forms', 'pipelines', 'custom_fields'] },
    { key: 'spaces', label: 'Alanlar & Etkinlik', resources: ['facilities', 'reservations', 'events', 'trainings'] },
    { key: 'finance', label: 'Finans & Muhasebe', resources: ['finance', 'finance_project', 'invoice', 'rent'] },
    { key: 'cms', label: 'Web Sitesi (CMS)', resources: ['cms', 'pages', 'news', 'media', 'menus', 'supports', 'redirects', 'revisions', 'terminology'] },
    { key: 'comms', label: 'İletişim & Rapor', resources: ['email_templates', 'email_outbox', 'templates', 'reports'] },
    { key: 'system', label: 'Sistem & Güvenlik', resources: ['users', 'roles', 'settings', 'security', 'security_center', 'audit_logs', 'system_health', 'integrations', 'ai'] },
];

export const RESOURCE_LABELS: Record<string, string> = {
    '*': 'Tüm modüller',
    dashboard: 'Dashboard', analytics: 'Analitik', calendar: 'Takvim', search: 'Arama',
    tasks: 'Görevler', teams: 'Ekipler', automations: 'Şablon & Otomasyon', projects: 'Projeler & Hibeler', activities: 'Kurumsal faaliyetler', interactions: 'Günlük görüşmeler', documents: 'Doküman merkezi',
    persons: 'Kişiler', directory: 'Rehber', entrepreneurs: 'Girişimciler', mentors: 'Mentörler', contacts: 'İletişim talepleri', kvkk: 'KVKK & izinler',
    programs: 'Programlar', applications: 'Başvurular', forms: 'Form Merkezi', pipelines: 'Pipeline durumları', custom_fields: 'Özel alanlar',
    facilities: 'Alanlar & makineler', reservations: 'Rezervasyonlar', events: 'Etkinlikler', trainings: 'Eğitimler',
    finance: 'Finans & ön muhasebe', finance_project: 'Proje finansı', invoice: 'Gelen faturalar', rent: 'Kira',
    cms: 'Tasarım stüdyosu', pages: 'Sayfalar', news: 'Haberler', media: 'Medya', menus: 'Menüler', supports: 'Destekler', redirects: 'Yönlendirmeler', revisions: 'Revizyonlar', terminology: 'Terimler',
    email_templates: 'E-posta şablonları', email_outbox: 'E-posta outbox', templates: 'Şablonlar', reports: 'Raporlar',
    users: 'Kullanıcılar', roles: 'Roller', settings: 'Ayarlar', security: 'Güvenlik', security_center: 'Güvenlik merkezi', audit_logs: 'Denetim kayıtları', system_health: 'Sistem sağlığı', integrations: 'Entegrasyonlar', ai: 'İKÜANTS AI',
};

export const ACTION_LABELS: Record<string, string> = {
    '*': 'Tümü',
    view: 'Görüntüle', create: 'Oluştur', edit: 'Düzenle', update: 'Düzenle', delete: 'Sil', export: 'Dışa aktar',
    publish: 'Yayınla', approve: 'Onayla', manage: 'Yönet', assign: 'Ata', view_all: 'Tümünü gör', evaluate: 'Değerlendir',
    view_sensitive: 'Hassas veriyi gör', upload: 'Yükle', disable: 'Pasifleştir', assign_role: 'Rol ata', reset_password: 'Şifre sıfırla',
    manage_sessions: 'Oturum yönet', manage_mfa: 'MFA yönet', identity_view: 'T.C. görüntüle', identity_edit: 'T.C. düzenle',
    privacy_view: 'Gizlilik gör', privacy_edit: 'Gizlilik düzenle', sensitive_export: 'Hassas dışa aktarım', view_restricted: 'Kısıtlı belgeleri gör',
    payment: 'Tahsilat', reminder: 'Hatırlatma', use: 'Kullan', high_risk_action: 'Yüksek riskli işlem',
};

export const resourceLabel = (r: string) => RESOURCE_LABELS[r] || r;
export const actionLabel = (a: string) => ACTION_LABELS[a] || a;

export function moduleOf(resource: string): string {
    return PERMISSION_MODULES.find((m) => m.resources.includes(resource))?.key || 'other';
}
