import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createRevision } from '@/lib/revision';

export interface EntrepreneurData {
    name: string;
    slug?: string;
    logoUrl?: string;
    coverUrl?: string;
    sector: string;
    subSector?: string;
    shortDesc?: string;
    longDesc?: string;
    keywords?: string[];
    founders?: string;
    website?: string;
    linkedin?: string;
    instagram?: string;
    otherSocials?: Record<string, string>;
    email?: string;
    phone?: string;
    program?: string;
    incubationType?: string;
    startDate?: Date;
    graduationDate?: Date;
    status?: string;
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

export const EntrepreneurService = {
    async getPublicEntrepreneurs() {
        try {
            const list = await prisma.entrepreneur.findMany({
                where: { status: 'ACTIVE', isArchived: false },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    logoUrl: true,
                    coverUrl: true,
                    sector: true,
                    subSector: true,
                    shortDesc: true,
                    longDesc: true,
                    keywords: true,
                    founders: true,
                    website: true,
                    linkedin: true,
                    instagram: true,
                    program: true,
                    incubationType: true,
                    startDate: true,
                    isFeatured: true,
                    sortOrder: true,
                },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            });

            return list.map((item: any) => ({
                ...item,
                keywords: item.keywords ? (typeof item.keywords === 'string' ? JSON.parse(item.keywords) : item.keywords) : [],
            }));
        } catch {
            return [];
        }
    },

