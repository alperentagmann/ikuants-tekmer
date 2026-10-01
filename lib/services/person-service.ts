import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreatePersonInput {
    firstName: string;
    lastName: string;
    fullName?: string;
    title?: string;
    email?: string;
    secondaryEmail?: string;
    phone?: string;
    secondaryPhone?: string;
    linkedin?: string;
    avatarUrl?: string;
    city?: string;
    country?: string;
    notes?: string;
    tags?: string[];
    status?: string;
    userId?: string;
}

export interface UpdatePersonInput extends Partial<CreatePersonInput> {
    id: string;
}

export const PersonService = {
    async getPersons(params?: {
        search?: string;
        role?: string;
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

        if (params?.search) {
            where.OR = [
                { fullName: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
                { phone: { contains: params.search, mode: 'insensitive' } },
                { title: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        const items = await prisma.person.findMany({
            where,
            include: {
                memberships: {
                    include: {
                        organization: true,
                    },
                },
                mentors: true,
                founders: {
                    include: {
                        entrepreneur: true,
                    },
                },
                stakeholders: {
                    include: {
                        organization: true,
                    },
                },
                user: {
                    select: { id: true, email: true, name: true, isSuperAdmin: true },
                },
            },
            orderBy: { fullName: 'asc' },
            take: params?.limit || 100,
            skip: params?.offset || 0,
        });

        const total = await prisma.person.count({ where });

        return { items, total };
    },

    async getPersonById(id: string) {
        const person = await prisma.person.findUnique({
            where: { id },
            include: {
                memberships: {
                    include: {
                        organization: true,
                    },
                },
                mentors: {
                    include: {
                        mentorPrograms: {
                            include: { program: true },
                        },
                        mentorSessions: {
                            include: { entrepreneur: true },
                            orderBy: { sessionDate: 'desc' },
                        },
                    },
                },
                founders: {
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
                stakeholders: {
                    include: {
                        organization: true,
                    },
                },
                user: {
                    select: { id: true, email: true, name: true, isSuperAdmin: true, isActive: true },
                },
                assignedRentContracts: {
                    include: {
                        entrepreneur: true,
                    },
                },
            },
        });

        if (!person) return null;

        // Fetch recent interactions / meetings involving this person
        const interactions = await prisma.dailyInteraction.findMany({
            where: {
                OR: [
                    { contactName: { contains: person.fullName, mode: 'insensitive' } },
                    { email: person.email ? { equals: person.email, mode: 'insensitive' } : undefined },
                    { mentorId: person.mentors[0]?.id },
                ],
            },
            orderBy: { date: 'desc' },
            take: 20,
        });

        return {
            ...person,
            interactions,
        };
    },

    async findPotentialDuplicates(name: string, email?: string, phone?: string) {
        const checks: any[] = [];
        if (email && email.trim() !== '') {
            checks.push({ email: { equals: email.trim(), mode: 'insensitive' } });
        }
        if (phone && phone.trim() !== '') {
            checks.push({ phone: { contains: phone.trim().slice(-7) } });
        }
        if (name && name.trim().length >= 3) {
            checks.push({ fullName: { contains: name.trim(), mode: 'insensitive' } });
        }

        if (checks.length === 0) return [];

        return prisma.person.findMany({
            where: { OR: checks },
            include: {
                memberships: { include: { organization: true } },
                mentors: true,
            },
            take: 5,
        });
    },

    async createPerson(input: CreatePersonInput, actor?: { id: string; name?: string }) {
        const fullName = input.fullName || `${input.firstName} ${input.lastName}`.trim();
        
        const person = await prisma.person.create({
            data: {
                firstName: input.firstName,
                lastName: input.lastName,
                fullName,
                title: input.title,
                email: input.email,
                secondaryEmail: input.secondaryEmail,
                phone: input.phone,
                secondaryPhone: input.secondaryPhone,
                linkedin: input.linkedin,
                avatarUrl: input.avatarUrl,
                city: input.city,
                country: input.country || 'Türkiye',
                notes: input.notes,
                tags: input.tags ? JSON.stringify(input.tags) : null,
                status: input.status || 'ACTIVE',
                userId: input.userId,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'Person',
                entityId: person.id,
                diff: `Kişi rehberine eklendi: ${person.fullName}`,
            });
        }

        return person;
    },

    async updatePerson(input: UpdatePersonInput, actor?: { id: string; name?: string }) {
        const existing = await prisma.person.findUnique({ where: { id: input.id } });
        if (!existing) throw new Error('Kişi bulunamadı.');

        const fullName = input.fullName || 
            (input.firstName || input.lastName ? `${input.firstName || existing.firstName} ${input.lastName || existing.lastName}`.trim() : existing.fullName);

        const updated = await prisma.person.update({
            where: { id: input.id },
            data: {
                firstName: input.firstName ?? existing.firstName,
                lastName: input.lastName ?? existing.lastName,
                fullName,
                title: input.title !== undefined ? input.title : existing.title,
                email: input.email !== undefined ? input.email : existing.email,
                secondaryEmail: input.secondaryEmail !== undefined ? input.secondaryEmail : existing.secondaryEmail,
                phone: input.phone !== undefined ? input.phone : existing.phone,
                secondaryPhone: input.secondaryPhone !== undefined ? input.secondaryPhone : existing.secondaryPhone,
                linkedin: input.linkedin !== undefined ? input.linkedin : existing.linkedin,
                avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : existing.avatarUrl,
                city: input.city !== undefined ? input.city : existing.city,
                country: input.country !== undefined ? input.country : existing.country,
                notes: input.notes !== undefined ? input.notes : existing.notes,
                tags: input.tags ? JSON.stringify(input.tags) : existing.tags,
                status: input.status ?? existing.status,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'UPDATE',
                entityType: 'Person',
                entityId: updated.id,
                diff: `Kişi güncellendi: ${updated.fullName}`,
            });
        }

        return updated;
    },

    async deletePerson(id: string, actor?: { id: string; name?: string }) {
        const existing = await prisma.person.findUnique({ where: { id } });
        if (!existing) throw new Error('Kişi bulunamadı.');

        const archived = await prisma.person.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'DELETE',
                entityType: 'Person',
                entityId: id,
                diff: `Kişi arşivlendi: ${existing.fullName}`,
            });
        }

        return archived;
    },
};
