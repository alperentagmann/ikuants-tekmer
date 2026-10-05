/**
 * Data integrity repair (idempotent, non-destructive).
 *
 *   npx tsx scripts/repair-data-integrity.ts            # dry run, prints what would change
 *   npx tsx scripts/repair-data-integrity.ts --apply    # applies the repairs
 *
 * Repairs:
 *  1. Resource projections are re-synchronized from their canonical Facility master
 *     (removes fake capacity defaults such as "10").
 *  2. Outbox e-mails that were marked SENT without any provider ("simulated-*" ids)
 *     are marked CANCELLED with an explanation. They are never re-sent automatically.
 *  3. T.C. Kimlik numbers stored as plaintext on applications are encrypted.
 *
 * Nothing is deleted.
 */
import { prisma } from '../lib/prisma';
import { SpaceDomainService, resolveVerifiedCapacity } from '../lib/services/space-domain-service';
import { encryptTcNumber, isLegacyPlaintextTc } from '../lib/security/identity-security';

const APPLY = process.argv.includes('--apply');

async function repairResourceProjections() {
    const facilities = await prisma.facility.findMany();
    const resources = await prisma.resource.findMany();
    const drift: string[] = [];

    for (const resource of resources) {
        const facility = facilities.find((f) => f.id === resource.id);
        if (!facility) continue;
        let features: Record<string, any> = {};
        try {
            features = facility.featuresJson ? JSON.parse(facility.featuresJson) : {};
        } catch {
            features = {};
        }
        const canonical = resolveVerifiedCapacity(facility.title, features.capacity);
        if (resource.capacity !== canonical) {
            drift.push(`${resource.name}: ${resource.capacity ?? 'NULL'} -> ${canonical ?? 'NULL'}`);
        }
    }

    console.log(`[1] Resource capacity drift: ${drift.length}`);
    drift.forEach((d) => console.log(`    - ${d}`));
    if (APPLY && drift.length > 0) {
        const result = await SpaceDomainService.reconcileFacilityResource();
        console.log(`    reconciled: ${result.reconciledCount}`);
    }
}

async function repairSimulatedEmails() {
    const simulated = await prisma.emailOutbox.count({
        where: { status: 'SENT', providerMessageId: { startsWith: 'simulated-' } },
    });
    console.log(`[2] E-mails marked SENT without a provider: ${simulated}`);
    if (APPLY && simulated > 0) {
        const updated = await prisma.emailOutbox.updateMany({
            where: { status: 'SENT', providerMessageId: { startsWith: 'simulated-' } },
            data: {
                status: 'CANCELLED',
                sentAt: null,
                errorMessage:
                    'Bu kayıt e-posta sağlayıcısı yokken "gönderildi" olarak işaretlenmişti; gerçek bir teslimat yapılmadı.',
            },
        });
        console.log(`    corrected: ${updated.count}`);
    }
}

async function encryptLegacyTcNumbers() {
    const applications = await prisma.application.findMany({
        where: { tcNumberEncrypted: { not: null } },
        select: { id: true, tcNumberEncrypted: true },
    });
    const legacy = applications.filter((a) => isLegacyPlaintextTc(a.tcNumberEncrypted));
    console.log(`[3] Applications with plaintext T.C. number: ${legacy.length}`);
    if (APPLY) {
        for (const app of legacy) {
            await prisma.application.update({
                where: { id: app.id },
                data: { tcNumberEncrypted: encryptTcNumber(app.tcNumberEncrypted) },
            });
        }
        if (legacy.length > 0) console.log(`    encrypted: ${legacy.length}`);
    }
}

async function main() {
    console.log(APPLY ? 'Mode: APPLY' : 'Mode: DRY RUN (use --apply to write changes)');
    await repairResourceProjections();
    await repairSimulatedEmails();
    await encryptLegacyTcNumbers();
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