    async getAdminEntrepreneurs(params?: {
        search?: string;
        status?: string;
        sector?: string;
        isFeatured?: boolean;
        page?: number;
        limit?: number;
    }) {
        const { search, status, sector, isFeatured, page = 1, limit = 50 } = params || {};
        const where: any = { isArchived: false };

        if (status) where.status = status;
        if (sector) where.sector = { contains: sector, mode: 'insensitive' };
        if (isFeatured !== undefined) where.isFeatured = isFeatured;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sector: { contains: search, mode: 'insensitive' } },
                { shortDesc: { contains: search, mode: 'insensitive' } },
                { keywords: { contains: search, mode: 'insensitive' } },
                { founders: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.entrepreneur.findMany({
                where,
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.entrepreneur.count({ where }),
        ]);

        return {
            items: items.map((item: any) => ({
                ...item,
                keywords: item.keywords ? JSON.parse(item.keywords) : [],
                otherSocials: item.otherSocials ? JSON.parse(item.otherSocials) : {},
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },

    async getEntrepreneurById(id: string, includeRelational = true) {
        const item = await prisma.entrepreneur.findUnique({
            where: { id },
            include: includeRelational
                ? {
                      founderMembers: { orderBy: { sortOrder: 'asc' } },
                      relationalInvestments: { orderBy: { investmentDate: 'desc' } },
                      relationalPatents: { orderBy: { createdAt: 'desc' } },
                      relationalGrants: { orderBy: { createdAt: 'desc' } },
                      relationalMilestones: { orderBy: { milestoneDate: 'asc' } },
                      relationalDocuments: { orderBy: { createdAt: 'desc' } },
                      galleryImages: { orderBy: { sortOrder: 'asc' } },
                  }
                : undefined,
        });
        if (!item) return null;

        return {
            ...item,
            keywords: item.keywords ? JSON.parse(item.keywords) : [],
            otherSocials: item.otherSocials ? JSON.parse(item.otherSocials) : {},
        };
    },

    // Relational sub-entity managers
    async addFounder(entrepreneurId: string, founder: { fullName: string; title?: string; email?: string; phone?: string; avatarUrl?: string; bio?: string; linkedin?: string; isLead?: boolean }) {
        return prisma.entrepreneurFounder.create({
            data: { entrepreneurId, ...founder },
        });
    },

    async addInvestment(entrepreneurId: string, investment: { investorName: string; round: string; amount: number; currency?: string; valuation?: number; investmentDate: Date | string; isPublic?: boolean; notes?: string }) {
        return prisma.entrepreneurInvestment.create({
            data: {
                entrepreneurId,
                ...investment,
                investmentDate: new Date(investment.investmentDate),
            },
        });
    },

    async addPatent(entrepreneurId: string, patent: { title: string; applicationNumber?: string; registrationNumber?: string; patentType?: string; status?: string; filingDate?: Date | string; grantDate?: Date | string; documentUrl?: string; notes?: string }) {
        return prisma.entrepreneurPatent.create({
            data: {
                entrepreneurId,
                ...patent,
                filingDate: patent.filingDate ? new Date(patent.filingDate) : null,
                grantDate: patent.grantDate ? new Date(patent.grantDate) : null,
            },
        });
    },

    async addGrant(entrepreneurId: string, grant: { grantorName: string; programName: string; grantAmount: number; currency?: string; status?: string; awardedDate?: Date | string; projectCode?: string; notes?: string }) {
        return prisma.entrepreneurGrant.create({
            data: {
                entrepreneurId,
                ...grant,
                awardedDate: grant.awardedDate ? new Date(grant.awardedDate) : null,
            },
        });
    },

    async addMilestone(entrepreneurId: string, milestone: { title: string; description?: string; milestoneDate: Date | string; isCompleted?: boolean; sortOrder?: number }) {
        return prisma.entrepreneurMilestone.create({
            data: {
                entrepreneurId,
                ...milestone,
                milestoneDate: new Date(milestone.milestoneDate),
            },
        });
    },

    async addDocument(entrepreneurId: string, doc: { title: string; fileUrl: string; fileType?: string; fileSize?: number; mimeType?: string; isConfidential?: boolean }) {
        return prisma.entrepreneurDocument.create({
            data: { entrepreneurId, ...doc },
        });
    },

    async addGalleryImage(entrepreneurId: string, img: { imageUrl: string; caption?: string; sortOrder?: number }) {
        return prisma.entrepreneurGallery.create({
            data: { entrepreneurId, ...img },
        });
    },

    async createEntrepreneur(data: EntrepreneurData, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const slug = data.slug || `${slugify(data.name)}-${Date.now().toString().slice(-4)}`;

        const entrepreneur = await prisma.entrepreneur.create({
            data: {
                name: data.name,
                slug,
                logoUrl: data.logoUrl,
                coverUrl: data.coverUrl,
                sector: data.sector,
                subSector: data.subSector,
                shortDesc: data.shortDesc,
                longDesc: data.longDesc,
                keywords: data.keywords ? JSON.stringify(data.keywords) : null,
                founders: data.founders,
                website: data.website,
                linkedin: data.linkedin,
                instagram: data.instagram,
                otherSocials: data.otherSocials ? JSON.stringify(data.otherSocials) : null,
                email: data.email,
                phone: data.phone,
                program: data.program,
                incubationType: data.incubationType,
                startDate: data.startDate,
                graduationDate: data.graduationDate,
                status: data.status || 'ACTIVE',
                isFeatured: data.isFeatured ?? false,
                sortOrder: data.sortOrder ?? 0,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
            },
        });

        // Revision snapshot
        await createRevision({
            entityType: 'Entrepreneur',
            entityId: entrepreneur.id,
            data: entrepreneur,
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
            entityType: 'Entrepreneur',
            entityId: entrepreneur.id,
            newValues: entrepreneur,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return entrepreneur;
    },

    async updateEntrepreneur(id: string, data: Partial<EntrepreneurData>, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const oldRecord = await prisma.entrepreneur.findUnique({ where: { id } });
        if (!oldRecord) throw new Error('Entrepreneur not found');

        const updatePayload: any = { ...data };
        if (data.keywords) updatePayload.keywords = JSON.stringify(data.keywords);
        if (data.otherSocials) updatePayload.otherSocials = JSON.stringify(data.otherSocials);

        const updated = await prisma.entrepreneur.update({
            where: { id },
            data: updatePayload,
        });

        // Revision snapshot
        await createRevision({
            entityType: 'Entrepreneur',
            entityId: id,
            data: updated,
            changeSummary: 'Updated entrepreneur details',
            authorId: actor?.id,
            authorName: actor?.name,
        });

        // Audit Log
        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'Entrepreneur',
            entityId: id,
            oldValues: oldRecord,
            newValues: updated,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return updated;
    },

    async deleteEntrepreneur(id: string, actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string }) {
        const record = await prisma.entrepreneur.findUnique({ where: { id } });
        if (!record) throw new Error('Entrepreneur not found');

        const archived = await prisma.entrepreneur.update({
            where: { id },
            data: { isArchived: true, status: 'PASSIVE' },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'DELETE',
            entityType: 'Entrepreneur',
            entityId: id,
            diff: `Archived entrepreneur ${record.name}`,
            ipAddress: actor?.ip,
            userAgent: actor?.userAgent,
        });

        return archived;
    },

    async reorderEntrepreneurs(ids: string[], actor?: { id: string; name: string; email: string }) {
        for (let i = 0; i < ids.length; i++) {
            await prisma.entrepreneur.update({
                where: { id: ids[i] },
                data: { sortOrder: i },
            });
        }
        await logAuditEvent({
            actorId: actor?.id,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'Entrepreneur',
            diff: `Reordered ${ids.length} entrepreneurs`,
        });
    }
};
