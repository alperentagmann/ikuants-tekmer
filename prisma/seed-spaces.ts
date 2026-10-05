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

const VERIFIED_SPACES: { title: string; code: string; type: string; capacity: number | null; equipment: string | null; description: string }[] = [
    { title: 'Broadcasting Stüdyosu', code: 'STUDIO-01', type: 'STUDIO', capacity: null, equipment: 'Kamera sistemi, ses yalıtımı, canlı yayın altyapısı', description: 'Profesyonel yayın ve podcast kayıtları için tam donanımlı stüdyo. Yüksek kaliteli ses ve görüntü ekipmanları ile içerik üreticilerine hizmet vermektedir.' },
    { title: 'AR/VR Stüdyosu', code: 'STUDIO-02', type: 'STUDIO', capacity: null, equipment: "VR Headset'ler, motion capture, 3D modelleme istasyonları", description: "Artırılmış ve sanal gerçeklik projelerinin geliştirilmesi için özel donanımlı laboratuvar. VR headset'ler ve geliştirme araçları mevcuttur." },
    { title: 'Sanal Çekim Stüdyosu', code: 'STUDIO-03', type: 'STUDIO', capacity: null, equipment: 'Green screen, profesyonel aydınlatma, sanal set yazılımları', description: 'Green screen ve sanal set teknolojileri ile profesyonel video prodüksiyon imkanı sunan çekim stüdyosu.' },
    { title: 'Prototipleme Laboratuvarı', code: 'LAB-01', type: 'LAB', capacity: null, equipment: null, description: 'Prototip geliştirme çalışmaları için laboratuvar alanı.' },
    { title: 'Seminer Alanı', code: 'SEMINAR-01', type: 'SEMINAR_AREA', capacity: null, equipment: null, description: 'Seminer, eğitim ve sunumlar için kullanılan alan.' },
    { title: 'Kapalı Toplantı Odası', code: 'MEETING-01', type: 'MEETING_ROOM', capacity: null, equipment: null, description: 'Kapalı toplantı odası.' },
    { title: 'Açık Toplantı Masası 1 — 8 Kişilik', code: 'OPEN-TABLE-01', type: 'OPEN_MEETING_TABLE', capacity: 8, equipment: null, description: '8 kişilik açık toplantı masası.' },
    { title: 'Açık Toplantı Masası 2 — 8 Kişilik', code: 'OPEN-TABLE-02', type: 'OPEN_MEETING_TABLE', capacity: 8, equipment: null, description: '8 kişilik açık toplantı masası.' },
    { title: 'Açık Toplantı Masası — 20 Kişilik', code: 'OPEN-TABLE-03', type: 'OPEN_MEETING_TABLE', capacity: 20, equipment: null, description: '20 kişilik açık toplantı masası.' },
];

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
