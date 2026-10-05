import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { checkEndpointRateLimit } from '@/lib/rate-limit';
import { AiEngine, listActionsFor, SUGGESTIONS } from '@/lib/ai/engine';
import type { AiActor, AiContext } from '@/lib/ai/types';

/** Interprets a natural-language command. Reads run immediately; mutations return a preview to confirm. */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'use', 'ai');
    if (auth.error) return auth.error;
    const limit = checkEndpointRateLimit(auth.user.id, { limit: 30, windowSeconds: 60, keyPrefix: 'ai-chat' });
    if (!limit.isAllowed) return NextResponse.json({ success: false, message: 'Çok fazla istek. Lütfen biraz bekleyin.' }, { status: 429 });
    try {
        const body = (await request.json()) as { prompt?: unknown; message?: unknown; context?: AiContext };
        const prompt = typeof body.prompt === 'string' ? body.prompt : typeof body.message === 'string' ? body.message : '';
        if (!prompt.trim()) return NextResponse.json({ success: false, message: 'Komut metni zorunludur.' }, { status: 400 });
        const context: AiContext = {
            route: typeof body.context?.route === 'string' ? body.context.route.slice(0, 300) : null,
            entityType: typeof body.context?.entityType === 'string' ? body.context.entityType : null,
            entityId: typeof body.context?.entityId === 'string' ? body.context.entityId : null,
            lastEntity: body.context?.lastEntity && typeof body.context.lastEntity.id === 'string' ? { type: String(body.context.lastEntity.type), id: body.context.lastEntity.id, label: String(body.context.lastEntity.label || '') } : null,
        };
        const response = await AiEngine.handlePrompt(prompt, auth.user as AiActor, context);
        return NextResponse.json({ success: true, response });
    } catch (error) {
        return errorResponse(error, 'AI komutu işlenemedi');
    }
}

/** Capabilities available to the current user and provider status. */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'use', 'ai');
    if (auth.error) return auth.error;
    return NextResponse.json({ success: true, actions: listActionsFor(auth.user as AiActor), suggestions: SUGGESTIONS, provider: AiEngine.providerStatus() });
}
