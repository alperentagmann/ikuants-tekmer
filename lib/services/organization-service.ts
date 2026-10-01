import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreateOrganizationInput {
    name: string;
    legalName?: string;
    sector?: string;
    orgType?: string; // COMPANY, UNIVERSITY, PUBLIC_INSTITUTION, INVESTOR, NGO, PARTNER, SUPPLIER, SPONSOR, TEKMER, OTHER
    taxNumber?: string;
    taxOffice?: string;
    mersisNo?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    logoUrl?: string;
    status?: string;
    tags?: string[];
    notes?: string;
}

export interface AddPersonnelInput {
    organizationId: string;
    personId: string;
    role?: string; // FOUNDER, CO_FOUNDER, CEO, CTO, EMPLOYEE, FINANCE_CONTACT, LEGAL_CONTACT, AUTHORIZED_PERSON, OTHER
    department?: string;
    position?: string;
    isPrimaryContact?: boolean;
    isFinanceContact?: boolean;
    isLegalContact?: boolean;
    isAuthorizedSignatory?: boolean;
}

export const OrganizationService = {
    async getOrganizations(params?: {
        search?: string;
        orgType?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};
        if (params?.status) {
            where.status = params.status;
        } else {
            where.status = { not: 'ARCHIVED' };
        }

        if (params?.orgType) {
            where.orgType = params.orgType;
        }

        if (params?.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { legalName: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
                { taxNumber: { contains: params.search, mode: 'insensitive' } },
                { sector: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        const items = await prisma.organization.findMany({
            where,
            include: {
                memberships: {
                    include: {
                        person: true,
                    },
                },
                entrepreneurs: {
                    include: {
                        entrepreneur: {
                            include: {
                                programAssignments: {
                                    include: { program: true },
                                },
                            },
                        },
                    },
                },
                rentContracts: {
                    where: { status: 'ACTIVE' },
                },
                _count: {
                    select: {
                        memberships: true,
                        entrepreneurs: true,
                        projects: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
            take: params?.limit || 100,
            skip: params?.offset || 0,
        });

        const total = await prisma.organization.count({ where });

        return { items, total };
    },

    async getOrganizationById(id: string) {
        const org = await prisma.organization.findUnique({
            where: { id },
            include: {
                memberships: {
                    include: {
                        person: true,
                    },
                    orderBy: { role: 'asc' },
                },
                entrepreneurs: {
                    include: {
                        entrepreneur: {
                            include: {
                                programAssignments: {
                                    include: { program: true },
                                },
                                rentContracts: true,
                            },
                        },
                    },
                },
                rentContracts: {
                    include: {
                        entrepreneur: true,
                        accruals: {
                            orderBy: [{ year: 'desc' }, { month: 'desc' }],
                            take: 12,
                        },
                    },
                },
                projects: {
                    include: {
                        creator: { select: { name: true } },
                    },
                },
                receivables: {
                    orderBy: { dueDate: 'desc' },
                },
                stakeholders: true,
            },
        });

        if (!org) return null;

        // Fetch interactions associated with this organization
        const interactions = await prisma.dailyInteraction.findMany({
            where: {
                OR: [
                    { organizationName: { equals: org.name, mode: 'insensitive' } },
                    { organizationName: org.legalName ? { equals: org.legalName, mode: 'insensitive' } : undefined },
                ],
            },
            orderBy: { date: 'desc' },
            take: 20,
        });

        return {
            ...org,
            interactions,
        };
    },

    async createOrganization(input: CreateOrganizationInput, actor?: { id: string; name?: string }) {
        const org = await prisma.organization.create({
            data: {
                name: input.name,
                legalName: input.legalName || input.name,
                sector: input.sector,
                orgType: input.orgType || 'COMPANY',
                taxNumber: input.taxNumber,
                taxOffice: input.taxOffice,
                mersisNo: input.mersisNo,
                website: input.website,
                email: input.email,
                phone: input.phone,
                address: input.address,
                city: input.city,
                country: input.country || 'Türkiye',
                logoUrl: input.logoUrl,
                status: input.status || 'ACTIVE',
                tags: input.tags ? JSON.stringify(input.tags) : null,
                notes: input.notes,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'Organization',
                entityId: org.id,
                diff: `Kurum / Şirket oluşturuldu: ${org.name}`,
            });
        }

        return org;
    },

    async updateOrganization(id: string, input: Partial<CreateOrganizationInput>, actor?: { id: string; name?: string }) {
        const existing = await prisma.organization.findUnique({ where: { id } });
        if (!existing) throw new Error('Kurum bulunamadı.');

        const updated = await prisma.organization.update({
            where: { id },
            data: {
                name: input.name ?? existing.name,
                legalName: input.legalName !== undefined ? input.legalName : existing.legalName,
                sector: input.sector !== undefined ? input.sector : existing.sector,
                orgType: input.orgType ?? existing.orgType,
                taxNumber: input.taxNumber !== undefined ? input.taxNumber : existing.taxNumber,
                taxOffice: input.taxOffice !== undefined ? input.taxOffice : existing.taxOffice,
                mersisNo: input.mersisNo !== undefined ? input.mersisNo : existing.mersisNo,
                website: input.website !== undefined ? input.website : existing.website,
                email: input.email !== undefined ? input.email : existing.email,
                phone: input.phone !== undefined ? input.phone : existing.phone,
                address: input.address !== undefined ? input.address : existing.address,
                city: input.city !== undefined ? input.city : existing.city,
                country: input.country !== undefined ? input.country : existing.country,
                logoUrl: input.logoUrl !== undefined ? input.logoUrl : existing.logoUrl,
                status: input.status ?? existing.status,
                tags: input.tags ? JSON.stringify(input.tags) : existing.tags,
                notes: input.notes !== undefined ? input.notes : existing.notes,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'UPDATE',
                entityType: 'Organization',
                entityId: updated.id,
                diff: `Kurum güncellendi: ${updated.name}`,
            });
        }

        return updated;
    },

    async addPersonnel(input: AddPersonnelInput, actor?: { id: string; name?: string }) {
        const existing = await prisma.personOrganizationMembership.findFirst({
            where: {
                organizationId: input.organizationId,
                personId: input.personId,
            },
        });

        let membership;
        if (existing) {
            membership = await prisma.personOrganizationMembership.update({
                where: { id: existing.id },
                data: {
                    role: input.role || existing.role,
                    department: input.department ?? existing.department,
                    position: input.position ?? existing.position,
                    isPrimaryContact: input.isPrimaryContact ?? existing.isPrimaryContact,
                    isFinanceContact: input.isFinanceContact ?? existing.isFinanceContact,
                    isLegalContact: input.isLegalContact ?? existing.isLegalContact,
                    isAuthorizedSignatory: input.isAuthorizedSignatory ?? existing.isAuthorizedSignatory,
                    status: 'ACTIVE',
                },
                include: { person: true, organization: true },
            });
        } else {
            membership = await prisma.personOrganizationMembership.create({
                data: {
                    organizationId: input.organizationId,
                    personId: input.personId,
                    role: input.role || 'EMPLOYEE',
                    department: input.department,
                    position: input.position,
                    isPrimaryContact: input.isPrimaryContact || false,
                    isFinanceContact: input.isFinanceContact || false,
                    isLegalContact: input.isLegalContact || false,
                    isAuthorizedSignatory: input.isAuthorizedSignatory || false,
                    status: 'ACTIVE',
                },
                include: { person: true, organization: true },
            });
        }

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'PersonOrganizationMembership',
                entityId: membership.id,
                diff: `${membership.organization.name} şirketine personel bağlandı: ${membership.person.fullName} (${membership.role})`,
            });
        }

        return membership;
    },

    async removePersonnel(membershipId: string, actor?: { id: string; name?: string }) {
        const membership = await prisma.personOrganizationMembership.findUnique({
            where: { id: membershipId },
            include: { person: true, organization: true },
        });
        if (!membership) throw new Error('Personel kaydı bulunamadı.');

        await prisma.personOrganizationMembership.delete({
            where: { id: membershipId },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'DELETE',
                entityType: 'PersonOrganizationMembership',
                entityId: membershipId,
                diff: `${membership.organization.name} şirketinden personel çıkarıldı: ${membership.person.fullName}`,
            });
        }

        return { success: true };
    },

    async linkEntrepreneur(organizationId: string, entrepreneurId: string, relationType = 'PRIMARY', actor?: { id: string; name?: string }) {
        const link = await prisma.entrepreneurOrganization.upsert({
            where: {
                entrepreneurId_organizationId: {
                    entrepreneurId,
                    organizationId,
                },
            },
            update: {
                relationType,
                isPrimary: relationType === 'PRIMARY',
                status: 'ACTIVE',
            },
            create: {
                entrepreneurId,
                organizationId,
                relationType,
                isPrimary: relationType === 'PRIMARY',
                status: 'ACTIVE',
            },
            include: { entrepreneur: true, organization: true },
        });

        await prisma.entrepreneur.update({
            where: { id: entrepreneurId },
            data: { companyStatus: 'INCORPORATED' },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'EntrepreneurOrganization',
                entityId: link.id,
                diff: `${link.entrepreneur.name} girişimi ${link.organization.name} şirketiyle bağlandı`,
            });
        }

        return link;
    },
};
