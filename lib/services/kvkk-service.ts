import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { hasPermission } from '@/lib/rbac';
import { maskTcNumber } from '@/lib/utils';

export interface KvkkConsentFilter {
    search?: string;
    subjectType?: string;
    status?: string;
    sourceChannel?: string;
    textVersionId?: string;
    startDate?: Date;
    endDate?: Date;
}

export class KvkkService {
    static async getTextVersions() {
        return prisma.kvkkTextVersion.findMany({
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            include: {
                _count: { select: { consents: true } },
            },
        });
    }

    static async createTextVersion(data: {
        title: string;
        version: string;
        content: string;
        summary?: string;
        consentTypes?: string[];
        isPublished?: boolean;
    }, actorId?: string) {
        const textVersion = await prisma.kvkkTextVersion.create({
            data: {
                title: data.title,
                version: data.version,
                content: data.content,
                summary: data.summary || null,
                consentTypes: data.consentTypes ? JSON.stringify(data.consentTypes) : JSON.stringify(['DATA_PROCESSING', 'COMMUNICATION']),
                isPublished: data.isPublished !== undefined ? data.isPublished : true,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'KvkkTextVersion',
            entityId: textVersion.id,
            newValues: { title: textVersion.title, version: textVersion.version },
        });

        return textVersion;
    }

    static async getConsents(filters?: KvkkConsentFilter, actor?: any) {
        const where: any = {};

        if (filters?.search) {
            where.OR = [
                { fullName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search, mode: 'insensitive' } },
                { organizationName: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters?.subjectType && filters.subjectType !== 'ALL') {
            where.subjectType = filters.subjectType;
        }

        if (filters?.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }

        if (filters?.sourceChannel && filters.sourceChannel !== 'ALL') {
            where.sourceChannel = filters.sourceChannel;
        }

        if (filters?.textVersionId && filters.textVersionId !== 'ALL') {
            where.textVersionId = filters.textVersionId;
        }

        if (filters?.startDate || filters?.endDate) {
            where.consentedAt = {};
            if (filters.startDate) where.consentedAt.gte = filters.startDate;
            if (filters.endDate) where.consentedAt.lte = filters.endDate;
        }

        const consents = await prisma.kvkkConsent.findMany({
            where,
            include: {
                textVersion: { select: { id: true, title: true, version: true } },
                entrepreneur: { select: { id: true, name: true } },
                mentor: { select: { id: true, name: true, surname: true } },
            },
            orderBy: [{ consentedAt: 'desc' }, { createdAt: 'desc' }],
        });

        const canViewSensitive = actor?.isSuperAdmin || hasPermission(actor, 'view_sensitive', 'kvkk');

        // Log sensitive access if actor viewed consents
        if (actor?.id && !canViewSensitive) {
            // Mask phone/tc/sensitive fields for regular admins
            return consents.map(c => ({
                ...c,
                tcNumberMasked: c.tcNumberMasked ? maskTcNumber(c.tcNumberMasked) : null,
                phone: c.phone ? c.phone.replace(/(\d{3})\d{4}(\d{2})/, '$1****$2') : null,
            }));
        }

        return consents;
    }

    static async recordConsent(data: any, actorId?: string) {
        const fullName = data.fullName || data.personName;
        const subjectType = data.subjectType || data.dataSubjectType || 'APPLICANT';
        const email = data.email || data.personEmail || null;
        const phone = data.phone || data.personPhone || null;

        if (!fullName) {
            throw new Error('İsim zorunludur');
        }

        // If no textVersionId provided, link to latest published version
        let versionId = data.textVersionId;
        if (!versionId) {
            const latest = await prisma.kvkkTextVersion.findFirst({
                where: { isPublished: true },
                orderBy: { publishedAt: 'desc' },
            });
            if (latest) {
                versionId = latest.id;
            } else {
                const createdVer = await prisma.kvkkTextVersion.create({
                    data: {
                        title: 'Genel Aydınlatma ve Açık Rıza Metni',
                        version: 'v1.0',
                        content: 'İKÜANTS TEKMER Genel Aydınlatma Metni',
                        consentTypes: JSON.stringify(['DATA_PROCESSING', 'MARKETING_COMMUNICATION']),
                        isPublished: true,
                    },
                });
                versionId = createdVer.id;
            }
        }

        const consent = await prisma.kvkkConsent.create({
            data: {
                subjectType,
                fullName,
                email,
                phone,
                tcNumberMasked: data.tcNumber ? maskTcNumber(data.tcNumber) : null,
                organizationName: data.organizationName || null,
                sourceChannel: data.sourceChannel || data.sourceForm || 'ADMIN_PANEL',
                sourceFormId: data.sourceFormId || null,
                sourceSubmissionId: data.sourceSubmissionId || null,
                textVersionId: versionId,
                isExplicitConsent: data.isExplicitConsent !== undefined ? Boolean(data.isExplicitConsent) : true,
                allowCommunication: data.allowCommunication !== undefined ? Boolean(data.allowCommunication) : true,
                allowMediaUse: Boolean(data.allowMediaUse),
                allowMarketing: Boolean(data.allowMarketing),
                evidenceDocumentUrl: data.evidenceDocumentUrl || null,
                notes: data.notes || null,
                status: data.status || 'ACTIVE',
                consentedAt: data.consentedAt ? new Date(data.consentedAt) : new Date(),
                entrepreneurId: data.entrepreneurId || null,
                mentorId: data.mentorId || null,
                createdById: actorId || null,
            },
            include: {
                textVersion: { select: { id: true, title: true, version: true } },
            },
        });

        await logAuditEvent({
            actorId,
            action: 'CREATE',
            entityType: 'KvkkConsent',
            entityId: consent.id,
            newValues: { fullName: consent.fullName, subjectType: consent.subjectType, status: consent.status },
        });

        return consent;
    }

    static async withdrawConsent(id: string, reason?: string, actorId?: string) {
        const existing = await prisma.kvkkConsent.findUnique({ where: { id } });
        if (!existing) throw new Error('Açık rıza kaydı bulunamadı');

        const updated = await prisma.kvkkConsent.update({
            where: { id },
            data: {
                status: 'WITHDRAWN',
                withdrawnAt: new Date(),
                notes: reason ? `${existing.notes || ''}\n[Geri Çekme Gerekçesi]: ${reason}`.trim() : existing.notes,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'KvkkConsent',
            entityId: id,
            oldValues: { status: existing.status },
            newValues: { status: 'WITHDRAWN', withdrawnAt: updated.withdrawnAt, reason },
        });

        return updated;
    }
}
