import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface InteractionFilter {
    search?: string;
    interactionType?: string;
    status?: string;
    hostUserId?: string;
    entrepreneurId?: string;
    programId?: string;
    startDate?: Date;
    endDate?: Date;
    followUpPending?: boolean;
}

export class InteractionService {
    static async getInteractions(filters?: InteractionFilter) {
        const where: any = {};

        if (filters?.search) {
            where.OR = [
                { contactName: { contains: filters.search, mode: 'insensitive' } },
                { organizationName: { contains: filters.search, mode: 'insensitive' } },
                { subject: { contains: filters.search, mode: 'insensitive' } },
                { notes: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters?.interactionType && filters.interactionType !== 'ALL') {
            where.interactionType = filters.interactionType;
        }

        if (filters?.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }

        if (filters?.hostUserId) {
            where.hostUserId = filters.hostUserId;
        }

        if (filters?.entrepreneurId) {
            where.entrepreneurId = filters.entrepreneurId;
        }

        if (filters?.programId) {
            where.programId = filters.programId;
        }

        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = filters.startDate;
            if (filters.endDate) where.date.lte = filters.endDate;
        }

        if (filters?.followUpPending) {
            where.followUpDate = { not: null };
            where.status = { in: ['COMPLETED', 'FOLLOW_UP_NEEDED', 'IN_PROGRESS'] };
        }

        return prisma.dailyInteraction.findMany({
            where,
            include: {
                hostUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
                entrepreneur: { select: { id: true, name: true, logoUrl: true, sector: true } },
                mentor: { select: { id: true, name: true, surname: true, company: true } },
                program: { select: { id: true, name: true, slug: true } },
                project: { select: { id: true, title: true, code: true } },
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        });
    }

    static async getInteractionById(id: string) {
        return prisma.dailyInteraction.findUnique({
            where: { id },
            include: {
                hostUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
                entrepreneur: { select: { id: true, name: true, logoUrl: true, sector: true } },
                mentor: { select: { id: true, name: true, surname: true, company: true } },
                program: { select: { id: true, name: true, slug: true } },
                project: { select: { id: true, title: true, code: true } },
            },
        });
    }

    static async createInteraction(data: any, actorId?: string) {
        const contactName = data.contactName || data.personName;
        if (!contactName) {
            throw new Error('Kişi adı zorunludur');
        }

        const interaction = await prisma.dailyInteraction.create({
            data: {
                date: data.date ? new Date(data.date) : new Date(),
                startTime: data.startTime || null,
                endTime: data.endTime || null,
                interactionType: data.interactionType || data.type || 'MEETING',
                contactName: contactName,
                organizationName: data.organizationName || null,
                phone: data.phone || null,
                email: data.email || null,
                hostUserId: data.hostUserId || actorId || null,
                otherAttendees: data.otherAttendees || data.otherParticipants || null,
                subject: data.subject,
                notes: data.notes || data.meetingNotes || null,
                decisions: data.decisions || null,
                nextSteps: data.nextSteps || null,
                followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
                status: data.status || 'COMPLETED',
                tags: typeof data.tags === 'string' ? data.tags : data.tags ? JSON.stringify(data.tags) : null,
                attachments: typeof data.attachments === 'string' ? data.attachments : data.attachments ? JSON.stringify(data.attachments) : null,
                entrepreneurId: data.entrepreneurId || null,
                mentorId: data.mentorId || null,
                programId: data.programId || null,
                applicationId: data.applicationId || null,
                projectId: data.projectId || null,
                eventId: data.eventId || null,
                hasKvkkConsent: Boolean(data.hasKvkkConsent),
                kvkkConsentId: data.kvkkConsentId || null,
                createdById: actorId || null,
            },
            include: {
                hostUser: { select: { id: true, name: true } },
                entrepreneur: { select: { id: true, name: true } },
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'DailyInteraction',
            entityId: interaction.id,
            newValues: { subject: interaction.subject, contactName: interaction.contactName, type: interaction.interactionType },
        });

        return interaction;
    }

    static async updateInteraction(id: string, data: any, actorId?: string) {
        const existing = await prisma.dailyInteraction.findUnique({ where: { id } });
        if (!existing) throw new Error('Görüşme kaydı bulunamadı');

        const updated = await prisma.dailyInteraction.update({
            where: { id },
            data: {
                date: data.date !== undefined ? new Date(data.date) : undefined,
                startTime: data.startTime !== undefined ? data.startTime : undefined,
                endTime: data.endTime !== undefined ? data.endTime : undefined,
                interactionType: data.interactionType !== undefined ? data.interactionType : undefined,
                contactName: data.contactName !== undefined ? data.contactName : undefined,
                organizationName: data.organizationName !== undefined ? data.organizationName : undefined,
                phone: data.phone !== undefined ? data.phone : undefined,
                email: data.email !== undefined ? data.email : undefined,
                hostUserId: data.hostUserId !== undefined ? data.hostUserId : undefined,
                otherAttendees: data.otherAttendees !== undefined ? data.otherAttendees : undefined,
                subject: data.subject !== undefined ? data.subject : undefined,
                notes: data.notes !== undefined ? data.notes : undefined,
                decisions: data.decisions !== undefined ? data.decisions : undefined,
                nextSteps: data.nextSteps !== undefined ? data.nextSteps : undefined,
                followUpDate: data.followUpDate !== undefined ? (data.followUpDate ? new Date(data.followUpDate) : null) : undefined,
                status: data.status !== undefined ? data.status : undefined,
                tags: data.tags !== undefined ? (typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags)) : undefined,
                attachments: data.attachments !== undefined ? (typeof data.attachments === 'string' ? data.attachments : JSON.stringify(data.attachments)) : undefined,
                entrepreneurId: data.entrepreneurId !== undefined ? data.entrepreneurId : undefined,
                mentorId: data.mentorId !== undefined ? data.mentorId : undefined,
                programId: data.programId !== undefined ? data.programId : undefined,
                projectId: data.projectId !== undefined ? data.projectId : undefined,
                hasKvkkConsent: data.hasKvkkConsent !== undefined ? data.hasKvkkConsent : undefined,
            },
            include: {
                hostUser: { select: { id: true, name: true } },
                entrepreneur: { select: { id: true, name: true } },
            },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'DailyInteraction',
            entityId: id,
            oldValues: { subject: existing.subject, status: existing.status },
            newValues: { subject: updated.subject, status: updated.status },
        });

        return updated;
    }

    static async deleteInteraction(id: string, actorId?: string) {
        const existing = await prisma.dailyInteraction.findUnique({ where: { id } });
        if (!existing) throw new Error('Görüşme kaydı bulunamadı');

        await prisma.dailyInteraction.delete({ where: { id } });

        await logAuditEvent({
            actorId,
            action: 'DELETE',
            entityType: 'DailyInteraction',
            entityId: id,
            oldValues: { subject: existing.subject, contactName: existing.contactName },
        });

        return { success: true };
    }

    static async convertToTask(interactionId: string, taskData: any, actorId: string) {
        const interaction = await prisma.dailyInteraction.findUnique({ where: { id: interactionId } });
        if (!interaction) throw new Error('Görüşme kaydı bulunamadı');

        const task = await prisma.task.create({
            data: {
                title: taskData.title || `Takip: ${interaction.subject} (${interaction.contactName})`,
                description: taskData.description || `Görüşme Notları:\n${interaction.notes || '-'}\n\nSonraki Adımlar:\n${interaction.nextSteps || '-'}`,
                createdById: actorId,
                dueDate: taskData.dueDate ? new Date(taskData.dueDate) : interaction.followUpDate || null,
                priority: taskData.priority || 'HIGH',
                status: 'TODO',
                entrepreneurId: interaction.entrepreneurId || null,
                mentorId: interaction.mentorId || null,
                programId: interaction.programId || null,
            },
        });

        await prisma.dailyInteraction.update({
            where: { id: interactionId },
            data: { createdTaskId: task.id },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'Task',
            entityId: task.id,
            newValues: { convertedFromInteractionId: interactionId, title: task.title },
        });

        return task;
    }

    static async convertToActivity(interactionId: string, activityData: any, actorId: string) {
        const interaction = await prisma.dailyInteraction.findUnique({ where: { id: interactionId } });
        if (!interaction) throw new Error('Görüşme kaydı bulunamadı');

        let category = await prisma.activityCategory.findFirst();
        if (!category) {
            category = await prisma.activityCategory.create({
                data: {
                    name: 'Görüşme ve Ziyaretler',
                    slug: 'gorusme-ve-ziyaretler',
                    colorCode: '#06b6d4',
                },
            });
        }

        const activity = await prisma.corporateActivity.create({
            data: {
                categoryId: category.id,
                title: activityData.title || `Toplantı / Görüşme: ${interaction.subject}`,
                description: activityData.description || `Katılımcılar: ${interaction.contactName} (${interaction.organizationName || '-'})\nNotlar: ${interaction.notes || '-'}\nKararlar: ${interaction.decisions || '-'}`,
                activityDate: interaction.date,
                createdById: actorId,
                status: 'APPROVED',
                entrepreneurId: interaction.entrepreneurId || null,
                mentorId: interaction.mentorId || null,
                programId: interaction.programId || null,
            },
        });

        await prisma.dailyInteraction.update({
            where: { id: interactionId },
            data: { createdActivityId: activity.id },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'CorporateActivity',
            entityId: activity.id,
            newValues: { convertedFromInteractionId: interactionId, title: activity.title },
        });

        return activity;
    }

    static async getDailySummary(date: Date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const todayInteractions = await prisma.dailyInteraction.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
            },
            include: {
                hostUser: { select: { id: true, name: true } },
                entrepreneur: { select: { id: true, name: true, logoUrl: true } },
            },
            orderBy: { startTime: 'asc' },
        });

