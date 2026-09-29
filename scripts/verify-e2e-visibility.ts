import { prisma } from '../lib/prisma';
import { EntrepreneurService } from '../lib/services/entrepreneur-service';

const TARGET_COMPANIES = [
    'Aleaza Development Solutions',
    'Ability Pool Blşm. Yaz. Tic. Eğt. Dan. Ve R&G A.Ş.',
    'Kulüpbirliğim Bilişim İletişim ve Danışmanlık Ltd. Şti.',
    'Hazır Cevap Akıllı Teknolojiler Ve Sürdürülebilirlik Ltd. Şti.',
    'Altelca Aviation',
    'M-RADS (Medical Reporting and Detection System)',
    'Elevatora',
];

async function main() {
    console.log('=== VERIFYING ENTREPRENEUR VISIBILITY AUDIT ===');

    // 1. Check DB existence
    console.log('\n[1] Checking Database Records:');
    let dbCount = 0;
    for (const name of TARGET_COMPANIES) {
        const found = await prisma.entrepreneur.findFirst({
            where: { name: { contains: name.slice(0, 15), mode: 'insensitive' } },
        });
        if (found) {
            dbCount++;
            console.log(`  ✓ DB Record Found: "${found.name}" | isPublished: ${found.isPublished} | isArchived: ${found.isArchived}`);
        } else {
            console.log(`  ✗ DB Record NOT found: ${name}`);
        }
    }
    console.log(`  Result: ${dbCount}/7 target companies preserved in DB.`);

    // 2. Check Public API / Service
    console.log('\n[2] Checking Public Service / API Filter:');
    const publicList = await EntrepreneurService.getPublicEntrepreneurs();
    console.log(`  Total public entrepreneurs returned: ${publicList.length}`);
    const leaked = publicList.filter(p => TARGET_COMPANIES.some(t => p.name.toLowerCase().includes(t.slice(0, 15).toLowerCase())));
    if (leaked.length === 0) {
        console.log('  ✓ 0/7 target companies leaked in public feed (All 7 filtered out).');
    } else {
        console.log('  ✗ LEAKED in public:', leaked.map(l => l.name));
    }

    // 3. Check Admin API / Service
    console.log('\n[3] Checking Admin Service:');
    const adminList = await EntrepreneurService.getAdminEntrepreneurs({ limit: 100 });
    console.log(`  Total admin entrepreneurs returned: ${adminList.items.length}`);
    const adminFound = adminList.items.filter(p => TARGET_COMPANIES.some(t => p.name.toLowerCase().includes(t.slice(0, 15).toLowerCase())));
    console.log(`  ✓ ${adminFound.length}/7 target companies visible in admin.`);

    // 4. Check Audit Logs
    console.log('\n[4] Checking Audit Logs:');
    const logs = await prisma.auditLog.findMany({
        where: {
            entityType: 'Entrepreneur',
            diff: { contains: 'ENTREPRENEUR_PUBLIC_VISIBILITY_CHANGED' },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
    });
    console.log(`  Total visibility change audit logs recorded: ${logs.length}`);
    logs.slice(0, 3).forEach(l => console.log(`  - [${l.createdAt.toISOString()}] ${l.diff}`));

    console.log('\n=== VERIFICATION COMPLETE ===\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
