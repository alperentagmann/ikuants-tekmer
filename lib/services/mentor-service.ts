import { prisma } from '@/lib/prisma';
import { MENTOR_DEFAULTS } from '@/data/public-defaults';
import { logAuditEvent } from '@/lib/audit';
import { createRevision } from '@/lib/revision';

export interface MentorData {
    name: string;
    surname: string;
    company: string;
    title: string;
    expertiseAreas?: string[];
    bio?: string;
    imageUrl?: string;
    linkedin?: string;
    email?: string;
    phone?: string;
    website?: string;
    mentorAreas?: string[];
    programIds?: string[];
    availability?: string;
    notes?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
}

export const MentorService = {
    async getPublicMentors() {
        try {
            const mentors = await prisma.mentor.findMany({
                where: { isActive: true, isArchived: false },
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    company: true,
                    title: true,
                    expertiseAreas: true,
                    bio: true,
                    imageUrl: true,
                    linkedin: true,
                    website: true,
                    mentorAreas: true,
                    isFeatured: true,
                    sortOrder: true,
                },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            });

            return mentors.map((m: any) => ({
                id: m.id,
                name: m.name,
                surname: m.surname,
                fullName: `${m.name} ${m.surname}`.trim(),
                company: m.company,
                title: m.title,
                bio: m.bio,
                imageUrl: m.imageUrl,
                linkedin: m.linkedin,
                website: m.website,
                isFeatured: m.isFeatured,
                expertiseAreas: m.expertiseAreas ? (typeof m.expertiseAreas === 'string' ? JSON.parse(m.expertiseAreas) : m.expertiseAreas) : [],
                mentorAreas: m.mentorAreas ? (typeof m.mentorAreas === 'string' ? JSON.parse(m.mentorAreas) : m.mentorAreas) : [],
            }));
        } catch (error) {
            console.error('Error fetching public mentors:', error);
            // Database unreachable: show the original website content instead of an empty page
            return MENTOR_DEFAULTS.map((m, i) => ({
                id: `default-mentor-${i}`,
                name: m.name,
                surname: m.surname,
                fullName: `${m.name} ${m.surname}`.trim(),
                company: m.company,
                title: m.title,
                bio: null,
                imageUrl: m.imageUrl,
                linkedin: m.linkedin,
                website: null,
                isFeatured: i < 6,
                expertiseAreas: [],
                mentorAreas: [],
            }));
        }
    },

    async getAdminMentors(params?: {
        search?: string;
        isActive?: boolean;
        isFeatured?: boolean;
        page?: number;
        limit?: number;
    }) {
        const { search, isActive, isFeatured, page = 1, limit = 50 } = params || {};
        const where: any = { isArchived: false };

        if (isActive !== undefined) where.isActive = isActive;
        if (isFeatured !== undefined) where.isFeatured = isFeatured;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { surname: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { expertiseAreas: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.mentor.findMany({
                where,
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.mentor.count({ where }),
        ]);

        return {
            items: items.map((m: any) => ({
                ...m,
                fullName: `${m.name} ${m.surname}`.trim(),
                expertiseAreas: m.expertiseAreas ? JSON.parse(m.expertiseAreas) : [],
                mentorAreas: m.mentorAreas ? JSON.parse(m.mentorAreas) : [],
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },

    async getMentorById(id: string, includeRelational = true) {
        const mentor = await prisma.mentor.findUnique({
            where: { id },
            include: includeRelational
                ? {
                      mentorPrograms: { include: { program: true } },
                      mentorSessions: {
                          include: { entrepreneur: true },
                          orderBy: { sessionDate: 'desc' },
                      },
                      trainings: { include: { training: true } },
                  }
                : undefined,
        });
        if (!mentor) return null;

        return {
            ...mentor,
            fullName: `${mentor.name} ${mentor.surname}`.trim(),
            expertiseAreas: mentor.expertiseAreas ? JSON.parse(mentor.expertiseAreas) : [],
            mentorAreas: mentor.mentorAreas ? JSON.parse(mentor.mentorAreas) : [],
            programIds: mentor.programIds ? JSON.parse(mentor.programIds) : [],
        };
    },

    async assignProgram(mentorId: string, programId: string, role = 'MENTOR') {
        return prisma.mentorProgram.upsert({
            where: { mentorId_programId: { mentorId, programId } },
            update: { role },
            create: { mentorId, programId, role },
        });
    },

    async recordSession(params: {
        mentorId: string;
        entrepreneurId?: string;
        sessionDate: Date | string;
        durationMinutes?: number;
        topic: string;
        notes?: string;
        meetingUrl?: string;
        feedbackRating?: number;
        feedbackText?: string;
    }) {
        const session = await prisma.mentorSession.create({
            data: {
                mentorId: params.mentorId,
                entrepreneurId: params.entrepreneurId || null,
                sessionDate: new Date(params.sessionDate),
                durationMinutes: params.durationMinutes || 60,
                topic: params.topic,
                notes: params.notes,
                meetingUrl: params.meetingUrl,
                feedbackRating: params.feedbackRating,
                feedbackText: params.feedbackText,
            },
        });

        // Increment total hours
        const hoursToAdd = (params.durationMinutes || 60) / 60;
        await prisma.mentor.update({
            where: { id: params.mentorId },
            data: { totalHours: { increment: hoursToAdd } },
        });

        return session;
    },

    async createMentor(data: MentorData, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const mentor = await prisma.mentor.create({
            data: {
                name: data.name,
                surname: data.surname,
                company: data.company,
                title: data.title,
                expertiseAreas: data.expertiseAreas ? JSON.stringify(data.expertiseAreas) : null,
                bio: data.bio,
                imageUrl: data.imageUrl,
                linkedin: data.linkedin,
                email: data.email,
                phone: data.phone,
                website: data.website,
                mentorAreas: data.mentorAreas ? JSON.stringify(data.mentorAreas) : null,
                programIds: data.programIds ? JSON.stringify(data.programIds) : null,
                availability: data.availability || 'AVAILABLE',
                notes: data.notes,
                isActive: data.isActive ?? true,
                isFeatured: data.isFeatured ?? false,
                sortOrder: data.sortOrder ?? 0,
            },
        });

        // Revision snapshot
        await createRevision({
            entityType: 'Mentor',
            entityId: mentor.id,
            data: mentor,
            changeSummary: 'Initial creation',
            authorId: actor?.id,
            authorName: actor?.name,
        });

        // Audit Log
        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'CREATE',
            entityType: 'Mentor',
            entityId: mentor.id,
            newValues: mentor,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return mentor;
    },

    async updateMentor(id: string, data: Partial<MentorData>, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const oldMentor = await prisma.mentor.findUnique({ where: { id } });
        if (!oldMentor) throw new Error('Mentor not found');

        const updatePayload: any = { ...data };
        if (data.expertiseAreas) updatePayload.expertiseAreas = JSON.stringify(data.expertiseAreas);
        if (data.mentorAreas) updatePayload.mentorAreas = JSON.stringify(data.mentorAreas);
        if (data.programIds) updatePayload.programIds = JSON.stringify(data.programIds);

        const updatedMentor = await prisma.mentor.update({
            where: { id },
            data: updatePayload,
        });

        // Revision snapshot
        await createRevision({
            entityType: 'Mentor',
            entityId: id,
            data: updatedMentor,
            changeSummary: 'Updated mentor details',
            authorId: actor?.id,
            authorName: actor?.name,
        });

        // Audit Log with field diff
        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'Mentor',
            entityId: id,
            oldValues: oldMentor,
            newValues: updatedMentor,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return updatedMentor;
    },

    async deleteMentor(id: string, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const mentor = await prisma.mentor.findUnique({ where: { id } });
        if (!mentor) throw new Error('Mentor not found');

        // Soft delete
        const archived = await prisma.mentor.update({
            where: { id },
            data: { isArchived: true, isActive: false },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'DELETE',
            entityType: 'Mentor',
            entityId: id,
            diff: `Archived mentor ${mentor.name} ${mentor.surname}`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return archived;
    },

    async reorderMentors(ids: string[], actor?: { id: string; name: string; email: string }) {
        for (let i = 0; i < ids.length; i++) {
            await prisma.mentor.update({
                where: { id: ids[i] },
                data: { sortOrder: i },
            });
        }
        await logAuditEvent({
            actorId: actor?.id,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'Mentor',
            diff: `Reordered ${ids.length} mentors`,
        });
    }
};
