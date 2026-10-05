import { NextRequest, NextResponse } from 'next/server';
import { serializeGallery } from '@/lib/facility-media';
import { prisma } from '@/lib/prisma';
import { SpaceDomainService } from '@/lib/services/space-domain-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { logAuditEvent } from '@/lib/audit';
import { sanitizeMachines, sanitizePricing } from '@/lib/machines';

type Params = { params: Promise<{ id: string }> };

/** Updates a facility and its reservation projection in one transaction (SpaceDomainService). */
export async function PUT(req: NextRequest, { params }: Params) {
    const auth = await requireAdmin(req, 'update', 'facilities');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await req.json();
        const before = await prisma.facility.findUnique({ where: { id } });
        if (!before) return NextResponse.json({ success: false, message: 'Alan bulunamadı' }, { status: 404 });
        const num = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v));
        const features: Record<string, unknown> = {};
        const map: [string, (v: unknown) => unknown][] = [
            ['spaceCode', (v) => v || null], ['floor', (v) => v || null], ['capacity', num], ['squareMeters', num],
            ['equipment', (v) => v || null], ['amenities', (v) => v || null], ['bufferBeforeMinutes', (v) => num(v) ?? 0],
            ['bufferAfterMinutes', (v) => num(v) ?? 0], ['openTime', (v) => v || null], ['closeTime', (v) => v || null],
            ['workingDays', (v) => (Array.isArray(v) && v.length ? v : null)], ['status', (v) => v || 'AVAILABLE'],
            ['reservationEnabled', (v) => v === true], ['publicVisible', (v) => v !== false], ['approvalRequired', (v) => v !== false],
            ['pricing', sanitizePricing], ['machines', sanitizeMachines],
        ];
        for (const [key, fn] of map) if (key in body) features[key] = fn(body[key]);

        const { facility } = await SpaceDomainService.updateFacility(id, {
            title: body.name,
            description: body.description,
            facilityType: body.spaceType,
            iconName: body.iconName,
            sortOrder: body.sortOrder === undefined ? undefined : Number(body.sortOrder),
            isActive: body.isActive,
            features,
        });
        // Photos shown on the public spaces page
        if ('coverImageUrl' in body || 'gallery' in body) {
            await prisma.facility.update({
                where: { id },
                data: {
                    ...('coverImageUrl' in body ? { coverImageUrl: typeof body.coverImageUrl === 'string' && body.coverImageUrl.trim() ? body.coverImageUrl.trim().slice(0, 500) : null } : {}),
                    ...('gallery' in body ? { galleryJson: serializeGallery(body.gallery) } : {}),
                },
            });
        }
        await logAuditEvent({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            actorName: auth.user.name,
            action: 'UPDATE',
            entityType: 'Facility',
            entityId: id,
            oldValues: { title: before.title, featuresJson: before.featuresJson, isActive: before.isActive },
            newValues: { title: facility.title, featuresJson: facility.featuresJson, isActive: facility.isActive },
        });
        return NextResponse.json({ success: true, space: facility, message: `"${facility.title}" güncellendi.` });
    } catch (error) {
        return errorResponse(error, 'Alan güncellenemedi');
    }
}

/** Facilities are deactivated, never deleted (reservations, assignments and contracts keep history). */
export async function DELETE(req: NextRequest, { params }: Params) {
    const auth = await requireAdmin(req, 'delete', 'facilities');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const facility = await SpaceDomainService.archiveFacility(id);
        await logAuditEvent({ actorId: auth.user.id, actorName: auth.user.name, action: 'ARCHIVE', entityType: 'Facility', entityId: id, diff: `Alan pasife alındı: ${facility.title}` });
        return NextResponse.json({ success: true, message: `"${facility.title}" pasife alındı.` });
    } catch (error) {
        return errorResponse(error, 'Alan pasife alınamadı');
    }
}
