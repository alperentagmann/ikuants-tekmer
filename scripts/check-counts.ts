import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function count() {
    console.log('BoardMembers:', await prisma.boardMember.count());
    console.log('TeamMembers:', await prisma.teamMember.count());
    console.log('Partners:', await prisma.partner.count());
    console.log('Facilities:', await prisma.facility.count());
    console.log('Services:', await prisma.serviceItem.count());
    console.log('Legislations:', await prisma.legislationDocument.count());
    console.log('FAQs:', await prisma.faqItem.count());
    console.log('Total Entrepreneurs:', await prisma.entrepreneur.count());
    console.log('Published Entrepreneurs:', await prisma.entrepreneur.count({ where: { isPublished: true, isArchived: false } }));
    console.log('Unpublished Entrepreneurs (7 hidden):', await prisma.entrepreneur.count({ where: { isPublished: false } }));
    console.log('Total Mentors:', await prisma.mentor.count());
    console.log('Active Mentors:', await prisma.mentor.count({ where: { isActive: true, isArchived: false } }));
    console.log('Programs:', await prisma.program.count());
    console.log('HeroSlides:', await prisma.heroSlide.count());
    console.log('Supports:', await prisma.support.count());
    await prisma.$disconnect();
}
count();
