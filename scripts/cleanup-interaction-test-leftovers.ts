/**
 * Removes Task / CorporateActivity rows left behind by older runs of
 * tests/e2e/daily-interaction.spec.ts (the test only deleted the interaction).
 * Matches the exact generated patterns only. Dry run by default; pass --apply to delete.
 */
import { prisma } from '../lib/prisma';

const TASK_RE = /^Takip: Yatirim ve Mentorluk Gorusmesi \(Ziyaretci \d{13}\)$/;
const ACTIVITY_DESC_RE = /^Katılımcılar: Ziyaretci \d{13} \(Test Holding \d{13}\)\n/;

async function main() {
    const apply = process.argv.includes('--apply');
    const tasks = (await prisma.task.findMany({ where: { title: { startsWith: 'Takip: Yatirim ve Mentorluk Gorusmesi (Ziyaretci ' } }, select: { id: true, title: true } })).filter((t) => TASK_RE.test(t.title));
    const activities = (await prisma.corporateActivity.findMany({ where: { title: 'Toplantı / Görüşme: Yatirim ve Mentorluk Gorusmesi' }, select: { id: true, description: true } })).filter((a) => ACTIVITY_DESC_RE.test(a.description || ''));
    // Interactions of runs that failed before their own cleanup
    const leftoverInteractions = (await prisma.dailyInteraction.findMany({ where: { subject: 'Yatirim ve Mentorluk Gorusmesi', contactName: { startsWith: 'Ziyaretci ' } }, select: { id: true, contactName: true, organizationName: true } }))
        .filter((i) => /^Ziyaretci \d{13}$/.test(i.contactName) && /^Test Holding \d{13}$/.test(i.organizationName || ''));
    const otherLinks = await prisma.dailyInteraction.count({ where: { id: { notIn: leftoverInteractions.map((i) => i.id) }, OR: [{ createdTaskId: { in: tasks.map((t) => t.id) } }, { createdActivityId: { in: activities.map((a) => a.id) } }] } });
    console.log(`tasks=${tasks.length} activities=${activities.length} testInteractions=${leftoverInteractions.length} linkedToOtherInteractions=${otherLinks}`);
    if (!apply) return console.log('Dry run. Re-run with --apply to delete exactly these rows.');
    if (otherLinks > 0) throw new Error('Some rows are linked to a non-test interaction; not deleting.');
    const i = await prisma.dailyInteraction.deleteMany({ where: { id: { in: leftoverInteractions.map((x) => x.id) } } });
    console.log(`deleted interactions=${i.count}`);
    const t = await prisma.task.deleteMany({ where: { id: { in: tasks.map((x) => x.id) } } });
    const a = await prisma.corporateActivity.deleteMany({ where: { id: { in: activities.map((x) => x.id) } } });
    console.log(`deleted tasks=${t.count} activities=${a.count}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
