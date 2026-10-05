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
    } catch (e) {
        // Internal errors (e.g. database connection details) stay in the server log
        console.error('Error fetching public homepage sections:', e);
        return NextResponse.json({ success: false, message: 'Ana sayfa bölümleri şu anda yüklenemiyor.' }, { status: 503 });
    }
}
