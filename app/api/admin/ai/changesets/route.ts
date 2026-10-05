import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { AiEngine } from '@/lib/ai/engine';
import type { AiActor } from '@/lib/ai/types';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'use', 'ai');
    if (auth.error) return auth.error;
    try {
        const limit = Number(new URL(request.url).searchParams.get('limit') || 50);
        return NextResponse.json({ success: true, items: await AiEngine.history(auth.user as AiActor, Number.isFinite(limit) ? limit : 50) });
    } catch (error) {
        return errorResponse(error, 'İşlem geçmişi alınamadı');
    }
}
