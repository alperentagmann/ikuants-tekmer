import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PersonalWorkspaceService } from '@/lib/services/personal-workspace-service';
import { z } from 'zod';

const favoriteSchema = z.object({
    entityType: z.string().min(1),
    entityId: z.string().min(1),
    title: z.string().min(1),
    url: z.string().min(1),
});

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const parsed = favoriteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const result = await PersonalWorkspaceService.toggleFavorite(auth.user.id, parsed.data);
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
