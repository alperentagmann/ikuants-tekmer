import { NextRequest, NextResponse } from 'next/server';
import { FacilityExperienceService } from '@/lib/services/facility-experience-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    const auth = await requireAdmin(req, 'view', 'facilities');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const experience = await FacilityExperienceService.get(id);
        return NextResponse.json({ success: true, experience });
    } catch (error) {
        return errorResponse(error, '3D/360 ayarları yüklenemedi');
    }
}

/** Saves the 3D / 360 configuration and hotspots of a facility. */
export async function PUT(req: NextRequest, { params }: Params) {
    const auth = await requireAdmin(req, 'update', 'facilities');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await req.json();
        const experience = await FacilityExperienceService.save(id, body, auth.user);
        return NextResponse.json({ success: true, experience, message: '3D / 360° ayarları kaydedildi.' });
    } catch (error) {
        return errorResponse(error, '3D/360 ayarları kaydedilemedi');
    }
}
