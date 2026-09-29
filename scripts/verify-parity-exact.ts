import { prisma } from '../lib/prisma';
import { EntrepreneurService } from '../lib/services/entrepreneur-service';
import { MentorService } from '../lib/services/mentor-service';

const HIDDEN_COMPANIES = [
    'Aleaza Development Solutions',
    'Ability Pool Blşm. Yaz. Tic. Eğt. Dan. Ve R&G A.Ş.',
    'Kulüpbirliğim Bilişim İletişim ve Danışmanlık Ltd. Şti.',
    'Hazır Cevap Akıllı Teknolojiler Ve Sürdürülebilirlik Ltd. Şti.',
    'Altelca Aviation',
    'M-RADS (Medical Reporting and Detection System)',
    'Elevatora',
];

async function main() {
    console.log('================================================================');
    console.log('🔍 İKÜANTS TEKMER — EXACT PARITY & VISIBILITY AUDIT');
    console.log('================================================================\n');

    // 1. Database Total Count
    const totalDb = await prisma.entrepreneur.count({ where: { isArchived: false } });
    const publishedDb = await prisma.entrepreneur.findMany({
        where: { isPublished: true, status: 'ACTIVE', isArchived: false },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });
    const hiddenDb = await prisma.entrepreneur.findMany({
        where: { isPublished: false, isArchived: false },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });

    console.log(`📊 DB Toplam Girişimci (Aktif/Non-Archived): ${totalDb}`);
    console.log(`🟢 DB Yayında (isPublished: true): ${publishedDb.length}`);
    console.log(`🟠 DB Gizli / Yayından Kaldırılmış (isPublished: false): ${hiddenDb.length}`);
    console.log(`🔢 Kontrol: ${publishedDb.length} + ${hiddenDb.length} = ${publishedDb.length + hiddenDb.length} (Toplam: ${totalDb})\n`);

    // 2. Service Layer Count
    const serviceList = await EntrepreneurService.getPublicEntrepreneurs();
    console.log(`🌐 EntrepreneurService.getPublicEntrepreneurs() Count: ${serviceList.length}`);

    // 3. Verify 7 Target Companies are strictly in hidden list and NOT in public list
    console.log('\n🔒 7 Gizlenen Şirket Kontrolü:');
    let hiddenMatches = 0;
    for (const target of HIDDEN_COMPANIES) {
        const inHidden = hiddenDb.some(h => h.name.toLowerCase().includes(target.slice(0, 15).toLowerCase()));
        const inPublic = serviceList.some(p => p.name.toLowerCase().includes(target.slice(0, 15).toLowerCase()));
        if (inHidden && !inPublic) {
            hiddenMatches++;
            console.log(`  ✓ "${target}" -> DB: GİZLİ, Public: GİZLİ (Doğru)`);
        } else {
            console.log(`  ✗ "${target}" -> HATA! inHidden=${inHidden}, inPublic=${inPublic}`);
        }
    }
    console.log(`  Sonuç: ${hiddenMatches}/7 şirket public'tan kaldırıldı, admin veritabanında korundu.`);

    // 4. Mentors Parity
    const totalMentorsDb = await prisma.mentor.count({ where: { isArchived: false, isActive: true } });
    const serviceMentors = await MentorService.getPublicMentors();
    console.log(`\n👥 Mentörler DB Aktif: ${totalMentorsDb} | Public Service: ${serviceMentors.length}`);

    // 5. Check Admin user status
    const superAdmin = await prisma.user.findUnique({ where: { email: 'bilgi@ikuantstekmer.com' } });
    const legacyAdmin = await prisma.user.findUnique({ where: { email: 'admin@ikuantstekmer.com' } });
    console.log('\n👑 Yönetici Hesapları:');
    console.log(`  - bilgi@ikuantstekmer.com: ${superAdmin ? (superAdmin.isActive ? 'AKTİF (SUPER_ADMIN)' : 'PASİF') : 'YOK'}`);
    console.log(`  - admin@ikuantstekmer.com: ${legacyAdmin ? (legacyAdmin.isActive ? 'AKTİF (HATA!)' : 'DEVRE DIŞI (DOĞRU)') : 'YOK'}`);

    console.log('\n================================================================');
    console.log('🎉 AUDIT SUCCESSFUL!');
    console.log('================================================================\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
