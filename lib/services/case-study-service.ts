import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CaseStudyData {
    title: string;
    slug?: string;
    summary?: string;
    entrepreneurId?: string;
    programId?: string;
    challenge?: string; // Maps to problem
    problem?: string;
    solution?: string;
    contribution?: string; // Maps to tekmerContribution
    tekmerContribution?: string;
    results?: string;
    metrics?: string; // Maps to metricsJson
    metricsJson?: string;
    featuredImage?: string; // Maps to imageUrl
    imageUrl?: string;
    logoUrl?: string;
    quote?: string;
    quoteAuthor?: string;
    ctaText?: string;
    ctaUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    isPublished?: boolean;
    featuredOrder?: number;
    sortOrder?: number;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

export const CaseStudyService = {
    // 1. Public Queries
    async getPublishedCaseStudies() {
        try {
            const items = await prisma.caseStudy.findMany({
                where: { isPublished: true },
                orderBy: { sortOrder: 'asc' },
                include: {
                    entrepreneur: {
                        select: { id: true, name: true, slug: true, sector: true, logoUrl: true },
                    },
                    program: {
                        select: { id: true, name: true, slug: true },
                    },
                },
            });

            return items.map((item) => ({
                ...item,
                challenge: item.problem,
                contribution: item.tekmerContribution,
                metrics: item.metricsJson,
                featuredImage: item.imageUrl,
                entrepreneur: item.entrepreneur ? { ...item.entrepreneur, companyName: item.entrepreneur.name } : null,
            }));
        } catch {
            return [];
        }
    },

    async getCaseStudyBySlug(slug: string) {
        try {
            const item = await prisma.caseStudy.findUnique({
                where: { slug },
                include: {
                    entrepreneur: {
                        select: { id: true, name: true, slug: true, sector: true, logoUrl: true, shortDesc: true },
                    },
                    program: {
                        select: { id: true, name: true, slug: true },
                    },
                },
            });

            if (!item) return null;

            return {
                ...item,
                challenge: item.problem,
                contribution: item.tekmerContribution,
                metrics: item.metricsJson,
                featuredImage: item.imageUrl,
                entrepreneur: item.entrepreneur ? { ...item.entrepreneur, companyName: item.entrepreneur.name } : null,
            };
        } catch {
            return null;
        }
    },

    // 2. Admin CRUD
    async getAllCaseStudies() {
        return prisma.caseStudy.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                entrepreneur: { select: { id: true, name: true } },
                program: { select: { id: true, name: true } },
            },
        });
    },

    async createCaseStudy(data: CaseStudyData, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const slug = data.slug || `${slugify(data.title)}-${Date.now().toString().slice(-4)}`;
        const created = await prisma.caseStudy.create({
            data: {
                title: data.title,
                slug,
                summary: data.summary,
                entrepreneurId: data.entrepreneurId,
                programId: data.programId,
                problem: data.problem || data.challenge,
                solution: data.solution,
                tekmerContribution: data.tekmerContribution || data.contribution,
                results: data.results,
                metricsJson: data.metricsJson || data.metrics,
                imageUrl: data.imageUrl || data.featuredImage,
                logoUrl: data.logoUrl,
                quote: data.quote,
                quoteAuthor: data.quoteAuthor,
                ctaText: data.ctaText,
                ctaUrl: data.ctaUrl,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                isPublished: data.isPublished || false,
                sortOrder: data.sortOrder || data.featuredOrder || 0,
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'CREATE',
            entityType: 'CaseStudy',
            entityId: created.id,
            diff: `CASE_STUDY_CREATED: ${created.title} (${created.slug})`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return created;
    },

    async updateCaseStudy(id: string, data: Partial<CaseStudyData>, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const updated = await prisma.caseStudy.update({
            where: { id },
            data: {
                ...(data.title ? { title: data.title } : {}),
                ...(data.slug ? { slug: data.slug } : {}),
                ...(data.summary !== undefined ? { summary: data.summary } : {}),
                ...(data.entrepreneurId !== undefined ? { entrepreneurId: data.entrepreneurId } : {}),
                ...(data.programId !== undefined ? { programId: data.programId } : {}),
                ...(data.problem !== undefined || data.challenge !== undefined ? { problem: data.problem || data.challenge } : {}),
                ...(data.solution !== undefined ? { solution: data.solution } : {}),
                ...(data.tekmerContribution !== undefined || data.contribution !== undefined ? { tekmerContribution: data.tekmerContribution || data.contribution } : {}),
                ...(data.results !== undefined ? { results: data.results } : {}),
                ...(data.metricsJson !== undefined || data.metrics !== undefined ? { metricsJson: data.metricsJson || data.metrics } : {}),
                ...(data.imageUrl !== undefined || data.featuredImage !== undefined ? { imageUrl: data.imageUrl || data.featuredImage } : {}),
                ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
                ...(data.quote !== undefined ? { quote: data.quote } : {}),
                ...(data.quoteAuthor !== undefined ? { quoteAuthor: data.quoteAuthor } : {}),
                ...(data.ctaText !== undefined ? { ctaText: data.ctaText } : {}),
                ...(data.ctaUrl !== undefined ? { ctaUrl: data.ctaUrl } : {}),
                ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle } : {}),
                ...(data.seoDescription !== undefined ? { seoDescription: data.seoDescription } : {}),
                ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
                ...(data.sortOrder !== undefined || data.featuredOrder !== undefined ? { sortOrder: data.sortOrder || data.featuredOrder } : {}),
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'CaseStudy',
            entityId: id,
            diff: `CASE_STUDY_UPDATED: ${updated.title}`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return updated;
    },

    async deleteCaseStudy(id: string, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const deleted = await prisma.caseStudy.delete({
            where: { id },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'DELETE',
            entityType: 'CaseStudy',
            entityId: id,
            diff: `CASE_STUDY_DELETED: ${deleted.title}`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return deleted;
    },
};
