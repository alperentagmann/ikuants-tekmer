import { prisma } from '../lib/prisma';
import { siteContent } from '../data/content';

async function main() {
    console.log('=== DATA AUDIT: DB VS STATIC ===');
    
    // 1. Users
    const users = await prisma.user.findMany();
    console.log(`Users in DB: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.email} | ${u.isSuperAdmin ? 'SUPER_ADMIN' : 'USER'} | active: ${u.isActive}`));

    // 2. Entrepreneurs
    const dbEntrepreneurs = await prisma.entrepreneur.findMany();
    console.log(`\nEntrepreneurs in DB: ${dbEntrepreneurs.length}`);
    const staticEnts = siteContent.entrepreneurs.list;
    console.log(`Static Entrepreneurs: ${staticEnts.length}`);

    // 3. Mentors
    const dbMentors = await prisma.mentor.findMany();
    console.log(`\nMentors in DB: ${dbMentors.length}`);
    dbMentors.forEach(m => console.log(`  - ${m.name} ${m.surname} (${m.company}) | active: ${m.isActive}`));

    console.log('================================');
}

main().catch(console.error).finally(() => prisma.$disconnect());
