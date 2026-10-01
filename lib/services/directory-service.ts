import { prisma } from '@/lib/prisma';
import { PersonService, CreatePersonInput } from './person-service';
import { OrganizationService, CreateOrganizationInput } from './organization-service';

export const DirectoryService = {
    async getUnifiedDirectory(params: {
        tab?: 'people' | 'companies' | 'mentors' | 'stakeholders' | 'all';
        search?: string;
        type?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }) {
        const tab = params.tab || 'people';
        const search = params.search || '';

        if (tab === 'people') {
            const result = await PersonService.getPersons({
                search,
                status: params.status,
                limit: params.limit,
                offset: params.offset,
            });
            return {
                type: 'people',
                items: result.items,
                total: result.total,
            };
        }

        if (tab === 'companies') {
            const result = await OrganizationService.getOrganizations({
                search,
                orgType: params.type,
                status: params.status,
                limit: params.limit,
                offset: params.offset,
            });
            return {
                type: 'companies',
                items: result.items,
                total: result.total,
            };
        }

        if (tab === 'mentors') {
            const where: any = { isArchived: false };
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { surname: { contains: search, mode: 'insensitive' } },
                    { company: { contains: search, mode: 'insensitive' } },
                    { title: { contains: search, mode: 'insensitive' } },
                ];
            }
            const items = await prisma.mentor.findMany({
                where,
                include: {
                    person: true,
                    mentorPrograms: { include: { program: true } },
                    _count: { select: { mentorSessions: true } },
                },
                orderBy: { name: 'asc' },
                take: params.limit || 100,
                skip: params.offset || 0,
            });
            const total = await prisma.mentor.count({ where });
            return {
                type: 'mentors',
                items,
                total,
            };
        }

        if (tab === 'stakeholders') {
            const where: any = {};
            if (params.type) where.stakeholderType = params.type;
            const items = await prisma.stakeholderRelationship.findMany({
                where,
                include: {
                    person: true,
                    organization: true,
                },
                orderBy: { createdAt: 'desc' },
                take: params.limit || 100,
                skip: params.offset || 0,
            });
            const total = await prisma.stakeholderRelationship.count({ where });
            return {
                type: 'stakeholders',
                items,
                total,
            };
        }

        // Default overview stats
        const [peopleCount, companiesCount, mentorsCount, stakeholdersCount] = await Promise.all([
            prisma.person.count({ where: { status: 'ACTIVE' } }),
            prisma.organization.count({ where: { status: 'ACTIVE' } }),
            prisma.mentor.count({ where: { isArchived: false } }),
            prisma.stakeholderRelationship.count(),
        ]);

        return {
            type: 'overview',
            stats: {
                peopleCount,
                companiesCount,
                mentorsCount,
                stakeholdersCount,
            },
        };
    },

    async createPerson(input: CreatePersonInput, actor?: { id: string; name?: string }) {
        return PersonService.createPerson(input, actor);
    },

    async createOrganization(input: CreateOrganizationInput, actor?: { id: string; name?: string }) {
        return OrganizationService.createOrganization(input, actor);
    },

    async getContacts(filters?: any) {
        return PersonService.getPersons(filters);
    },

    async getOrganizations(filters?: any) {
        return OrganizationService.getOrganizations(filters);
    },

    async createContact(input: any, actor?: { id: string; name?: string }) {
        return PersonService.createPerson({
            firstName: input.fullName?.split(' ')[0] || input.firstName || 'Kişi',
            lastName: input.fullName?.split(' ').slice(1).join(' ') || input.lastName || '',
            email: input.email,
            phone: input.phone,
            title: input.title,
            linkedin: input.linkedin,
            notes: input.notes,
        }, actor);
    },
};
