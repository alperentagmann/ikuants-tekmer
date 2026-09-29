import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import crypto from 'crypto';

export interface CreateEventInput {
    title: string;
    slug: string;
    categoryId?: string;
    description?: string;
    agenda?: string;
    startDate: string | Date;
    endDate?: string | Date;
    location?: string;
    eventType?: string; // PHYSICAL, ONLINE, HYBRID
    mapUrl?: string;
    onlineMeetingUrl?: string;
    quota?: number;
    registrationLink?: string;
    coverImage?: string;
    gallery?: string[];
    files?: Array<{ title: string; fileUrl: string }>;
    eventManager?: string;
    partners?: string[];
    isFeatured?: boolean;
    sessions?: Array<{ title: string; description?: string; hallRoom?: string; startTime: string; endTime: string }>;
    speakers?: Array<{ name: string; title?: string; company?: string; avatarUrl?: string; bio?: string; linkedin?: string }>;
}

export const EventService = {
    async getEvents(params: { status?: string; categoryId?: string; search?: string }) {
        const where: any = { isArchived: false };
        if (params.status) where.status = params.status;
        if (params.categoryId) where.categoryId = params.categoryId;
        if (params.search) {
            where.OR = [
                { title: { contains: params.search } },
                { description: { contains: params.search } },
                { location: { contains: params.search } },
            ];
        }

        return prisma.event.findMany({
            where,
            include: {
                category: true,
                sessions: { orderBy: { startTime: 'asc' } },
                speakers: { orderBy: { sortOrder: 'asc' } },
                _count: { select: { registrations: true } },
            },
            orderBy: { startDate: 'desc' },
        });
    },

    async getEventById(id: string) {
        return prisma.event.findUnique({
            where: { id },
            include: {
                category: true,
                sessions: { orderBy: { startTime: 'asc' } },
                speakers: { orderBy: { sortOrder: 'asc' } },
                registrations: { orderBy: { createdAt: 'desc' } },
                tasks: true,
            },
        });
    },

    async createEvent(input: CreateEventInput, actor?: { id: string; name?: string }) {
        const event = await prisma.event.create({
            data: {
                title: input.title,
                slug: input.slug,
                categoryId: input.categoryId,
                description: input.description,
                agenda: input.agenda,
                startDate: new Date(input.startDate),
                endDate: input.endDate ? new Date(input.endDate) : null,
                location: input.location,
                eventType: input.eventType || 'PHYSICAL',
                mapUrl: input.mapUrl,
                onlineMeetingUrl: input.onlineMeetingUrl,
                quota: input.quota ? Number(input.quota) : null,
                registrationLink: input.registrationLink,
                coverImage: input.coverImage,
                gallery: input.gallery ? JSON.stringify(input.gallery) : null,
                files: input.files ? JSON.stringify(input.files) : null,
                eventManager: input.eventManager,
                partners: input.partners ? JSON.stringify(input.partners) : null,
                isFeatured: input.isFeatured || false,
                sessions: input.sessions
                    ? {
                          create: input.sessions.map((s, idx) => ({
                              title: s.title,
                              description: s.description,
                              hallRoom: s.hallRoom,
                              startTime: new Date(s.startTime),
                              endTime: new Date(s.endTime),
                              sortOrder: idx + 1,
                          })),
                      }
                    : undefined,
                speakers: input.speakers
                    ? {
                          create: input.speakers.map((spk, idx) => ({
                              name: spk.name,
                              title: spk.title,
                              company: spk.company,
                              avatarUrl: spk.avatarUrl,
                              bio: spk.bio,
                              linkedin: spk.linkedin,
                              sortOrder: idx,
                          })),
                      }
                    : undefined,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'Event',
                entityId: event.id,
                diff: `Etkinlik oluşturuldu: ${event.title}`,
            });
        }

        return event;
    },

    async registerAttendee(eventId: string, data: {
        fullName: string;
        email: string;
        phone?: string;
        company?: string;
        title?: string;
    }) {
        const qrCode = `IKU-EVT-${eventId.slice(0, 4)}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        return prisma.eventRegistration.create({
            data: {
                eventId,
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                company: data.company,
                title: data.title,
                qrCode,
                status: 'CONFIRMED',
            },
        });
    },

    async checkInAttendee(registrationId: string) {
        return prisma.eventRegistration.update({
            where: { id: registrationId },
            data: {
                status: 'CHECKED_IN',
                checkedInAt: new Date(),
            },
        });
    },
};
