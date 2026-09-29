import { NextRequest, NextResponse } from 'next/server';
import { SocialMediaService } from '@/lib/services/social-media-service';
import { prisma } from '@/lib/prisma';

// 1. Meta Webhook Verification (GET)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN;

    if (mode === 'subscribe' && token && token === verifyToken) {
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Doğrulama başarısız' }, { status: 403 });
}

// 2. Meta Webhook Ingestion (POST)
export async function POST(req: NextRequest) {
    try {
        const signatureHeader = req.headers.get('x-hub-signature-256');
        const rawBody = await req.text();
        const appSecret = process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;

        // If secret is configured, strictly validate HMAC signature
        if (appSecret) {
            const isValid = SocialMediaService.validateMetaWebhookSignature(rawBody, signatureHeader, appSecret);
            if (!isValid) {
                return NextResponse.json({ error: 'Geçersiz imza (HMAC signature mismatch)' }, { status: 401 });
            }
        }

        let payload: any;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: 'Geçersiz JSON yükü' }, { status: 400 });
        }

        if (payload.object !== 'instagram' && payload.object !== 'page') {
            return NextResponse.json({ received: true });
        }

        // Process entry changes
        for (const entry of payload.entry || []) {
            const accountId = entry.id;
            const account = await prisma.socialAccount.findFirst({
                where: { accountId, isActive: true },
            });
            if (!account) continue;

            const changes = entry.changes || [];
            const postsToIngest = [];

            for (const change of changes) {
                if (change.field === 'feed' || change.field === 'posts') {
                    const val = change.value;
                    if (val && val.id) {
                        postsToIngest.push({
                            externalId: val.id,
                            caption: val.message || val.caption || '',
                            mediaType: val.item_type || 'IMAGE',
                            mediaUrl: val.media_url || val.picture,
                            thumbnailUrl: val.thumbnail_url || val.picture,
                            permalink: val.permalink,
                            postDate: val.created_time ? new Date(val.created_time * 1000) : new Date(),
                            rawData: val,
                        });
                    }
                }
            }

            if (postsToIngest.length > 0) {
                await SocialMediaService.ingestExternalPosts(account.id, postsToIngest);
            }
        }

        return NextResponse.json({ success: true, processed: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Webhook işleme hatası' }, { status: 500 });
    }
}
