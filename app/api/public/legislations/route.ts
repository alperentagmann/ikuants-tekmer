import { NextRequest, NextResponse } from 'next/server';
import { LegislationService } from '@/lib/services/legislation-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || undefined;

        const legislations = await LegislationService.getPublicLegislations(category);
        return NextResponse.json({ success: true, legislations });
    } catch (error: any) {
        return NextResponse.json({ success: false, legislations: [], error: error.message }, { status: 500 });
    }
}
