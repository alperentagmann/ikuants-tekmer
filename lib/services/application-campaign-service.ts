import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { APPLICATION_STATUSES } from '@/lib/constants/application';
import { APPLICATION_TYPES } from '@/lib/forms/schema';

export interface WorkflowStage {
    key: string;
    label: string;
    order: number;
    isTerminal?: boolean;
    outcome?: 'ACCEPTED' | 'REJECTED' | 'WAITLIST' | null;
}

export interface RequiredDocument {
    key: string;
    label: string;
    required: boolean;
    allowedTypes?: string[];
    maxSizeMb?: number;
    description?: string;
    requiredAtStage?: string | null;
}

export interface CampaignInput {
    name: string;
    slug: string;
    applicationType: string;
    description?: string | null;
    status?: string;
    programId?: string | null;
    formId?: string | null;
    evaluationTemplateId?: string | null;
    ownerId?: string | null;
    opensAt?: string | Date | null;
    closesAt?: string | Date | null;
    publicPath?: string | null;
    allowedApplicantTypes?: string[];
    workflowStages?: WorkflowStage[];
    requiredDocuments?: RequiredDocument[];
    notificationRecipients?: string[];
    confirmationTemplateKey?: string | null;
    statusTemplateMap?: Record<string, string>;
}

type Actor = { id: string; name?: string | null; email?: string | null; ip?: string; userAgent?: string };

const STATUS_LABEL = new Map(APPLICATION_STATUSES.map((s) => [s.key, s.label]));

function stage(key: string, order: number, extra: Partial<WorkflowStage> = {}): WorkflowStage {
    return { key, label: STATUS_LABEL.get(key) || key, order, ...extra };
}

