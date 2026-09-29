import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { SocialMediaService } from '@/lib/services/social-media-service';
import { z } from 'zod';

const accountSchema = z.object({
    provider: z.string().default('INSTAGRAM'),
    accountName: z.string().min(1, 'Hesap adı zorunludur'),
    accountId: z.string().min(1, 'Hesap ID zorunludur'),
    profileUrl: z.string().optional(),
    avatarUrl: z.string().optional(),
    syncMode: z.enum(['MANUAL_REVIEW', 'AUTO_DRAFT', 'AUTO_PUBLISH']).optional(),
    syncIntervalMinutes: z.number().int().min(5).max(1440).optional(),
});

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const accounts = await SocialMediaService.getAccounts();
        return NextResponse.json({ success: true, accounts });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const parsed = accountSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const account = await SocialMediaService.connectAccount(parsed.data, {
            id: auth.user.id,
            name: `${auth.user.name || ''} ${auth.user.surname || ''}`.trim(),
            email: auth.user.email || '',
        });

        return NextResponse.json({ success: true, account });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
