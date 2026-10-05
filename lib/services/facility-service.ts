import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { SpaceDomainService } from '@/lib/services/space-domain-service';
import { FacilityExperienceService } from '@/lib/services/facility-experience-service';

export interface FacilityData {
    title: string;
    description: string;
    facilityType?: 'STUDIO' | 'WORK_AREA' | 'FEATURE';
    featuresJson?: string; // JSON string
    iconName?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export const FacilityService = {
    async getPublicFacilities(facilityType?: string) {
        try {
            const where: any = { isActive: true };
            if (facilityType) where.facilityType = facilityType.toUpperCase();

            const [facilities, with3D] = await Promise.all([
                prisma.facility.findMany({ where, orderBy: { sortOrder: 'asc' } }),
                FacilityExperienceService.publicFacilityIds(),
            ]);
            // Facilities hidden from the public site are not listed
            return facilities
                .filter((f) => {
                    try {
                        return JSON.parse(f.featuresJson || '{}').publicVisible !== false;
                    } catch {
                        return true;
                    }
                })
                .map((f) => ({ ...f, has3D: with3D.has(f.id) }));
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
        let parsedFeatures: any = {};
        try {
            if (data.featuresJson) parsedFeatures = JSON.parse(data.featuresJson);
        } catch (e) {
            parsedFeatures = {};
        }

        const { facility } = await SpaceDomainService.createFacility({
            title: data.title,
            description: data.description,
            facilityType: data.facilityType || 'STUDIO',
            features: parsedFeatures,
            iconName: data.iconName || 'Building2',
            sortOrder: data.sortOrder ?? 0,
            isActive: data.isActive ?? true,
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

        let parsedFeatures: any = undefined;
        if (cleanData.featuresJson) {
            try {
                parsedFeatures = JSON.parse(cleanData.featuresJson);
            } catch (e) {}
        }

        const { facility } = await SpaceDomainService.updateFacility(id, {
            title: cleanData.title,
            description: cleanData.description,
            facilityType: cleanData.facilityType,
            features: parsedFeatures,
            iconName: cleanData.iconName,
            sortOrder: cleanData.sortOrder,
            isActive: cleanData.isActive,
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
        
        // Transactional delete/deactivation of both Facility and Resource projection
        const result = await prisma.$transaction(async (tx) => {
            await tx.resource.deleteMany({ where: { id } });
            return await tx.facility.delete({ where: { id } });
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'DELETE',
            entityType: 'Facility',
            entityId: id,
            oldValues: oldFacility,
        });

        return result;
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
