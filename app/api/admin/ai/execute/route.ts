import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { AiEngine } from '@/lib/ai/engine';
import type { AiActor } from '@/lib/ai/types';

/**
 * Confirms a plan previously prepared by /api/admin/ai/chat. Only the server-stored plan is
 * executed; action ids or parameters sent by the client are never trusted.
 */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'use', 'ai');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { changeSetId?: unknown };
        if (typeof body.changeSetId !== 'string') {
            return NextResponse.json({ success: false, message: 'Onaylanacak işlem bulunamadı. Önce komutu verip önizlemeyi oluşturun.' }, { status: 400 });
        }
        const response = await AiEngine.confirm(body.changeSetId, auth.user as AiActor);
        return NextResponse.json({ success: true, response, changeSetId: body.changeSetId });
    } catch (error) {
        return errorResponse(error, 'İşlem çalıştırılamadı');
    }
}
