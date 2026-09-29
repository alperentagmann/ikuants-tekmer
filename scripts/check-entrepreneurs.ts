import { prisma } from '../lib/prisma';

async function main() {
    const list = await prisma.entrepreneur.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            isArchived: true,
        },
        orderBy: { name: 'asc' },
    });
    console.log(`Total Entrepreneurs in DB: ${list.length}`);
    list.forEach((e, idx) => {
        console.log(`${idx + 1}. [${e.id}] ${e.name} (status: ${e.status}, isArchived: ${e.isArchived})`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
