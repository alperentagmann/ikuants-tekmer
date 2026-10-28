import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { uploadSignedScan } from '@/lib/contract-upload';

/** Sihirbazda sözleşme oluşmadan önce ıslak imzalı taramayı yükler; dönen mediaId kayıtta sözleşmeye eklenir. */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'create', 'rent');
    if (auth.error) return auth.error;
    try {
        const { media } = await uploadSignedScan(request, auth.actor.id);
        return NextResponse.json({ success: true, mediaId: media.id, fileName: media.originalName });
    } catch (error) {
        return errorResponse(error, 'Belge yüklenemedi');
    }
}
