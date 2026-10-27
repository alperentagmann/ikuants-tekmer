import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { RentContractFormService } from '@/lib/services/rent-contract-form-service';

type P = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'view', 'rent');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, contract: await RentContractFormService.get((await params).id) });
    } catch (error) {
        return errorResponse(error, 'Sözleşme alınamadı');
    }
}

/** Tüm alanlar düzenlenebilir; `expectedUpdatedAt` ile eşzamanlı düzenleme 409 döner. */
export async function PATCH(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'update', 'rent');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        return NextResponse.json({ success: true, contract: await RentContractFormService.update((await params).id, body, auth.actor) });
    } catch (error) {
        return errorResponse(error, 'Sözleşme güncellenemedi');
    }
}
