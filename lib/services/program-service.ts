import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createRevision } from '@/lib/revision';

export interface ProgramData {
    name: string;
    slug?: string;
    programType?: string;
    tagline?: string;
    shortDesc?: string;
    detailedDesc?: string;
    logoUrl?: string;
    coverUrl?: string;
    gallery?: string[];
    colorCode?: string;
    duration?: string;
    quota?: string;
    mentorHours?: string;
    startDate?: Date;
    endDate?: Date;
    applyStartDate?: Date;
    applyEndDate?: Date;
    applyStatus?: string;
    features?: Array<{ title: string; desc: string; icon?: string }>;
    supports?: string[];
    modules?: Array<{ title: string; desc: string; duration?: string }>;
    jury?: string[];
    partners?: string[];
    programManager?: string;
    ctaText?: string;
    ctaLink?: string;
    isFeatured?: boolean;
    sortOrder?: number;
    seoTitle?: string;
    seoDescription?: string;
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

export const ProgramService = {
    async getPublicPrograms() {
        try {
            const list = await prisma.program.findMany({
                where: { isArchived: false },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            });

            return list.map((item: any) => ({
                ...item,
                gallery: item.gallery ? JSON.parse(item.gallery) : [],
                features: item.features ? JSON.parse(item.features) : [],
                supports: item.supports ? JSON.parse(item.supports) : [],
                modules: item.modules ? JSON.parse(item.modules) : [],
                jury: item.jury ? JSON.parse(item.jury) : [],
                partners: item.partners ? JSON.parse(item.partners) : [],
            }));
        } catch {
            return [];
        }
    },

    async getProgramBySlug(slug: string) {
        const item = await prisma.program.findUnique({ where: { slug } });
        if (!item) return null;

        return {
            ...item,
            gallery: item.gallery ? JSON.parse(item.gallery) : [],
            features: item.features ? JSON.parse(item.features) : [],
            supports: item.supports ? JSON.parse(item.supports) : [],
            modules: item.modules ? JSON.parse(item.modules) : [],
            jury: item.jury ? JSON.parse(item.jury) : [],
            partners: item.partners ? JSON.parse(item.partners) : [],
        };
    },

    async getAdminPrograms() {
        const list = await prisma.program.findMany({
            where: { isArchived: false },
            include: { _count: { select: { applications: true } } },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        });

        return list.map((item: any) => ({
            ...item,
            gallery: item.gallery ? JSON.parse(item.gallery) : [],
            features: item.features ? JSON.parse(item.features) : [],
            supports: item.supports ? JSON.parse(item.supports) : [],
            modules: item.modules ? JSON.parse(item.modules) : [],
            jury: item.jury ? JSON.parse(item.jury) : [],
            partners: item.partners ? JSON.parse(item.partners) : [],
        }));
    },

    async createProgram(data: ProgramData, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const slug = data.slug || `${slugify(data.name)}-${Date.now().toString().slice(-4)}`;

        const program = await prisma.program.create({
            data: {
                name: data.name,
                slug,
                programType: data.programType,
                tagline: data.tagline,
                shortDesc: data.shortDesc,
                detailedDesc: data.detailedDesc,
                logoUrl: data.logoUrl,
                coverUrl: data.coverUrl,
                gallery: data.gallery ? JSON.stringify(data.gallery) : null,
                colorCode: data.colorCode,
                duration: data.duration,
                quota: data.quota,
                mentorHours: data.mentorHours,
                startDate: data.startDate,
                endDate: data.endDate,
                applyStartDate: data.applyStartDate,
                applyEndDate: data.applyEndDate,
                applyStatus: data.applyStatus || 'OPEN',
                features: data.features ? JSON.stringify(data.features) : null,
                supports: data.supports ? JSON.stringify(data.supports) : null,
                modules: data.modules ? JSON.stringify(data.modules) : null,
                jury: data.jury ? JSON.stringify(data.jury) : null,
                partners: data.partners ? JSON.stringify(data.partners) : null,
                programManager: data.programManager,
                ctaText: data.ctaText || 'HEMEN BAŞVUR',
                ctaLink: data.ctaLink || '/basvuru',
                isFeatured: data.isFeatured ?? false,
                sortOrder: data.sortOrder ?? 0,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
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

        return program;
    },

    async updateProgram(id: string, data: Partial<ProgramData>, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const oldRecord = await prisma.program.findUnique({ where: { id } });
        if (!oldRecord) throw new Error('Program not found');

        const updatePayload: any = { ...data };
        if (data.gallery) updatePayload.gallery = JSON.stringify(data.gallery);
        if (data.features) updatePayload.features = JSON.stringify(data.features);
        if (data.supports) updatePayload.supports = JSON.stringify(data.supports);
        if (data.modules) updatePayload.modules = JSON.stringify(data.modules);
        if (data.jury) updatePayload.jury = JSON.stringify(data.jury);
        if (data.partners) updatePayload.partners = JSON.stringify(data.partners);

        const updated = await prisma.program.update({
            where: { id },
            data: updatePayload,
        });

        // Revision snapshot
        await createRevision({
            entityType: 'Program',
            entityId: id,
            data: updated,
            changeSummary: 'Updated program details',
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

        return updated;
    },

    async deleteProgram(id: string, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const record = await prisma.program.findUnique({ where: { id } });
        if (!record) throw new Error('Program not found');

        const archived = await prisma.program.update({
            where: { id },
            data: { isArchived: true, applyStatus: 'CLOSED' },
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

        return archived;
    }
};
