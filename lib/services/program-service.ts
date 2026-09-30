import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createRevision } from '@/lib/revision';

export interface ContentBlock {
    id: string;
    type: 'richText' | 'textImage' | 'fullImage' | 'gallery' | 'video' | 'timeline' | 'benefits' | 'stats' | 'mentors' | 'trainings' | 'documents' | 'faq' | 'cta';
    title?: string;
    subtitle?: string;
    content?: string;
    imageUrl?: string;
    videoUrl?: string;
    layout?: 'left' | 'right' | 'center';
    items?: any[];
    sortOrder?: number;
    isVisible?: boolean;
}

export interface ProgramData {
    name: string;
    slug?: string;
    programType?: string;
    tagline?: string;
    shortDesc?: string;
    detailedDesc?: string;
    logoUrl?: string;
    heroUrl?: string;
    coverUrl?: string;
    mobileHeroUrl?: string;
    gallery?: string[];
    colorCode?: string;
    duration?: string;
    quota?: string;
    mentorHours?: string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    applyStartDate?: Date | string | null;
    applyEndDate?: Date | string | null;
    applyStatus?: string; // OPEN, UPCOMING, CLOSED
    targetAudience?: string;
    whoCanApply?: string;
    applicationCriteria?: string;
    timelineJson?: Array<{ stepNumber?: number; title: string; period?: string; description?: string; details?: string[] }>;
    benefitsJson?: Array<{ title: string; description: string; icon?: string }>;
    faqsJson?: Array<{ question: string; answer: string }>;
    documentsJson?: Array<{ title: string; fileUrl: string; type?: string; size?: string }>;
    contentBlocksJson?: ContentBlock[];
    features?: Array<{ title: string; desc: string; icon?: string }>;
    supports?: string[];
    modules?: Array<{ title: string; desc: string; duration?: string }>;
    jury?: string[];
    partners?: string[];
    programManager?: string;
    ctaTitle?: string;
    ctaDescription?: string;
    ctaText?: string;
    ctaLink?: string;
    formId?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    sortOrder?: number;
    seoTitle?: string;
    seoDescription?: string;
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

function parseJsonField(val: any, fallback: any = []) {
    if (!val) return fallback;
    if (typeof val !== 'string') return val;
    try {
        return JSON.parse(val);
    } catch {
        return fallback;
    }
}

function formatProgramItem(item: any) {
    if (!item) return null;
    return {
        ...item,
        gallery: parseJsonField(item.gallery, []),
        features: parseJsonField(item.features, []),
        supports: parseJsonField(item.supports, []),
        modules: parseJsonField(item.modules, []),
        jury: parseJsonField(item.jury, []),
        partners: parseJsonField(item.partners, []),
        timeline: parseJsonField(item.timelineJson, []),
        timelineJson: parseJsonField(item.timelineJson, []),
        benefits: parseJsonField(item.benefitsJson, []),
        benefitsJson: parseJsonField(item.benefitsJson, []),
        faqs: parseJsonField(item.faqsJson, []),
        faqsJson: parseJsonField(item.faqsJson, []),
        documents: parseJsonField(item.documentsJson, []),
        documentsJson: parseJsonField(item.documentsJson, []),
        contentBlocks: parseJsonField(item.contentBlocksJson, []),
        contentBlocksJson: parseJsonField(item.contentBlocksJson, []),
    };
}

function parseSafeDate(val: any): Date | null {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

function safeStringify(val: any): string | null {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return val;
    try {
        return JSON.stringify(val);
    } catch {
        return null;
    }
}

export const ProgramService = {
    async getPublicPrograms() {
        try {
            const list = await prisma.program.findMany({
                where: { isArchived: false, isPublished: true },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            });

            return list.map(formatProgramItem);
        } catch {
            return [];
        }
    },

    async getProgramBySlug(slug: string) {
        try {
            // Also handle slug aliases (e.g. antspark, antspark-on-kulucka)
            let item = await prisma.program.findFirst({
                where: {
                    OR: [
                        { slug },
                        { slug: slug.replace(/-/g, '') },
                        { slug: `${slug}-on-kulucka` },
                        { slug: `${slug}-kulucka` },
                        { slug: `${slug}-programi` },
                    ],
                    isArchived: false,
                },
            });

            if (!item) {
                // Try case-insensitive name match
                item = await prisma.program.findFirst({
                    where: {
                        name: { contains: slug.replace(/-/g, ' '), mode: 'insensitive' },
                        isArchived: false,
                    },
                });
            }

            return formatProgramItem(item);
        } catch {
            return null;
        }
    },

    async getAdminPrograms() {
        const list = await prisma.program.findMany({
            where: { isArchived: false },
            include: { _count: { select: { applications: true } } },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        });

        return list.map(formatProgramItem);
    },

    async getProgramById(id: string) {
        const item = await prisma.program.findUnique({ where: { id } });
        return formatProgramItem(item);
    },

    async createProgram(data: ProgramData, actor?: { id: string; name?: string; email?: string; ip?: string; userAgent?: string }) {
        const slug = data.slug || `${slugify(data.name)}-${Date.now().toString().slice(-4)}`;

        const program = await prisma.program.create({
            data: {
                name: data.name,
                slug,
                programType: data.programType || 'INCUBATION',
                tagline: data.tagline,
                shortDesc: data.shortDesc,
                detailedDesc: data.detailedDesc,
                logoUrl: data.logoUrl,
                heroUrl: data.heroUrl || data.coverUrl,
                coverUrl: data.coverUrl || data.heroUrl,
                mobileHeroUrl: data.mobileHeroUrl,
                gallery: safeStringify(data.gallery),
                colorCode: data.colorCode || 'from-purple-500 to-pink-500',
                duration: data.duration,
                quota: data.quota,
                mentorHours: data.mentorHours,
                startDate: parseSafeDate(data.startDate),
                endDate: parseSafeDate(data.endDate),
                applyStartDate: parseSafeDate(data.applyStartDate),
                applyEndDate: parseSafeDate(data.applyEndDate),
                applyStatus: data.applyStatus || 'OPEN',
                targetAudience: data.targetAudience,
                whoCanApply: data.whoCanApply,
                applicationCriteria: data.applicationCriteria,
                timelineJson: safeStringify(data.timelineJson),
                benefitsJson: safeStringify(data.benefitsJson),
                faqsJson: safeStringify(data.faqsJson),
                documentsJson: safeStringify(data.documentsJson),
                contentBlocksJson: safeStringify(data.contentBlocksJson),
                features: safeStringify(data.features),
                supports: safeStringify(data.supports),
                modules: safeStringify(data.modules),
                jury: safeStringify(data.jury),
                partners: safeStringify(data.partners),
                programManager: data.programManager,
                ctaTitle: data.ctaTitle,
                ctaDescription: data.ctaDescription,
                ctaText: data.ctaText || 'HEMEN BAŞVUR',
                ctaLink: data.ctaLink || '/basvuru',
                formId: data.formId,
                isFeatured: data.isFeatured ?? false,
                isPublished: data.isPublished ?? true,
                sortOrder: data.sortOrder ?? 0,
                seoTitle: data.seoTitle || data.name,
                seoDescription: data.seoDescription || data.shortDesc,
                ogImageUrl: data.ogImageUrl || data.coverUrl,
            },
        });

        // Revision snapshot
        await createRevision({
            entityType: 'Program',
            entityId: program.id,
            data: program,
            changeSummary: 'Initial creation',
            authorId: actor?.id,
            authorName: actor?.name,
        });

        // Audit Log
        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'CREATE',
            entityType: 'Program',
            entityId: program.id,
            newValues: program,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return formatProgramItem(program);
    },

    async updateProgram(id: string, data: Partial<ProgramData>, actor?: { id: string; name?: string; email?: string; ip?: string; userAgent?: string }) {
        const oldRecord = await prisma.program.findUnique({ where: { id } });
        if (!oldRecord) throw new Error('Program not found');

        const {
            id: _id,
            createdAt: _c,
            updatedAt: _u,
            _count: _cnt,
            timeline: _t,
            benefits: _b,
            faqs: _f,
            documents: _d,
            contentBlocks: _cb,
            applications: _app,
            trainings: _tr,
            mentorPrograms: _mp,
            projects: _pr,
            tasks: _tsk,
            activities: _act,
            caseStudies: _cs,
            ...cleanData
        }: any = data;

        const updatePayload: any = { ...cleanData };
        if (cleanData.gallery !== undefined) updatePayload.gallery = safeStringify(cleanData.gallery);
        if (cleanData.features !== undefined) updatePayload.features = safeStringify(cleanData.features);
        if (cleanData.supports !== undefined) updatePayload.supports = safeStringify(cleanData.supports);
        if (cleanData.modules !== undefined) updatePayload.modules = safeStringify(cleanData.modules);
        if (cleanData.jury !== undefined) updatePayload.jury = safeStringify(cleanData.jury);
        if (cleanData.partners !== undefined) updatePayload.partners = safeStringify(cleanData.partners);
        if (cleanData.timelineJson !== undefined) updatePayload.timelineJson = safeStringify(cleanData.timelineJson);
        if (cleanData.benefitsJson !== undefined) updatePayload.benefitsJson = safeStringify(cleanData.benefitsJson);
        if (cleanData.faqsJson !== undefined) updatePayload.faqsJson = safeStringify(cleanData.faqsJson);
        if (cleanData.documentsJson !== undefined) updatePayload.documentsJson = safeStringify(cleanData.documentsJson);
        if (cleanData.contentBlocksJson !== undefined) updatePayload.contentBlocksJson = safeStringify(cleanData.contentBlocksJson);

        if (cleanData.startDate !== undefined) updatePayload.startDate = parseSafeDate(cleanData.startDate);
        if (cleanData.endDate !== undefined) updatePayload.endDate = parseSafeDate(cleanData.endDate);
        if (cleanData.applyStartDate !== undefined) updatePayload.applyStartDate = parseSafeDate(cleanData.applyStartDate);
        if (cleanData.applyEndDate !== undefined) updatePayload.applyEndDate = parseSafeDate(cleanData.applyEndDate);

        const updated = await prisma.program.update({
            where: { id },
            data: updatePayload,
        });

        // Revision snapshot
        await createRevision({
            entityType: 'Program',
            entityId: id,
            data: updated,
            changeSummary: 'Updated program details and blocks',
            authorId: actor?.id,
            authorName: actor?.name,
        });

        // Audit Log
        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'Program',
            entityId: id,
            oldValues: oldRecord,
            newValues: updated,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return formatProgramItem(updated);
    },

    async deleteProgram(id: string, actor?: { id: string; name?: string; email?: string; ip?: string; userAgent?: string }) {
        const record = await prisma.program.findUnique({ where: { id } });
        if (!record) throw new Error('Program not found');

        const archived = await prisma.program.update({
            where: { id },
            data: { isArchived: true, applyStatus: 'CLOSED', isPublished: false },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'DELETE',
            entityType: 'Program',
            entityId: id,
            diff: `Archived program ${record.name}`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return formatProgramItem(archived);
    }
};
