import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { FacilityUnitService } from '@/lib/services/facility-unit-service';

/** Kat haritası: ?floorId= (boşsa planı olan ilk kat). */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'facilities');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, map: await FacilityUnitService.floorMap(request.nextUrl.searchParams.get('floorId')) });
    } catch (error) {
        return errorResponse(error, 'Kat haritası alınamadı');
    }
}
