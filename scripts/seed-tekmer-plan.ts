/**
 * TEKMER zemin kat planından (app/TEKMER-Model.pdf → public/plans/tekmer-zemin.png) bina, kat, 30 masa ve
 * 6 kapalı ofisi harita konumlarıyla oluşturur. Tekrar çalıştırmak güvenlidir: var olan bölüme dokunmaz,
 * yalnız boş harita konumunu doldurur. Konumlar Kat Haritası ekranında sürüklenerek düzeltilebilir.
 *
 *   npx tsx --env-file=.env scripts/seed-tekmer-plan.ts
 */
import { prisma } from '../lib/prisma';

const W = 1169, H = 1654; // planın 100 dpi görüntüsündeki piksel ölçüsü; konumlar yüzde olarak saklanır
const pct = (x: number, y: number) => ({ mapX: Math.round((x / W) * 10000) / 100, mapY: Math.round((y / H) * 10000) / 100 });

// Masa no → plandaki yaklaşık konum (px)
const DESKS: Record<number, [number, number]> = {
    15: [867, 1265], 16: [867, 1293], 13: [893, 1265], 14: [893, 1293], 12: [953, 1265], 11: [953, 1293], 10: [974, 1265], 9: [974, 1293],
    1: [872, 1420], 2: [872, 1450], 3: [893, 1420], 4: [893, 1450], 5: [952, 1420], 6: [952, 1450], 8: [973, 1420], 7: [973, 1450],
    23: [620, 1390], 24: [620, 1418], 21: [641, 1390], 22: [641, 1418], 19: [713, 1390], 20: [713, 1418], 17: [735, 1390], 18: [735, 1418],
    25: [630, 1498], 26: [648, 1497], 27: [710, 1515], 28: [708, 1535], 29: [726, 1553], 30: [745, 1533],
};
const OFFICES: { code: string; area: number; capacity: number | null; at: [number, number] }[] = [
    { code: 'ÇAPA OFİSİ', area: 23, capacity: null, at: [176, 1185] },
    { code: 'T-1', area: 17, capacity: null, at: [428, 1160] },
    { code: 'T-2', area: 17, capacity: null, at: [340, 1160] },
    { code: 'T-3', area: 17, capacity: null, at: [249, 1160] },
    { code: 'T-4', area: 35, capacity: 10, at: [612, 1255] },
    { code: 'T-5', area: 30, capacity: 8, at: [745, 1255] },
];

async function main() {
    const building = (await prisma.building.findFirst({ where: { name: 'İKÜANTS TEKMER', isArchived: false } }))
        ?? (await prisma.building.create({ data: { name: 'İKÜANTS TEKMER', notes: 'TEKMER-Model.pdf zemin kat planından oluşturuldu.' } }));
    const floor = (await prisma.floor.findFirst({ where: { buildingId: building.id, name: 'Zemin Kat', isArchived: false } }))
        ?? (await prisma.floor.create({ data: { buildingId: building.id, name: 'Zemin Kat', sortOrder: 0, planImageUrl: '/plans/tekmer-zemin.png' } }));
    if (!floor.planImageUrl) await prisma.floor.update({ where: { id: floor.id }, data: { planImageUrl: '/plans/tekmer-zemin.png' } });

    let created = 0, positioned = 0;
    const upsert = async (code: string, data: { unitType: string; area: number; capacity: number | null; notes?: string }, pos: { mapX: number; mapY: number }) => {
        const existing = await prisma.spaceUnit.findFirst({ where: { code: { equals: code, mode: 'insensitive' }, floor: { buildingId: building.id } } });
        if (!existing) {
            await prisma.spaceUnit.create({ data: { floorId: floor.id, code, ...data, maxTenants: 1, status: 'AVAILABLE', ...pos } });
            created++;
        } else if (existing.mapX === null || existing.mapY === null) {
            await prisma.spaceUnit.update({ where: { id: existing.id }, data: pos });
            positioned++;
        }
    };
    for (const [no, [x, y]] of Object.entries(DESKS)) {
        const n = Number(no);
        // Alan: plandaki 70 m² açık ofis alanlarının masa sayısına bölünmesi (sağ blok 16, sol blok 14 masa)
        const area = n <= 16 ? Math.round((70 / 16) * 100) / 100 : 5;
        await upsert(`MASA-${String(n).padStart(2, '0')}`, { unitType: 'DESK', area, capacity: 1, notes: 'Alan plandaki 70 m² açık ofisin masa sayısına bölünmesiyle hesaplandı; gerçek değerle düzeltin.' }, pct(x, y));
    }
    for (const o of OFFICES) await upsert(o.code, { unitType: 'OFFICE', area: o.area, capacity: o.capacity }, pct(o.at[0], o.at[1]));
    console.log(JSON.stringify({ building: building.name, floor: 'Zemin Kat', created, positioned }));
    await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
