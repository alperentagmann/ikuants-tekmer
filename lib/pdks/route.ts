import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse, type AdminUser, type ActorContext } from '@/lib/api-guard';

/** PDKS admin rotaları için ortak sarmalayıcı: yetki + hata yanıtı; dosya yanıtları olduğu gibi döner. */
export function pdksRoute<C>(action: 'view' | 'manage' | 'view_identity', fallback: string, fn: (req: NextRequest, ctx: C, user: AdminUser, actor: ActorContext) => Promise<unknown>) {
    return async (req: NextRequest, ctx: C) => {
        const auth = await requireAdmin(req, action, 'pdks');
        if (auth.error) return auth.error;
        try {
            const result = await fn(req, ctx, auth.user, auth.actor);
            return result instanceof Response ? result : NextResponse.json({ success: true, ...(result as object) });
        } catch (error) {
            return errorResponse(error, fallback);
        }
    };
}
