import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface FacilityData {
    title: string;
    description: string;
    facilityType?: 'STUDIO' | 'WORK_AREA' | 'FEATURE';
    featuresJson?: string; // JSON array of features
    iconName?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export const FacilityService = {
    async getPublicFacilities(facilityType?: string) {
        try {
            const where: any = { isActive: true };
            if (facilityType) where.facilityType = facilityType.toUpperCase();

            return await prisma.facility.findMany({
                where,
                orderBy: { sortOrder: 'asc' },
            });
        } catch (error) {
            console.error('Error fetching public facilities:', error);
            return [];
        }
    },

    async getAdminFacilities(facilityType?: string) {
        const where: any = {};
        if (facilityType) where.facilityType = facilityType.toUpperCase();

        return prisma.facility.findMany({
            where,
            orderBy: [{ facilityType: 'asc' }, { sortOrder: 'asc' }],
        });
    },

    async getFacilityById(id: string) {
        return prisma.facility.findUnique({ where: { id } });
    },

    async createFacility(data: FacilityData, actor?: any) {
        const facility = await prisma.facility.create({
            data: {
                title: data.title,
                description: data.description,
                facilityType: data.facilityType || 'STUDIO',
                featuresJson: data.featuresJson,
                iconName: data.iconName || 'Building2',
                sortOrder: data.sortOrder ?? 0,
                isActive: data.isActive ?? true,
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'CREATE',
            entityType: 'Facility',
            entityId: facility.id,
            newValues: facility,
        });

        return facility;
    },

    async updateFacility(id: string, data: Partial<FacilityData>, actor?: any) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...cleanData }: any = data;
        const oldFacility = await prisma.facility.findUnique({ where: { id } });
        const facility = await prisma.facility.update({
            where: { id },
            data: cleanData,
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'UPDATE',
            entityType: 'Facility',
            entityId: id,
            oldValues: oldFacility,
            newValues: facility,
        });

        return facility;
    },

    async deleteFacility(id: string, actor?: any) {
        const oldFacility = await prisma.facility.findUnique({ where: { id } });
        const facility = await prisma.facility.delete({ where: { id } });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'DELETE',
            entityType: 'Facility',
            entityId: id,
            oldValues: oldFacility,
        });

        return facility;
    },

    async reorderFacilities(orderedIds: string[], actor?: any) {
        const updates = orderedIds.map((id, index) =>
            prisma.facility.update({
                where: { id },
                data: { sortOrder: index },
            })
        );
        const result = await prisma.$transaction(updates);

        await logAuditEvent({
            actorId: actor?.id,
            action: 'REORDER',
            entityType: 'Facility',
            newValues: { orderedIds },
        });

        return result;
    }
};
