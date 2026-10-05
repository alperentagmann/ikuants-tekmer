import { NextRequest, NextResponse } from 'next/server';
import { FacilityExperienceService } from '@/lib/services/facility-experience-service';

/** Public 3D/360 experience of a facility (only enabled, public, real assets). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const experience = await FacilityExperienceService.getPublic(id);
        if (!experience) return NextResponse.json({ success: false, message: 'Bu alan için 3D görünüm yok.' }, { status: 404 });
        return NextResponse.json({ success: true, experience });
    } catch (error) {
        console.error('Public experience failed:', error);
        return NextResponse.json({ success: false, message: '3D görünüm yüklenemedi.' }, { status: 500 });
    }
}
