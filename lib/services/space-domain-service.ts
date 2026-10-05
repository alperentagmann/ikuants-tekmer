import { prisma } from '@/lib/prisma';

export interface SpaceFeatures {
  capacity?: number | null;
  squareMeters?: number | null;
  floor?: string | null;
  equipment?: string | string[] | null;
  amenities?: string | string[] | null;
  reservationEnabled?: boolean;
  approvalRequired?: boolean;
  bufferMinutes?: number;
  openTime?: string;
  closeTime?: string;
  [key: string]: any;
}

export interface UpsertSpaceInput {
  id?: string;
  title: string;
  description: string;
  facilityType?: string;
  features?: SpaceFeatures;
  iconName?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const VERIFIED_CAPACITIES: Record<string, number> = {
  'Açık Toplantı Masası 1 — 8 Kişilik': 8,
  'Açık Toplantı Masası 2 — 8 Kişilik': 8,
  'Açık Toplantı Masası — 20 Kişilik': 20,
};

export function resolveVerifiedCapacity(title: string, inputCapacity?: number | null): number | null {
  // If explicitly in verified user whitelist, enforce it
  for (const [key, cap] of Object.entries(VERIFIED_CAPACITIES)) {
    if (title.trim().toLowerCase() === key.toLowerCase()) {
      return cap;
    }
  }
  // Otherwise, if valid non-zero number is given, use it, else null (never default to fake 10)
  if (typeof inputCapacity === 'number' && !isNaN(inputCapacity) && inputCapacity > 0) {
    return inputCapacity;
  }
  return null;
}

export function generateResourceCode(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .toUpperCase();
  const shortId = id.slice(0, 8).toUpperCase();
  return `${slug.slice(0, 16)}-${shortId}`;
}

export function mapFacilityTypeToResourceType(facilityType: string): string {
  switch (facilityType) {
    case 'STUDIO':
      return 'STUDIO';
    case 'WORK_AREA':
      return 'MEETING_ROOM';
    case 'TRAINING':
      return 'TRAINING_HALL';
    case 'LAB':
      return 'VR_LAB';
    case 'MACHINE_LASER':
    case 'MACHINE_SMT':
    case 'MACHINE_3D':
      return 'HARDWARE_EQUIPMENT';
    default:
      return 'MEETING_ROOM';
  }
}

export class SpaceDomainService {
  /**
   * Centralized atomic creation of Facility (Master) and Resource (Reservation Projection)
   */
  static async createFacility(input: UpsertSpaceInput) {
    const title = input.title.trim();
    const capacity = resolveVerifiedCapacity(title, input.features?.capacity);
    const features: SpaceFeatures = {
      ...(input.features || {}),
      capacity,
      reservationEnabled: input.features?.reservationEnabled ?? true,
      approvalRequired: input.features?.approvalRequired ?? true,
    };

    return await prisma.$transaction(async (tx: any) => {
      const facility = await tx.facility.create({
        data: {
          title,
          description: input.description,
          facilityType: input.facilityType || 'STUDIO',
          featuresJson: JSON.stringify(features),
          iconName: input.iconName || 'Building',
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true,
        },
      });

      // Synchronize Resource projection atomically if reservation is enabled
      let resource = null;
      if (features.reservationEnabled !== false) {
        resource = await tx.resource.upsert({
          where: { id: facility.id },
          create: {
            id: facility.id,
            name: facility.title,
            code: generateResourceCode(facility.title, facility.id),
            resourceType: mapFacilityTypeToResourceType(facility.facilityType),
            capacity, // null when unknown, never a fake default
            location: features.floor || null,
            description: facility.description,
            features: JSON.stringify(features.equipment || []),
            isActive: facility.isActive,
          },
          update: {
            name: facility.title,
            capacity: capacity,
            location: features.floor || null,
            description: facility.description,
            features: JSON.stringify(features.equipment || []),
            isActive: facility.isActive,
          },
        });
      }

      return { facility, resource };
    });
  }

  /**
   * Centralized atomic update of Facility (Master) and Resource (Reservation Projection)
   */
  static async updateFacility(id: string, input: Partial<UpsertSpaceInput>) {
    return await prisma.$transaction(async (tx: any) => {
      const existing = await tx.facility.findUnique({ where: { id } });
      if (!existing) {
        throw new Error(`Facility with id ${id} not found`);
      }

      let existingFeatures: SpaceFeatures = {};
      try {
        if (existing.featuresJson) {
          existingFeatures = JSON.parse(existing.featuresJson);
        }
      } catch (_e) {
        existingFeatures = {};
      }

      const title = input.title !== undefined ? input.title.trim() : existing.title;
      const capacity =
        input.features?.capacity !== undefined
          ? resolveVerifiedCapacity(title, input.features.capacity)
          : existingFeatures.capacity !== undefined
          ? existingFeatures.capacity
          : resolveVerifiedCapacity(title, null);

      const mergedFeatures: SpaceFeatures = {
        ...existingFeatures,
        ...(input.features || {}),
        capacity,
      };

      const updatedFacility = await tx.facility.update({
        where: { id },
        data: {
          title: input.title !== undefined ? title : undefined,
          description: input.description !== undefined ? input.description : undefined,
          facilityType: input.facilityType !== undefined ? input.facilityType : undefined,
          featuresJson: JSON.stringify(mergedFeatures),
          iconName: input.iconName !== undefined ? input.iconName : undefined,
          sortOrder: input.sortOrder !== undefined ? input.sortOrder : undefined,
          isActive: input.isActive !== undefined ? input.isActive : undefined,
        },
      });

      // Synchronize Resource projection
      let updatedResource = null;
      if (mergedFeatures.reservationEnabled !== false) {
        updatedResource = await tx.resource.upsert({
          where: { id },
          create: {
            id,
            name: updatedFacility.title,
            code: generateResourceCode(updatedFacility.title, id),
            resourceType: mapFacilityTypeToResourceType(updatedFacility.facilityType),
            capacity: capacity,
            location: mergedFeatures.floor || null,
            description: updatedFacility.description,
            features: JSON.stringify(mergedFeatures.equipment || []),
            isActive: updatedFacility.isActive,
          },
          update: {
            name: updatedFacility.title,
            capacity: capacity,
            location: mergedFeatures.floor || null,
            description: updatedFacility.description,
            features: JSON.stringify(mergedFeatures.equipment || []),
            isActive: updatedFacility.isActive,
          },
        });
      } else {
        // If reservation disabled, deactivate resource projection
        await tx.resource.updateMany({
          where: { id },
          data: { isActive: false },
        });
      }

      return { facility: updatedFacility, resource: updatedResource };
    });
  }

