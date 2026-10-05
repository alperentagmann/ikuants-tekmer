import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { AiEngine } from '@/lib/ai/engine';
import type { AiActor } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'use', 'ai');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { changeSetId?: unknown };
        if (typeof body.changeSetId !== 'string') return NextResponse.json({ success: false, message: 'İşlem kimliği zorunludur.' }, { status: 400 });
        const result = await AiEngine.undo(body.changeSetId, auth.user as AiActor);
        return NextResponse.json(result);
    } catch (error) {
        return errorResponse(error, 'Geri alma başarısız');
    }
}
