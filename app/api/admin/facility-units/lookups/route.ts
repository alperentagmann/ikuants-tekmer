import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { FacilityUnitService } from '@/lib/services/facility-unit-service';

/** Alan yönetimi formları ve filtreleri için seçim listeleri. */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'facilities');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, lookups: await FacilityUnitService.lookups(auth.user) });
    } catch (error) {
        return errorResponse(error, 'Seçim listeleri alınamadı');
    }
}
