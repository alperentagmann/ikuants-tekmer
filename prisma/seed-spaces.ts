/**
 * Verified shared spaces of İKÜANTS TEKMER (create-only; never overwrites admin edits).
 *
 * Only verified facts are recorded: names, and the capacities of the three open
 * meeting tables (8, 8, 20). Descriptions and equipment come from the previous
 * public website content. Unknown capacity, floor, size, buffer and amenities stay
 * empty ("Bilgi girilmemiş") until an admin enters them.
 *
 *   npx tsx prisma/seed-spaces.ts
 */
import { prisma } from '../lib/prisma';
import { SpaceDomainService } from '../lib/services/space-domain-service';
import { MACHINE_SEEDS } from '../lib/machines';
import { VERIFIED_SPACES } from '../data/public-defaults';

export async function seedVerifiedSpaces() {
    let created = 0;
    for (const space of VERIFIED_SPACES) {
        const existing = await prisma.facility.findFirst({ where: { title: space.title } });
        if (existing) continue;
        await SpaceDomainService.createFacility({
            title: space.title,
            description: space.description,
            facilityType: space.type,
            features: {
                spaceCode: space.code,
                capacity: space.capacity,
                floor: null,
                squareMeters: null,
                equipment: space.equipment,
                amenities: null,
                status: 'AVAILABLE',
                reservationEnabled: true,
                publicVisible: true,
                approvalRequired: true,
            },
            isActive: true,
        });
        created++;
    }
    // Machine park: paid equipment, reserved like spaces, priced by quote until a tariff is set
    for (const m of MACHINE_SEEDS) {
        const existing = await prisma.facility.findFirst({ where: { title: m.title } });
        if (existing) continue;
        await SpaceDomainService.createFacility({
            title: m.title,
            description: m.description,
            facilityType: m.type,
            iconName: m.type === 'MACHINE_LASER' ? 'Zap' : m.type === 'MACHINE_SMT' ? 'Cpu' : 'Printer',
            features: {
                spaceCode: m.code,
                capacity: null,
                floor: null,
                squareMeters: null,
                equipment: m.machines.map((x) => x.name),
                amenities: null,
                status: 'AVAILABLE',
                reservationEnabled: true,
                publicVisible: true,
                approvalRequired: true,
                machines: m.machines,
                pricing: { model: 'QUOTE', hourlyRate: null, currency: 'TRY', note: null },
            },
            isActive: true,
        });
        created++;
    }
    console.log(`Ortak alanlar ve makineler: ${created} kayıt oluşturuldu (mevcutlar korundu).`);
    return created;
}

if (require.main === module) {
    seedVerifiedSpaces()
        .catch((error) => {
            console.error(error);
            process.exitCode = 1;
        })
        .finally(() => prisma.$disconnect());
}
