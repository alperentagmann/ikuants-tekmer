import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreateTrainingInput {
    programId: string;
    title: string;
    slug: string;
    description?: string;
    objective?: string;
    moduleName?: string;
    weekNumber?: number;
    topics?: string[];
    format?: string; // PHYSICAL, ONLINE, HYBRID
    location?: string;
    onlineMeetingUrl?: string;
    startDate: string | Date;
    endDate?: string | Date;
    durationMinutes?: number;
    capacity?: number;
    materials?: Array<{ title: string; fileUrl: string; type: string }>;
    homework?: Array<{ title: string; desc: string; dueDate?: string }>;
    status?: string;
    instructorIds?: string[]; // Array of Mentor IDs
    externalInstructors?: Array<{ name: string; title?: string; organization?: string; avatarUrl?: string }>;
}

export const TrainingService = {
    async getTrainings(params: { programId?: string; status?: string; search?: string }) {
        const where: any = {};
        if (params.programId) where.programId = params.programId;
        if (params.status) where.status = params.status;
        if (params.search) {
            where.OR = [
                { title: { contains: params.search } },
                { moduleName: { contains: params.search } },
                { description: { contains: params.search } },
            ];
        }

        return prisma.training.findMany({
            where,
            include: {
                program: { select: { id: true, name: true, slug: true } },
                instructors: { include: { mentor: true } },
                sessions: { orderBy: { sessionOrder: 'asc' } },
                _count: { select: { enrollments: true, feedback: true } },
            },
            orderBy: [{ startDate: 'asc' }, { weekNumber: 'asc' }],
        });
    },

    async getTrainingById(id: string) {
        return prisma.training.findUnique({
            where: { id },
            include: {
                program: true,
                instructors: { include: { mentor: true } },
                sessions: {
                    include: {
                        attendance: {
                            include: { enrollment: true },
                        },
                    },
                    orderBy: { sessionOrder: 'asc' },
                },
                enrollments: {
                    include: {
                        attendance: true,
                        feedback: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
                feedback: {
                    include: { enrollment: true },
                },
            },
        });
    },

    async createTraining(input: CreateTrainingInput, actor?: { id: string; name?: string }) {
        const training = await prisma.training.create({
            data: {
                programId: input.programId,
                title: input.title,
                slug: input.slug,
                description: input.description,
                objective: input.objective,
                moduleName: input.moduleName,
                weekNumber: input.weekNumber ? Number(input.weekNumber) : null,
                topics: input.topics ? JSON.stringify(input.topics) : null,
                format: input.format || 'HYBRID',
                location: input.location,
                onlineMeetingUrl: input.onlineMeetingUrl,
                startDate: new Date(input.startDate),
                endDate: input.endDate ? new Date(input.endDate) : null,
                durationMinutes: input.durationMinutes ? Number(input.durationMinutes) : 120,
                capacity: input.capacity ? Number(input.capacity) : 30,
                materials: input.materials ? JSON.stringify(input.materials) : null,
                homework: input.homework ? JSON.stringify(input.homework) : null,
                status: input.status || 'SCHEDULED',
                // Create single default session
                sessions: {
                    create: {
                        sessionTitle: `${input.title} - Oturum 1`,
                        sessionOrder: 1,
                        startTime: new Date(input.startDate),
                        endTime: input.endDate ? new Date(input.endDate) : new Date(new Date(input.startDate).getTime() + 7200000),
                        roomOrUrl: input.location || input.onlineMeetingUrl,
                    },
                },
            },
        });

        // Link instructors
        if (input.instructorIds && input.instructorIds.length > 0) {
            for (const mId of input.instructorIds) {
                const mentor = await prisma.mentor.findUnique({ where: { id: mId } });
                if (mentor) {
                    await prisma.trainingInstructor.create({
                        data: {
                            trainingId: training.id,
                            mentorId: mentor.id,
                            name: `${mentor.name} ${mentor.surname}`,
                            title: mentor.title,
                            organization: mentor.company,
                            avatarUrl: mentor.imageUrl,
                            isLead: true,
                        },
                    });
                }
            }
        }

        if (input.externalInstructors && input.externalInstructors.length > 0) {
            for (const ext of input.externalInstructors) {
                await prisma.trainingInstructor.create({
                    data: {
                        trainingId: training.id,
                        name: ext.name,
                        title: ext.title,
                        organization: ext.organization,
                        avatarUrl: ext.avatarUrl,
                    },
                });
            }
        }

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'Training',
                entityId: training.id,
                diff: `Eğitim oluşturuldu: ${training.title}`,
            });
        }

        return training;
    },

    async recordAttendance(params: {
        sessionId: string;
        enrollmentId: string;
        isPresent: boolean;
        method?: string;
    }) {
        return prisma.trainingAttendance.upsert({
            where: {
                sessionId_enrollmentId: {
                    sessionId: params.sessionId,
                    enrollmentId: params.enrollmentId,
                },
            },
            update: {
                isPresent: params.isPresent,
                checkInTime: new Date(),
                method: params.method || 'MANUAL',
            },
            create: {
                sessionId: params.sessionId,
                enrollmentId: params.enrollmentId,
                isPresent: params.isPresent,
                method: params.method || 'MANUAL',
            },
        });
    },

    async enrollParticipant(trainingId: string, participant: {
        fullName: string;
        email: string;
        phone?: string;
        company?: string;
        role?: string;
    }) {
        return prisma.trainingEnrollment.create({
            data: {
                trainingId,
                fullName: participant.fullName,
                email: participant.email,
                phone: participant.phone,
                company: participant.company,
                role: participant.role,
            },
        });
    },
};