        const pendingFollowUps = await prisma.dailyInteraction.findMany({
            where: {
                followUpDate: { lte: endOfDay },
                status: { in: ['COMPLETED', 'FOLLOW_UP_NEEDED', 'IN_PROGRESS'] },
            },
            include: {
                hostUser: { select: { id: true, name: true } },
                entrepreneur: { select: { id: true, name: true } },
            },
            orderBy: { followUpDate: 'asc' },
            take: 10,
        });

        const visitorsCount = todayInteractions.filter(i => i.interactionType === 'VISIT').length;
        const meetingsCount = todayInteractions.filter(i => i.interactionType !== 'VISIT').length;

        return {
            date: startOfDay,
            todayInteractions,
            visitorsCount,
            meetingsCount,
            totalToday: todayInteractions.length,
            pendingFollowUps,
        };
    }

    static async getMonthlyAggregation(year: number, month: number) {
        const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        const interactions = await prisma.dailyInteraction.findMany({
            where: {
                date: { gte: startOfMonth, lte: endOfMonth },
            },
            select: {
                id: true,
                interactionType: true,
                organizationName: true,
                entrepreneurId: true,
                mentorId: true,
                followUpDate: true,
                status: true,
            },
        });

        const byType: Record<string, number> = {};
        const orgs = new Set<string>();
        let entrepreneurCount = 0;
        let mentorCount = 0;
        let followUpsCreated = 0;

        for (const item of interactions) {
            byType[item.interactionType] = (byType[item.interactionType] || 0) + 1;
            if (item.organizationName) orgs.add(item.organizationName);
            if (item.entrepreneurId) entrepreneurCount++;
            if (item.mentorId) mentorCount++;
            if (item.followUpDate) followUpsCreated++;
        }

        return {
            year,
            month,
            totalInteractions: interactions.length,
            byType,
            uniqueOrganizationsCount: orgs.size,
            entrepreneurInteractionsCount: entrepreneurCount,
            mentorInteractionsCount: mentorCount,
            followUpsCreatedCount: followUpsCreated,
        };
    }
}
