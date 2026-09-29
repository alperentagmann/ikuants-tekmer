/**
 * İKÜANTS TEKMER — Knowledge Base & Internal Wiki Service
 * 
 * Manages operational guides, procedures, compliance rules,
 * and new personnel onboarding checklists.
 */

import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreateKnowledgeArticleInput {
    title: string;
    slug: string;
    category: string;
    content: string;
    excerpt?: string;
    audience?: 'ALL' | 'STAFF' | 'ENTREPRENEUR' | 'MENTOR';
    tags?: string[];
    checklist?: { task: string; completed: boolean }[];
    authorId?: string;
}

export class KnowledgeService {
    /**
     * Get articles filtered by category, audience or search
     */
    static async getArticles(filters?: {
        category?: string;
        audience?: string;
        search?: string;
    }) {
        const where: any = { isPublished: true };
        if (filters?.category && filters.category !== 'ALL') {
            where.category = filters.category;
        }
        if (filters?.audience && filters.audience !== 'ALL') {
            where.audience = { in: [filters.audience, 'ALL'] };
        }
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { content: { contains: filters.search, mode: 'insensitive' } },
                { tags: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return prisma.knowledgeArticle.findMany({
            where,
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get single article by slug and increment view count
     */
    static async getArticleBySlug(slug: string) {
        const article = await prisma.knowledgeArticle.findUnique({
            where: { slug },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        });

        if (article) {
            await prisma.knowledgeArticle.update({
                where: { id: article.id },
                data: { viewCount: { increment: 1 } },
            });
        }

        return article;
    }

    /**
     * Create knowledge article
     */
    static async createArticle(input: CreateKnowledgeArticleInput) {
        const article = await prisma.knowledgeArticle.create({
            data: {
                title: input.title,
                slug: input.slug,
                category: input.category,
                content: input.content,
                excerpt: input.excerpt,
                audience: input.audience || 'STAFF',
                tags: input.tags ? JSON.stringify(input.tags) : null,
                checklist: input.checklist ? JSON.stringify(input.checklist) : null,
                authorId: input.authorId,
                isPublished: true,
            },
            include: { author: true },
        });

        if (input.authorId) {
            await logAuditEvent({
                actorId: input.authorId,
                action: 'CREATE_KNOWLEDGE_ARTICLE',
                entityType: 'KnowledgeArticle',
                entityId: article.id,
                diff: JSON.stringify({ title: article.title, category: article.category }),
            });
        }

        return article;
    }

    /**
     * Update checklist item completion
     */
    static async toggleChecklistItem(articleId: string, itemIndex: number, userId: string) {
        const article = await prisma.knowledgeArticle.findUnique({ where: { id: articleId } });
        if (!article || !article.checklist) throw new Error('Madde bulunamadı.');

        let items: { task: string; completed: boolean }[] = [];
        try {
            items = JSON.parse(article.checklist);
        } catch {
            items = [];
        }

        if (items[itemIndex]) {
            items[itemIndex].completed = !items[itemIndex].completed;
        }

        const updated = await prisma.knowledgeArticle.update({
            where: { id: articleId },
            data: { checklist: JSON.stringify(items) },
        });

        await logAuditEvent({
            actorId: userId,
            action: 'UPDATE_CHECKLIST_PROGRESS',
            entityType: 'KnowledgeArticle',
            entityId: articleId,
            diff: `Checklist item ${itemIndex} toggled`,
        });

        return updated;
    }
}
