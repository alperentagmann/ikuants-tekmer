import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { ParameterService } from '@/lib/services/parameter-service';

type P = { params: Promise<{ id: string }> };

/** Düzenleme (`expectedUpdatedAt` ile) veya `{ isActive: boolean }` ile pasife al / etkinleştir. Silme yok. */
export async function PATCH(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'manage', 'parameters');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        return NextResponse.json({ success: true, parameter: await ParameterService.update(id, body, typeof body.expectedUpdatedAt === 'string' ? body.expectedUpdatedAt : undefined, auth.actor) });
    } catch (error) {
        return errorResponse(error, 'Parametre güncellenemedi');
    }
}
