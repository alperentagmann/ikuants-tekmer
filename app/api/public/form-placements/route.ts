import { NextRequest, NextResponse } from 'next/server';
import { FormPlacementService, PLACEMENT_TARGETS, type PlacementTarget } from '@/lib/services/form-placement-service';

/** Published forms placed on a public page (only non-program targets; program pages render server-side). */
export async function GET(request: NextRequest) {
    const target = request.nextUrl.searchParams.get('target') || '';
    if (!(target in PLACEMENT_TARGETS) || target === 'PROGRAM_PAGE') return NextResponse.json({ success: false, placements: [] }, { status: 400 });
    const placements = await FormPlacementService.forTarget(target as PlacementTarget);
    return NextResponse.json({ success: true, placements });
}
