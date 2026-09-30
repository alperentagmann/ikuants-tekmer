import { NextRequest, NextResponse } from 'next/server';
import { FacilityService } from '@/lib/services/facility-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || undefined;

        const facilities = await FacilityService.getPublicFacilities(type);
        return NextResponse.json({ success: true, facilities });
    } catch (error: any) {
        return NextResponse.json({ success: false, facilities: [], error: error.message }, { status: 500 });
    }
}
