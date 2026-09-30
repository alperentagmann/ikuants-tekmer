import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface LegislationData {
    title: string;
    description?: string;
    category?: string; // KANUN, YONETMELIK, KARARNAME, TEBLIG
    publishDate?: Date;
    externalUrl?: string;
    fileUrl?: string;
    fileName?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export const LegislationService = {
    async getPublicLegislations(category?: string) {
        try {
            const where: any = { isActive: true };
            if (category) where.category = category.toUpperCase();

            return await prisma.legislationDocument.findMany({
                where,
                orderBy: { sortOrder: 'asc' },
            });
        } catch (error) {
            console.error('Error fetching public legislations:', error);
            return [];
        }
    },

    async getAdminLegislations() {
        return prisma.legislationDocument.findMany({
            orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
        });
    },

    async getLegislationById(id: string) {
        return prisma.legislationDocument.findUnique({ where: { id } });
    },

    async createLegislation(data: LegislationData, actor?: any) {
        const item = await prisma.legislationDocument.create({
            data: {
                title: data.title,
                description: data.description,
                category: data.category || 'YONETMELIK',
                publishDate: data.publishDate,
                externalUrl: data.externalUrl,
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                sortOrder: data.sortOrder ?? 0,
                isActive: data.isActive ?? true,
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'CREATE',
            entityType: 'LegislationDocument',
            entityId: item.id,
            newValues: item,
        });

        return item;
    },

    async updateLegislation(id: string, data: Partial<LegislationData>, actor?: any) {
        const oldItem = await prisma.legislationDocument.findUnique({ where: { id } });
        const item = await prisma.legislationDocument.update({
            where: { id },
            data,
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'UPDATE',
            entityType: 'LegislationDocument',
            entityId: id,
            oldValues: oldItem,
            newValues: item,
        });

        return item;
    },

    async deleteLegislation(id: string, actor?: any) {
        const oldItem = await prisma.legislationDocument.findUnique({ where: { id } });
        const item = await prisma.legislationDocument.delete({ where: { id } });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'DELETE',
            entityType: 'LegislationDocument',
            entityId: id,
            oldValues: oldItem,
        });

        return item;
    },

    async reorderLegislations(orderedIds: string[], actor?: any) {
        const updates = orderedIds.map((id, index) =>
            prisma.legislationDocument.update({
                where: { id },
                data: { sortOrder: index },
            })
        );
        const result = await prisma.$transaction(updates);

        await logAuditEvent({
            actorId: actor?.id,
            action: 'REORDER',
            entityType: 'LegislationDocument',
            newValues: { orderedIds },
        });

        return result;
    }
};