/** Sensible starting workflows. Each campaign stores its own copy and can change it independently. */
export function defaultWorkflow(applicationType: string): WorkflowStage[] {
    if (applicationType === 'TEKMER') {
        return [
            stage('NEW', 1),
            stage('PRE_REVIEW', 2),
            stage('MISSING_DOCS', 3),
            stage('UNDER_EVALUATION', 4),
            stage('INTERVIEW', 5),
            stage('ACCEPTED', 6, { isTerminal: true, outcome: 'ACCEPTED' }),
            stage('REJECTED', 7, { isTerminal: true, outcome: 'REJECTED' }),
            stage('WAITLIST', 8, { isTerminal: true, outcome: 'WAITLIST' }),
        ];
    }
    return [
        stage('NEW', 1),
        stage('PRE_REVIEW', 2),
        stage('UNDER_EVALUATION', 3),
        stage('JURY', 4),
        stage('INTERVIEW', 5),
        stage('ACCEPTED', 6, { isTerminal: true, outcome: 'ACCEPTED' }),
        stage('REJECTED', 7, { isTerminal: true, outcome: 'REJECTED' }),
        stage('WAITLIST', 8, { isTerminal: true, outcome: 'WAITLIST' }),
    ];
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function getCampaignStages(campaign: { workflowStages: string | null; applicationType: string } | null | undefined): WorkflowStage[] {
    if (!campaign) return APPLICATION_STATUSES.map((s, i) => stage(s.key, i + 1));
    const stages = parseJson<WorkflowStage[]>(campaign.workflowStages, []);
    return (stages.length ? stages : defaultWorkflow(campaign.applicationType)).sort((a, b) => a.order - b.order);
}

function serialize(campaign: Awaited<ReturnType<typeof loadCampaign>>) {
    if (!campaign) return null;
    return {
        ...campaign,
        allowedApplicantTypes: parseJson<string[]>(campaign.allowedApplicantTypes, []),
        workflowStages: getCampaignStages(campaign),
        requiredDocuments: parseJson<RequiredDocument[]>(campaign.requiredDocuments, []),
        notificationRecipients: parseJson<string[]>(campaign.notificationRecipients, []),
        statusTemplateMap: parseJson<Record<string, string>>(campaign.statusTemplateMap, {}),
    };
}

async function loadCampaign(id: string) {
    return prisma.applicationCampaign.findUnique({
        where: { id },
        include: {
            program: { select: { id: true, name: true, slug: true } },
            form: { select: { id: true, title: true, slug: true, isPublished: true, formType: true } },
            evaluationTemplate: { select: { id: true, name: true } },
            owner: { select: { id: true, name: true } },
            _count: { select: { applications: true, submissions: true } },
        },
    });
}

function validateStages(stages: WorkflowStage[]) {
    if (stages.length === 0) throw new DomainError('İş akışında en az bir aşama olmalı.');
    const keys = new Set<string>();
    for (const s of stages) {
        if (!/^[A-Z][A-Z0-9_]{1,40}$/.test(s.key)) throw new DomainError(`"${s.label}" aşamasının anahtarı geçersiz (BÜYÜK_HARF_ALT_ÇİZGİ).`);
        if (keys.has(s.key)) throw new DomainError(`"${s.key}" aşaması birden fazla kez tanımlanmış.`);
        if (!s.label?.trim()) throw new DomainError(`"${s.key}" aşamasının adı boş.`);
        keys.add(s.key);
    }
}

async function normalize(input: CampaignInput, existingId?: string) {
    if (!APPLICATION_TYPES.some((t) => t.value === input.applicationType)) {
        throw new DomainError('Geçersiz başvuru türü.');
    }
    const slug = input.slug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(slug)) throw new DomainError('Kampanya adresi yalnız küçük harf, rakam ve tire içermelidir.');
    const clash = await prisma.applicationCampaign.findUnique({ where: { slug } });
    if (clash && clash.id !== existingId) throw new DomainError(`"${slug}" adresiyle bir kampanya zaten var.`);

    // Program and TEKMER processes are separate: TEKMER campaigns never target a program.
    if (input.applicationType === 'TEKMER' && input.programId) {
        throw new DomainError('TEKMER yer edinme kampanyası bir programa bağlanamaz.');
    }
    if (input.applicationType === 'PROGRAM' && !input.programId) {
        throw new DomainError('Program başvuru kampanyası için program seçilmelidir.');
    }

    // Form isolation: a form belongs to exactly one campaign.
    if (input.formId) {
        const owner = await prisma.applicationCampaign.findFirst({ where: { formId: input.formId, id: existingId ? { not: existingId } : undefined } });
        if (owner) {
            throw new DomainError(`Bu form "${owner.name}" kampanyasında kullanılıyor. Her kampanya kendi formunu kullanmalı; formu kopyalayarak yeni bir form oluşturun.`);
        }
    }

    const stages = input.workflowStages && input.workflowStages.length ? input.workflowStages : defaultWorkflow(input.applicationType);
    validateStages(stages);

    const recipients = (input.notificationRecipients || []).map((e) => e.trim()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const docs = (input.requiredDocuments || []).filter((d) => d.label?.trim()).map((d, i) => ({
        ...d,
        key: d.key || `doc_${i + 1}`,
        required: d.required === true,
    }));

    return {
        name: input.name.trim(),
        slug,
        applicationType: input.applicationType,
        description: input.description || null,
        status: input.status || 'DRAFT',
        programId: input.applicationType === 'TEKMER' ? null : input.programId || null,
        formId: input.formId || null,
        evaluationTemplateId: input.evaluationTemplateId || null,
        ownerId: input.ownerId || null,
        opensAt: input.opensAt ? new Date(input.opensAt) : null,
        closesAt: input.closesAt ? new Date(input.closesAt) : null,
        publicPath: input.publicPath || null,
        allowedApplicantTypes: JSON.stringify(input.allowedApplicantTypes || []),
        workflowStages: JSON.stringify(stages),
        requiredDocuments: JSON.stringify(docs),
        notificationRecipients: JSON.stringify(recipients),
        confirmationTemplateKey: input.confirmationTemplateKey || null,
        statusTemplateMap: JSON.stringify(input.statusTemplateMap || {}),
    };
}

export const ApplicationCampaignService = {
    async list(params?: { applicationType?: string; status?: string; programId?: string; includeArchived?: boolean }) {
        const where: Record<string, unknown> = {};
        if (params?.applicationType) where.applicationType = params.applicationType;
        if (params?.programId) where.programId = params.programId;
        if (params?.status) where.status = params.status;
        else if (!params?.includeArchived) where.status = { not: 'ARCHIVED' };

        const campaigns = await prisma.applicationCampaign.findMany({
            where,
            include: {
                program: { select: { id: true, name: true, slug: true } },
                form: { select: { id: true, title: true, slug: true, isPublished: true } },
                evaluationTemplate: { select: { id: true, name: true } },
                owner: { select: { id: true, name: true } },
                _count: { select: { applications: true, submissions: true } },
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        });

        const statusCounts = await prisma.application.groupBy({
            by: ['campaignId', 'status'],
            where: { campaignId: { in: campaigns.map((c) => c.id) }, isArchived: false },
            _count: true,
        });

        return campaigns.map((c) => ({
            ...serialize(c as never),
            statusCounts: statusCounts.filter((s) => s.campaignId === c.id).reduce<Record<string, number>>((acc, s) => {
                acc[s.status] = s._count;
                return acc;
            }, {}),
        }));
    },

    async get(id: string) {
        return serialize(await loadCampaign(id));
    },

    async create(input: CampaignInput, actor: Actor) {
        const data = await normalize(input);
        const campaign = await prisma.applicationCampaign.create({ data: { ...data, ownerId: data.ownerId || actor.id } });
        await logAuditEvent({
            actorId: actor.id,
            actorEmail: actor.email || undefined,
            actorName: actor.name || undefined,
            action: 'CREATE',
            entityType: 'ApplicationCampaign',
            entityId: campaign.id,
            newValues: { name: campaign.name, applicationType: campaign.applicationType, programId: campaign.programId, formId: campaign.formId },
            ipAddress: actor.ip,
            userAgent: actor.userAgent,
        });
        return ApplicationCampaignService.get(campaign.id);
    },

    async update(id: string, input: CampaignInput, actor: Actor) {
        const existing = await prisma.applicationCampaign.findUnique({ where: { id } });
        if (!existing) throw new DomainError('Kampanya bulunamadı.', 404);
        if (existing.applicationType !== input.applicationType) {
            const count = await prisma.application.count({ where: { campaignId: id } });
            if (count > 0) throw new DomainError('Başvurusu olan bir kampanyanın türü değiştirilemez.');
        }
        const data = await normalize(input, id);

        // Stages that still hold applications cannot be removed.
        const newKeys = new Set(JSON.parse(data.workflowStages).map((s: WorkflowStage) => s.key));
        const inUse = await prisma.application.groupBy({ by: ['status'], where: { campaignId: id }, _count: true });
        const orphaned = inUse.filter((s) => !newKeys.has(s.status));
        if (orphaned.length) {
            throw new DomainError(`Şu aşamalarda başvuru bulunduğu için kaldırılamaz: ${orphaned.map((s) => `${s.status} (${s._count})`).join(', ')}`);
        }

        const updated = await prisma.applicationCampaign.update({ where: { id }, data });
        await logAuditEvent({
            actorId: actor.id,
            actorEmail: actor.email || undefined,
            actorName: actor.name || undefined,
            action: 'UPDATE',
            entityType: 'ApplicationCampaign',
            entityId: id,
            oldValues: { name: existing.name, status: existing.status, formId: existing.formId, programId: existing.programId },
            newValues: { name: updated.name, status: updated.status, formId: updated.formId, programId: updated.programId },
            ipAddress: actor.ip,
            userAgent: actor.userAgent,
        });
        return ApplicationCampaignService.get(id);
    },

    async setStatus(id: string, status: string, actor: Actor) {
        if (!['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED'].includes(status)) throw new DomainError('Geçersiz kampanya durumu.');
        const existing = await prisma.applicationCampaign.findUnique({ where: { id }, include: { form: true } });
        if (!existing) throw new DomainError('Kampanya bulunamadı.', 404);
        if (status === 'OPEN' && (!existing.form || !existing.form.isPublished)) {
            throw new DomainError('Kampanyayı açmak için yayınlanmış bir form bağlanmalı.');
        }
        await prisma.applicationCampaign.update({ where: { id }, data: { status } });
        await logAuditEvent({
            actorId: actor.id,
            actorEmail: actor.email || undefined,
            actorName: actor.name || undefined,
            action: 'UPDATE',
            entityType: 'ApplicationCampaign',
            entityId: id,
            oldValues: { status: existing.status },
            newValues: { status },
        });
        return ApplicationCampaignService.get(id);
    },
};
