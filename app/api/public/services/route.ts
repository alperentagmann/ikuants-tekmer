import { NextResponse } from 'next/server';
import { ServiceItemService } from '@/lib/services/service-item-service';

export async function GET() {
    try {
        const services = await ServiceItemService.getPublicServices();
        return NextResponse.json({ success: true, services });
    } catch (error: any) {
        return NextResponse.json({ success: false, services: [], error: error.message }, { status: 500 });
    }
}
