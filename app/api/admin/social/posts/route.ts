import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { SocialMediaService } from '@/lib/services/social-media-service';
import { z } from 'zod';

const convertSchema = z.object({
    postId: z.string().min(1, 'Post ID zorunludur'),
    title: z.string().optional(),
    category: z.string().optional(),
    summary: z.string().optional(),
    content: z.string().optional(),
    autoPublish: z.boolean().optional(),
});

const actionSchema = z.object({
    postId: z.string().min(1, 'Post ID zorunludur'),
    action: z.enum(['IGNORE', 'CONVERT']),
});

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId') || undefined;
        const syncStatus = searchParams.get('syncStatus') || undefined;
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '30', 10);

        const data = await SocialMediaService.getPosts({
            accountId,
            syncStatus,
            search,
            page,
            limit,
        });

        return NextResponse.json({ success: true, ...data });
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
        const parsed = convertSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const news = await SocialMediaService.convertPostToNews(
            parsed.data.postId,
            {
                title: parsed.data.title,
                category: parsed.data.category,
                summary: parsed.data.summary,
                content: parsed.data.content,
                autoPublish: parsed.data.autoPublish,
            },
            {
                id: auth.user.id,
                name: `${auth.user.name || ''} ${auth.user.surname || ''}`.trim(),
                email: auth.user.email || '',
            }
        );

        return NextResponse.json({ success: true, news });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const parsed = actionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        if (parsed.data.action === 'IGNORE') {
            const post = await SocialMediaService.ignorePost(parsed.data.postId, {
                id: auth.user.id,
                name: `${auth.user.name || ''} ${auth.user.surname || ''}`.trim(),
                email: auth.user.email || '',
            });
            return NextResponse.json({ success: true, post });
        }

        return NextResponse.json({ error: 'Bilinmeyen işlem' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
