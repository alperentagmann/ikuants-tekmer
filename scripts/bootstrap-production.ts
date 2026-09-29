import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SYSTEM_ROLES = [
    { name: 'SUPER_ADMIN', slug: 'super-admin', description: 'Tüm sistem üzerinde tam yetki', isSystem: true },
    { name: 'ADMIN', slug: 'admin', description: 'Operasyonel yönetim yetkisi', isSystem: true },
    { name: 'COORDINATOR', slug: 'coordinator', description: 'Kuluçka ve etkinlik koordinasyonu', isSystem: true },
    { name: 'EVALUATOR', slug: 'evaluator', description: 'Başvuru ve jüri puanlama yetkisi', isSystem: true },
    { name: 'MENTOR', slug: 'mentor', description: 'Girişimci mentörlük yönetimi', isSystem: true },
    { name: 'ENTREPRENEUR', slug: 'entrepreneur', description: 'Kendi şirket ve başvuru paneli', isSystem: true },
    { name: 'VIEWER', slug: 'viewer', description: 'Salt okunur rapor ve metrik erişimi', isSystem: true },
];

const MODULES = [
    'dashboard', 'applications', 'entrepreneurs', 'mentors', 'users', 'roles',
    'settings', 'audit_logs', 'terminology', 'custom_fields', 'pipelines',
    'email_templates', 'security', 'trainings', 'events', 'activities',
    'projects', 'tasks', 'calendar', 'directory', 'forms', 'news', 'supports',
    'menus', 'pages', 'media', 'revisions', 'system_health'
];

const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'publish', 'approve', 'view_sensitive'];

async function bootstrap() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log(`\n🚀 ${isDryRun ? '[DRY RUN] ' : ''}İKÜANTS TEKMER — Production Database Bootstrap Başlatılıyor...\n`);

    try {
        await prisma.$connect();
        console.log('✅ Veritabanı bağlantısı kuruldu.');

        // 1. System Roles
        console.log('\n[1] Sistem Rolleri Tanımlanıyor...');
        for (const r of SYSTEM_ROLES) {
            const existingRole = await prisma.role.findFirst({
                where: { OR: [{ name: r.name }, { slug: r.slug }] }
            });
            if (!existingRole) {
                if (!isDryRun) {
                    await prisma.role.create({ data: r });
                }
                console.log(`  + Rol oluşturuldu: ${r.name}`);
            } else {
                console.log(`  • Rol mevcut: ${existingRole.name}`);
            }
        }

        // 2. System Permissions
        console.log('\n[2] Sistem İzinleri (Permissions) Tanımlanıyor...');
        let permCount = 0;
        for (const mod of MODULES) {
            for (const act of ACTIONS) {
                const existingPerm = await prisma.permission.findFirst({
                    where: { resource: mod, action: act }
                });
                if (!existingPerm) {
                    if (!isDryRun) {
                        await prisma.permission.create({
                            data: {
                                resource: mod,
                                action: act,
                                description: `${mod} modülü için ${act} yetkisi`,
                            }
                        });
                    }
                    permCount++;
                }
            }
        }
        console.log(`  ✓ ${permCount} yeni izin eklendi / doğrulandı.`);

        // 3. Super Admin Account: bilgi@ikuantstekmer.com
        console.log('\n[3] Production Süper Yönetici Hesabı Yapılandırılıyor...');
        const superAdminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'bilgi@ikuantstekmer.com';
        const rawPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD || process.argv.find(a => a.startsWith('--password='))?.split('=')[1];
        
        if (!rawPassword && !isDryRun) {
            throw new Error('GÜVENLİK HATASI: BOOTSTRAP_ADMIN_PASSWORD ortam değişkeni veya --password parametresi belirtilmelidir.');
        }

        const passwordHash = rawPassword ? await bcrypt.hash(rawPassword, 12) : '';

        const existingAdmin = await prisma.user.findUnique({
            where: { email: superAdminEmail }
        });

        let superAdminId = '';
        if (!existingAdmin) {
            if (!isDryRun) {
                const created = await prisma.user.create({
                    data: {
                        email: superAdminEmail,
                        name: 'İKÜANTS TEKMER Genel Yönetici',
                        passwordHash,
                        isSuperAdmin: true,
                        isActive: true,
                    }
                });
                superAdminId = created.id;
            }
            console.log(`  ✅ Süper Yönetici hesabı OLUŞTURULDU: ${superAdminEmail}`);
        } else {
            if (!isDryRun) {
                const updated = await prisma.user.update({
                    where: { email: superAdminEmail },
                    data: {
                        isSuperAdmin: true,
                        isActive: true,
                        passwordHash, // Ensures password matches hash securely
                    }
                });
                superAdminId = updated.id;
            } else {
                superAdminId = existingAdmin.id;
            }
            console.log(`  ✅ Süper Yönetici hesabı GÜNCELLENDİ: ${superAdminEmail} (SUPER_ADMIN, ACTIVE)`);
        }

        // Assign SUPER_ADMIN role to user
        if (!isDryRun && superAdminId) {
            const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
            if (superAdminRole) {
                const existingUserRole = await prisma.userRole.findFirst({
                    where: { userId: superAdminId, roleId: superAdminRole.id }
                });
                if (!existingUserRole) {
                    await prisma.userRole.create({
                        data: { userId: superAdminId, roleId: superAdminRole.id }
                    });
                }
            }
        }

        // 4. Disable legacy admin@ikuantstekmer.com
        console.log('\n[4] Eski admin hesabı kontrol ediliyor...');
        const legacyAdmin = await prisma.user.findUnique({
            where: { email: 'admin@ikuantstekmer.com' }
        });
        if (legacyAdmin) {
            if (!isDryRun) {
                await prisma.user.update({
                    where: { email: 'admin@ikuantstekmer.com' },
                    data: { isActive: false }
                });
            }
            console.log('  🔒 admin@ikuantstekmer.com hesabı devre dışı bırakıldı (isActive: false - Audit verileri korundu).');
        } else {
            console.log('  • admin@ikuantstekmer.com veritabanında bulunamadı.');
        }

        // 5. Default Site Settings
        console.log('\n[5] Temel Site Ayarları (SiteSettings) Kontrol Ediliyor...');
        const defaultSettings = [
            { key: 'site_title', value: 'İKÜANTS TEKMER — Teknoloji Geliştirme Merkezi', group: 'general' },
            { key: 'site_email', value: 'bilgi@ikuantstekmer.com', group: 'general' },
            { key: 'site_phone', value: '(0212) 498 41 62', group: 'general' },
            { key: 'system_environment', value: 'production', group: 'system' },
            { key: 'is_maintenance_mode', value: 'false', group: 'system' },
        ];

        for (const setting of defaultSettings) {
            const existingSetting = await prisma.siteSetting.findUnique({ where: { key: setting.key } });
            if (!existingSetting) {
                if (!isDryRun) {
                    await prisma.siteSetting.create({ data: setting });
                }
                console.log(`  + Ayar oluşturuldu: ${setting.key}`);
            }
        }

        console.log('\n============================================================');
        console.log('🎉 Production Veritabanı Bootstrap İşlemi Başarıyla Tamamlandı!');
        console.log('============================================================\n');
    } catch (e: any) {
        console.error('❌ Bootstrap Sırasında Hata:', e.message || e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

bootstrap();
