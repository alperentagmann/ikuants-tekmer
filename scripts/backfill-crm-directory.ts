import { prisma } from '../lib/prisma';

export async function backfillCrmDirectory() {
    console.log('🔄 Starting CRM & Central Directory Backfill...');

    // 1. Backfill Mentors -> Person + Mentor.personId
    const mentors = await prisma.mentor.findMany();
    console.log(`Found ${mentors.length} mentors to evaluate for Person linkage.`);

    for (const mentor of mentors) {
        const fullName = `${mentor.name} ${mentor.surname}`.trim();
        const email = mentor.email || `mentor-${mentor.id.slice(0, 8)}@ikuantstekmer.com`;

        // Find or create Person
        let person = await prisma.person.findFirst({
            where: {
                OR: [
                    { email: mentor.email ? mentor.email : undefined },
                    { fullName },
                ],
            },
        });

        if (!person) {
            person = await prisma.person.create({
                data: {
                    firstName: mentor.name,
                    lastName: mentor.surname,
                    fullName,
                    title: mentor.title || 'Mentör',
                    email,
                    phone: mentor.phone,
                    linkedin: mentor.linkedin,
                    avatarUrl: mentor.imageUrl,
                    notes: mentor.notes,
                    tags: mentor.expertiseAreas,
                    status: mentor.isActive ? 'ACTIVE' : 'PASSIVE',
                },
            });
            console.log(`✅ Created Person for Mentor: ${fullName}`);
        }

        // Link Person to Mentor
        if (mentor.personId !== person.id) {
            await prisma.mentor.update({
                where: { id: mentor.id },
                data: { personId: person.id },
            });
        }

        // Check if mentor has a company and create Organization if needed
        if (mentor.company && mentor.company.trim() !== '') {
            let org = await prisma.organization.findFirst({
                where: { name: { equals: mentor.company.trim(), mode: 'insensitive' } },
            });
            if (!org) {
                org = await prisma.organization.create({
                    data: {
                        name: mentor.company.trim(),
                        orgType: 'COMPANY',
                        status: 'ACTIVE',
                    },
                });
            }

            // Ensure PersonOrganizationMembership exists
            const existingMembership = await prisma.personOrganizationMembership.findFirst({
                where: {
                    personId: person.id,
                    organizationId: org.id,
                },
            });

            if (!existingMembership) {
                await prisma.personOrganizationMembership.create({
                    data: {
                        personId: person.id,
                        organizationId: org.id,
                        role: 'EMPLOYEE',
                        position: mentor.title || 'Danışman / Mentör',
                        status: 'ACTIVE',
                    },
                });
            }
        }
    }

    // 2. Backfill Entrepreneur Founders -> Person + Founder.personId
    const founders = await prisma.entrepreneurFounder.findMany({
        include: { entrepreneur: true },
    });
    console.log(`Found ${founders.length} entrepreneur founders to evaluate.`);

    for (const founder of founders) {
        const parts = founder.fullName.trim().split(' ');
        const firstName = parts[0] || founder.fullName;
        const lastName = parts.slice(1).join(' ') || '';
        const email = founder.email || `founder-${founder.id.slice(0, 8)}@ikuantstekmer.com`;

        let person = await prisma.person.findFirst({
            where: {
                OR: [
                    { email: founder.email ? founder.email : undefined },
                    { fullName: founder.fullName.trim() },
                ],
            },
        });

        if (!person) {
            person = await prisma.person.create({
                data: {
                    firstName,
                    lastName,
                    fullName: founder.fullName.trim(),
                    title: founder.title || 'Kurucu Ortak',
                    email,
                    phone: founder.phone,
                    avatarUrl: founder.avatarUrl,
                    linkedin: founder.linkedin,
                    notes: founder.bio,
                    status: 'ACTIVE',
                },
            });
            console.log(`✅ Created Person for Founder: ${founder.fullName}`);
        }

        if (founder.personId !== person.id) {
            await prisma.entrepreneurFounder.update({
                where: { id: founder.id },
                data: { personId: person.id },
            });
        }
    }

    // 3. Backfill StakeholderContacts -> Person
    const stakeholderContacts = await prisma.stakeholderContact.findMany();
    console.log(`Found ${stakeholderContacts.length} stakeholder contacts.`);

    for (const sc of stakeholderContacts) {
        const parts = sc.fullName.trim().split(' ');
        const firstName = parts[0] || sc.fullName;
        const lastName = parts.slice(1).join(' ') || '';
        const email = sc.email || `stakeholder-${sc.id.slice(0, 8)}@ikuantstekmer.com`;

        let person = await prisma.person.findFirst({
            where: {
                OR: [
                    { email: sc.email ? sc.email : undefined },
                    { fullName: sc.fullName.trim() },
                ],
            },
        });

        if (!person) {
            person = await prisma.person.create({
                data: {
                    firstName,
                    lastName,
                    fullName: sc.fullName.trim(),
                    title: sc.title || 'Paydaş Temsilcisi',
                    email,
                    phone: sc.phone,
                    linkedin: sc.linkedin,
                    notes: sc.notes,
                    tags: sc.tags,
                    status: 'ACTIVE',
                },
            });
        }

        if (sc.organizationId) {
            const existingMembership = await prisma.personOrganizationMembership.findFirst({
                where: {
                    personId: person.id,
                    organizationId: sc.organizationId,
                },
            });
            if (!existingMembership) {
                await prisma.personOrganizationMembership.create({
                    data: {
                        personId: person.id,
                        organizationId: sc.organizationId,
                        role: sc.contactType === 'MENTOR' ? 'OTHER' : 'EMPLOYEE',
                        position: sc.title,
                        status: 'ACTIVE',
                    },
                });
            }
        }
    }

    // 4. Check Entrepreneur Organizations & Incorporation Status
    const entrepreneurs = await prisma.entrepreneur.findMany({
        include: { organizations: true },
    });

    for (const ent of entrepreneurs) {
        // If entrepreneur has a formal company name in notes or name contains A.Ş. or Ltd.
        const isCorp = ent.name.includes('A.Ş.') || ent.name.includes('Ltd.') || ent.name.includes('Ticaret') || ent.name.includes('Şirketi');
        if (isCorp && ent.organizations.length === 0) {
            let org = await prisma.organization.findFirst({
                where: { name: { equals: ent.name.trim(), mode: 'insensitive' } },
            });
            if (!org) {
                org = await prisma.organization.create({
                    data: {
                        name: ent.name.trim(),
                        legalName: ent.name.trim(),
                        sector: ent.sector,
                        orgType: 'COMPANY',
                        status: 'ACTIVE',
                    },
                });
            }
            await prisma.entrepreneurOrganization.create({
                data: {
                    entrepreneurId: ent.id,
                    organizationId: org.id,
                    relationType: 'PRIMARY',
                    isPrimary: true,
                },
            });
            await prisma.entrepreneur.update({
                where: { id: ent.id },
                data: { companyStatus: 'INCORPORATED' },
            });
        }
    }

    console.log('✨ CRM & Central Directory Backfill Completed Successfully!');
}

if (require.main === module) {
    backfillCrmDirectory()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
