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

export function hasPermission(
    user: UserWithPermissions | null | undefined,
    action: string,
    resource: string
): boolean {
    if (!user || !user.isActive) return false;
    if (user.isSuperAdmin) return true; // Super admin has full bypass access

    // 1. Check direct user explicit overrides
    if (user.userPermissions) {
        const explicit = user.userPermissions.find(
            (up) =>
                (up.permission.action === action || up.permission.action === '*') &&
                (up.permission.resource === resource || up.permission.resource === '*')
        );
        if (explicit !== undefined) {
            return explicit.isGranted;
        }
    }

    // 2. Check role permissions
    if (user.userRoles) {
        for (const userRole of user.userRoles) {
            const match = userRole.role.permissions.some(
                (rp) =>
                    (rp.permission.action === action || rp.permission.action === '*') &&
                    (rp.permission.resource === resource || rp.permission.resource === '*')
            );
            if (match) return true;
        }
    }

    return false;
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
            { action: '*', resource: 'activities' },
            { action: '*', resource: 'projects' },
            { action: '*', resource: 'trainings' },
            { action: '*', resource: 'events' },
            { action: '*', resource: 'settings' },
            { action: '*', resource: 'menus' },
            { action: '*', resource: 'redirects' },
            { action: 'view', resource: 'audit_logs' },
            { action: 'view', resource: 'system_health' },
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
        ],
    },
];
