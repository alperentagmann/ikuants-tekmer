import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { prisma } from '@/lib/prisma';
import { RentContractFormService, RENT_CONTRACT_STATUS_LABELS, SPACE_TYPE_LABELS } from '@/lib/services/rent-contract-form-service';

/** Yeni sözleşme formu: seçim listeleri + ?entrepreneurId=&unitId=&assignmentId= ile önceden doldurma. */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'rent');
    if (auth.error) return auth.error;
    try {
        const sp = request.nextUrl.searchParams;
        const [prefill, entrepreneurs, organizations, units] = await Promise.all([
            RentContractFormService.prefill({ entrepreneurId: sp.get('entrepreneurId'), unitId: sp.get('unitId'), assignmentId: sp.get('assignmentId') }),
            prisma.entrepreneur.findMany({ where: { isArchived: false }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            prisma.organization.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, name: true, legalName: true }, orderBy: { name: 'asc' }, take: 1000 }),
            prisma.spaceUnit.findMany({ where: { isArchived: false, floor: { isArchived: false } }, select: { id: true, code: true, area: true, unitType: true, floor: { select: { name: true, building: { select: { name: true } } } } }, orderBy: { code: 'asc' } }),
        ]);
        return NextResponse.json({
            success: true, prefill,
            lookups: {
                entrepreneurs, organizations,
                units: units.map((u) => ({ id: u.id, label: `${u.floor.building.name} · ${u.floor.name} · ${u.code}`, area: u.area, unitType: u.unitType })),
                statuses: Object.entries(RENT_CONTRACT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
                spaceTypes: Object.entries(SPACE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            },
        });
    } catch (error) {
        return errorResponse(error, 'Sözleşme formu hazırlanamadı');
    }
}

/** Oluşturma. Gövdede `assignmentId` varsa sözleşme o bölüm tahsisine bağlanır. */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'create', 'rent');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const contract = await RentContractFormService.create(body, auth.actor, { assignmentId: typeof body.assignmentId === 'string' ? body.assignmentId : null });
        return NextResponse.json({ success: true, contract });
    } catch (error) {
        return errorResponse(error, 'Sözleşme oluşturulamadı');
    }
}
