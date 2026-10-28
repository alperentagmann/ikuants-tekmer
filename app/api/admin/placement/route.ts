import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { PlacementService } from '@/lib/services/placement-service';

/** Yerleştirme sihirbazı seçim listeleri (boş yeri olan masa / ofisler, firmalar, şirketler) veya ?entrepreneurId= ile firma özeti. */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'facilities');
    if (auth.error) return auth.error;
    try {
        const entrepreneurId = request.nextUrl.searchParams.get('entrepreneurId');
        if (entrepreneurId) return NextResponse.json({ success: true, overview: await PlacementService.overview(entrepreneurId, auth.user) });
        return NextResponse.json({ success: true, lookups: await PlacementService.lookups() });
    } catch (error) {
        return errorResponse(error, 'Veriler alınamadı');
    }
}

/** Tek kayıtla firma + şirket + masa/ofis tahsisleri + sözleşme + ıslak imzalı belge. */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'create', 'facilities');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, result: await PlacementService.place(await request.json().catch(() => ({})), auth.user, auth.actor) });
    } catch (error) {
        return errorResponse(error, 'Yerleştirme kaydedilemedi');
    }
}
