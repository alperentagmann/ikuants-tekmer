import { NextResponse } from 'next/server';
import { SupportService } from '@/lib/services/support-service';

export async function GET() {
    try {
        const supports = await SupportService.getPublicSupports();
        return NextResponse.json({ success: true, supports });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message, supports: [] }, { status: 500 });
    }
}
