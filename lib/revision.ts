import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function createRevision(params: {
    entityType: string;
    entityId: string;
    data: Record<string, any>;
    changeSummary?: string;
    authorId?: string | null;
    authorName?: string | null;
}) {
    try {
        // Find latest version number
        const latestRev = await prisma.revision.findFirst({
            where: {
                entityType: params.entityType,
                entityId: params.entityId,
            },
            orderBy: { version: 'desc' },
        });

        const nextVersion = (latestRev?.version ?? 0) + 1;

        const revision = await prisma.revision.create({
            data: {
                entityType: params.entityType,
                entityId: params.entityId,
                version: nextVersion,
                data: JSON.stringify(params.data),
                changeSummary: params.changeSummary || `Version ${nextVersion}`,
                authorId: params.authorId,
                authorName: params.authorName,
            },
        });

        return revision;
    } catch (error) {
        console.error('Revision creation failed:', error);
        return null;
    }
}

export async function getRevisions(entityType: string, entityId: string) {
    return prisma.revision.findMany({
        where: { entityType, entityId },
        orderBy: { version: 'desc' },
    });
}

export async function rollbackRevision(params: {
    entityType: string;
    entityId: string;
    targetVersion: number;
    authorId?: string | null;
    authorName?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}) {
    const revision = await prisma.revision.findUnique({
        where: {
            entityType_entityId_version: {
                entityType: params.entityType,
                entityId: params.entityId,
                version: params.targetVersion,
            },
        },
    });

    if (!revision) {
        throw new Error(`Revision ${params.targetVersion} not found`);
    }

    const snapshotData = JSON.parse(revision.data);

    // Apply rollback based on entityType
    let updatedRecord: any = null;

    if (params.entityType === 'Mentor') {
        const { id, createdAt, updatedAt, ...rest } = snapshotData;
        updatedRecord = await prisma.mentor.update({
            where: { id: params.entityId },
            data: rest,
        });
    } else if (params.entityType === 'Entrepreneur') {
        const { id, createdAt, updatedAt, ...rest } = snapshotData;
        updatedRecord = await prisma.entrepreneur.update({
            where: { id: params.entityId },
            data: rest,
        });
    } else if (params.entityType === 'News') {
        const { id, createdAt, updatedAt, ...rest } = snapshotData;
        updatedRecord = await prisma.news.update({
            where: { id: params.entityId },
            data: rest,
        });
    } else if (params.entityType === 'Program') {
        const { id, createdAt, updatedAt, ...rest } = snapshotData;
        updatedRecord = await prisma.program.update({
            where: { id: params.entityId },
            data: rest,
        });
    } else if (params.entityType === 'Support') {
        const { id, createdAt, updatedAt, ...rest } = snapshotData;
        updatedRecord = await prisma.support.update({
            where: { id: params.entityId },
            data: rest,
        });
    } else if (params.entityType === 'SiteSetting') {
        const { id, updatedAt, ...rest } = snapshotData;
        updatedRecord = await prisma.siteSetting.update({
            where: { id: params.entityId },
            data: rest,
        });
    }

    // Create a new revision representing the rollback
    await createRevision({
        entityType: params.entityType,
        entityId: params.entityId,
        data: snapshotData,
        changeSummary: `Rolled back to version ${params.targetVersion}`,
        authorId: params.authorId,
        authorName: params.authorName,
    });

    // Log audit event
    await logAuditEvent({
        actorId: params.authorId,
        actorName: params.authorName,
        action: 'RESTORE',
        entityType: params.entityType,
        entityId: params.entityId,
        diff: `Restored to Revision v${params.targetVersion}`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
    });

    return updatedRecord;
}
