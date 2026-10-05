import { prisma } from '@/lib/prisma';
import { SERVICE_DEFAULTS } from '@/data/public-defaults';
import { logAuditEvent } from '@/lib/audit';

export interface ServiceItemData {
    title: string;
    description: string;
    detailsJson?: string; // JSON array of detail strings
    highlight?: string;
    iconName?: string;
    colorGradient?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export const ServiceItemService = {
    async getPublicServices() {
        try {
            return await prisma.serviceItem.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
            });
        } catch (error) {
            console.error('Error fetching public services:', error);
            // Database unreachable: show the original website content instead of an empty page
            return SERVICE_DEFAULTS.map((s, i) => ({ id: `default-service-${i}`, ...s, isActive: true }));
        }
    },

    async getAdminServices() {
        return prisma.serviceItem.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    },

    async getServiceById(id: string) {
        return prisma.serviceItem.findUnique({ where: { id } });
    },

    async createService(data: ServiceItemData, actor?: any) {
        const service = await prisma.serviceItem.create({
            data: {
                title: data.title,
                description: data.description,
                detailsJson: data.detailsJson,
                highlight: data.highlight,
                iconName: data.iconName || 'Building2',
                colorGradient: data.colorGradient || 'from-purple-500 to-pink-500',
                ctaLabel: data.ctaLabel,
                ctaUrl: data.ctaUrl,
                sortOrder: data.sortOrder ?? 0,
                isActive: data.isActive ?? true,
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'CREATE',
            entityType: 'ServiceItem',
            entityId: service.id,
            newValues: service,
        });

        return service;
    },

    async updateService(id: string, data: Partial<ServiceItemData>, actor?: any) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...cleanData }: any = data;
        const oldService = await prisma.serviceItem.findUnique({ where: { id } });
        const service = await prisma.serviceItem.update({
            where: { id },
            data: cleanData,
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'UPDATE',
            entityType: 'ServiceItem',
            entityId: id,
            oldValues: oldService,
            newValues: service,
        });

        return service;
    },

    async deleteService(id: string, actor?: any) {
        const oldService = await prisma.serviceItem.findUnique({ where: { id } });
        const service = await prisma.serviceItem.delete({ where: { id } });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'DELETE',
            entityType: 'ServiceItem',
            entityId: id,
            oldValues: oldService,
        });

        return service;
    },

    async reorderServices(orderedIds: string[], actor?: any) {
        const updates = orderedIds.map((id, index) =>
            prisma.serviceItem.update({
                where: { id },
                data: { sortOrder: index },
            })
        );
        const result = await prisma.$transaction(updates);

        await logAuditEvent({
            actorId: actor?.id,
            action: 'REORDER',
            entityType: 'ServiceItem',
            newValues: { orderedIds },
        });

        return result;
    }
};
