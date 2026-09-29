import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreateContactInput {
    organizationId?: string;
    fullName: string;
    title?: string;
    email?: string;
    phone?: string;
    contactType?: string; // MENTOR, ENTREPRENEUR, INSTRUCTOR, ACADEMIC, INVESTOR, PARTNER, PUBLIC_REP
    linkedEntityId?: string;
    linkedin?: string;
    notes?: string;
    tags?: string[];
}

export const DirectoryService = {
    async getContacts(params: {
        contactType?: string;
        organizationId?: string;
        search?: string;
    }) {
        const where: any = {};
        if (params.contactType) where.contactType = params.contactType;
        if (params.organizationId) where.organizationId = params.organizationId;
        if (params.search) {
            where.OR = [
                { fullName: { contains: params.search } },
                { email: { contains: params.search } },
                { title: { contains: params.search } },
                { organization: { name: { contains: params.search } } },
            ];
        }

        return prisma.stakeholderContact.findMany({
            where,
            include: {
                organization: true,
            },
            orderBy: { fullName: 'asc' },
        });
    },

    async getOrganizations() {
        return prisma.organization.findMany({
            include: {
                _count: { select: { contacts: true } },
            },
            orderBy: { name: 'asc' },
        });
    },

    async createContact(input: CreateContactInput, actor?: { id: string; name?: string }) {
        const contact = await prisma.stakeholderContact.create({
            data: {
                organizationId: input.organizationId,
                fullName: input.fullName,
                title: input.title,
                email: input.email,
                phone: input.phone,
                contactType: input.contactType || 'PARTNER',
                linkedEntityId: input.linkedEntityId,
                linkedin: input.linkedin,
                notes: input.notes,
                tags: input.tags ? JSON.stringify(input.tags) : null,
            },
            include: {
                organization: true,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'StakeholderContact',
                entityId: contact.id,
                diff: `Paydaş rehberine kişi eklendi: ${contact.fullName}`,
            });
        }

        return contact;
    },

    async createOrganization(data: {
        name: string;
        sector?: string;
        orgType?: string;
        website?: string;
        email?: string;
        phone?: string;
        address?: string;
        notes?: string;
    }, actor?: { id: string; name?: string }) {
        const org = await prisma.organization.create({
            data: {
                name: data.name,
                sector: data.sector,
                orgType: data.orgType || 'COMPANY',
                website: data.website,
                email: data.email,
                phone: data.phone,
                address: data.address,
                notes: data.notes,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'Organization',
                entityId: org.id,
                diff: `Kurum oluşturuldu: ${org.name}`,
            });
        }

        return org;
    },
};
