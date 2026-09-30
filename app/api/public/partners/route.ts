import { NextRequest, NextResponse } from 'next/server';
import { PartnerService } from '@/lib/services/partner-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const group = searchParams.get('group') || undefined;

        const partners = await PartnerService.getPublicPartners(group);
        return NextResponse.json({ success: true, partners });
    } catch (error: any) {
        return NextResponse.json({ success: false, partners: [], error: error.message }, { status: 500 });
    }
}
