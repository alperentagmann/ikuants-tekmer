import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { SocialMediaService } from '@/lib/services/social-media-service';
import { z } from 'zod';

const syncSchema = z.object({
    accountId: z.string().min(1, 'Account ID zorunludur'),
    samplePosts: z.array(
        z.object({
            externalId: z.string(),
            caption: z.string().optional(),
            mediaType: z.string().optional(),
            mediaUrl: z.string().optional(),
            thumbnailUrl: z.string().optional(),
            permalink: z.string().optional(),
            postDate: z.string().or(z.date()),
        })
    ).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const parsed = syncSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const account = await SocialMediaService.getAccountById(parsed.data.accountId);
        if (!account) {
            return NextResponse.json({ error: 'Sosyal medya hesabı bulunamadı' }, { status: 404 });
        }

        // Check if real Meta credentials exist in env or if sample posts are provided
        const metaAppSecret = process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;
        const postsToIngest = parsed.data.samplePosts || [];

        if (postsToIngest.length === 0 && !metaAppSecret) {
            return NextResponse.json({
                success: false,
                status: 'NOT_CONFIGURED',
                message: 'Meta/Instagram API anahtarları henüz tanımlanmamış. Canlı bağlantı için META_APP_ID ve META_APP_SECRET environment değişkenlerini tanımlayın.',
            }, { status: 200 });
        }

        const result = await SocialMediaService.ingestExternalPosts(
            parsed.data.accountId,
            postsToIngest,
            {
                id: auth.user.id,
                name: `${auth.user.name || ''} ${auth.user.surname || ''}`.trim(),
                email: auth.user.email || '',
            }
        );

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
