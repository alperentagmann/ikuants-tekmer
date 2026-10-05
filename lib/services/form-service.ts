import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import {
    buildSections,
    normalizeField,
    validateFormDefinition,
    FormFieldDefinition,
    FormSectionDefinition,
    getFieldTypeMeta,
} from '@/lib/forms/schema';
import { FormFieldInput } from '@/lib/types/form';

export type { FormFieldInput };

export interface FormActor {
    id: string;
    name?: string | null;
    email?: string | null;
    ip?: string;
    userAgent?: string;
}

export class FormDefinitionError extends Error {
    problems: string[];
    constructor(problems: string[]) {
        super(problems.join(' '));
        this.name = 'FormDefinitionError';
        this.problems = problems;
    }
}

interface StoredSnapshot {
    sections?: FormSectionDefinition[];
    fields?: unknown[];
}

function parseSnapshot(raw: string | null | undefined): StoredSnapshot {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return { fields: parsed };
        return parsed as StoredSnapshot;
    } catch {
        return {};
    }
}

function parseJsonArray(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

function fieldRowToDefinition(row: Record<string, unknown>): FormFieldDefinition {
    return normalizeField(row);
}

function definitionToRow(field: FormFieldDefinition, index: number) {
    return {
        id: crypto.randomUUID(), // Every version owns its own field rows; fieldKey is the stable identity
        fieldKey: field.fieldKey,
        label: field.label,
        fieldType: String(field.fieldType),
        placeholder: field.placeholder || null,
        helpText: field.helpText || null,
        isRequired: field.isRequired === true,
        defaultValue: field.defaultValue || null,
        validationRules: field.validationRules && Object.keys(field.validationRules).length > 0 ? JSON.stringify(field.validationRules) : null,
        conditionalRules: field.conditionalRules && field.conditionalRules.rules?.length ? JSON.stringify(field.conditionalRules) : null,
        options: field.options && field.options.length > 0 ? JSON.stringify(field.options) : null,
        stepNumber: field.stepNumber ?? 1,
        stepTitle: field.stepTitle || null,
        sectionDescription: field.sectionDescription || null,
        width: field.width || 'FULL',
        sortOrder: index,
        uiConfig: field.uiConfig && Object.keys(field.uiConfig).length > 0 ? JSON.stringify(field.uiConfig) : null,
    };
}

function sortFields(fields: FormFieldDefinition[], sections: FormSectionDefinition[]): FormFieldDefinition[] {
    const sectionOrder = new Map(sections.map((s, i) => [s.stepNumber, i]));
    return [...fields].sort((a, b) => {
        const sa = sectionOrder.get(a.stepNumber ?? 1) ?? 0;
        const sb = sectionOrder.get(b.stepNumber ?? 1) ?? 0;
        if (sa !== sb) return sa - sb;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
}

/** Applies section titles/descriptions to the fields that belong to each section. */
function applySections(fields: FormFieldDefinition[], sections: FormSectionDefinition[]): FormFieldDefinition[] {
    return fields.map((f) => {
        const section = sections.find((s) => s.stepNumber === (f.stepNumber ?? 1));
        return section ? { ...f, stepTitle: section.title, sectionDescription: section.description ?? null } : f;
    });
}

export function versionToDefinition(version: { schemaSnapshot: string; fields: Record<string, unknown>[] }) {
    const snapshot = parseSnapshot(version.schemaSnapshot);
    const fields = version.fields
        .map(fieldRowToDefinition)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const sections = buildSections(fields, snapshot.sections || null);
    return { sections, fields };
}

async function audit(actor: FormActor | undefined, action: string, entityType: string, entityId: string, diff: string, extra?: Record<string, unknown>) {
    await logAuditEvent({
        actorId: actor?.id,
        actorEmail: actor?.email || undefined,
        actorName: actor?.name || undefined,
        action,
        entityType,
        entityId,
        diff,
        ipAddress: actor?.ip,
        userAgent: actor?.userAgent,
        ...(extra || {}),
    });
}

export const FormService = {
    // ------------------------------------------------------------------ Public

    /**
     * Returns the published version of a public form. Archived, unpublished or
     * authentication-required forms are not returned.
     */
    async getPublishedFormBySlug(slug: string) {
        const form = await prisma.form.findUnique({
            where: { slug },
            include: {
                versions: {
                    where: { status: 'PUBLISHED' },
                    orderBy: { versionNumber: 'desc' },
                    take: 1,
                    include: { fields: { orderBy: { sortOrder: 'asc' } } },
                },
                campaigns: {
                    where: { status: { not: 'ARCHIVED' } },
                    include: { program: { select: { id: true, name: true, slug: true } } },
                },
            },
        });

        if (!form || form.isArchived || !form.isPublished || form.requiresAuth || form.versions.length === 0) return null;

        const version = form.versions[0];
        const { sections, fields } = versionToDefinition(version as never);
        const now = new Date();
        const campaign = form.campaigns.find((c) => c.status === 'OPEN') || form.campaigns[0] || null;
        const campaignOpen = campaign
            ? campaign.status === 'OPEN' && (!campaign.opensAt || campaign.opensAt <= now) && (!campaign.closesAt || campaign.closesAt >= now)
            : true;

        const kvkkTextIds = Array.from(
            new Set(fields.map((f) => f.uiConfig?.kvkkTextId).filter((id): id is string => Boolean(id)))
        );
        const kvkkTexts = kvkkTextIds.length
            ? await prisma.kvkkTextVersion.findMany({
                where: { id: { in: kvkkTextIds }, isPublished: true },
                select: { id: true, title: true, version: true, content: true },
            })
            : [];

        return {
            formId: form.id,
            title: form.title,
            slug: form.slug,
            description: form.description,
            formType: form.formType,
            theme: form.theme,
            submitLabel: form.submitLabel,
            successMessage: form.successMessage,
            versionId: version.id,
            versionNumber: version.versionNumber,
            sections,
            fields: fields
                .filter((f) => !getFieldTypeMeta(String(f.fieldType)).adminOnly)
                .map((f) => ({ ...f, id: undefined })),
            kvkkTexts,
            campaign: campaign
                ? {
                    id: campaign.id,
                    name: campaign.name,
                    slug: campaign.slug,
                    applicationType: campaign.applicationType,
                    isOpen: campaignOpen,
                    closesAt: campaign.closesAt,
                    program: campaign.program,
                }
                : null,
        };
    },

    // ------------------------------------------------------------------ Admin: list

    async listForms(params?: { includeArchived?: boolean; search?: string; formType?: string }) {
        const where: Record<string, unknown> = {};
        if (!params?.includeArchived) where.isArchived = false;
        if (params?.formType) where.formType = params.formType;
        if (params?.search) {
            where.OR = [
                { title: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        const forms = await prisma.form.findMany({
            where,
            include: {
                owner: { select: { id: true, name: true } },
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    select: { id: true, versionNumber: true, status: true, publishedAt: true, createdById: true, updatedAt: true },
                },
                campaigns: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        applicationType: true,
                        status: true,
                        publicPath: true,
                        program: { select: { id: true, name: true } },
                    },
                },
                _count: { select: { submissions: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Submissions created before Submission.formId existed are counted through their version.
        const legacyCounts = await prisma.submission.groupBy({
            by: ['formVersionId'],
            where: { formId: null },
            _count: true,
        });
        const legacyByVersion = new Map(legacyCounts.map((c) => [c.formVersionId, c._count]));

        const editorIds = Array.from(new Set(forms.flatMap((f) => f.versions.map((v) => v.createdById)).filter(Boolean))) as string[];
        const editors = editorIds.length
            ? await prisma.user.findMany({ where: { id: { in: editorIds } }, select: { id: true, name: true } })
            : [];
        const editorName = new Map(editors.map((u) => [u.id, u.name]));

        return forms.map((form) => {
            const published = form.versions.find((v) => v.status === 'PUBLISHED') || null;
            const draft = form.versions.find((v) => v.status === 'DRAFT') || null;
            const latest = form.versions[0] || null;
            const legacy = form.versions.reduce((sum, v) => sum + (legacyByVersion.get(v.id) || 0), 0);
            return {
                id: form.id,
                title: form.title,
                slug: form.slug,
                formType: form.formType,
                description: form.description,
                isPublished: form.isPublished,
                isArchived: form.isArchived,
                isTemplate: form.isTemplate,
                publicPath: form.publicPath,
                theme: form.theme,
                owner: form.owner,
                currentVersion: published ? { id: published.id, versionNumber: published.versionNumber, publishedAt: published.publishedAt } : null,
                hasDraft: Boolean(draft),
                draftVersionNumber: draft?.versionNumber ?? null,
                versionCount: form.versions.length,
                campaigns: form.campaigns,
                submissionCount: form._count.submissions + legacy,
                updatedAt: latest?.updatedAt && latest.updatedAt > form.updatedAt ? latest.updatedAt : form.updatedAt,
                updatedBy: latest?.createdById ? editorName.get(latest.createdById) || null : null,
            };
        });
    },

    // ------------------------------------------------------------------ Admin: detail

    async getFormDetail(id: string) {
        const form = await prisma.form.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    include: {
                        fields: { orderBy: { sortOrder: 'asc' } },
                        publisher: { select: { id: true, name: true } },
                        _count: { select: { submissions: true, applications: true } },
                    },
                },
                campaigns: {
                    include: { program: { select: { id: true, name: true, slug: true } } },
                },
            },
        });
        if (!form) return null;

        const draft = form.versions.find((v) => v.status === 'DRAFT') || null;
        const published = form.versions.find((v) => v.status === 'PUBLISHED') || null;
        const editable = draft || published || form.versions[0] || null;
        const definition = editable ? versionToDefinition(editable as never) : { sections: buildSections([], null), fields: [] };

        return {
            form: {
                id: form.id,
                title: form.title,
                slug: form.slug,
                description: form.description,
                formType: form.formType,
                isPublished: form.isPublished,
                isArchived: form.isArchived,
                isTemplate: form.isTemplate,
                allowMultiple: form.allowMultiple,
                requiresAuth: form.requiresAuth,
                successMessage: form.successMessage,
                redirectUrl: form.redirectUrl,
                submitLabel: form.submitLabel,
                theme: form.theme,
                publicPath: form.publicPath,
                notifyEmails: parseJsonArray(form.notifyEmails),
                confirmationTemplateKey: form.confirmationTemplateKey,
                owner: form.owner,
                sourceFormId: form.sourceFormId,
                createdAt: form.createdAt,
                updatedAt: form.updatedAt,
            },
            editing: {
                versionId: editable?.id ?? null,
                versionNumber: editable?.versionNumber ?? null,
                status: editable?.status ?? null,
                isDraft: Boolean(draft),
                ...definition,
            },
            versions: form.versions.map((v) => ({
                id: v.id,
                versionNumber: v.versionNumber,
                status: v.status,
                changeNote: v.changeNote,
                publishedAt: v.publishedAt,
                publisher: v.publisher,
                fieldCount: v.fields.length,
                submissionCount: v._count.submissions,
                applicationCount: v._count.applications,
                createdAt: v.createdAt,
            })),
            campaigns: form.campaigns.map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                applicationType: c.applicationType,
                status: c.status,
                publicPath: c.publicPath,
                program: c.program,
            })),
            whereUsed: FormService.describeWhereUsed(form, form.campaigns),
        };
    },

    describeWhereUsed(
        form: { formType: string; publicPath: string | null },
        campaigns: { id: string; name: string; applicationType: string; publicPath: string | null; program: { id: string; name: string } | null }[]
    ) {
        const usages: { kind: string; label: string; href: string | null; publicPath: string | null }[] = campaigns.map((c) => ({
            kind: c.applicationType,
            label: c.program ? `${c.applicationType === 'PROGRAM' ? 'PROGRAM' : c.applicationType} / ${c.program.name} — ${c.name}` : `${c.applicationType} / ${c.name}`,
            href: `/admin/basvuru-kampanyalari?campaignId=${c.id}`,
            publicPath: c.publicPath,
        }));
        if (form.publicPath && !usages.some((u) => u.publicPath === form.publicPath)) {
            const kindByType: Record<string, string> = {
                CONTACT: 'CONTACT',
                RESERVATION_REQUEST: 'RESERVATION',
                INTERNSHIP_APPLICATION: 'INTERNSHIP',
                NEWSLETTER: 'NEWSLETTER',
                EVENT_REGISTRATION: 'EVENT',
                TRAINING_REGISTRATION: 'TRAINING',
            };
            usages.push({
                kind: kindByType[form.formType] || 'PUBLIC_PAGE',
                label: `Public sayfa: ${form.publicPath}`,
                href: null,
                publicPath: form.publicPath,
            });
        }
        return usages;
    },

    async getVersionDefinition(versionId: string) {
        const version = await prisma.formVersion.findUnique({
            where: { id: versionId },
            include: { form: true, fields: { orderBy: { sortOrder: 'asc' } } },
        });
        if (!version) return null;
        return { version, ...versionToDefinition(version as never) };
    },

    // ------------------------------------------------------------------ Admin: mutations

    async createForm(
        params: {
            title: string;
            slug: string;
            formType?: string;
            description?: string | null;
            theme?: string | null;
            publicPath?: string | null;
            sections?: FormSectionDefinition[];
            fields?: FormFieldDefinition[];
            ownerId?: string | null;
            sourceFormId?: string | null;
            isTemplate?: boolean;
        },
        actor?: FormActor
    ) {
        const slug = params.slug.trim().toLowerCase();
        if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(slug)) {
            throw new FormDefinitionError(['Form adresi (slug) yalnız küçük harf, rakam ve tire içermelidir.']);
        }
        if (await prisma.form.findUnique({ where: { slug } })) {
            throw new FormDefinitionError([`"${slug}" adresiyle bir form zaten var.`]);
        }

        const sections = params.sections && params.sections.length ? params.sections : buildSections(params.fields || [], null);
        const fields = sortFields(applySections(params.fields || [], sections), sections);
        const problems = validateFormDefinition(fields);
        if (problems.length) throw new FormDefinitionError(problems);

        const result = await prisma.$transaction(async (tx) => {
            const form = await tx.form.create({
                data: {
                    title: params.title.trim(),
                    slug,
                    description: params.description || null,
                    formType: params.formType || 'CUSTOM',
                    theme: params.theme || null,
                    publicPath: params.publicPath || null,
                    ownerId: params.ownerId || actor?.id || null,
                    sourceFormId: params.sourceFormId || null,
                    isTemplate: params.isTemplate === true,
                    isPublished: false,
                },
            });
            const version = await tx.formVersion.create({
                data: {
                    formId: form.id,
                    versionNumber: 1,
                    status: 'DRAFT',
                    createdById: actor?.id || null,
                    changeNote: params.sourceFormId ? 'Mevcut formdan kopyalandı' : 'İlk taslak',
                    schemaSnapshot: JSON.stringify({ sections, fields }),
                    fields: { create: fields.map(definitionToRow) },
                },
            });
            return { form, version };
        });

        await audit(actor, 'CREATE', 'Form', result.form.id, `Form oluşturuldu: "${result.form.title}" (taslak v1, ${fields.length} alan)`);
        return result;
    },

    /** Independent copy: the new form gets its own draft version, nothing is shared. */
    async duplicateForm(id: string, params: { title: string; slug: string; asTemplate?: boolean }, actor?: FormActor) {
        const detail = await FormService.getFormDetail(id);
        if (!detail) throw new Error('Form bulunamadı');
        return FormService.createForm(
            {
                title: params.title,
                slug: params.slug,
                formType: detail.form.formType,
                description: detail.form.description,
                theme: detail.form.theme,
                sections: detail.editing.sections,
                fields: detail.editing.fields.map((f) => ({ ...f, id: undefined })),
                sourceFormId: id,
                isTemplate: params.asTemplate === true,
            },
            actor
        );
    },

    async updateSettings(
        id: string,
        settings: {
            title?: string;
            description?: string | null;
            formType?: string;
            theme?: string | null;
            publicPath?: string | null;
            successMessage?: string | null;
            redirectUrl?: string | null;
            submitLabel?: string | null;
            notifyEmails?: string[];
            confirmationTemplateKey?: string | null;
            ownerId?: string | null;
            allowMultiple?: boolean;
            requiresAuth?: boolean;
            isTemplate?: boolean;
        },
        actor?: FormActor
    ) {
        const existing = await prisma.form.findUnique({ where: { id } });
        if (!existing) throw new Error('Form bulunamadı');

        const notifyEmails = settings.notifyEmails?.map((e) => e.trim()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

        const updated = await prisma.form.update({
            where: { id },
            data: {
                title: settings.title?.trim() || undefined,
                description: settings.description === undefined ? undefined : settings.description,
                formType: settings.formType || undefined,
                theme: settings.theme === undefined ? undefined : settings.theme,
                publicPath: settings.publicPath === undefined ? undefined : settings.publicPath || null,
                successMessage: settings.successMessage === undefined ? undefined : settings.successMessage,
                redirectUrl: settings.redirectUrl === undefined ? undefined : settings.redirectUrl,
                submitLabel: settings.submitLabel === undefined ? undefined : settings.submitLabel,
                notifyEmails: notifyEmails === undefined ? undefined : JSON.stringify(notifyEmails),
                confirmationTemplateKey: settings.confirmationTemplateKey === undefined ? undefined : settings.confirmationTemplateKey || null,
                ownerId: settings.ownerId === undefined ? undefined : settings.ownerId || null,
                allowMultiple: settings.allowMultiple,
                requiresAuth: settings.requiresAuth,
                isTemplate: settings.isTemplate,
            },
        });

        await audit(actor, 'UPDATE', 'Form', id, `Form ayarları güncellendi: "${updated.title}"`, {
            oldValues: { title: existing.title, formType: existing.formType, publicPath: existing.publicPath },
            newValues: { title: updated.title, formType: updated.formType, publicPath: updated.publicPath },
        });
        return updated;
    },

    /**
     * Saves the editable draft. Published versions are immutable: if there is no
     * draft yet, a new draft version is created from the submitted definition.
     */
    async saveDraft(formId: string, params: { sections: FormSectionDefinition[]; fields: FormFieldDefinition[]; changeNote?: string | null }, actor?: FormActor) {
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: { versions: { orderBy: { versionNumber: 'desc' } } },
        });
        if (!form) throw new Error('Form bulunamadı');
        if (form.isArchived) throw new FormDefinitionError(['Arşivlenmiş form düzenlenemez. Önce geri yükleyin.']);

        const sections = params.sections && params.sections.length ? params.sections : buildSections(params.fields, null);
        const fields = sortFields(applySections(params.fields, sections), sections);
        const problems = validateFormDefinition(fields);
        if (problems.length) throw new FormDefinitionError(problems);

        const draft = form.versions.find((v) => v.status === 'DRAFT');
        const snapshot = JSON.stringify({ sections, fields });

        const version = await prisma.$transaction(async (tx) => {
            if (draft) {
                const submissions = await tx.submission.count({ where: { formVersionId: draft.id } });
                if (submissions > 0) throw new FormDefinitionError(['Bu taslak versiyona bağlı gönderimler var; yeni bir taslak oluşturun.']);
                await tx.formField.deleteMany({ where: { formVersionId: draft.id } });
                return tx.formVersion.update({
                    where: { id: draft.id },
                    data: {
                        schemaSnapshot: snapshot,
                        changeNote: params.changeNote ?? draft.changeNote,
                        createdById: actor?.id || draft.createdById,
                        fields: { create: fields.map(definitionToRow) },
                    },
                });
            }
            const nextNumber = (form.versions[0]?.versionNumber || 0) + 1;
            return tx.formVersion.create({
                data: {
                    formId,
                    versionNumber: nextNumber,
                    status: 'DRAFT',
                    createdById: actor?.id || null,
                    changeNote: params.changeNote || null,
                    schemaSnapshot: snapshot,
                    fields: { create: fields.map(definitionToRow) },
                },
            });
        });

        await prisma.form.update({ where: { id: formId }, data: { updatedAt: new Date() } });
        await audit(actor, 'UPDATE', 'FormVersion', version.id, `Taslak kaydedildi: "${form.title}" v${version.versionNumber} (${fields.length} alan)`);
        return version;
    },

    /** Publishes the draft. The previously published version is kept (status ARCHIVED) for historic submissions. */
    async publishDraft(formId: string, actor?: FormActor) {
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: { versions: { where: { status: 'DRAFT' }, include: { fields: true } } },
        });
        if (!form) throw new Error('Form bulunamadı');
        const draft = form.versions[0];
        if (!draft) throw new FormDefinitionError(['Yayınlanacak bir taslak yok.']);

        const { fields } = versionToDefinition(draft as never);
        const problems = validateFormDefinition(fields);
        if (fields.filter((f) => !getFieldTypeMeta(String(f.fieldType)).isDisplayOnly).length === 0) {
            problems.push('Yayınlamak için en az bir soru gerekli.');
        }
        if (problems.length) throw new FormDefinitionError(problems);

        const published = await prisma.$transaction(async (tx) => {
            await tx.formVersion.updateMany({
                where: { formId, status: 'PUBLISHED' },
                data: { status: 'ARCHIVED' },
            });
            const version = await tx.formVersion.update({
                where: { id: draft.id },
                data: { status: 'PUBLISHED', publishedAt: new Date(), publishedById: actor?.id || null },
            });
            await tx.form.update({ where: { id: formId }, data: { isPublished: true } });
            return version;
        });

        await audit(actor, 'PUBLISH', 'FormVersion', published.id, `Form yayınlandı: "${form.title}" v${published.versionNumber}`);
        return published;
    },

    async discardDraft(formId: string, actor?: FormActor) {
        const draft = await prisma.formVersion.findFirst({ where: { formId, status: 'DRAFT' }, include: { _count: { select: { submissions: true } } } });
        if (!draft) return null;
        if (draft._count.submissions > 0) throw new FormDefinitionError(['Bu taslağa bağlı gönderimler olduğu için silinemez.']);
        await prisma.formVersion.delete({ where: { id: draft.id } });
        await audit(actor, 'DELETE', 'FormVersion', draft.id, `Taslak v${draft.versionNumber} silindi`);
        return draft;
    },

    async setPublished(formId: string, isPublished: boolean, actor?: FormActor) {
        const form = await prisma.form.findUnique({ where: { id: formId }, include: { versions: { where: { status: 'PUBLISHED' } } } });
        if (!form) throw new Error('Form bulunamadı');
        if (isPublished && form.versions.length === 0) throw new FormDefinitionError(['Önce bir versiyon yayınlayın.']);
        const updated = await prisma.form.update({ where: { id: formId }, data: { isPublished } });
        await audit(actor, isPublished ? 'PUBLISH' : 'UNPUBLISH', 'Form', formId, `Form ${isPublished ? 'yayına alındı' : 'yayından kaldırıldı'}: "${form.title}"`);
        return updated;
    },

    async setArchived(formId: string, isArchived: boolean, actor?: FormActor) {
        const form = await prisma.form.findUnique({ where: { id: formId } });
        if (!form) throw new Error('Form bulunamadı');
        const updated = await prisma.form.update({
            where: { id: formId },
            data: { isArchived, archivedAt: isArchived ? new Date() : null, isPublished: isArchived ? false : form.isPublished },
        });
        await audit(actor, isArchived ? 'ARCHIVE' : 'RESTORE', 'Form', formId, `Form ${isArchived ? 'arşivlendi' : 'geri yüklendi'}: "${form.title}"`);
        return updated;
    },
};
