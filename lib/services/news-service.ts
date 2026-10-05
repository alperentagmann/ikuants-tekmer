import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createRevision } from '@/lib/revision';

export interface NewsData {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    coverImage?: string;
    gallery?: string[];
    videoUrl?: string;
    fileAttachment?: string;
    categoryId?: string;
    tags?: string[];
    author?: string;
    publishedAt?: Date;
    eventDate?: string;
    registrationLink?: string;
    isFeatured?: boolean;
    showOnHome?: boolean;
    status?: string;
    scheduledPublishAt?: Date;
    seoTitle?: string;
    seoDescription?: string;
    canonicalUrl?: string;
    ogImageUrl?: string;
}

function slugify(text: string): string {
    const trMap: Record<string, string> = {
        'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i',
        'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
    };
    return text
        .split('')
        .map(char => trMap[char] || char)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

export const NewsService = {
    async getPublicNews(params?: { category?: string; limit?: number }) {
        try {
            // Auto-publish scheduled items if due
            await prisma.news.updateMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledPublishAt: { lte: new Date() },
                },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                },
            });

            const where: any = {
                status: 'PUBLISHED',
                isArchived: false,
            };

            if (params?.category && params.category !== 'Tümü') {
                where.category = { name: params.category };
            }

            const items = await prisma.news.findMany({
                where,
                include: { category: true },
                orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
                take: params?.limit || 100,
            });

            return items.map((item: any) => ({
                id: item.id,
                title: item.title,
                slug: item.slug,
                excerpt: item.excerpt || '',
                fullContent: item.content,
                date: item.eventDate || (item.publishedAt ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(item.publishedAt)) : ''),
                category: item.category?.name || 'Duyuru',
                image: item.coverImage || '/images/news-placeholder.jpg',
                gallery: item.gallery ? JSON.parse(item.gallery) : [],
                featured: item.isFeatured,
                registrationLink: item.registrationLink || undefined,
            }));
        } catch {
            return [];
        }
    },

    /** One published article by slug (detail page) plus a few recent ones for "related news". */
    async getPublicBySlug(slug: string) {
        const item = await prisma.news.findFirst({ where: { slug, status: 'PUBLISHED', isArchived: false }, include: { category: true } });
        if (!item) return null;
        const related = await prisma.news.findMany({
            where: { status: 'PUBLISHED', isArchived: false, id: { not: item.id } },
            include: { category: true },
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            take: 3,
        });
        await prisma.news.update({ where: { id: item.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
        const shape = (n: typeof item) => ({
            id: n.id,
            title: n.title,
            slug: n.slug,
            excerpt: n.excerpt || '',
            content: n.content,
            date: n.eventDate || (n.publishedAt ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(n.publishedAt) : ''),
            publishedAt: n.publishedAt,
            updatedAt: n.updatedAt,
            category: n.category?.name || 'Duyuru',
            image: n.coverImage || null,
            imageAlt: n.coverAltText || n.title,
            gallery: (() => {
                try {
                    const g = n.gallery ? JSON.parse(n.gallery) : [];
                    return Array.isArray(g) ? g.filter((x): x is string => typeof x === 'string') : [];
                } catch {
                    return [];
                }
            })(),
            registrationLink: n.registrationLink || null,
            videoUrl: n.videoUrl || null,
            seoTitle: n.seoTitle || null,
            seoDescription: n.seoDescription || null,
        });
        return { item: shape(item), related: related.map(shape) };
    },

    async getAdminNews(params?: {
        search?: string;
        status?: string;
        categoryId?: string;
        page?: number;
        limit?: number;
    }) {
        const { search, status, categoryId, page = 1, limit = 50 } = params || {};
        const where: any = { isArchived: false };

        if (status) where.status = status;
        if (categoryId) where.categoryId = categoryId;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { excerpt: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.news.findMany({
                where,
                include: { category: true },
                orderBy: [{ createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.news.count({ where }),
        ]);

        return {
            items: items.map((item: any) => ({
                ...item,
                gallery: item.gallery ? JSON.parse(item.gallery) : [],
                tags: item.tags ? JSON.parse(item.tags) : [],
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },

    async getNewsById(id: string) {
        const item = await prisma.news.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!item) return null;

        return {
            ...item,
            gallery: item.gallery ? JSON.parse(item.gallery) : [],
            tags: item.tags ? JSON.parse(item.tags) : [],
        };
    },

    async createNews(data: NewsData, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const slug = data.slug || `${slugify(data.title)}-${Date.now().toString().slice(-4)}`;
        const status = data.status || 'DRAFT';
        const publishedAt = status === 'PUBLISHED' ? (data.publishedAt || new Date()) : null;

        const news = await prisma.news.create({
            data: {
                title: data.title,
                slug,
                excerpt: data.excerpt,
                content: data.content,
                coverImage: data.coverImage,
                gallery: data.gallery ? JSON.stringify(data.gallery) : null,
                videoUrl: data.videoUrl,
                fileAttachment: data.fileAttachment,
                categoryId: data.categoryId,
                tags: data.tags ? JSON.stringify(data.tags) : null,
                author: data.author || actor?.name,
                publishedAt,
                eventDate: data.eventDate,
                registrationLink: data.registrationLink,
                isFeatured: data.isFeatured ?? false,
                showOnHome: data.showOnHome ?? false,
                status,
                scheduledPublishAt: data.scheduledPublishAt,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                canonicalUrl: data.canonicalUrl,
                ogImageUrl: data.ogImageUrl,
            },
        });

        // Revision snapshot
        await createRevision({
            entityType: 'News',
            entityId: news.id,
            data: news,
            changeSummary: `Created (${status})`,
            authorId: actor?.id,
            authorName: actor?.name,
        });

        // Audit Log
        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'CREATE',
            entityType: 'News',
            entityId: news.id,
            newValues: news,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return news;
    },

    async updateNews(id: string, data: Partial<NewsData>, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const oldRecord = await prisma.news.findUnique({ where: { id } });
        if (!oldRecord) throw new Error('News item not found');

        const updatePayload: any = { ...data };
        if (data.gallery) updatePayload.gallery = JSON.stringify(data.gallery);
        if (data.tags) updatePayload.tags = JSON.stringify(data.tags);

        if (data.status === 'PUBLISHED' && !oldRecord.publishedAt && !data.publishedAt) {
            updatePayload.publishedAt = new Date();
        }

        const updated = await prisma.news.update({
            where: { id },
            data: updatePayload,
        });

        // Revision snapshot
        await createRevision({
            entityType: 'News',
            entityId: id,
            data: updated,
            changeSummary: `Updated (Status: ${updated.status})`,
            authorId: actor?.id,
            authorName: actor?.name,
        });

        // Audit Log
        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: data.status === 'PUBLISHED' && oldRecord.status !== 'PUBLISHED' ? 'PUBLISH' : 'UPDATE',
            entityType: 'News',
            entityId: id,
            oldValues: oldRecord,
            newValues: updated,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return updated;
    },

    async deleteNews(id: string, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const record = await prisma.news.findUnique({ where: { id } });
        if (!record) throw new Error('News item not found');

        const archived = await prisma.news.update({
            where: { id },
            data: { isArchived: true, status: 'ARCHIVED' },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'DELETE',
            entityType: 'News',
            entityId: id,
            diff: `Archived news ${record.title}`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return archived;
    }
};
