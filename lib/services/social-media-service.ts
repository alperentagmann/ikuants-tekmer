import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import crypto from 'crypto';

export interface SocialAccountData {
    provider: string;
    accountName: string;
    accountId: string;
    profileUrl?: string;
    avatarUrl?: string;
    accessToken?: string;
    syncIntervalMinutes?: number;
    syncMode?: string; // MANUAL_REVIEW, AUTO_DRAFT, AUTO_PUBLISH
}

export interface ConvertPostParams {
    title?: string;
    category?: string;
    summary?: string;
    content?: string;
    authorName?: string;
    autoPublish?: boolean;
}

export const SocialMediaService = {
    // 1. Account Management
    async getAccounts() {
        return prisma.socialAccount.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { posts: true, syncRuns: true } },
            },
        });
    },

    async getAccountById(id: string) {
        return prisma.socialAccount.findUnique({
            where: { id },
            include: {
                importRules: true,
                syncRuns: { orderBy: { startedAt: 'desc' }, take: 10 },
            },
        });
    },

    async connectAccount(data: SocialAccountData, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const existing = await prisma.socialAccount.findUnique({ where: { accountId: data.accountId } });
        
        let account;
        if (existing) {
            account = await prisma.socialAccount.update({
                where: { id: existing.id },
                data: {
                    accountName: data.accountName,
                    profileUrl: data.profileUrl,
                    avatarUrl: data.avatarUrl,
                    isActive: true,
                    syncMode: data.syncMode || existing.syncMode,
                    syncIntervalMinutes: data.syncIntervalMinutes || existing.syncIntervalMinutes,
                },
            });
        } else {
            account = await prisma.socialAccount.create({
                data: {
                    provider: data.provider || 'INSTAGRAM',
                    accountName: data.accountName,
                    accountId: data.accountId,
                    profileUrl: data.profileUrl,
                    avatarUrl: data.avatarUrl,
                    isActive: true,
                    syncMode: data.syncMode || 'AUTO_DRAFT',
                    syncIntervalMinutes: data.syncIntervalMinutes || 30,
                },
            });
        }

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'CREATE',
            entityType: 'SocialAccount',
            entityId: account.id,
            diff: `SOCIAL_ACCOUNT_CONNECTED: ${account.provider} (${account.accountName})`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return account;
    },

    async disconnectAccount(id: string, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const updated = await prisma.socialAccount.update({
            where: { id },
            data: { isActive: false },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'SocialAccount',
            entityId: id,
            diff: `SOCIAL_ACCOUNT_DISCONNECTED: ${updated.accountName}`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return updated;
    },

    // 2. Post Management & Inbox
    async getPosts(params?: {
        accountId?: string;
        syncStatus?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const { accountId, syncStatus, search, page = 1, limit = 50 } = params || {};
        const where: any = {};
        if (accountId) where.socialAccountId = accountId;
        if (syncStatus) where.syncStatus = syncStatus;
        if (search) {
            where.caption = { contains: search, mode: 'insensitive' };
        }

        const [items, total] = await Promise.all([
            prisma.socialPost.findMany({
                where,
                include: {
                    socialAccount: { select: { id: true, accountName: true, provider: true } },
                },
                orderBy: { postDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.socialPost.count({ where }),
        ]);

        return { items, total, page, totalPages: Math.ceil(total / limit) };
    },

    // 3. Post to News Conversion Pipeline
    async convertPostToNews(
        postId: string,
        params?: ConvertPostParams,
        actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }
    ) {
        const post = await prisma.socialPost.findUnique({
            where: { id: postId },
            include: { socialAccount: true },
        });
        if (!post) throw new Error('Sosyal medya gönderisi bulunamadı.');

        const captionClean = (post.caption || '').trim();
        const firstLine = captionClean.split('\n')[0]?.slice(0, 100) || 'Instagram Duyurusu';
        const title = params?.title || firstLine.replace(/#[a-zA-Z0-9_]+/g, '').trim() || 'İKÜANTS TEKMER Duyurusu';
        const summary = params?.summary || captionClean.slice(0, 200);
        const content = params?.content || captionClean;

        function slugify(text: string) {
            return text
                .toLowerCase()
                .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-');
        }

        const slug = `${slugify(title)}-${Date.now().toString().slice(-4)}`;

        // Create News Item matching schema fields
        const isPublished = params?.autoPublish || false;
        const news = await prisma.news.create({
            data: {
                title,
                slug,
                excerpt: summary,
                content,
                coverImage: post.mediaUrl || post.thumbnailUrl,
                author: params?.authorName || `Instagram (@${post.socialAccount.accountName})`,
                status: isPublished ? 'PUBLISHED' : 'DRAFT',
                approvalStatus: isPublished ? 'APPROVED' : 'DRAFT',
                publishedAt: isPublished ? new Date() : null,
                seoTitle: `${title} | İKÜANTS TEKMER`,
                seoDescription: summary,
            },
        });

        // Update Social Post status
        await prisma.socialPost.update({
            where: { id: postId },
            data: {
                syncStatus: isPublished ? 'PUBLISHED' : 'DRAFT_CREATED',
                convertedNewsId: news.id,
            },
        });

        // Create Link record
        await prisma.socialContentLink.create({
            data: {
                socialPostId: postId,
                entityType: 'News',
                entityId: news.id,
                source: 'INSTAGRAM',
            },
        });

        // Audit Log
        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'CREATE',
            entityType: 'News',
            entityId: news.id,
            diff: `SOCIAL_POST_CONVERTED_TO_NEWS: From post ${post.externalId} -> News ID: ${news.id} (${isPublished ? 'PUBLISHED' : 'DRAFT'})`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return news;
    },

    async ignorePost(postId: string, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const post = await prisma.socialPost.update({
            where: { id: postId },
            data: { syncStatus: 'IGNORED' },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'SocialPost',
            entityId: postId,
            diff: `SOCIAL_POST_IGNORED: ${postId}`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return post;
    },

    // 4. Ingest Posts (Mock or Real API ingestion)
    async ingestExternalPosts(
        accountId: string,
        posts: Array<{
            externalId: string;
            caption?: string;
            mediaType?: string;
            mediaUrl?: string;
            thumbnailUrl?: string;
            permalink?: string;
            postDate: Date | string;
            rawData?: any;
        }>,
        actor?: { id: string; name: string; email: string }
    ) {
        const account = await prisma.socialAccount.findUnique({
            where: { id: accountId },
            include: { importRules: { where: { isActive: true } } },
        });
        if (!account) throw new Error('Sosyal medya hesabı bulunamadı.');

        const syncRun = await prisma.socialSyncRun.create({
            data: {
                socialAccountId: accountId,
                status: 'RUNNING',
                postsFound: posts.length,
            },
        });

        let imported = 0;
        let drafted = 0;

        try {
            for (const p of posts) {
                const existing = await prisma.socialPost.findUnique({
                    where: {
                        socialAccountId_externalId: {
                            socialAccountId: accountId,
                            externalId: p.externalId,
                        },
                    },
                });

                if (existing) {
                    continue; // Deduplicate: Do not create again
                }

                // Check automated rules
                let syncStatus = 'NEW';
                let matchedRule = null;
                const captionLower = (p.caption || '').toLowerCase();

                for (const rule of account.importRules) {
                    if (captionLower.includes(rule.keywordOrHashtag.toLowerCase())) {
                        matchedRule = rule;
                        break;
                    }
                }

                if (account.syncMode === 'AUTO_DRAFT' || matchedRule) {
                    syncStatus = 'DRAFT_CREATED';
                }

                const createdPost = await prisma.socialPost.create({
                    data: {
                        socialAccountId: accountId,
                        externalId: p.externalId,
                        caption: p.caption,
                        mediaType: p.mediaType || 'IMAGE',
                        mediaUrl: p.mediaUrl,
                        thumbnailUrl: p.thumbnailUrl || p.mediaUrl,
                        permalink: p.permalink,
                        postDate: new Date(p.postDate),
                        syncStatus,
                        rawDataJson: p.rawData ? JSON.stringify(p.rawData) : null,
                    },
                });

                imported++;

                if (syncStatus === 'DRAFT_CREATED' || matchedRule) {
                    await this.convertPostToNews(createdPost.id, {
                        category: matchedRule?.targetCategory || 'DUYURU',
                        autoPublish: matchedRule?.autoPublish || false,
                    });
                    drafted++;
                }
            }

            await prisma.socialSyncRun.update({
                where: { id: syncRun.id },
                data: {
                    status: 'SUCCESS',
                    postsImported: imported,
                    postsDrafted: drafted,
                    completedAt: new Date(),
                },
            });

            await prisma.socialAccount.update({
                where: { id: accountId },
                data: { lastSyncAt: new Date() },
            });

            await logAuditEvent({
                actorId: actor?.id,
                actorEmail: actor?.email,
                actorName: actor?.name,
                action: 'CREATE',
                entityType: 'SocialSyncRun',
                entityId: syncRun.id,
                diff: `SOCIAL_POST_IMPORTED: Account ${account.accountName} synced ${imported} new posts (${drafted} drafted)`,
            });

            return { success: true, imported, drafted, total: posts.length };
        } catch (err: any) {
            await prisma.socialSyncRun.update({
                where: { id: syncRun.id },
                data: {
                    status: 'FAILED',
                    errorMessage: err.message,
                    completedAt: new Date(),
                },
            });

            await logAuditEvent({
                actorId: actor?.id,
                actorEmail: actor?.email,
                actorName: actor?.name,
                action: 'UPDATE',
                entityType: 'SocialSyncRun',
                entityId: syncRun.id,
                diff: `SOCIAL_SYNC_FAILED: ${err.message}`,
            });

            throw err;
        }
    },

    // 5. Public Lightweight Widget
    async getPublicInstagramWidgetPosts(limit = 6) {
        try {
            return await prisma.socialPost.findMany({
                where: {
                    socialAccount: { isActive: true, provider: 'INSTAGRAM' },
                    syncStatus: { in: ['NEW', 'IMPORTED', 'DRAFT_CREATED', 'PUBLISHED'] },
                },
                select: {
                    id: true,
                    externalId: true,
                    caption: true,
                    mediaType: true,
                    mediaUrl: true,
                    thumbnailUrl: true,
                    permalink: true,
                    postDate: true,
                },
                orderBy: { postDate: 'desc' },
                take: limit,
            });
        } catch {
            return [];
        }
    },

    // 6. Webhook HMAC signature validator
    validateMetaWebhookSignature(payloadRaw: string, signatureHeader: string | null, appSecret: string): boolean {
        if (!signatureHeader || !appSecret) return false;
        const [algo, signature] = signatureHeader.split('=');
        if (algo !== 'sha256' || !signature) return false;

        const expected = crypto.createHmac('sha256', appSecret).update(payloadRaw).digest('hex');
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);

        if (sigBuf.length !== expBuf.length) return false;
        return crypto.timingSafeEqual(sigBuf, expBuf);
    },
};
