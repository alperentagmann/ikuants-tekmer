import { prisma } from '../lib/prisma';
import { logAuditEvent } from '../lib/audit';

const TARGET_ENTREPRENEURS = [
    'Aleaza Development Solutions',
    'Ability Pool Blşm. Yaz. Tic. Eğt. Dan. Ve R&G A.Ş.',
    'Kulüpbirliğim Bilişim İletişim ve Danışmanlık Ltd. Şti.',
    'Hazır Cevap Akıllı Teknolojiler Ve Sürdürülebilirlik Ltd. Şti.',
    'Altelca Aviation',
    'M-RADS (Medical Reporting and Detection System)',
    'Elevatora',
];

async function main() {
    console.log('--- Unpublishing 7 specified entrepreneurs ---');

    // Find super admin for audit logging
    const superAdmin = await prisma.user.findFirst({
        where: { isSuperAdmin: true },
    });

    let updatedCount = 0;

    for (const name of TARGET_ENTREPRENEURS) {
        const ent = await prisma.entrepreneur.findFirst({
            where: { name: { contains: name, mode: 'insensitive' } },
        });

        if (ent) {
            await prisma.entrepreneur.update({
                where: { id: ent.id },
                data: { isPublished: false },
            });

            await logAuditEvent({
                actorId: superAdmin?.id,
                actorEmail: superAdmin?.email || 'system@ikuants.com',
                actorName: superAdmin?.name || 'Super Admin',
                action: 'UPDATE',
                entityType: 'Entrepreneur',
                entityId: ent.id,
                diff: `ENTREPRENEUR_PUBLIC_VISIBILITY_CHANGED: "${ent.name}" Old: VISIBLE -> New: HIDDEN`,
            });

            console.log(`[x] Unpublished: ${ent.name} (id: ${ent.id})`);
            updatedCount++;
        } else {
            console.log(`[!] Not found in DB: ${name}`);
        }
    }

    console.log(`Total unpublished: ${updatedCount} / ${TARGET_ENTREPRENEURS.length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
