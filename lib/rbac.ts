export type SystemRoleSlug =
    | 'super-admin'
    | 'admin'
    | 'content-editor'
    | 'application-manager'
    | 'mentor-manager'
    | 'program-manager'
    | 'viewer';

export interface UserWithPermissions {
    id: string;
    isSuperAdmin: boolean;
    isActive: boolean;
    userRoles?: Array<{
        role: {
            slug: string;
            permissions: Array<{
                permission: {
                    action: string;
                    resource: string;
                };
            }>;
        };
    }>;
    userPermissions?: Array<{
        isGranted: boolean;
        permission: {
            action: string;
            resource: string;
        };
    }>;
}

export function isSensitiveIdentityAction(action: string, resource: string): boolean {
    const act = action.toLowerCase();
    const res = resource.toLowerCase();

    // Explicit person identity capabilities (e.g. person:identity:view)
    if (
        act === 'person:identity:view' ||
        act === 'person:identity:edit' ||
        act === 'person:sensitive_export'
    ) {
        return true;
    }

    // Only restricted to explicit capability when the target resource is persons / person
    if (res === 'persons' || res === 'person') {
        return (
            act === 'identity_view' ||
            act === 'identity_edit' ||
            act === 'sensitive_export' ||
            act.includes('identity') ||
            act.includes('sensitive')
        );
    }

    return false;
}

export function hasPermission(
    user: UserWithPermissions | null | undefined,
    action: string,
    resource: string = '*'
): boolean {
    if (!user || !user.isActive) return false;

    // Normalizing colon syntax like "person:identity:view"
    if (action.includes(':') && resource === '*') {
        const parts = action.split(':');
        if (parts.length === 3) {
            resource = parts[0] + 's';
            action = parts[1] + '_' + parts[2];
        } else if (parts.length === 2) {
            resource = parts[0] + 's';
            action = parts[1];
        }
    }

    const isSensitive = isSensitiveIdentityAction(action, resource);

    // 1. Check direct user explicit overrides
    if (user.userPermissions) {
        const explicit = user.userPermissions.find(
            (up) => {
                const actMatch = up.permission.action === action || up.permission.action === '*';
                const resMatch = up.permission.resource === resource || up.permission.resource === '*';
                return actMatch && resMatch;
            }
        );
        if (explicit !== undefined) {
            return explicit.isGranted;
        }
    }

    // 2. Check role permissions
    if (user.userRoles) {
        for (const userRole of user.userRoles) {
            const match = userRole.role.permissions.some(
                (rp) => {
                    // For sensitive identity, wildcard does not blindly bypass unless specific permission assigned
                    if (isSensitive && rp.permission.action === '*' && rp.permission.resource === '*') {
                        return false;
                    }
                    const actMatch = rp.permission.action === action || (rp.permission.action === '*' && !isSensitive);
                    const resMatch = rp.permission.resource === resource || (rp.permission.resource === '*' && !isSensitive);
                    return actMatch && resMatch;
                }
            );
            if (match) return true;
        }
    }

    // 3. Super admin bypass: Super admins have global access to general operations,
    // but sensitive identity reveal requires explicit capability (e.g. person:identity:view).
    if (user.isSuperAdmin) {
        return !isSensitive;
    }

    return false;
}

export function canViewSensitiveIdentity(user: UserWithPermissions | null | undefined): boolean {
    return hasPermission(user, 'identity_view', 'persons');
}

export function canEditSensitiveIdentity(user: UserWithPermissions | null | undefined): boolean {
    return hasPermission(user, 'identity_edit', 'persons');
}

export function canExportSensitiveData(user: UserWithPermissions | null | undefined): boolean {
    return hasPermission(user, 'sensitive_export', 'persons');
}

