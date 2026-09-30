import { NextResponse } from 'next/server';
import { AboutService } from '@/lib/services/about-service';

export async function GET() {
    try {
        const content = await AboutService.getAboutContent();
        return NextResponse.json({ success: true, content });
    } catch (error: any) {
        return NextResponse.json({ success: false, content: null, error: error.message }, { status: 500 });
    }
}
