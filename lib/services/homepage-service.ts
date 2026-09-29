import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreateHeroSlideInput {
    title: string;
    subtitle?: string;
    badgeText?: string;
    description?: string;
    mediaType?: string; // IMAGE, VIDEO
    mediaUrl: string;
    mobileMediaUrl?: string;
    videoEmbedUrl?: string;
    overlayColor?: string;
    primaryCtaText?: string;
    primaryCtaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    statsJson?: Array<{ title: string; subtitle: string; icon?: string }>;
    sortOrder?: number;
    status?: string; // DRAFT, REVIEW, APPROVED, PUBLISHED, ARCHIVED
    startDate?: string | Date;
    endDate?: string | Date;
    isActive?: boolean;
}

export const HomepageService = {
    async getHeroSlides(includeDrafts = false) {
        const where: any = { isArchived: false };
        if (!includeDrafts) {
            where.status = 'PUBLISHED';
            where.isActive = true;
        }

        return prisma.heroSlide.findMany({
            where,
            orderBy: { sortOrder: 'asc' },
        });
    },

    async getSections() {
        return prisma.homepageSection.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    },

    async createHeroSlide(input: CreateHeroSlideInput, actor?: { id: string; name?: string }) {
        const slide = await prisma.heroSlide.create({
            data: {
                title: input.title,
                subtitle: input.subtitle,
                badgeText: input.badgeText,
                description: input.description,
                mediaType: input.mediaType || 'IMAGE',
                mediaUrl: input.mediaUrl,
                mobileMediaUrl: input.mobileMediaUrl,
                videoEmbedUrl: input.videoEmbedUrl,
                overlayColor: input.overlayColor || 'rgba(5, 5, 16, 0.7)',
                primaryCtaText: input.primaryCtaText || 'HEMEN BAŞVUR',
                primaryCtaLink: input.primaryCtaLink || '/basvuru',
                secondaryCtaText: input.secondaryCtaText || 'DETAYLI BİLGİ',
                secondaryCtaLink: input.secondaryCtaLink || '/programlar',
                statsJson: input.statsJson ? JSON.stringify(input.statsJson) : null,
                sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : 0,
                status: input.status || 'PUBLISHED',
                startDate: input.startDate ? new Date(input.startDate) : null,
                endDate: input.endDate ? new Date(input.endDate) : null,
                isActive: input.isActive !== undefined ? Boolean(input.isActive) : true,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'HeroSlide',
                entityId: slide.id,
                diff: `Hero Slide oluşturuldu: ${slide.title}`,
            });
        }

        return slide;
    },

    async updateHeroSlide(id: string, input: Partial<CreateHeroSlideInput>, actor?: { id: string; name?: string }) {
        const slide = await prisma.heroSlide.update({
            where: { id },
            data: {
                title: input.title,
                subtitle: input.subtitle,
                badgeText: input.badgeText,
                description: input.description,
                mediaType: input.mediaType,
                mediaUrl: input.mediaUrl,
                mobileMediaUrl: input.mobileMediaUrl,
                videoEmbedUrl: input.videoEmbedUrl,
                overlayColor: input.overlayColor,
                primaryCtaText: input.primaryCtaText,
                primaryCtaLink: input.primaryCtaLink,
                secondaryCtaText: input.secondaryCtaText,
                secondaryCtaLink: input.secondaryCtaLink,
                statsJson: input.statsJson ? JSON.stringify(input.statsJson) : undefined,
                sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : undefined,
                status: input.status,
                startDate: input.startDate ? new Date(input.startDate) : undefined,
                endDate: input.endDate ? new Date(input.endDate) : undefined,
                isActive: input.isActive,
            },
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'UPDATE',
                entityType: 'HeroSlide',
                entityId: slide.id,
                diff: `Hero Slide güncellendi: ${slide.title}`,
            });
        }

        return slide;
    },

    async updateSectionVisibility(sectionKey: string, isVisible: boolean) {
        return prisma.homepageSection.upsert({
            where: { sectionKey },
            update: { isVisible },
            create: {
                sectionKey,
                title: sectionKey,
                isVisible,
            },
        });
    },

    async updateSection(sectionKey: string, data: { title?: string; subtitle?: string; description?: string; customConfig?: string; isVisible?: boolean }, actor?: { id: string; name?: string }) {
        const updated = await prisma.homepageSection.upsert({
            where: { sectionKey },
            update: {
                title: data.title,
                subtitle: data.subtitle,
                description: data.description,
                customConfig: data.customConfig,
                isVisible: data.isVisible !== undefined ? data.isVisible : undefined,
            },
            create: {
                sectionKey,
                title: data.title || sectionKey,
                subtitle: data.subtitle,
                description: data.description,
                customConfig: data.customConfig,
                isVisible: data.isVisible !== undefined ? data.isVisible : true,
            }
        });

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'UPDATE',
                entityType: 'HomepageSection',
                entityId: updated.id,
                diff: `Ana sayfa bölümü güncellendi: ${sectionKey}`,
            });
        }

        return updated;
    },

    async reorderSections(orderedKeys: string[], actor?: { id: string; name?: string }) {
        const updates = orderedKeys.map((key, index) =>
            prisma.homepageSection.updateMany({
                where: { sectionKey: key },
                data: { sortOrder: index + 1 },
            })
        );
        await prisma.$transaction(updates);

        if (actor) {
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'REORDER',
                entityType: 'HomepageSection',
                diff: `Bölüm sırası güncellendi (${orderedKeys.length} bölüm)`,
            });
        }

        return this.getSections();
    },
};
