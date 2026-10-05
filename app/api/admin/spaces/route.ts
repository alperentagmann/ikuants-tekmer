import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SpaceDomainService } from '@/lib/services/space-domain-service';
import { parseFacilitySettings } from '@/lib/services/space-reservation-service';
import { parseGallery } from '@/lib/facility-media';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { logAuditEvent } from '@/lib/audit';
import { facilityMachines, facilityPricing, sanitizeMachines, sanitizePricing } from '@/lib/machines';

function parseFeatures(raw: string | null): Record<string, unknown> {
    try {
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req, 'view', 'facilities');
    if (auth.error) return auth.error;
    try {
        const facilities = await prisma.facility.findMany({
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            include: {
                experience: { select: { isEnabled: true, isPublic: true, mode: true, modelUrl: true, panoramaUrl: true, _count: { select: { hotspots: true } } } },
                _count: { select: { spaceAssignments: true } },
            },
        });
        const pending = await prisma.reservation.groupBy({ by: ['resourceId'], where: { status: 'PENDING_APPROVAL' }, _count: true });
        const pendingBy = new Map(pending.map((p) => [p.resourceId, p._count]));

        const spaces = facilities.map((f) => {
            const features = parseFeatures(f.featuresJson);
            const settings = parseFacilitySettings(f);
            return {
                id: f.id,
                name: f.title,
                description: f.description,
                spaceType: f.facilityType,
                iconName: f.iconName,
                coverImageUrl: f.coverImageUrl,
                gallery: parseGallery(f.galleryJson),
                sortOrder: f.sortOrder,
                isActive: f.isActive,
                spaceCode: typeof features.spaceCode === 'string' ? features.spaceCode : null,
                capacity: settings.capacity,
                floor: settings.floor,
                squareMeters: settings.squareMeters,
                equipment: typeof features.equipment === 'string' ? features.equipment : Array.isArray(features.equipment) ? (features.equipment as string[]).join(', ') : null,
                amenities: typeof features.amenities === 'string' ? features.amenities : Array.isArray(features.amenities) ? (features.amenities as string[]).join(', ') : null,
                status: settings.status,
                reservationEnabled: settings.reservationEnabled,
                publicVisible: settings.publicVisible,
                approvalRequired: settings.approvalRequired,
                bufferBeforeMinutes: settings.bufferBeforeMinutes,
                bufferAfterMinutes: settings.bufferAfterMinutes,
                openTime: settings.openTime,
                closeTime: settings.closeTime,
                workingDays: settings.workingDays,
                pricing: facilityPricing(f),
                machines: facilityMachines(f),
                pendingReservations: pendingBy.get(f.id) || 0,
                assignmentCount: f._count.spaceAssignments,
                experience: f.experience
                    ? { isEnabled: f.experience.isEnabled, isPublic: f.experience.isPublic, mode: f.experience.mode, hasAsset: Boolean(f.experience.modelUrl || f.experience.panoramaUrl), hotspotCount: f.experience._count.hotspots }
                    : null,
            };
        });

        return NextResponse.json({ success: true, spaces });
    } catch (error) {
        return errorResponse(error, 'Alanlar yüklenemedi');
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdmin(req, 'create', 'facilities');
    if (auth.error) return auth.error;
    try {
        const body = await req.json();
        if (!body.name?.trim()) return NextResponse.json({ success: false, message: 'Alan adı zorunludur.' }, { status: 400 });
        const num = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v));
        const { facility } = await SpaceDomainService.createFacility({
            title: body.name,
            description: body.description || '',
            facilityType: body.spaceType || 'STUDIO',
            features: {
                spaceCode: body.spaceCode || null,
                floor: body.floor || null,
                capacity: num(body.capacity),
                squareMeters: num(body.squareMeters),
                equipment: body.equipment || null,
                amenities: body.amenities || null,
                bufferBeforeMinutes: num(body.bufferBeforeMinutes) ?? 0,
                bufferAfterMinutes: num(body.bufferAfterMinutes) ?? 0,
                openTime: body.openTime || null,
                closeTime: body.closeTime || null,
                workingDays: Array.isArray(body.workingDays) ? body.workingDays : null,
                status: body.status || 'AVAILABLE',
                reservationEnabled: body.reservationEnabled !== false,
                publicVisible: body.publicVisible !== false,
                approvalRequired: body.approvalRequired !== false,
                ...(body.pricing ? { pricing: sanitizePricing(body.pricing) } : {}),
                ...(Array.isArray(body.machines) ? { machines: sanitizeMachines(body.machines) } : {}),
            },
            isActive: body.status !== 'CLOSED',
        });
        await logAuditEvent({ actorId: auth.user.id, actorEmail: auth.user.email, actorName: auth.user.name, action: 'CREATE', entityType: 'Facility', entityId: facility.id, newValues: { name: facility.title } });
        return NextResponse.json({ success: true, space: facility, message: `"${facility.title}" oluşturuldu.` });
    } catch (error) {
        return errorResponse(error, 'Alan oluşturulamadı');
    }
}
