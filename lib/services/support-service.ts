import { prisma } from '@/lib/prisma';
import { SUPPORT_DEFAULTS } from '@/data/support-defaults';
import { logAuditEvent } from '@/lib/audit';
import { createRevision } from '@/lib/revision';

export interface SupportData {
    title: string;
    description: string;
    legalBasis?: string;
    exampleScenario?: string;
    iconName?: string;
    colorGradient?: string;
    sortOrder?: number;
    isActive?: boolean;
    ctaText?: string;
    ctaLink?: string;
    sourceUrl?: string;
}

export const SupportService = {
    async getPublicSupports() {
        try {
            return await prisma.support.findMany({
                where: { isActive: true, isArchived: false },
                orderBy: { sortOrder: 'asc' },
            });
        } catch (error) {
            console.error('Error fetching public supports:', error);
            // Database unreachable: show the original website content instead of an empty page
            return SUPPORT_DEFAULTS.map((s, i) => ({ ...s, id: `default-support-${s.id}`, legalBasis: null, ctaText: null, ctaLink: null, sourceUrl: null, sortOrder: i + 1, isActive: true, isArchived: false }));
        }
    },

    async getAdminSupports() {
        return prisma.support.findMany({
            where: { isArchived: false },
            orderBy: { sortOrder: 'asc' },
        });
    },

    async createSupport(data: SupportData, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const support = await prisma.support.create({
            data: {
                title: data.title,
                description: data.description,
                legalBasis: data.legalBasis,
                exampleScenario: data.exampleScenario,
                iconName: data.iconName,
                colorGradient: data.colorGradient,
                sortOrder: data.sortOrder ?? 0,
                isActive: data.isActive ?? true,
                ctaText: data.ctaText,
                ctaLink: data.ctaLink,
                sourceUrl: data.sourceUrl,
            },
        });

        // Revision
        await createRevision({
            entityType: 'Support',
            entityId: support.id,
            data: support,
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
            entityType: 'Support',
            entityId: support.id,
            newValues: support,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return support;
    },

    async updateSupport(id: string, data: Partial<SupportData>, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...cleanData }: any = data;
        const oldRecord = await prisma.support.findUnique({ where: { id } });
        if (!oldRecord) throw new Error('Support not found');

        const updated = await prisma.support.update({
            where: { id },
            data: cleanData,
        });

        // Revision
        await createRevision({
            entityType: 'Support',
            entityId: id,
            data: updated,
            changeSummary: 'Updated support details',
            authorId: actor?.id,
            authorName: actor?.name,
        });

        // Audit Log
        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'Support',
            entityId: id,
            oldValues: oldRecord,
            newValues: updated,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return updated;
    },

    async deleteSupport(id: string, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const record = await prisma.support.findUnique({ where: { id } });
        if (!record) throw new Error('Support not found');

        const archived = await prisma.support.update({
            where: { id },
            data: { isArchived: true, isActive: false },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'DELETE',
            entityType: 'Support',
            entityId: id,
            diff: `Archived support ${record.title}`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return archived;
    }
};
