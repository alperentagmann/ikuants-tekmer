import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { syncRbacDefinitions } from '../lib/rbac-sync';
import { seedFormCenter } from '../prisma/seed-form-center';
import { seedVerifiedSpaces } from '../prisma/seed-spaces';
import { importLegacyNews } from './import-legacy-news';
import { seedEmailTemplates } from '../prisma/seed-email-templates';

const prisma = new PrismaClient();

async function bootstrap() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log(`\n🚀 ${isDryRun ? '[DRY RUN] ' : ''}İKÜANTS TEKMER — Production Database Bootstrap Başlatılıyor...\n`);

    try {
        await prisma.$connect();
        console.log('✅ Veritabanı bağlantısı kuruldu.');

        // 1-2. Permissions & default roles (additive; never removes admin customizations)
        console.log('\n[1] Yetki ve rol tanımları senkronize ediliyor...');
        const rbac = await syncRbacDefinitions(prisma, { dryRun: isDryRun });
        console.log(`  ✓ ${rbac.permissionsCreated} yeni izin, ${rbac.rolesCreated} yeni rol, ${rbac.linksCreated} yeni rol-izin bağlantısı.`);

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
            const superAdminRole = await prisma.role.findUnique({ where: { slug: 'super-admin' } });
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

        // 6. Form Center: KVKK texts, public business forms and application campaigns (create-only)
        console.log('\n[6] Form Merkezi başlangıç içeriği kontrol ediliyor...');
        if (!isDryRun) {
            await seedFormCenter();
            await seedVerifiedSpaces();
            await seedEmailTemplates(prisma);
            const news = await importLegacyNews(true);
            console.log(`  • Haberler: ${news.created.length} oluşturuldu, ${news.completed.length} tamamlandı, ${news.skippedEdited.length} düzenlenmiş kayıt korundu.`);
        } else {
            console.log('  • [DRY RUN] Form Merkezi seed atlandı.');
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
