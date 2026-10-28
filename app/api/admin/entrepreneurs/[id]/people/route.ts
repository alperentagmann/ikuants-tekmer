import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { FirmPeopleService, PEOPLE_ROLE_LABELS } from '@/lib/services/firm-people-service';

type P = { params: Promise<{ id: string }> };

/** Girişimin personeli (rehberdeki kişiler, şirket kaydı üzerinden). */
export async function GET(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'view', 'persons');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, ...(await FirmPeopleService.list((await params).id)), roles: PEOPLE_ROLE_LABELS });
    } catch (error) {
        return errorResponse(error, 'Personel alınamadı');
    }
}

/** Kişi ekle (rehberden seç veya yeni oluştur → rehbere de kaydolur) ya da `{ endMembershipId }` ile ayrılış. */
export async function POST(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'update', 'persons');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        if (typeof body.endMembershipId === 'string') return NextResponse.json({ success: true, item: await FirmPeopleService.end(id, body.endMembershipId, auth.actor) });
        return NextResponse.json({ success: true, result: await FirmPeopleService.add(id, body, auth.actor) });
    } catch (error) {
        return errorResponse(error, 'Kişi eklenemedi');
    }
}
