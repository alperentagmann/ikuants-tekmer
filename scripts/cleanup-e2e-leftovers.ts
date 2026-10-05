/**
 * Removes records left behind by e2e runs that failed before their own cleanup
 * (finance-reporting, project-finance, rent-management, e2e-real-scenarios).
 * Matches only the exact generated patterns (13-digit Date.now() suffix).
 * Dry run by default; pass --apply to delete.
 */
import { prisma } from '../lib/prisma';

const PROJECT_RE = /^(Finans Rapor Test Projesi|Test AR-GE Finans) \d{13}$/;
const PROJECT_SLUG_RE = /^(finans-rapor-test|test-ar-ge-finans)-\d{13}$/;
const RENT_RE = /^KIRA-TEST-\d{13}$/;
const USER_RE = /^admin_e2e_\d{13}@ikuants\.com$/;

async function main() {
    const apply = process.argv.includes('--apply');

    const projects = (await prisma.project.findMany({ select: { id: true, title: true, slug: true } }))
        .filter((p) => PROJECT_RE.test(p.title) || PROJECT_SLUG_RE.test(p.slug));
    const contracts = (await prisma.rentContract.findMany({ select: { id: true, contractNo: true } }))
        .filter((c) => RENT_RE.test(c.contractNo || ''));
    const users = (await prisma.user.findMany({ select: { id: true, email: true } }))
        .filter((u) => USER_RE.test(u.email));

    console.log('projects:', projects.map((p) => p.title));
    console.log('rent contracts:', contracts.map((c) => c.contractNo));
    console.log('users:', users.map((u) => u.email));
    if (!apply) return console.log('Dry run. Re-run with --apply to delete exactly these rows.');

    const projectIds = projects.map((p) => p.id);
    const contractIds = contracts.map((c) => c.id);
    await prisma.$transaction([
        prisma.invoiceRecord.deleteMany({ where: { projectId: { in: projectIds } } }),
        prisma.projectExpense.deleteMany({ where: { projectId: { in: projectIds } } }),
        prisma.projectBudgetLine.deleteMany({ where: { projectId: { in: projectIds } } }),
        prisma.fundingReceipt.deleteMany({ where: { fundingSource: { projectId: { in: projectIds } } } }),
        prisma.fundingSource.deleteMany({ where: { projectId: { in: projectIds } } }),
        prisma.project.deleteMany({ where: { id: { in: projectIds } } }),
        prisma.rentPayment.deleteMany({ where: { accrual: { contractId: { in: contractIds } } } }),
        prisma.rentAccrual.deleteMany({ where: { contractId: { in: contractIds } } }),
        prisma.rentContract.deleteMany({ where: { id: { in: contractIds } } }),
        prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } }),
    ]);
    console.log(`deleted projects=${projectIds.length} rentContracts=${contractIds.length} users=${users.length}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