export async function checkPermission(
    userOrId: UserWithPermissions | string | null | undefined,
    arg1: string,
    arg2?: string
): Promise<boolean> {
    if (!userOrId) return false;

    // Handle checkPermission(user, action, resource) or checkPermission(userId, resource, action)
    let action = arg1;
    let resource = arg2 || '*';

    // If arg1 is resource and arg2 is action (e.g., 'settings', 'create')
    if (arg2 && ['settings', 'menus', 'redirects', 'pages', 'partners', 'news', 'mentors', 'entrepreneurs', 'applications', 'forms', 'contacts', 'media', 'users', 'roles', 'audit_logs', 'tasks', 'calendar', 'activities', 'trainings', 'events', 'homepage', 'approvals', 'directory', 'projects'].includes(arg1)) {
        resource = arg1;
        action = arg2;
    }

    if (typeof userOrId === 'object') {
        return hasPermission(userOrId, action, resource);
    }

    try {
        const { prisma } = await import('@/lib/prisma');
        const user = await prisma.user.findUnique({
            where: { id: userOrId },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
                userPermissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        return hasPermission(user as any, action, resource);
    } catch {
        return false;
    }
}

export function canAssignRole(caller: UserWithPermissions | null | undefined, targetRoleSlug: string): boolean {
    if (!caller || !caller.isActive) return false;
    if (caller.isSuperAdmin) return true;

    // Non-superadmins cannot assign super-admin role
    if (targetRoleSlug === 'super-admin') return false;

    // Caller must have 'users:assign_role' or 'users:*' or '*:*'
    return hasPermission(caller, 'assign_role', 'users') || hasPermission(caller, '*', 'users') || hasPermission(caller, '*', '*');
}

export const SYSTEM_PERMISSIONS = [
    // Dashboard & Analytics
    { action: 'view', resource: 'dashboard', description: 'Ana paneli görüntüleme' },
    { action: 'view', resource: 'analytics', description: 'Analitik ve raporları görme' },

    // Entrepreneurs
    { action: 'view', resource: 'entrepreneurs', description: 'Girişimcileri görüntüleme' },
    { action: 'create', resource: 'entrepreneurs', description: 'Yeni girişimci ekleme' },
    { action: 'edit', resource: 'entrepreneurs', description: 'Girişimci düzenleme' },
    { action: 'delete', resource: 'entrepreneurs', description: 'Girişimci silme/arşivleme' },
    { action: 'export', resource: 'entrepreneurs', description: 'Girişimcileri dışa aktarma (Excel/CSV)' },

    // Mentors
    { action: 'view', resource: 'mentors', description: 'Mentörleri görüntüleme' },
    { action: 'create', resource: 'mentors', description: 'Yeni mentör ekleme' },
    { action: 'edit', resource: 'mentors', description: 'Mentör düzenleme' },
    { action: 'delete', resource: 'mentors', description: 'Mentör silme/arşivleme' },
    { action: 'export', resource: 'mentors', description: 'Mentörleri dışa aktarma' },

    // Programs
    { action: 'view', resource: 'programs', description: 'Programları görüntüleme' },
    { action: 'create', resource: 'programs', description: 'Yeni program oluşturma' },
    { action: 'edit', resource: 'programs', description: 'Program düzenleme' },
    { action: 'delete', resource: 'programs', description: 'Program silme' },

    // News & Events
    { action: 'view', resource: 'news', description: 'Haber ve duyuruları görüntüleme' },
    { action: 'create', resource: 'news', description: 'Haber/duyuru oluşturma' },
    { action: 'edit', resource: 'news', description: 'Haber/duyuru düzenleme' },
    { action: 'publish', resource: 'news', description: 'Haber yayınlama/zamanlama' },
    { action: 'delete', resource: 'news', description: 'Haber silme' },

    // Applications & CRM
    { action: 'view', resource: 'applications', description: 'Başvuruları görüntüleme' },
    { action: 'edit', resource: 'applications', description: 'Başvuru durumu ve notları güncelleme' },
    { action: 'evaluate', resource: 'applications', description: 'Başvuruları puanlama ve değerlendirme' },
    { action: 'view_sensitive', resource: 'applications', description: 'Hassas PII verilerini (T.C. No vb.) görme' },
    { action: 'export', resource: 'applications', description: 'Başvuruları Excel/CSV olarak indirme' },
    { action: 'delete', resource: 'applications', description: 'Başvuru silme/arşivleme' },

    // Form Builder
    { action: 'view', resource: 'forms', description: 'Formları görüntüleme' },
    { action: 'create', resource: 'forms', description: 'Yeni dinamik form oluşturma' },
    { action: 'edit', resource: 'forms', description: 'Form alanlarını düzenleme ve yeni versiyon oluşturma' },
    { action: 'publish', resource: 'forms', description: 'Form versiyonunu canlıya alma' },
    { action: 'delete', resource: 'forms', description: 'Form silme' },

    // Contact & Meetings
    { action: 'view', resource: 'contacts', description: 'İletişim, toplantı ve ziyaret taleplerini görme' },
    { action: 'edit', resource: 'contacts', description: 'Talep durumunu değiştirme ve not ekleme' },
    { action: 'export', resource: 'contacts', description: 'İletişim taleplerini dışa aktarma' },

    // Media
    { action: 'view', resource: 'media', description: 'Medya kütüphanesini görüntüleme' },
    { action: 'upload', resource: 'media', description: 'Dosya ve görsel yükleme' },
    { action: 'delete', resource: 'media', description: 'Medya dosyalarını silme' },

    // Tasks & Collaboration
    { action: 'view', resource: 'tasks', description: 'Görevleri görüntüleme' },
    { action: 'create', resource: 'tasks', description: 'Yeni görev oluşturma' },
    { action: 'edit', resource: 'tasks', description: 'Görev düzenleme ve durum güncelleme' },
    { action: 'delete', resource: 'tasks', description: 'Görev silme/arşivleme' },

    // Corporate Activities & Evidence
    { action: 'view', resource: 'activities', description: 'Faaliyetleri görüntüleme' },
    { action: 'create', resource: 'activities', description: 'Yeni faaliyet oluşturma' },
    { action: 'edit', resource: 'activities', description: 'Faaliyet ve kanıt dosyalarını düzenleme' },
    { action: 'delete', resource: 'activities', description: 'Faaliyet silme' },

    // Projects & Grants
    { action: 'view', resource: 'projects', description: 'Projeleri görüntüleme' },
    { action: 'create', resource: 'projects', description: 'Yeni proje oluşturma' },
    { action: 'edit', resource: 'projects', description: 'Proje ve bütçe düzenleme' },
    { action: 'delete', resource: 'projects', description: 'Proje silme' },

    // Trainings & Events
    { action: 'view', resource: 'trainings', description: 'Eğitimleri görüntüleme' },
    { action: 'create', resource: 'trainings', description: 'Yeni eğitim oluşturma' },
    { action: 'edit', resource: 'trainings', description: 'Eğitim ve yoklama düzenleme' },
    { action: 'view', resource: 'events', description: 'Etkinlikleri görüntüleme' },
    { action: 'create', resource: 'events', description: 'Yeni etkinlik oluşturma' },
    { action: 'edit', resource: 'events', description: 'Etkinlik ve biletleri düzenleme' },

    // Settings & Customization
    { action: 'manage', resource: 'settings', description: 'Site ayarlarını yönetme' },
    { action: 'manage', resource: 'menus', description: 'Menü ve bağlantıları düzenleme' },
    { action: 'manage', resource: 'redirects', description: 'SEO ve 301 yönlendirmelerini yönetme' },
    { action: 'manage', resource: 'templates', description: 'E-posta şablonlarını düzenleme' },
    { action: 'manage', resource: 'terminology', description: 'Terminoloji ve etiketleri özelleştirme' },
    { action: 'manage', resource: 'custom_fields', description: 'Özel alanları yönetme' },
    { action: 'manage', resource: 'pipelines', description: 'Durum ve pipeline yönetimi' },
    { action: 'manage', resource: 'email_outbox', description: 'E-posta kuyruğunu ve gönderimleri yönetme' },

    // User & Roles Management (Granular)
    { action: 'view', resource: 'users', description: 'Admin kullanıcılarını ve rolleri görme' },
    { action: 'create', resource: 'users', description: 'Yeni admin/kullanıcı oluşturma veya davet etme' },
    { action: 'edit', resource: 'users', description: 'Kullanıcı bilgilerini düzenleme' },
    { action: 'disable', resource: 'users', description: 'Kullanıcıyı pasife alma veya kilitleme' },
    { action: 'delete', resource: 'users', description: 'Kullanıcı silme' },
    { action: 'assign_role', resource: 'users', description: 'Kullanıcılara rol ve yetki atama' },
    { action: 'reset_password', resource: 'users', description: 'Kullanıcı şifresi sıfırlama' },
    { action: 'manage_sessions', resource: 'users', description: 'Kullanıcı oturumlarını sonlandırma' },
    { action: 'manage_mfa', resource: 'users', description: 'Kullanıcı MFA sıfırlama ve yapılandırma' },
    { action: 'manage', resource: 'roles', description: 'Rol ve yetkileri yönetme' },

    // Audit & System Logs & Security
    { action: 'view', resource: 'audit_logs', description: 'Güvenlik ve denetim loglarını görüntüleme' },
    { action: 'view', resource: 'system_health', description: 'Sistem durumu ve hata loglarını görme' },
    { action: 'view', resource: 'security_center', description: 'Güvenlik merkezini görüntüleme ve olayları yönetme' },

    // Daily Interactions & Meetings
    { action: 'view', resource: 'interactions', description: 'Günlük görüşmeleri ve ziyaretleri görüntüleme' },
    { action: 'create', resource: 'interactions', description: 'Yeni görüşme veya ziyaret kaydı oluşturma' },
    { action: 'update', resource: 'interactions', description: 'Görüşme ve ziyaret detaylarını düzenleme' },
    { action: 'delete', resource: 'interactions', description: 'Görüşme veya ziyaret kaydı silme' },
    { action: 'export', resource: 'interactions', description: 'Görüşme ve ziyaret listesini dışa aktarma' },

    
    // Persons & Enterprise CRM Directory
    { action: 'view', resource: 'persons', description: 'Kişi rehberini ve temel profilleri görüntüleme' },
    { action: 'create', resource: 'persons', description: 'Yeni kişi kaydı ve kurum bağlantısı oluşturma' },
    { action: 'update', resource: 'persons', description: 'Kişi ve iletişim bilgilerini düzenleme' },
    { action: 'delete', resource: 'persons', description: 'Kişi kaydını arşivleme veya silme' },
    { action: 'identity_view', resource: 'persons', description: 'T.C. Kimlik No gibi hassas kimlik verilerini tam görme (person:identity:view)' },
    { action: 'identity_edit', resource: 'persons', description: 'T.C. Kimlik No ve hassas kimlik verilerini güncelleme (person:identity:edit)' },
    { action: 'privacy_view', resource: 'persons', description: 'KVKK ve açık rıza geçmişini inceleme (person:privacy:view)' },
    { action: 'privacy_edit', resource: 'persons', description: 'KVKK ve iletişim izinlerini düzenleme veya geri çekme (person:privacy:edit)' },
    { action: 'sensitive_export', resource: 'persons', description: 'Hassas kimlik ve kişisel verileri dışa aktarma (person:sensitive_export)' },

    // Task assignment scope (task:assign is different from task:view_all)
    { action: 'assign', resource: 'tasks', description: 'Başkalarına görev atama (task:assign)' },
    { action: 'view_all', resource: 'tasks', description: 'Kurumdaki tüm görevleri görme (task:view_all)' },
    { action: 'approve', resource: 'tasks', description: 'Kontrole gönderilen görevi onaylama / düzeltmeye gönderme' },

    // Facilities, space assignments & reservations
    { action: 'view', resource: 'facilities', description: 'Kullanım alanlarını ve tahsisleri görüntüleme' },
    { action: 'create', resource: 'facilities', description: 'Yeni alan oluşturma' },
    { action: 'update', resource: 'facilities', description: 'Alan bilgileri, 3D/360 medya ve tahsisleri düzenleme' },
    { action: 'delete', resource: 'facilities', description: 'Alanı pasife alma / arşivleme' },
    { action: 'view', resource: 'reservations', description: 'Rezervasyon taleplerini görüntüleme' },
    { action: 'approve', resource: 'reservations', description: 'Rezervasyon onaylama, reddetme, alternatif önerme' },
    { action: 'create', resource: 'reservations', description: 'Admin adına rezervasyon oluşturma' },

    // Document center
    { action: 'view', resource: 'documents', description: 'Doküman merkezini görüntüleme' },
    { action: 'upload', resource: 'documents', description: 'Doküman yükleme ve kayda bağlama' },
    { action: 'delete', resource: 'documents', description: 'Dokümanı arşivleme' },
    { action: 'view_restricted', resource: 'documents', description: 'Kısıtlı (hassas) dokümanları görme' },

    // Reports
    { action: 'view', resource: 'reports', description: 'Raporları görüntüleme' },
    { action: 'create', resource: 'reports', description: 'Rapor oluşturma ve düzenleme' },
    { action: 'approve', resource: 'reports', description: 'Rapor onaylama' },
    { action: 'publish', resource: 'reports', description: 'Rapor yayınlama' },
    { action: 'export', resource: 'reports', description: 'Rapor dışa aktarma (PDF/Excel)' },

    // CMS publishing
    { action: 'publish', resource: 'cms', description: 'Web sitesi içeriğini yayınlama (cms:publish)' },
    { action: 'edit', resource: 'cms', description: 'Ana sayfa, menü, footer ve sayfa içeriklerini düzenleme' },

    // AI operations
    { action: 'use', resource: 'ai', description: 'İKÜANTS AI Komuta & Operasyon Merkezini kullanma' },
    { action: 'high_risk_action', resource: 'ai', description: 'AI ile yüksek riskli işlemleri onaylayıp çalıştırma (ai:high_risk_action)' },

    // KVKK & Consent Management
    { action: 'view', resource: 'kvkk', description: 'KVKK ve veri izinleri merkezini görüntüleme' },
    { action: 'create', resource: 'kvkk', description: 'Yeni KVKK açık rıza kaydı oluşturma' },
    { action: 'update', resource: 'kvkk', description: 'KVKK izni durumunu güncelleme veya geri çekme' },
    { action: 'export', resource: 'kvkk', description: 'KVKK ve veri izinleri listesini dışa aktarma' },
    { action: 'view_sensitive', resource: 'kvkk', description: 'KVKK hassas kişisel verileri maskesiz görüntüleme' },

    // Finance & Project Budget Center
    { action: 'view', resource: 'finance', description: 'Finans merkezini ve genel göstergeleri görüntüleme' },
    { action: 'create', resource: 'finance', description: 'Yeni finansman kaynağı veya harcama ekleme' },
    { action: 'update', resource: 'finance', description: 'Finansal kayıtları düzenleme' },
    { action: 'approve', resource: 'finance', description: 'Finansal harcama ve bütçe onaylama' },
    { action: 'export', resource: 'finance', description: 'Finansal rapor ve dökümleri dışa aktarma' },
    { action: 'view', resource: 'finance_project', description: 'Proje bütçe ve harcama detaylarını görme' },
    { action: 'update', resource: 'finance_project', description: 'Proje bütçesini ve finansmanını güncelleme' },

    // Rent & Collection Management
    { action: 'view', resource: 'rent', description: 'Kira sözleşmeleri ve tahakkukları görüntüleme' },
    { action: 'create', resource: 'rent', description: 'Yeni kira sözleşmesi ve tahakkuk oluşturma' },
    { action: 'update', resource: 'rent', description: 'Kira sözleşmesi ve ayarlarını düzenleme' },
    { action: 'payment', resource: 'rent', description: 'Kira tahsilatı ve kısmi ödeme kaydetme' },
    { action: 'reminder', resource: 'rent', description: 'Otomatik ve manuel kira hatırlatma gönderme' },

    // Invoice Management
    { action: 'view', resource: 'invoice', description: 'Fatura ve finansal belgeleri görüntüleme' },
    { action: 'create', resource: 'invoice', description: 'Yeni fatura kaydı ve belge bağlama' },
    { action: 'view_sensitive', resource: 'invoice', description: 'Hassas fatura ve banka dekontlarını görüntüleme' },

    // Work OS: teams and automations
    { action: 'view', resource: 'teams', description: 'Ekipleri ve ekip panolarını görüntüleme' },
    { action: 'manage', resource: 'teams', description: 'Ekip oluşturma, üye ve lider atama' },
    { action: 'manage', resource: 'automations', description: 'Görev şablonları ve otomasyon kurallarını yönetme' },

    // Integration hub
    { action: 'view', resource: 'integrations', description: 'Entegrasyon bağlantılarını ve kayıtlarını görüntüleme' },
    { action: 'manage', resource: 'integrations', description: 'Entegrasyon, webhook ve API anahtarı yönetimi' },
];

export const DEFAULT_ROLES = [
    {
        name: 'Süper Yönetici',
        slug: 'super-admin',
        description: 'Tüm yetkilere ve sistem ayarlarına tam erişim.',
        isSystem: true,
        permissions: [{ action: '*', resource: '*' }],
    },
    {
        name: 'Yönetici (Admin)',
        slug: 'admin',
        description: 'Kullanıcı yetkileri dışındaki tüm operasyonel modüllere tam erişim.',
        isSystem: true,
        permissions: [
            { action: '*', resource: 'dashboard' },
            { action: '*', resource: 'entrepreneurs' },
            { action: '*', resource: 'mentors' },
            { action: '*', resource: 'programs' },
            { action: '*', resource: 'news' },
            { action: '*', resource: 'applications' },
            { action: '*', resource: 'forms' },
            { action: '*', resource: 'contacts' },
            { action: '*', resource: 'media' },
            { action: '*', resource: 'tasks' },
            { action: 'view', resource: 'teams' },
            { action: '*', resource: 'activities' },
            { action: '*', resource: 'projects' },
            { action: '*', resource: 'trainings' },
            { action: '*', resource: 'events' },
            { action: '*', resource: 'settings' },
            { action: '*', resource: 'menus' },
            { action: '*', resource: 'redirects' },
            { action: 'view', resource: 'audit_logs' },
            { action: 'view', resource: 'system_health' },
            { action: 'view', resource: 'persons' },
            { action: 'create', resource: 'persons' },
            { action: 'update', resource: 'persons' },
            { action: 'privacy_view', resource: 'persons' },
            { action: '*', resource: 'interactions' },
            { action: '*', resource: 'facilities' },
            { action: '*', resource: 'reservations' },
            { action: 'view', resource: 'documents' },
            { action: 'upload', resource: 'documents' },
            { action: 'view', resource: 'reports' },
            { action: 'create', resource: 'reports' },
            { action: 'export', resource: 'reports' },
            { action: 'view', resource: 'kvkk' },
            { action: 'edit', resource: 'cms' },
            { action: 'use', resource: 'ai' },
        ],
    },
    {
        name: 'Finans Sorumlusu',
        slug: 'finance-manager',
        description: 'Kira, sözleşme, tahakkuk, fatura ve tahsilat süreçlerini yönetme.',
        isSystem: true,
        permissions: [
            { action: 'view', resource: 'dashboard' },
            { action: '*', resource: 'finance' },
            { action: '*', resource: 'rent' },
            { action: '*', resource: 'invoice' },
            { action: '*', resource: 'finance_project' },
            { action: 'view', resource: 'entrepreneurs' },
            { action: 'view', resource: 'persons' },
            { action: 'view', resource: 'facilities' },
            { action: 'view', resource: 'documents' },
            { action: 'upload', resource: 'documents' },
            { action: 'view', resource: 'reports' },
            { action: 'export', resource: 'reports' },
            { action: 'use', resource: 'ai' },
        ],
    },
    {
        name: 'İçerik Editörü',
        slug: 'content-editor',
        description: 'Haber, etkinlik, sayfa ve medya içeriklerini düzenleme ve yayınlama.',
        isSystem: true,
        permissions: [
            { action: 'view', resource: 'dashboard' },
            { action: '*', resource: 'news' },
            { action: '*', resource: 'media' },
            { action: 'edit', resource: 'cms' },
            { action: 'view', resource: 'menus' },
            { action: 'view', resource: 'facilities' },
            { action: 'use', resource: 'ai' },
            { action: 'view', resource: 'entrepreneurs' },
            { action: 'view', resource: 'mentors' },
            { action: 'view', resource: 'programs' },
            { action: 'view', resource: 'events' },
        ],
    },
    {
        name: 'Başvuru Yöneticisi',
        slug: 'application-manager',
        description: 'Girişimcilik ve program başvurularını inceleme, puanlama ve CRM yönetimi.',
        isSystem: true,
        permissions: [
            { action: 'view', resource: 'dashboard' },
            { action: '*', resource: 'applications' },
            { action: 'view', resource: 'forms' },
            { action: 'view', resource: 'programs' },
            { action: 'view', resource: 'contacts' },
            { action: 'export', resource: 'applications' },
        ],
    },
    {
        name: 'Mentör Yöneticisi',
        slug: 'mentor-manager',
        description: 'Mentör kadrosunu, başvuruları ve mentör eşleştirmelerini yönetme.',
        isSystem: true,
        permissions: [
            { action: 'view', resource: 'dashboard' },
            { action: '*', resource: 'mentors' },
            { action: 'view', resource: 'programs' },
            { action: 'view', resource: 'media' },
            { action: 'upload', resource: 'media' },
        ],
    },
    {
        name: 'Program Yöneticisi',
        slug: 'program-manager',
        description: 'Kuluçka/Hızlandırma programlarını, eğitim müfredatını ve kohortları yönetme.',
        isSystem: true,
        permissions: [
            { action: 'view', resource: 'dashboard' },
            { action: '*', resource: 'programs' },
            { action: '*', resource: 'trainings' },
            { action: 'view', resource: 'applications' },
            { action: 'view', resource: 'mentors' },
            { action: 'view', resource: 'entrepreneurs' },
        ],
    },
    {
        name: 'Etkinlik Sorumlusu',
        slug: 'event-manager',
        description: 'Etkinlikleri, oturumları, konuşmacıları ve bilet kayıtlarını yönetme.',
        isSystem: true,
        permissions: [
            { action: 'view', resource: 'dashboard' },
            { action: '*', resource: 'events' },
            { action: 'view', resource: 'media' },
            { action: 'upload', resource: 'media' },
        ],
    },
    {
        name: 'Proje Yöneticisi',
        slug: 'project-manager',
        description: 'KOSGEB, TÜBİTAK ve AB fonlu kurumsal projeleri, bütçeleri ve kilometre taşlarını yönetme.',
        isSystem: true,
        permissions: [
            { action: 'view', resource: 'dashboard' },
            { action: '*', resource: 'projects' },
            { action: '*', resource: 'activities' },
            { action: 'view', resource: 'tasks' },
        ],
    },
    {
        name: 'Sadece Görüntüleyici',
        slug: 'viewer',
        description: 'Sistemdeki verileri yalnızca okuma modunda inceleme yetkisi.',
        isSystem: true,
        permissions: [
            { action: 'view', resource: 'dashboard' },
            { action: 'view', resource: 'entrepreneurs' },
            { action: 'view', resource: 'mentors' },
            { action: 'view', resource: 'programs' },
            { action: 'view', resource: 'news' },
            { action: 'view', resource: 'applications' },
            { action: 'view', resource: 'contacts' },
            { action: 'view', resource: 'media' },
            { action: 'view', resource: 'facilities' },
            { action: 'view', resource: 'reservations' },
            { action: 'view', resource: 'reports' },
            { action: 'view', resource: 'tasks' },
        ],
    },
];
