import { prisma } from '@/lib/prisma';

export async function addTimelineEvent(params: {
    entityType: 'Application' | 'ContactRequest' | 'Mentor' | 'Entrepreneur';
    entityId: string;
    title: string;
    description?: string;
    eventType: 'STATUS_CHANGE' | 'NOTE_ADDED' | 'FILE_UPLOADED' | 'EMAIL_SENT' | 'EVALUATION_SCORED' | 'ASSIGNED' | 'RESTORED';
    actorId?: string | null;
    actorName?: string | null;
    metadata?: Record<string, any>;
}) {
    try {
        return await prisma.activityTimeline.create({
            data: {
                entityType: params.entityType,
                entityId: params.entityId,
                title: params.title,
                description: params.description,
                eventType: params.eventType,
                actorId: params.actorId,
                actorName: params.actorName,
                metadata: params.metadata ? JSON.stringify(params.metadata) : null,
            },
        });
    } catch (e) {
        console.error('Failed to add timeline event:', e);
        return null;
    }
}

export async function getTimelineEvents(entityType: string, entityId: string) {
    return prisma.activityTimeline.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
    });
}
