import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { FacilityUnitService } from '@/lib/services/facility-unit-service';

/** Toplu bölüm (ör. masa) ekleme: { floorId, prefix, startNo, count, digits, unitType, area, capacity, maxTenants }. */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'create', 'facilities');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, result: await FacilityUnitService.bulkCreateUnits(await request.json().catch(() => ({})), auth.actor) });
    } catch (error) {
        return errorResponse(error, 'Bölümler eklenemedi');
    }
}
