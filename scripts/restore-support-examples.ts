/**
 * Refills example scenarios of support items (Destekler) from the site's original texts.
 * - Only empty `exampleScenario` fields are filled (edited texts are never overwritten).
 * - Original items missing from the database are re-created (create-only).
 * Dry run by default; pass --apply to write.
 */
import { prisma } from '../lib/prisma';
import { logAuditEvent } from '../lib/audit';
import { SUPPORT_DEFAULTS } from '../data/support-defaults';

const apply = process.argv.includes('--apply');
const norm = (s: string) => s.toLocaleUpperCase('tr').replace(/\s+/g, ' ').trim();

async function main() {
    const existing = await prisma.support.findMany({ where: { isArchived: false } });
    let filled = 0;
    let created = 0;
    for (const [index, item] of SUPPORT_DEFAULTS.entries()) {
        const match = existing.find((s) => norm(s.title) === norm(item.title));
        if (match) {
            if (!match.exampleScenario?.trim()) {
                console.log(`${apply ? 'FILL' : '[dry] fill'} example: ${match.title}`);
                if (apply) {
                    await prisma.support.update({ where: { id: match.id }, data: { exampleScenario: item.exampleScenario, iconName: match.iconName || item.iconName, colorGradient: match.colorGradient || item.colorGradient } });
                    await logAuditEvent({ action: 'UPDATE', entityType: 'Support', entityId: match.id, diff: 'Örnek senaryo orijinal site metninden geri yüklendi' });
                }
                filled++;
            }
        } else {
            console.log(`${apply ? 'CREATE' : '[dry] create'} missing item: ${item.title}`);
            if (apply) {
                const s = await prisma.support.create({ data: { title: item.title, description: item.description, exampleScenario: item.exampleScenario, iconName: item.iconName, colorGradient: item.colorGradient, sortOrder: index, isActive: true } });
                await logAuditEvent({ action: 'CREATE', entityType: 'Support', entityId: s.id, diff: 'Eksik destek kalemi orijinal site metninden geri yüklendi' });
            }
            created++;
        }
    }
    console.log(`${apply ? 'Applied' : 'Dry run'}: ${filled} example filled, ${created} item created.`);
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
