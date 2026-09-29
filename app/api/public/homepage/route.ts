import { NextResponse } from 'next/server';
import { HomepageService } from '@/lib/services/homepage-service';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sections = await HomepageService.getSections();
        const activeSections = sections.filter(s => s.isVisible);
        return NextResponse.json({
            success: true,
            sections: activeSections,
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
