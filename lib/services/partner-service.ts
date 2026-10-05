import { prisma } from '@/lib/prisma';
import { PARTNER_DEFAULTS } from '@/data/public-defaults';
import { logAuditEvent } from '@/lib/audit';

export interface PartnerData {
    name: string;
    logoUrl: string;
    description?: string;
    websiteUrl?: string;
    linkedinUrl?: string;
    altText?: string;
    partnerGroup?: string; // STAKEHOLDER, SUPPORTER, SPONSOR, ECOSYSTEM
    sortOrder?: number;
    isActive?: boolean;
}

export const PartnerService = {
    async getPublicPartners(partnerGroup?: string) {
        try {
            const where: any = { isActive: true };
            if (partnerGroup) where.partnerGroup = partnerGroup.toUpperCase();

            return await prisma.partner.findMany({
                where,
                orderBy: { sortOrder: 'asc' },
            });
        } catch (error) {
            console.error('Error fetching public partners:', error);
            // Database unreachable: show the original website content instead of an empty page
            return PARTNER_DEFAULTS.filter((p) => !partnerGroup || p.partnerGroup === partnerGroup.toUpperCase()).map((p, i) => ({ id: `default-partner-${i}`, ...p, isActive: true }));
        }
    },

    async getAdminPartners() {
        return prisma.partner.findMany({
            orderBy: [{ partnerGroup: 'asc' }, { sortOrder: 'asc' }],
        });
    },

    async getPartnerById(id: string) {
        return prisma.partner.findUnique({ where: { id } });
    },

    async createPartner(data: PartnerData, actor?: any) {
        const partner = await prisma.partner.create({
            data: {
                name: data.name,
                logoUrl: data.logoUrl,
                description: data.description,
                websiteUrl: data.websiteUrl,
                linkedinUrl: data.linkedinUrl,
                altText: data.altText || data.name,
                partnerGroup: data.partnerGroup || 'STAKEHOLDER',
                sortOrder: data.sortOrder ?? 0,
                isActive: data.isActive ?? true,
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'CREATE',
            entityType: 'Partner',
            entityId: partner.id,
            newValues: partner,
        });

        return partner;
    },

    async updatePartner(id: string, data: Partial<PartnerData>, actor?: any) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...cleanData }: any = data;
        const oldPartner = await prisma.partner.findUnique({ where: { id } });
        const partner = await prisma.partner.update({
            where: { id },
            data: cleanData,
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'UPDATE',
            entityType: 'Partner',
            entityId: id,
            oldValues: oldPartner,
            newValues: partner,
        });

        return partner;
    },

    async deletePartner(id: string, actor?: any) {
        const oldPartner = await prisma.partner.findUnique({ where: { id } });
        const partner = await prisma.partner.delete({ where: { id } });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'DELETE',
            entityType: 'Partner',
            entityId: id,
            oldValues: oldPartner,
        });

        return partner;
    },

    async reorderPartners(orderedIds: string[], actor?: any) {
        const updates = orderedIds.map((id, index) =>
            prisma.partner.update({
                where: { id },
                data: { sortOrder: index },
            })
        );
        const result = await prisma.$transaction(updates);

        await logAuditEvent({
            actorId: actor?.id,
            action: 'REORDER',
            entityType: 'Partner',
            newValues: { orderedIds },
        });

        return result;
    }
};