  /**
   * Centralized archive/deactivation
   */
  static async archiveFacility(id: string) {
    return await prisma.$transaction(async (tx: any) => {
      const facility = await tx.facility.update({
        where: { id },
        data: { isActive: false },
      });
      await tx.resource.updateMany({
        where: { id },
        data: { isActive: false },
      });
      return facility;
    });
  }

  /**
   * Ensure a valid, canonical Resource projection exists for a bookable Facility.
   * Prevents orphan resources or arbitrary resource creation in public reservation routes.
   */
  static async ensureReservationResource(facilityId: string) {
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new Error(`Facility ${facilityId} not found`);
    }

    let features: SpaceFeatures = {};
    try {
      if (facility.featuresJson) {
        features = JSON.parse(facility.featuresJson);
      }
    } catch (_e) {
      features = {};
    }

    if (features.reservationEnabled === false) {
      throw new Error(`Facility ${facility.title} is not configured for public reservations`);
    }

    // Fast-path: If matching canonical projection already exists, return it directly
    const existing = await prisma.resource.findUnique({
      where: { id: facility.id },
    });
    if (existing) {
      return existing;
    }

    const capacity = resolveVerifiedCapacity(facility.title, features.capacity);

    // Create projection if missing
    const resourceData: any = {
      id: facility.id,
      name: facility.title,
      code: generateResourceCode(facility.title, facility.id),
      resourceType: mapFacilityTypeToResourceType(facility.facilityType),
      location: features.floor || null,
      description: facility.description,
      features: JSON.stringify(features.equipment || []),
      isActive: facility.isActive,
    };
    if (typeof capacity === 'number') {
      resourceData.capacity = capacity;
    }

    const resource = await prisma.resource.create({
      data: resourceData,
    });

    return resource;
  }

  /**
   * Complete Reconciliation & Drift Elimination
   */
  static async reconcileFacilityResource() {
    const facilities = await prisma.facility.findMany();
    const resources = await prisma.resource.findMany();

    const _resourceMap = new Map(resources.map((r: any) => [r.id, r]));
    const _facilityMap = new Map(facilities.map((f: any) => [f.id, f]));

    let bookableCount = 0;
    let reconciledCount = 0;
    let fakeDefaultsPurged = 0; // count of non-bookable projections deactivated
    const _orphanResourcesPurged = 0;

    for (const facility of facilities) {
      let features: SpaceFeatures = {};
      try {
        if (facility.featuresJson) {
          features = JSON.parse(facility.featuresJson);
        }
      } catch (_e) {
        features = {};
      }

      // Check if bookable
      // Only spaces explicitly configured for reservations get a projection;
      // informational CMS facility cards have no reservation settings.
      const isBookable = features.reservationEnabled === true && facility.isActive;
      if (!isBookable) continue;

      bookableCount++;
      const capacity = resolveVerifiedCapacity(facility.title, features.capacity);

      // Reconcile Resource projection atomically
      await prisma.resource.upsert({
        where: { id: facility.id },
        create: {
          id: facility.id,
          name: facility.title,
          code: generateResourceCode(facility.title, facility.id),
          resourceType: mapFacilityTypeToResourceType(facility.facilityType),
          capacity: capacity,
          location: features.floor || null,
          description: facility.description,
          features: JSON.stringify(features.equipment || []),
          isActive: facility.isActive,
        },
        update: {
          name: facility.title,
          capacity: capacity,
          location: features.floor || null,
          isActive: facility.isActive,
        },
      });

      // Update Facility.featuresJson if capacity was out of sync
      if (features.capacity !== capacity) {
        features.capacity = capacity;
        await prisma.facility.update({
          where: { id: facility.id },
          data: { featuresJson: JSON.stringify(features) },
        });
      }

      reconciledCount++;
    }

    // Resources without a bookable canonical Facility master are deactivated
    // (never deleted, reservations keep their history).
    const bookableIds = new Set(
      facilities
        .filter((f: any) => {
          try {
            return f.isActive && JSON.parse(f.featuresJson || '{}').reservationEnabled === true;
          } catch {
            return false;
          }
        })
        .map((f: any) => f.id)
    );
    const currentResources = await prisma.resource.findMany();
    for (const r of currentResources) {
      if (!bookableIds.has(r.id) && r.isActive) {
        await prisma.resource.update({ where: { id: r.id }, data: { isActive: false } });
        fakeDefaultsPurged++;
      }
    }

    return {
      bookableCount,
      reconciledCount,
      fakeDefaultsPurged,
    };
  }
}
