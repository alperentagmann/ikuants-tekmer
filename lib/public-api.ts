import { NextRequest, NextResponse } from 'next/server';
import { IntegrationService } from '@/lib/services/integration-service';
import { enforceRateLimit } from '@/lib/rate-limit';

/**
 * Guard for /api/v1 (external systems): API key from Admin › Entegrasyon Merkezi, a scope check
 * and a per-key rate limit. Responses never contain T.C. numbers or other identity data.
 */
export async function withApiKey(request: NextRequest, scope: string | null, handler: (key: { id: string; name: string }) => Promise<NextResponse>) {
    const limited = enforceRateLimit(request, { limit: 120, windowSeconds: 60, keyPrefix: 'v1' });
    if (limited) return limited;
    const key = await IntegrationService.verifyApiKey(request.headers.get('authorization'), scope);
    if (!key) return NextResponse.json({ success: false, error: 'Geçersiz, süresi dolmuş veya yetkisiz API anahtarı' }, { status: 401 });
    try {
        return await handler(key);
    } catch (error) {
        console.error('Public API error', error);
        return NextResponse.json({ success: false, error: 'İstek işlenemedi' }, { status: 500 });
    }
}

/** ?since=<ISO date>&limit=<1..100> */
export function listParams(request: NextRequest) {
    const sp = request.nextUrl.searchParams;
    const since = sp.get('since') ? new Date(String(sp.get('since'))) : null;
    return { since: since && !Number.isNaN(since.getTime()) ? since : null, limit: Math.min(100, Math.max(1, Number(sp.get('limit')) || 50)) };
}
