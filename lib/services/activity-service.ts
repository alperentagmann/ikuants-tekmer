import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreateActivityInput {
    categoryId: string;
    title: string;
    description?: string;
    activityDate: string | Date;
    endDate?: string | Date;
    location?: string;
    targetAudience?: string;
    participantCount?: number;
    status?: string;
    budgetAmount?: number;
    currency?: string;
    fundingSource?: string;
    outcomes?: string[];
    outputsJson?: Array<{ type: string; title: string; link?: string }>;
    programId?: string;
    entrepreneurId?: string;
    mentorId?: string;
    trainingId?: string;
    eventId?: string;
    createdById: string;
    evidenceFiles?: Array<{ title: string; fileUrl: string; fileType: string; description?: string }>;
    participants?: Array<{ fullName: string; organization?: string; role?: string; email?: string }>;
}

export const ActivityService = {
    async getCategories() {
        return prisma.activityCategory.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    },

    async getActivities(params: {
        categoryId?: string;
        programId?: string;
        startDate?: string | Date;
        endDate?: string | Date;
        search?: string;
    }) {
        const where: any = {};
        if (params.categoryId) where.categoryId = params.categoryId;
        if (params.programId) where.programId = params.programId;
        if (params.startDate || params.endDate) {
            where.activityDate = {};
            if (params.startDate) where.activityDate.gte = new Date(params.startDate);
            if (params.endDate) where.activityDate.lte = new Date(params.endDate);
        }
        if (params.search) {
            where.OR = [
                { title: { contains: params.search } },
                { description: { contains: params.search } },
                { location: { contains: params.search } },
            ];
        }

        return prisma.corporateActivity.findMany({
            where,
            include: {
                category: true,
                program: { select: { id: true, name: true, slug: true } },
                entrepreneur: { select: { id: true, name: true, slug: true } },
                mentor: { select: { id: true, name: true, surname: true } },
                _count: { select: { evidenceFiles: true, participants: true, tasks: true } },
            },
            orderBy: { activityDate: 'desc' },
        });
    },

    async getActivityById(id: string) {
        return prisma.corporateActivity.findUnique({
            where: { id },
            include: {
                category: true,
                program: true,
                entrepreneur: true,
                mentor: true,
                training: true,
                event: true,
                creator: { select: { id: true, name: true, email: true } },
                evidenceFiles: true,
                participants: true,
                tasks: true,
            },
        });
    },

    async createActivity(input: CreateActivityInput, actor?: { id: string; name?: string }) {
        const activity = await prisma.corporateActivity.create({
            data: {
                categoryId: input.categoryId,
                title: input.title,
                description: input.description,
                activityDate: new Date(input.activityDate),
                endDate: input.endDate ? new Date(input.endDate) : null,
                location: input.location,
                targetAudience: input.targetAudience,
                participantCount: input.participantCount ? Number(input.participantCount) : 0,
                status: input.status || 'COMPLETED',
                budgetAmount: input.budgetAmount ? Number(input.budgetAmount) : null,
                currency: input.currency || 'TRY',
                fundingSource: input.fundingSource,
                outcomes: input.outcomes ? JSON.stringify(input.outcomes) : null,
                outputsJson: input.outputsJson ? JSON.stringify(input.outputsJson) : null,
                programId: input.programId,
                entrepreneurId: input.entrepreneurId,
                mentorId: input.mentorId,
                trainingId: input.trainingId,
                eventId: input.eventId,
                createdById: input.createdById,
                evidenceFiles: input.evidenceFiles
                    ? {
                          create: input.evidenceFiles.map((ev) => ({
                              title: ev.title,
                              fileUrl: ev.fileUrl,
                              fileType: ev.fileType,
                              description: ev.description,
                          })),
                      }
                    : undefined,
                participants: input.participants
                    ? {
                          create: input.participants.map((p) => ({
                              fullName: p.fullName,
                              organization: p.organization,
                              role: p.role,
                              email: p.email,
                          })),
                      }
                    : undefined,
            },
            include: {
                category: true,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'CorporateActivity',
                entityId: activity.id,
                diff: `Kurumsal faaliyet oluşturuldu: ${activity.title}`,
            });
        }

        return activity;
    },

    async createFromTraining(trainingId: string, actor: { id: string; name?: string }) {
        const training = await prisma.training.findUnique({
            where: { id: trainingId },
            include: { program: true, enrollments: true },
        });
        if (!training) throw new Error('Eğitim bulunamadı');

        let category = await prisma.activityCategory.findUnique({ where: { slug: 'egitim' } });
        if (!category) {
            category = await prisma.activityCategory.create({
                data: { name: 'Eğitim & Atölye', slug: 'egitim', colorCode: '#6366f1' },
            });
        }

        return this.createActivity(
            {
                categoryId: category.id,
                title: `${training.program.name}: ${training.title}`,
                description: training.description || `${training.title} eğitimi gerçekleştirildi.`,
                activityDate: training.startDate,
                endDate: training.endDate || undefined,
                location: training.location || 'Online',
                participantCount: training.enrollments.length,
                programId: training.programId,
                trainingId: training.id,
                createdById: actor.id,
                outcomes: training.objective ? [training.objective] : [],
            },
            actor
        );
    },
};
