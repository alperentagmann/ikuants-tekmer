import { prisma } from '../lib/prisma';

async function test() {
    const p = await prisma.program.findFirst();
    console.log('Program test:', p?.name);
    await prisma.$disconnect();
}
test();
