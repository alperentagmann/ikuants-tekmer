/**
 * İKÜANTS TEKMER — Super Admin & Database Management CLI
 * 
 * Usage:
 *   npx tsx scripts/manage-admin.ts status
 *   npx tsx scripts/manage-admin.ts create (Etkileşimli / Interactive Prompt)
 *   npx tsx scripts/manage-admin.ts create --email=admin@ikuantstekmer.com --name="Sistem Yöneticisi" --password="YourSecurePassword"
 *   npx tsx scripts/manage-admin.ts reset-password (Etkileşimli)
 *   npx tsx scripts/manage-admin.ts reset-password --email=admin@ikuantstekmer.com --password="NewSecurePassword"
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
    const prefix = `--${name}=`;
    const arg = process.argv.find((a) => a.startsWith(prefix));
    if (arg) return arg.slice(prefix.length).trim();
    const index = process.argv.indexOf(`--${name}`);
    if (index !== -1 && index + 1 < process.argv.length) {
        return process.argv[index + 1].trim();
    }
    return undefined;
}

async function checkStatus() {
    console.log('🔍 PostgreSQL Veritabanı ve Yönetici Hesapları Kontrol Ediliyor...\n');
    try {
        await prisma.$connect();
        console.log('✅ PostgreSQL Veritabanı bağlantısı başarılı!\n');

        const totalUsers = await prisma.user.count();
        const superAdmins = await prisma.user.findMany({
            where: { isSuperAdmin: true },
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true,
                lastLoginIp: true,
            },
        });

        console.log(`📊 Toplam Kullanıcı Sayısı: ${totalUsers}`);
        console.log(`👑 Süper Yönetici Sayısı: ${superAdmins.length}`);

        if (superAdmins.length === 0) {
            console.log('\n⚠️  VERİTABANINDA HİÇBİR SÜPER YÖNETİCİ HESABI BULUNAMADI.');
            console.log('💡 İlk yönetici hesabınızı oluşturmak için:');
            console.log('   npm run admin create\n');
        } else {
            console.log('\n📋 Mevcut Süper Yönetici Hesapları:');
            superAdmins.forEach((sa, i) => {
                console.log(`   [${i + 1}] E-posta: ${sa.email}`);
                console.log(`       Ad Soyad: ${sa.name}`);
                console.log(`       Durum: ${sa.isActive ? '✅ Aktif' : '❌ Pasif'}`);
                console.log(`       Oluşturulma: ${sa.createdAt.toISOString()}`);
                console.log(`       Son Giriş: ${sa.lastLoginAt ? sa.lastLoginAt.toISOString() : 'Henüz giriş yapılmadı'}`);
            });
            console.log('');
        }
    } catch (error: any) {
        console.error('❌ Veritabanı Bağlantı Hatası:', error.message || error);
        console.log('\n💡 PostgreSQL sunucunuzun çalıştığından ve .env içerisindeki DATABASE_URL değerinin doğru olduğundan emin olun.');
    }
}

async function createSuperAdmin() {
    let email = getArg('email') || process.env.ADMIN_EMAIL;
    let name = getArg('name') || process.env.ADMIN_NAME;
    let password = getArg('password') || process.env.ADMIN_PASSWORD;

    // Interactive prompt if missing
    if (!email || !name || !password) {
        console.log('\n🛡️  İKÜANTS TEKMER — Yeni Süper Yönetici Oluşturma Sihirbazı\n');
        const rl = readline.createInterface({ input, output });
        try {
            if (!email) {
                const enteredEmail = await rl.question('📧 E-posta Adresi [admin@ikuantstekmer.com]: ');
                email = enteredEmail.trim() || 'admin@ikuantstekmer.com';
            }
            if (!name) {
                const enteredName = await rl.question('👤 Ad Soyad [Sistem Yöneticisi]: ');
                name = enteredName.trim() || 'Sistem Yöneticisi';
            }
            if (!password) {
                password = await rl.question('🔑 Güvenli Parola (en az 6 karakter): ');
                password = password.trim();
            }
        } finally {
            rl.close();
        }
    }

    email = email.toLowerCase().trim();

    if (!password || password.length < 6) {
        console.error('❌ Hata: Parola en az 6 karakter uzunluğunda olmalıdır.');
        process.exit(1);
    }

    console.log(`\n⏳ Süper Yönetici hesabı oluşturuluyor (${email})...`);

    try {
        await prisma.$connect();
        const passwordHash = await bcrypt.hash(password, 12);

        // Ensure super-admin role exists
        const superAdminRole = await prisma.role.upsert({
            where: { slug: 'super-admin' },
            update: {},
            create: {
                name: 'Süper Yönetici',
                slug: 'super-admin',
                description: 'Tüm yetkilere tam erişim',
                isSystem: true,
            },
        });

        // Ensure *:* permission exists
        const allPerm = await prisma.permission.upsert({
            where: { action_resource: { action: '*', resource: '*' } },
            update: {},
            create: { action: '*', resource: '*', description: 'Tüm yetkiler' },
        });

        // Link role to permission
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: allPerm.id } },
            update: {},
            create: { roleId: superAdminRole.id, permissionId: allPerm.id },
        });

        // Upsert Super Admin User
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                name,
                passwordHash,
                isSuperAdmin: true,
                isActive: true,
            },
            create: {
                email,
                name,
                passwordHash,
                isSuperAdmin: true,
                isActive: true,
            },
        });

        // Assign role
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: superAdminRole.id } },
            update: {},
            create: { userId: user.id, roleId: superAdminRole.id },
        });

        console.log(`\n🎉 Süper Yönetici hesabı başarıyla oluşturuldu / güncellendi!`);
        console.log(`   E-Posta: ${user.email}`);
        console.log(`   Ad Soyad: ${user.name}`);
        console.log(`   Yetki:   👑 Süper Yönetici (Wildcard Tam Erişim)`);
        console.log(`   Durum:   ✅ Aktif`);
        console.log(`\n👉 Giriş Paneli: http://localhost:3000/admin/login\n`);
    } catch (error: any) {
        console.error('❌ Süper Yönetici oluşturulamadı:', error.message || error);
    }
}

async function resetPassword() {
    let email = getArg('email') || process.env.ADMIN_EMAIL;
    let password = getArg('password') || process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.log('\n🔑 İKÜANTS TEKMER — Parola Sıfırlama Sihirbazı\n');
        const rl = readline.createInterface({ input, output });
        try {
            if (!email) {
                email = await rl.question('📧 Parolası sıfırlanacak e-posta: ');
                email = email.trim();
            }
            if (!password) {
                password = await rl.question('🔑 Yeni Parola (en az 6 karakter): ');
                password = password.trim();
            }
        } finally {
            rl.close();
        }
    }

    email = (email || '').toLowerCase().trim();

    if (!email) {
        console.error('❌ Hata: E-posta adresi zorunludur.');
        process.exit(1);
    }

    if (!password || password.length < 6) {
        console.error('❌ Hata: Yeni parola en az 6 karakter uzunluğunda olmalıdır.');
        process.exit(1);
    }

    console.log(`\n⏳ Parola güncelleniyor (${email})...`);

    try {
        await prisma.$connect();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error(`❌ Hata: "${email}" e-posta adresine sahip kullanıcı bulunamadı.`);
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { email },
            data: {
                passwordHash,
                isActive: true,
            },
        });

        // Invalidate old sessions for security
        await prisma.session.deleteMany({
            where: { userId: user.id },
        });

        console.log(`\n🎉 ${email} için parola başarıyla güncellendi!`);
        console.log(`🔒 Güvenlik gereği kullanıcının önceki tüm açık oturumları sonlandırıldı.`);
        console.log(`👉 Giriş Paneli: http://localhost:3000/admin/login\n`);
    } catch (error: any) {
        console.error('❌ Parola sıfırlanamadı:', error.message || error);
    }
}

async function main() {
    const command = process.argv[2] || 'status';

    switch (command) {
        case 'status':
            await checkStatus();
            break;
        case 'create':
            await createSuperAdmin();
            break;
        case 'reset-password':
            await resetPassword();
            break;
        default:
            console.log(`Geçersiz komut "${command}". Kullanılabilir komutlar: status, create, reset-password`);
            break;
    }
}

main()
    .catch((err) => console.error(err))
    .finally(async () => {
        await prisma.$disconnect();
    });
