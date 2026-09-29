import { PrismaClient } from '@prisma/client';

async function testRemoteDatabase() {
    const customUrl = process.argv[2] || process.env.DATABASE_URL;

    console.log('=== VERİTABANI BAĞLANTI TEST ARACI ===\n');

    if (!customUrl) {
        console.error('❌ HATA: Test edilecek bir DATABASE_URL bulunamadı.');
        console.log('Kullanım: npx tsx scripts/test-remote-db.ts "postgresql://kullanici:sifre@host:port/db?sslmode=require"');
        process.exit(1);
    }

    const isLocal = customUrl.includes('localhost') || customUrl.includes('127.0.0.1');
    console.log(`📡 Hedef URL Türü: ${isLocal ? '⚠️ YEREL (Localhost)' : '🌐 BULUT (Managed PostgreSQL)'}`);

    // Mask secret in log
    const maskedUrl = customUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔗 Bağlantı: ${maskedUrl}\n`);

    const client = new PrismaClient({
        datasources: {
            db: { url: customUrl },
        },
    });

    try {
        console.log('⏳ Veritabanına bağlanılıyor...');
        await client.$connect();
        console.log('✅ BAĞLANTI BAŞARILI!');

        const userCount = await client.user.count();
        const entCount = await client.entrepreneur.count();
        const mentorCount = await client.mentor.count();

        console.log('\n📊 Veritabanı İstatistikleri:');
        console.log(`  - Kullanıcılar: ${userCount}`);
        console.log(`  - Girişimciler: ${entCount}`);
        console.log(`  - Mentörler: ${mentorCount}`);

        const superAdmin = await client.user.findUnique({ where: { email: 'bilgi@ikuantstekmer.com' } });
        console.log(`\n👑 Süper Yönetici (bilgi@ikuantstekmer.com): ${superAdmin ? (superAdmin.isActive ? '✅ AKTİF' : '❌ PASİF') : '⚠️ BULUNAMADI (Bootstrap Gerekli)'}`);

        console.log('\n========================================');
        console.log('🎉 Bu veritabanı Vercel üzerinde kullanıma UYGUNDUR!');
        console.log('========================================\n');
    } catch (error: any) {
        console.error('\n❌ BAĞLANTI BAŞARISIZ OLDU!');
        console.error('Hata Detayı:', error.message || error);
        console.log('\n💡 Olası Nedenler:');
        console.log('  1. Parola veya kullanıcı adı hatalı.');
        console.log('  2. Veritabanı sunucusu SSL gerektiriyor olabilir (?sslmode=require ekleyin).');
        console.log('  3. IP erişim kısıtlaması (Supabase/Neon için 0.0.0.0/0 izni verilmelidir).');
        process.exit(1);
    } finally {
        await client.$disconnect();
    }
}

testRemoteDatabase();
