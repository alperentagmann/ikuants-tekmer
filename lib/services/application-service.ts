import { prisma } from '@/lib/prisma';
import { encryptTcNumber } from '@/lib/security/identity-security';
import { DomainError } from '@/lib/errors';
import { getCampaignStages } from '@/lib/services/application-campaign-service';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';
import { EntrepreneurService } from '@/lib/services/entrepreneur-service';
import { EntrepreneurProgramService } from '@/lib/services/entrepreneur-program-service';
import { logAuditEvent } from '@/lib/audit';
import { addTimelineEvent } from '@/lib/timeline';
import { maskTcNumber } from '@/lib/utils';

import { APPLICATION_STATUSES } from '@/lib/constants/application';
export { APPLICATION_STATUSES };


export async function generateApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.application.count();
    const sequence = String(count + 1).padStart(6, '0');
    return `ANTS-${year}-${sequence}`;
}

export const ApplicationService = {
    async submitPublicApplication(params: {
        formVersionId: string;
        programId?: string;
        answers: Record<string, any>; // { fieldKey: value } or { fieldId: value }
        applicantName: string;
        companyName?: string;
        email: string;
        phone?: string;
        tcNumber?: string;
        idempotencyKey?: string;
        ipAddress?: string;
        userAgent?: string;
        isTest?: boolean;
    }) {
        // Idempotency check
        if (params.idempotencyKey) {
            const existing = await prisma.submission.findUnique({
                where: { idempotencyKey: params.idempotencyKey },
                include: { application: true },
            });
            if (existing && existing.application) {
                return existing.application;
            }
        }

        // Duplicate warning detection
        let duplicateWarning: string | null = null;
        const duplicateMatches = await prisma.application.findFirst({
            where: {
                OR: [
                    { email: params.email },
                    params.phone ? { phone: params.phone } : {},
                ].filter(Boolean),
            },
        });

        if (duplicateMatches) {
            duplicateWarning = `Aynı e-posta/telefon ile mevcut başvuru var: ${duplicateMatches.applicationNumber}`;
        }

        const appNumber = await generateApplicationNumber();
        const subNumber = `SUB-${Date.now().toString().slice(-6)}`;

        // Fetch version fields to map relational answers
        const version = await prisma.formVersion.findUnique({
            where: { id: params.formVersionId },
            include: { fields: true },
        });

        if (!version) throw new Error('Form version not found');

        const submission = await prisma.submission.create({
            data: {
                formVersionId: params.formVersionId,
                submissionNumber: subNumber,
                isTest: params.isTest || false,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                idempotencyKey: params.idempotencyKey,
                rawSnapshot: JSON.stringify(params.answers),
            },
        });

        // Insert relational answers
        for (const field of version.fields) {
            const val = params.answers[field.fieldKey] ?? params.answers[field.id];
            if (val !== undefined && val !== null) {
                let textVal: string | null = null;
                let numVal: number | null = null;
                let jsonVal: string | null = null;

                if (typeof val === 'number') {
                    numVal = val;
                    textVal = String(val);
                } else if (typeof val === 'object') {
                    jsonVal = JSON.stringify(val);
                } else {
                    textVal = String(val);
                }

                await prisma.submissionAnswer.create({
                    data: {
                        submissionId: submission.id,
                        fieldId: field.id,
                        fieldKey: field.fieldKey,
                        fieldLabel: field.label,
                        textValue: textVal,
                        numValue: numVal,
                        jsonValue: jsonVal,
                    },
                });
            }
        }

        const application = await prisma.application.create({
            data: {
                applicationNumber: appNumber,
                formVersionId: params.formVersionId,
                submissionId: submission.id,
                programId: params.programId,
                applicantName: params.applicantName,
                companyName: params.companyName,
                email: params.email,
                phone: params.phone,
                tcNumberMasked: maskTcNumber(params.tcNumber),
                tcNumberEncrypted: encryptTcNumber(params.tcNumber),
                status: 'NEW',
                duplicateWarning,
            },
        });

        // Add Initial Timeline Event
        await addTimelineEvent({
            entityType: 'Application',
            entityId: application.id,
            title: 'Başvuru Alındı',
            description: `${appNumber} numaralı başvuru sisteme kaydedildi.`,
            eventType: 'STATUS_CHANGE',
        });

        return application;
    },

    async getAdminApplications(params?: {
        search?: string;
        status?: string;
        programId?: string;
        assignedToId?: string;
        applicationType?: string;
        excludeTypes?: string[];
        campaignId?: string;
        applicantType?: string;
        from?: Date;
        to?: Date;
        page?: number;
        limit?: number;
    }) {
        const { search, status, programId, assignedToId, applicationType, excludeTypes, campaignId, applicantType, from, to, page = 1, limit = 50 } = params || {};
        const where: Record<string, unknown> = { isArchived: false };

        if (status) where.status = status;
        if (programId) where.programId = programId;
        if (assignedToId) where.assignedToId = assignedToId;
        if (campaignId) where.campaignId = campaignId;
        if (applicantType) where.applicantType = applicantType;
        if (applicationType) where.applicationType = applicationType;
        else if (excludeTypes && excludeTypes.length) where.applicationType = { notIn: excludeTypes };
        if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
        if (search) {
            where.OR = [
                { applicationNumber: { contains: search, mode: 'insensitive' } },
                { applicantName: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.application.findMany({
                where,
                include: {
                    program: { select: { id: true, name: true, slug: true } },
                    campaign: { select: { id: true, name: true, slug: true, applicationType: true, workflowStages: true } },
                    assignedTo: { select: { id: true, name: true, email: true } },
                    evaluations: { select: { totalScore: true, isCompleted: true } },
                    statusHistory: { orderBy: { createdAt: 'desc' }, take: 1, select: { toStatus: true, createdAt: true, changedByName: true } },
                    _count: { select: { notes: true, files: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.application.count({ where }),
        ]);

        const sanitizedItems = items.map((item) => {
            const { tcNumberEncrypted: _omit, ...rest } = item;
            return rest;
        });

        return { items: sanitizedItems, total, page, totalPages: Math.ceil(total / limit) };
    },

    /**
     * Admin records an application on behalf of an applicant (phone, e-mail, walk-in).
     * The application is attached to a campaign and its published form version.
     */
    async createManualApplication(params: {
        campaignId: string;
        applicantName: string;
        email: string;
        phone?: string | null;
        companyName?: string | null;
        applicantType?: string;
        note?: string | null;
        actor: { id: string; name: string; email: string; ip?: string; userAgent?: string };
    }) {
        const campaign = await prisma.applicationCampaign.findUnique({
            where: { id: params.campaignId },
            include: { form: { include: { versions: { where: { status: 'PUBLISHED' }, orderBy: { versionNumber: 'desc' }, take: 1 } } } },
        });
        if (!campaign) throw new DomainError('Kampanya bulunamadı.', 404);
        const version = campaign.form?.versions[0];
        if (!version) throw new DomainError('Kampanyanın yayınlanmış bir formu yok. Önce formu yayınlayın.');
        if (!params.applicantName?.trim() || !params.email?.trim()) throw new DomainError('Başvuru sahibi adı ve e-posta zorunludur.');

        const stages = getCampaignStages(campaign);
        const status = stages[0]?.key || 'NEW';
        const prefix: Record<string, string> = { PROGRAM: 'PRG', TEKMER: 'TKM', IDEATHON: 'IDT', HACKATHON: 'HCK', EVENT: 'EVT', TRAINING: 'TRN', MENTOR: 'MNT', ENTREPRENEUR: 'ENT', OTHER: 'APP' };
        const numberPrefix = `${prefix[campaign.applicationType] || 'APP'}-${new Date().getFullYear()}-`;

        const application = await prisma.$transaction(async (tx) => {
            const last = await tx.application.findFirst({ where: { applicationNumber: { startsWith: numberPrefix } }, orderBy: { applicationNumber: 'desc' }, select: { applicationNumber: true } });
            const seq = last ? (parseInt(last.applicationNumber.slice(numberPrefix.length), 10) || 0) + 1 : 1;
            const applicationNumber = `${numberPrefix}${String(seq).padStart(5, '0')}`;
            const snapshot = { applicantName: params.applicantName, email: params.email, phone: params.phone || null, companyName: params.companyName || null, _source: 'ADMIN_MANUAL', _note: params.note || null };
            const submission = await tx.submission.create({
                data: {
                    formVersionId: version.id,
                    formId: campaign.formId,
                    campaignId: campaign.id,
                    submissionNumber: `SUB-${new Date().getFullYear()}-M${Date.now().toString(36).toUpperCase()}`,
                    status: 'SUBMITTED',
                    applicantName: params.applicantName.trim(),
                    applicantEmail: params.email.trim().toLowerCase(),
                    rawSnapshot: JSON.stringify(snapshot),
                },
            });
            const app = await tx.application.create({
                data: {
                    applicationNumber,
                    formVersionId: version.id,
                    submissionId: submission.id,
                    campaignId: campaign.id,
                    programId: campaign.applicationType === 'TEKMER' ? null : campaign.programId,
                    applicationType: campaign.applicationType,
                    applicantType: params.applicantType || 'PERSON',
                    applicantName: params.applicantName.trim(),
                    companyName: params.companyName || null,
                    email: params.email.trim().toLowerCase(),
                    phone: params.phone || null,
                    status,
                    assignedToId: params.actor.id,
                },
            });
            await tx.applicationStatusHistory.create({
                data: { applicationId: app.id, fromStatus: 'NONE', toStatus: status, reason: 'Yönetici tarafından manuel kaydedildi.', changedById: params.actor.id, changedByName: params.actor.name },
            });
            return app;
        });

        await addTimelineEvent({
            entityType: 'Application',
            entityId: application.id,
            title: 'Başvuru manuel kaydedildi',
            description: `${params.actor.name} tarafından ${campaign.name} için kaydedildi.${params.note ? ` Not: ${params.note}` : ''}`,
            eventType: 'STATUS_CHANGE',
            actorId: params.actor.id,
            actorName: params.actor.name,
        });
        await logAuditEvent({
            actorId: params.actor.id,
            actorEmail: params.actor.email,
            actorName: params.actor.name,
            action: 'CREATE',
            entityType: 'Application',
            entityId: application.id,
            newValues: { applicationNumber: application.applicationNumber, campaignId: campaign.id, applicationType: campaign.applicationType },
            ipAddress: params.actor.ip,
            userAgent: params.actor.userAgent,
        });
        return application;
    },

    async getApplicationDetails(id: string) {
        return prisma.application.findUnique({
            where: { id },
            include: {
                program: true,
                campaign: { include: { program: { select: { id: true, name: true } }, evaluationTemplate: { include: { criteria: true } } } },
                person: { select: { id: true, fullName: true, email: true } },
                organization: { select: { id: true, name: true } },
                entrepreneur: { select: { id: true, name: true, slug: true } },
                spaceAssignments: { include: { facility: { select: { id: true, title: true } } }, orderBy: { createdAt: 'desc' } },
                assignedTo: { select: { id: true, name: true, email: true } },
                formVersion: {
                    include: {
                        form: true,
                        fields: { orderBy: { sortOrder: 'asc' } },
                    },
                },
                submission: {
                    include: {
                        answers: {
                            include: { field: true },
                        },
                    },
                },
                statusHistory: { orderBy: { createdAt: 'desc' } },
                notes: {
                    include: { author: { select: { name: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                files: { orderBy: { createdAt: 'desc' } },
                evaluations: {
                    include: {
                        evaluator: { select: { id: true, name: true } },
                        scores: { include: { criterion: true } },
                    },
                },
            },
        });
    },

    async updateStatus(params: {
        applicationId: string;
        toStatus: string;
        reason?: string;
        actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string };
    }) {
        const app = await prisma.application.findUnique({ where: { id: params.applicationId }, include: { campaign: true } });
        if (!app) throw new DomainError('Başvuru bulunamadı.', 404);

        const fromStatus = app.status;
        if (fromStatus === params.toStatus) return app;

        // Each campaign has its own workflow; only its stages are valid targets.
        const stages = getCampaignStages(app.campaign);
        if (!stages.some((st) => st.key === params.toStatus)) {
            throw new DomainError(`"${params.toStatus}" bu kampanyanın iş akışında tanımlı değil.`);
        }
        const labelOf = (key: string) => stages.find((st) => st.key === key)?.label || key;

        const updated = await prisma.application.update({
            where: { id: params.applicationId },
            data: { status: params.toStatus },
        });

        await prisma.applicationStatusHistory.create({
            data: {
                applicationId: params.applicationId,
                fromStatus,
                toStatus: params.toStatus,
                reason: params.reason,
                changedById: params.actor?.id,
                changedByName: params.actor?.name,
            },
        });

        await addTimelineEvent({
            entityType: 'Application',
            entityId: params.applicationId,
            title: `Durum: ${labelOf(params.toStatus)}`,
            description: `${params.actor?.name || 'Sistem'} tarafından "${labelOf(fromStatus)}" → "${labelOf(params.toStatus)}" olarak güncellendi.${params.reason ? ` Gerekçe: ${params.reason}` : ''}`,
            eventType: 'STATUS_CHANGE',
            actorId: params.actor?.id,
            actorName: params.actor?.name,
        });

        await logAuditEvent({
            actorId: params.actor?.id,
            actorEmail: params.actor?.email,
            actorName: params.actor?.name,
            action: 'UPDATE',
            entityType: 'Application',
            entityId: params.applicationId,
            fieldName: 'status',
            oldValues: { status: fromStatus },
            newValues: { status: params.toStatus },
            diff: `Status changed from ${fromStatus} to ${params.toStatus}`,
            ipAddress: params.actor?.ip,
            userAgent: params.actor?.userAgent,
        });

        // Campaign-specific status e-mail (only when the campaign maps a template to this status)
        let templateMap: Record<string, string> = {};
        try {
            templateMap = app.campaign?.statusTemplateMap ? JSON.parse(app.campaign.statusTemplateMap) : {};
        } catch {
            templateMap = {};
        }
        const templateKey = templateMap[params.toStatus];
        if (templateKey && app.email) {
            const template = await prisma.emailTemplate.findUnique({ where: { templateKey } });
            if (template) {
                const variables: Record<string, string> = {
                    applicant_name: app.applicantName,
                    name: app.applicantName,
                    application_number: app.applicationNumber,
                    campaign_name: app.campaign?.name || '',
                    status_label: labelOf(params.toStatus),
                };
                const subject = Object.entries(variables).reduce(
                    (acc, [k, v]) => acc.split(`{{${k}}}`).join(v),
                    template.subject
                );
                await EmailOutboxService.enqueueEmail({
                    recipientEmail: app.email,
                    recipientName: app.applicantName,
                    subject,
                    templateKey,
                    htmlBody: EmailOutboxService.renderTemplate(template.htmlBody, variables),
                    entityType: 'APPLICATION',
                    entityId: app.id,
                });
            }
        }

        return updated;
    },

    /**
     * Program application accepted -> explicit assignment to the campaign's program.
     * Uses an existing entrepreneur or creates one from the application.
     */
    async assignAcceptedToProgram(params: {
        applicationId: string;
        entrepreneurId?: string | null;
        newEntrepreneur?: { name: string; sector?: string } | null;
        programId?: string | null;
        cohort?: string | null;
        actor: { id: string; name: string; email: string; ip?: string; userAgent?: string };
    }) {
        const app = await prisma.application.findUnique({ where: { id: params.applicationId }, include: { campaign: true } });
        if (!app) throw new DomainError('Başvuru bulunamadı.', 404);
        if (app.applicationType === 'TEKMER') {
            throw new DomainError('TEKMER yer edinme başvurusu programa atanamaz. Alan tahsis sürecini kullanın.');
        }
        const outcome = getCampaignStages(app.campaign).find((st) => st.key === app.status)?.outcome;
        if (app.status !== 'ACCEPTED' && outcome !== 'ACCEPTED') {
            throw new DomainError('Programa atama yalnız kabul edilmiş başvurular için yapılabilir.');
        }
        const programId = params.programId || app.programId || app.campaign?.programId;
        if (!programId) throw new DomainError('Atanacak program belirlenemedi.');

        let entrepreneurId = params.entrepreneurId || app.entrepreneurId || null;
        if (!entrepreneurId) {
            if (!params.newEntrepreneur?.name?.trim()) throw new DomainError('Mevcut bir girişim seçin veya yeni girişim adı girin.');
            const created = await EntrepreneurService.createEntrepreneur(
                {
                    name: params.newEntrepreneur.name.trim(),
                    sector: params.newEntrepreneur.sector || 'Belirtilmedi',
                    email: app.email || undefined,
                    phone: app.phone || undefined,
                    status: 'ACTIVE',
                    isPublished: false,
                },
                params.actor
            );
            entrepreneurId = created.id;
        }

        const existing = await prisma.entrepreneurProgram.findFirst({
            where: { entrepreneurId, programId, status: { notIn: ['WITHDRAWN', 'REJECTED'] } },
        });
        const assignment = existing
            ? existing
            : await EntrepreneurProgramService.assignProgram(
                {
                    entrepreneurId,
                    programId,
                    cohort: params.cohort || undefined,
                    status: 'ACTIVE',
                    notes: `Başvuru ${app.applicationNumber} kabulü sonrası atandı.`,
                    isPublic: false,
                },
                params.actor.id
            );

        await prisma.application.update({
            where: { id: app.id },
            data: { entrepreneurId, decidedAt: app.decidedAt || new Date(), decidedById: app.decidedById || params.actor.id },
        });

        await addTimelineEvent({
            entityType: 'Application',
            entityId: app.id,
            title: 'Programa atandı',
            description: existing ? 'Girişim bu programa zaten atanmıştı.' : 'Kabul sonrası program ataması yapıldı.',
            eventType: 'ASSIGNED',
            actorId: params.actor.id,
            actorName: params.actor.name,
            metadata: { entrepreneurId, programId, assignmentId: assignment.id },
        });
        await logAuditEvent({
            actorId: params.actor.id,
            actorEmail: params.actor.email,
            actorName: params.actor.name,
            action: 'ASSIGN',
            entityType: 'Application',
            entityId: app.id,
            newValues: { entrepreneurId, programId, assignmentId: assignment.id },
            diff: `Başvuru ${app.applicationNumber}: program ataması`,
            ipAddress: params.actor.ip,
            userAgent: params.actor.userAgent,
        });

        return { entrepreneurId, programId, assignmentId: assignment.id, alreadyAssigned: Boolean(existing) };
    },

    /**
     * TEKMER placement application accepted -> explicit start of the space
     * assignment process. Creates a PLANNED SpaceAssignment only; contracts,
     * rent and invoices are created separately and explicitly.
     */
    async startSpaceAssignment(params: {
        applicationId: string;
        facilityId: string;
        organizationId?: string | null;
        newOrganization?: { name: string } | null;
        entrepreneurId?: string | null;
        unitLabel?: string | null;
        startDate?: string | null;
        notes?: string | null;
        actor: { id: string; name: string; email: string; ip?: string; userAgent?: string };
    }) {
        const app = await prisma.application.findUnique({ where: { id: params.applicationId }, include: { campaign: true } });
        if (!app) throw new DomainError('Başvuru bulunamadı.', 404);
        if (app.applicationType !== 'TEKMER') throw new DomainError('Alan tahsis süreci yalnız TEKMER yer edinme başvuruları için başlatılır.');
        const outcome = getCampaignStages(app.campaign).find((st) => st.key === app.status)?.outcome;
        if (app.status !== 'ACCEPTED' && outcome !== 'ACCEPTED') {
            throw new DomainError('Alan tahsis süreci yalnız kabul edilmiş başvurular için başlatılabilir.');
        }
        const facility = await prisma.facility.findUnique({ where: { id: params.facilityId } });
        if (!facility) throw new DomainError('Alan bulunamadı.', 404);

        let organizationId = params.organizationId || app.organizationId || null;
        if (!organizationId && params.newOrganization?.name?.trim()) {
            const org = await prisma.organization.create({
                data: { name: params.newOrganization.name.trim(), email: app.email || null, phone: app.phone || null },
            });
            organizationId = org.id;
            await logAuditEvent({
                actorId: params.actor.id,
                actorName: params.actor.name,
                action: 'CREATE',
                entityType: 'Organization',
                entityId: org.id,
                diff: `TEKMER başvurusu ${app.applicationNumber} üzerinden kurum oluşturuldu: ${org.name}`,
            });
        }

        const entrepreneurId = params.entrepreneurId || app.entrepreneurId || null;
        const assignment = await prisma.spaceAssignment.create({
            data: {
                facilityId: facility.id,
                organizationId,
                entrepreneurId,
                applicationId: app.id,
                status: 'PLANNED',
                unitLabel: params.unitLabel || null,
                startDate: params.startDate ? new Date(params.startDate) : null,
                notes: params.notes || null,
                createdById: params.actor.id,
            },
        });

        await prisma.application.update({
            where: { id: app.id },
            data: {
                organizationId,
                entrepreneurId,
                decidedAt: app.decidedAt || new Date(),
                decidedById: app.decidedById || params.actor.id,
            },
        });

        await addTimelineEvent({
            entityType: 'Application',
            entityId: app.id,
            title: 'Alan tahsis süreci başlatıldı',
            description: `${facility.title}${params.unitLabel ? ` · ${params.unitLabel}` : ''} (Planlandı). Sözleşme ve kira ayrıca oluşturulur.`,
            eventType: 'ASSIGNED',
            actorId: params.actor.id,
            actorName: params.actor.name,
            metadata: { spaceAssignmentId: assignment.id },
        });
        await logAuditEvent({
            actorId: params.actor.id,
            actorEmail: params.actor.email,
            actorName: params.actor.name,
            action: 'CREATE',
            entityType: 'SpaceAssignment',
            entityId: assignment.id,
            newValues: { facilityId: facility.id, organizationId, applicationId: app.id, status: 'PLANNED' },
            ipAddress: params.actor.ip,
            userAgent: params.actor.userAgent,
        });

        return assignment;
    },


    async addInternalNote(params: {
        applicationId: string;
        noteText: string;
        mentions?: string[];
        fileUrl?: string;
        actor: { id: string; name: string; email: string };
    }) {
        const note = await prisma.applicationNote.create({
            data: {
                applicationId: params.applicationId,
                authorId: params.actor.id,
                authorName: params.actor.name,
                noteText: params.noteText,
                mentions: params.mentions ? JSON.stringify(params.mentions) : null,
                fileUrl: params.fileUrl,
                isInternal: true,
            },
        });

        await prisma.application.update({
            where: { id: params.applicationId },
            data: { internalNotesCount: { increment: 1 } },
        });

        await addTimelineEvent({
            entityType: 'Application',
            entityId: params.applicationId,
            title: 'Dahili Not Eklendi',
            description: `${params.actor.name}: ${params.noteText.slice(0, 100)}...`,
            eventType: 'NOTE_ADDED',
            actorId: params.actor.id,
            actorName: params.actor.name,
        });

        return note;
    }
};
