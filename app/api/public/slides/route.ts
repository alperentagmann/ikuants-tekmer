import { NextResponse } from 'next/server';
import { HomepageService } from '@/lib/services/homepage-service';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const slides = await HomepageService.getHeroSlides(false);
        return NextResponse.json({
            success: true,
            slides,
        });
    } catch (e) {
        // Database unreachable: the hero keeps its static slides. Internal errors stay in the server log.
        console.error('Error fetching public slides:', e);
        return NextResponse.json({ success: true, slides: [] });
    }
}
