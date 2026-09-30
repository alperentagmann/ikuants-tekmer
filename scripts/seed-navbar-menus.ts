import { prisma } from '../lib/prisma';

async function main() {
    console.log('=== Navbar Menu Seed: Restoring full navigation ===');

    // Target menu structure matching the reference site (www.ikuantstekmer.com)
    const menuStructure = [
        { label: 'Ana Sayfa', url: '/', sortOrder: 1, children: [] },
        {
            label: 'Hakkımızda', url: '#', sortOrder: 2, children: [
                { label: 'Ekibimiz', url: '/ekibimiz', sortOrder: 1 },
                { label: 'Kurullarımız', url: '/kurullar', sortOrder: 2 },
                { label: 'İşbirliklerimiz', url: '/isbirliklerimiz', sortOrder: 3 },
                { label: 'Kullanım Alanları', url: '/kullanim-alanlari', sortOrder: 4 },
                { label: 'Hizmetlerimiz', url: '/hizmetlerimiz', sortOrder: 5 },
                { label: 'Mevzuat', url: '/mevzuat', sortOrder: 6 },
                { label: 'SSS', url: '/sss', sortOrder: 7 },
            ]
        },
        { label: 'Girişimciler', url: '/girisimciler', sortOrder: 3, children: [] },
        { label: 'Destekler', url: '/destekler', sortOrder: 4, children: [] },
        {
            label: 'Programlar', url: '/programlar', sortOrder: 5, children: [
                { label: 'Tüm Programlar', url: '/programlar', sortOrder: 1 },
                { label: 'ANTSFire Kuluçka', url: '/antsfire', sortOrder: 2 },
                { label: 'ANTSPARK Ön Kuluçka', url: '/antspark', sortOrder: 3 },
                { label: 'Glow Up Ideathon', url: '/glowup-basvuru', sortOrder: 4 },
                { label: 'Staj Programı', url: '/staj-programi', sortOrder: 5 },
            ]
        },
        { label: 'Haberler', url: '/haberler', sortOrder: 6, children: [] },
        { label: 'Mentörler', url: '/mentorler', sortOrder: 7, children: [] },
        { label: 'İletişim', url: '/iletisim', sortOrder: 8, children: [] },
    ];

    // Get existing header menu items
    const existing = await prisma.menuItem.findMany({
        where: { menuLocation: 'HEADER', parentId: null },
        include: { children: true },
        orderBy: { sortOrder: 'asc' },
    });
    console.log(`Existing header menu items: ${existing.length}`);
    existing.forEach(m => console.log(`  [${m.sortOrder}] ${m.label} (${m.children.length} children)`));

    // Build lookup by label for deduplication
    const existingByLabel = new Map(existing.map(m => [m.label.toLowerCase(), m]));

    let created = 0;
    let updated = 0;

    for (const item of menuStructure) {
        const existingItem = existingByLabel.get(item.label.toLowerCase());

        if (existingItem) {
            // Update sort order
            await prisma.menuItem.update({
                where: { id: existingItem.id },
                data: { sortOrder: item.sortOrder, url: item.url, isActive: true },
            });
            updated++;
            console.log(`  Updated: ${item.label} → sortOrder ${item.sortOrder}`);

            // Handle children
            if (item.children.length > 0) {
                const existingChildLabels = new Set(existingItem.children.map((c: any) => c.label.toLowerCase()));
                for (const child of item.children) {
                    if (!existingChildLabels.has(child.label.toLowerCase())) {
                        await prisma.menuItem.create({
                            data: {
                                menuLocation: 'HEADER',
                                parentId: existingItem.id,
                                label: child.label,
                                url: child.url,
                                sortOrder: child.sortOrder,
                                isActive: true,
                            },
                        });
                        console.log(`    Created child: ${child.label}`);
                        created++;
                    }
                }
            }
        } else {
            // Create new item
            const newItem = await prisma.menuItem.create({
                data: {
                    menuLocation: 'HEADER',
                    parentId: null,
                    label: item.label,
                    url: item.url,
                    sortOrder: item.sortOrder,
                    isActive: true,
                },
            });
            created++;
            console.log(`  Created: ${item.label}`);

            // Create children
            for (const child of item.children) {
                await prisma.menuItem.create({
                    data: {
                        menuLocation: 'HEADER',
                        parentId: newItem.id,
                        label: child.label,
                        url: child.url,
                        sortOrder: child.sortOrder,
                        isActive: true,
                    },
                });
                console.log(`    Created child: ${child.label}`);
                created++;
            }
        }
    }

    const finalCount = await prisma.menuItem.count({ where: { menuLocation: 'HEADER', parentId: null } });
    const allCount = await prisma.menuItem.count({ where: { menuLocation: 'HEADER' } });

    console.log(`\n=== RESULT ===`);
    console.log(`Items created: ${created}`);
    console.log(`Items updated: ${updated}`);
    console.log(`Total top-level HEADER menu items: ${finalCount}`);
    console.log(`Total HEADER menu items (incl. children): ${allCount}`);

    // Final list
    const final = await prisma.menuItem.findMany({
        where: { menuLocation: 'HEADER', parentId: null },
        include: { children: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
    });
    console.log('\nFinal menu structure:');
    final.forEach(m => {
        console.log(`  [${m.sortOrder}] ${m.label} → ${m.url}`);
        m.children.forEach((c: any) => console.log(`    └─ [${c.sortOrder}] ${c.label} → ${c.url}`));
    });

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
