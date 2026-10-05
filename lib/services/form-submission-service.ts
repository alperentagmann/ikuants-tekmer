import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logAuditEvent } from '@/lib/audit';
import { addTimelineEvent } from '@/lib/timeline';
import { maskTcNumber } from '@/lib/utils';
import { encryptTcNumber } from '@/lib/security/identity-security';
import { getAuthSecret } from '@/lib/env';
import { AdminAlertService } from '@/lib/services/admin-alert-service';
import { IntegrationService } from '@/lib/services/integration-service';
import type { AlertEvent } from '@/lib/services/alert-recipients';
import { MACHINE_QUOTE_FORM_SLUG } from '@/lib/machines';
import { EmailOutboxService, escapeHtml } from '@/lib/services/email-outbox-service';
import { versionToDefinition } from '@/lib/services/form-service';
import {
    FormFieldDefinition,
    FormValues,
    getFieldTypeMeta,
    normalizeFieldType,
    validateSubmission,
} from '@/lib/forms/schema';

export class SubmissionError extends Error {
    status: number;
    fieldErrors?: Record<string, string>;
    constructor(message: string, status = 400, fieldErrors?: Record<string, string>) {
        super(message);
        this.name = 'SubmissionError';
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

export interface SubmissionContext {
    entityType: string;
    entityId?: string | null;
    label: string;
}

export interface SubmissionMeta {
    ipAddress?: string;
    userAgent?: string;
    idempotencyKey?: string;
    isTest?: boolean;
    context?: SubmissionContext | null;
    /** The caller (e.g. the reservation flow) sends its own notifications. */
    skipNotifications?: boolean;
}

const ALLOWED_CONTEXT_TYPES = ['News', 'Event', 'Training', 'Facility', 'Program', 'Support', 'InfoRequest'];

export function sanitizeContext(raw: unknown): SubmissionContext | null {
    if (!raw || typeof raw !== 'object') return null;
    const c = raw as Record<string, unknown>;
    const entityType = String(c.entityType || '');
    if (!ALLOWED_CONTEXT_TYPES.includes(entityType)) return null;
    const label = String(c.label || '').slice(0, 200).trim();
    if (!label) return null;
    const entityId = c.entityId ? String(c.entityId).slice(0, 64) : null;
    return { entityType, entityId, label };
}

type ApplicantInfo = {
    name: string;
    email: string | null;
    phone: string | null;
    companyName: string | null;
    tcNumber: string | null;
};

const MIN_FILL_SECONDS = 2;

// ---------------------------------------------------------------------------
// Upload tokens: public file uploads return a signed token so a submission can
// only reference files that were uploaded for that form.
// ---------------------------------------------------------------------------

export function signUploadToken(mediaId: string, formSlug: string): string {
    const sig = crypto.createHmac('sha256', getAuthSecret()).update(`${formSlug}:${mediaId}`).digest('hex').slice(0, 32);
    return `${mediaId}.${sig}`;
}

export function verifyUploadToken(token: string, formSlug: string): string | null {
    const [mediaId, sig] = String(token).split('.');
    if (!mediaId || !sig) return null;
    const expected = crypto.createHmac('sha256', getAuthSecret()).update(`${formSlug}:${mediaId}`).digest('hex').slice(0, 32);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b) ? mediaId : null;
}

// ---------------------------------------------------------------------------
// Field role resolution (systemKey first, then type/key heuristics)
// ---------------------------------------------------------------------------

function findByRole(fields: FormFieldDefinition[], role: string, fallback: (f: FormFieldDefinition) => boolean) {
    return fields.find((f) => f.uiConfig?.systemKey === role) || fields.find(fallback) || null;
}

function stringValue(values: FormValues, field: FormFieldDefinition | null): string | null {
    if (!field) return null;
    const v = values[field.fieldKey];
    if (v === null || v === undefined || v === '') return null;
    return Array.isArray(v) ? v.join(', ') : String(v);
}

export function resolveApplicant(fields: FormFieldDefinition[], values: FormValues): ApplicantInfo {
    const keyIs = (...keys: string[]) => (f: FormFieldDefinition) => keys.includes(f.fieldKey);
    const nameField = findByRole(fields, 'applicant_name', keyIs('fullName', 'full_name', 'name', 'authorizedPerson', 'founderName', 'leaderName', 'adSoyad'));
    const firstName = findByRole(fields, 'first_name', keyIs('firstName', 'first_name'));
    const lastName = findByRole(fields, 'last_name', keyIs('lastName', 'last_name'));
    const emailField = findByRole(fields, 'applicant_email', (f) => normalizeFieldType(String(f.fieldType)) === 'EMAIL');
    const phoneField = findByRole(fields, 'applicant_phone', (f) => normalizeFieldType(String(f.fieldType)) === 'PHONE');
    const companyField = findByRole(fields, 'company_name', keyIs('companyName', 'company', 'projectName', 'teamName', 'organization'));
    const tcField = findByRole(fields, 'tc_number', (f) => normalizeFieldType(String(f.fieldType)) === 'TC_NO');

    const composed = [stringValue(values, firstName), stringValue(values, lastName)].filter(Boolean).join(' ');
    return {
        name: stringValue(values, nameField) || composed || 'Başvuru Sahibi',
        email: stringValue(values, emailField)?.toLowerCase() || null,
        phone: stringValue(values, phoneField),
        companyName: stringValue(values, companyField),
        tcNumber: stringValue(values, tcField),
    };
}

/** Sensitive values are masked in stored answers; the encrypted value lives on the application. */
function redactSensitive(fields: FormFieldDefinition[], values: FormValues): FormValues {
    const copy: FormValues = { ...values };
    for (const field of fields) {
        if (getFieldTypeMeta(String(field.fieldType)).isSensitive && typeof copy[field.fieldKey] === 'string') {
            copy[field.fieldKey] = maskTcNumber(copy[field.fieldKey] as string);
        }
    }
    return copy;
}

function parseRecipients(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String).filter((e) => e.includes('@')) : [];
    } catch {
        return [];
    }
}

const NUMBER_PREFIX: Record<string, string> = {
    PROGRAM: 'PRG',
    TEKMER: 'TKM',
    IDEATHON: 'IDT',
    HACKATHON: 'HCK',
    EVENT: 'EVT',
    TRAINING: 'TRN',
    MENTOR: 'MNT',
    ENTREPRENEUR: 'ENT',
    OTHER: 'APP',
};

async function nextApplicationNumber(applicationType: string, tx: Prisma.TransactionClient): Promise<string> {
    const prefix = `${NUMBER_PREFIX[applicationType] || 'APP'}-${new Date().getFullYear()}-`;
    const last = await tx.application.findFirst({
        where: { applicationNumber: { startsWith: prefix } },
        orderBy: { applicationNumber: 'desc' },
        select: { applicationNumber: true },
    });
    const lastSeq = last ? parseInt(last.applicationNumber.slice(prefix.length), 10) || 0 : 0;
    return `${prefix}${String(lastSeq + 1).padStart(5, '0')}`;
}

function defaultStatusForCampaign(workflowStages: string | null | undefined): string {
    try {
        const stages = workflowStages ? JSON.parse(workflowStages) : null;
        if (Array.isArray(stages) && stages.length > 0) {
            const first = [...stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
            if (first?.key) return String(first.key);
        }
    } catch {
        // fall through
    }
    return 'NEW';
}

async function renderTemplate(templateKey: string | null | undefined, variables: Record<string, string>) {
    if (!templateKey) return null;
    const template = await prisma.emailTemplate.findUnique({ where: { templateKey } });
    if (!template) return null;
    const subject = Object.entries(variables).reduce((s, [k, v]) => s.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v), template.subject);
    return { subject, html: EmailOutboxService.renderTemplate(template.htmlBody, variables), key: template.templateKey };
}

export const FormSubmissionService = {
    /**
     * Validates and stores a public form submission against the published
     * version of the form. Creates an Application when the form belongs to an
     * application campaign and a ContactRequest for contact forms.
     */
    async submitPublicForm(slug: string, rawValues: Record<string, unknown>, meta: SubmissionMeta = {}) {
        // Bot protection: honeypot and minimum fill time
        if (rawValues._hp) throw new SubmissionError('Gönderim reddedildi.', 400);
        const startedAt = Number(rawValues._ts);
        if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < MIN_FILL_SECONDS * 1000) {
            throw new SubmissionError('Form çok hızlı gönderildi. Lütfen tekrar deneyin.', 400);
        }

        const form = await prisma.form.findUnique({
            where: { slug },
            include: {
                versions: { where: { status: 'PUBLISHED' }, orderBy: { versionNumber: 'desc' }, take: 1, include: { fields: { orderBy: { sortOrder: 'asc' } } } },
                campaigns: { where: { status: { not: 'ARCHIVED' } }, include: { program: { select: { id: true, name: true } } } },
            },
        });
        if (!form || form.isArchived || !form.isPublished || form.requiresAuth || form.versions.length === 0) {
            throw new SubmissionError('Form bulunamadı veya şu anda yayında değil.', 404);
        }

        const version = form.versions[0];
        const { fields } = versionToDefinition(version as never);
        const publicFields = fields.filter((f) => !getFieldTypeMeta(String(f.fieldType)).adminOnly);

        const now = new Date();
        const campaign = form.campaigns.find((c) => c.status === 'OPEN') || null;
        const hasApplicationCampaign = form.campaigns.length > 0;
        if (hasApplicationCampaign) {
            if (!campaign) throw new SubmissionError('Bu başvuru dönemi şu anda kapalı.', 409);
            if ((campaign.opensAt && campaign.opensAt > now) || (campaign.closesAt && campaign.closesAt < now)) {
                throw new SubmissionError('Bu başvuru dönemi şu anda kapalı.', 409);
            }
        }

        // Idempotency: the same client submission is stored once
        if (meta.idempotencyKey) {
            const existing = await prisma.submission.findUnique({
                where: { idempotencyKey: meta.idempotencyKey },
                include: { application: { select: { applicationNumber: true } } },
            });
            if (existing) {
                return {
                    submissionNumber: existing.submissionNumber,
                    applicationNumber: existing.application?.applicationNumber || null,
                    successMessage: form.successMessage,
                    duplicate: true,
                    submissionId: existing.id,
                    applicantName: existing.applicantName || '',
                    applicantEmail: existing.applicantEmail,
                    values: {} as Record<string, unknown>,
                };
            }
        }

        const values: FormValues = {};
        for (const field of publicFields) {
            const v = rawValues[field.fieldKey];
            if (v === undefined) continue;
            values[field.fieldKey] = Array.isArray(v) ? v.map(String) : typeof v === 'boolean' || typeof v === 'number' ? v : v === null ? null : String(v);
        }

        const result = validateSubmission(publicFields, values);
        if (!result.isValid) {
            throw new SubmissionError('Lütfen işaretli alanları kontrol edin.', 422, result.errors);
        }

        // File answers must be upload tokens issued for this form
        const fileMediaIds: string[] = [];
        for (const field of publicFields) {
            const type = normalizeFieldType(String(field.fieldType));
            if (type !== 'FILE' && type !== 'FILES') continue;
            const tokens = result.cleaned[field.fieldKey];
            if (!tokens) continue;
            const list = Array.isArray(tokens) ? tokens : [String(tokens)];
            const ids: string[] = [];
            for (const token of list) {
                const mediaId = verifyUploadToken(token, slug);
                if (!mediaId) throw new SubmissionError('Yüklenen dosya doğrulanamadı. Lütfen dosyayı yeniden yükleyin.', 422, { [field.fieldKey]: 'Dosya doğrulanamadı.' });
                ids.push(mediaId);
            }
            fileMediaIds.push(...ids);
            result.cleaned[field.fieldKey] = ids;
        }

        const applicant = resolveApplicant(publicFields, result.cleaned);
        const stored = redactSensitive(publicFields, result.cleaned);

        const consentFields = publicFields.filter((f) => normalizeFieldType(String(f.fieldType)) === 'CONSENT');
        const channelFields = publicFields.filter((f) => f.uiConfig?.consentChannels);
        const kvkkIds = consentFields.map((f) => f.uiConfig?.kvkkTextId).filter((id): id is string => Boolean(id));
        const kvkkTexts = kvkkIds.length
            ? await prisma.kvkkTextVersion.findMany({ where: { id: { in: kvkkIds } }, select: { id: true, title: true, version: true } })
            : [];
        const consentSnapshot = {
            recordedAt: now.toISOString(),
            formVersion: version.versionNumber,
            consents: consentFields.map((f) => {
                const text = kvkkTexts.find((t) => t.id === f.uiConfig?.kvkkTextId);
                return {
                    fieldKey: f.fieldKey,
                    statement: f.label,
                    kind: f.uiConfig?.consentKind || 'OTHER',
                    accepted: result.cleaned[f.fieldKey] === true,
                    kvkkTextId: text?.id || null,
                    kvkkTextTitle: text?.title || null,
                    kvkkTextVersion: text?.version || null,
                };
            }),
            channels: channelFields.reduce<Record<string, unknown>>((acc, f) => {
                acc[f.fieldKey] = result.cleaned[f.fieldKey] ?? [];
                return acc;
            }, {}),
        };

        const applicationType = campaign?.applicationType || null;

        const created = await prisma.$transaction(async (tx) => {
            const submissionNumber = `SUB-${now.getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            const submission = await tx.submission.create({
                data: {
                    formVersionId: version.id,
                    formId: form.id,
                    campaignId: campaign?.id || null,
                    submissionNumber,
                    isTest: meta.isTest === true,
                    status: 'SUBMITTED',
                    ipAddress: meta.ipAddress,
                    userAgent: meta.userAgent?.slice(0, 500),
                    idempotencyKey: meta.idempotencyKey || null,
                    applicantName: applicant.name,
                    applicantEmail: applicant.email,
                    rawSnapshot: JSON.stringify(stored),
                    consentSnapshot: JSON.stringify(consentSnapshot),
                    privacyTextIds: kvkkTexts.length ? JSON.stringify(kvkkTexts.map((t) => t.id)) : null,
                    contextJson: meta.context ? JSON.stringify(meta.context) : null,
                },
            });

            const rowsByKey = new Map(version.fields.map((row) => [row.fieldKey, row]));
            for (const field of publicFields) {
                const value = stored[field.fieldKey];
                const row = rowsByKey.get(field.fieldKey);
                if (value === undefined || !row) continue;
                await tx.submissionAnswer.create({
                    data: {
                        submissionId: submission.id,
                        fieldId: row.id,
                        fieldKey: field.fieldKey,
                        fieldLabel: field.label,
                        textValue: typeof value === 'string' ? value : typeof value === 'boolean' || typeof value === 'number' ? String(value) : null,
                        numValue: typeof value === 'number' ? value : null,
                        jsonValue: Array.isArray(value) ? JSON.stringify(value) : null,
                    },
                });
            }

            let application = null;
            if (campaign && applicationType) {
                const status = defaultStatusForCampaign(campaign.workflowStages);
                let applicationNumber = await nextApplicationNumber(applicationType, tx);
                for (let attempt = 0; attempt < 3; attempt++) {
                    const clash = await tx.application.findUnique({ where: { applicationNumber } });
                    if (!clash) break;
                    applicationNumber = `${applicationNumber.slice(0, -5)}${crypto.randomInt(10000, 99999)}`;
                }
                const duplicate = applicant.email
                    ? await tx.application.findFirst({
                        where: { email: applicant.email, campaignId: campaign.id, isArchived: false },
                        select: { applicationNumber: true },
                    })
                    : null;

                application = await tx.application.create({
                    data: {
                        applicationNumber,
                        formVersionId: version.id,
                        submissionId: submission.id,
                        campaignId: campaign.id,
                        programId: applicationType === 'TEKMER' ? null : campaign.programId,
                        applicationType,
                        applicantType: applicant.companyName && applicationType === 'TEKMER' ? 'ORGANIZATION' : 'PERSON',
                        applicantName: applicant.name,
                        companyName: applicant.companyName,
                        email: applicant.email || '',
                        phone: applicant.phone,
                        tcNumberMasked: applicant.tcNumber ? maskTcNumber(applicant.tcNumber) : null,
                        tcNumberEncrypted: applicant.tcNumber ? encryptTcNumber(applicant.tcNumber) : null,
                        status,
                        duplicateWarning: duplicate ? `Aynı e-posta ile bu kampanyada önceki başvuru: ${duplicate.applicationNumber}` : null,
                    },
                });

                await tx.applicationStatusHistory.create({
                    data: { applicationId: application.id, fromStatus: 'NONE', toStatus: status, reason: 'Başvuru public form üzerinden alındı.' },
                });
                await tx.notification.create({
                    data: {
                        title: applicationType === 'TEKMER' ? 'Yeni TEKMER Yer Edinme Başvurusu' : 'Yeni Başvuru',
                        message: `${applicant.name} — ${campaign.name} (${applicationNumber})`,
                        notificationType: 'NEW_APPLICATION',
                        targetUrl: `/admin/basvurular/${application.id}`,
                    },
                });
            }

            let contactRequest = null;
            if (form.formType.startsWith('CONTACT')) {
                const v = result.cleaned;
                const pick = (role: string, ...keys: string[]) => {
                    const f = publicFields.find((x) => x.uiConfig?.systemKey === role) || publicFields.find((x) => keys.includes(x.fieldKey));
                    return f ? stringValue(v, f) : null;
                };
                const requestType = form.formType === 'CONTACT_MEETING' ? 'MEETING' : form.formType === 'CONTACT_VISIT' ? 'VISIT' : 'MESSAGE';
                contactRequest = await tx.contactRequest.create({
                    data: {
                        requestType,
                        fullName: applicant.name,
                        email: applicant.email || '',
                        phone: applicant.phone,
                        company: applicant.companyName,
                        message: pick('message', 'message', 'mesaj'),
                        meetingTopic: requestType === 'MEETING' ? pick('meeting_topic', 'topic', 'meetingTopic') : null,
                        meetWith: requestType === 'MEETING' ? pick('meet_with', 'meetWith') : null,
                        meetingDate: requestType === 'MEETING' ? pick('meeting_date', 'date', 'meetingDate') : null,
                        meetingTime: requestType === 'MEETING' ? pick('meeting_time', 'time', 'meetingTime') : null,
                        visitTopic: requestType === 'VISIT' ? pick('visit_topic', 'visitTopic', 'topic') : null,
                        visitWho: requestType === 'VISIT' ? pick('visit_who', 'visitWho') : null,
                        visitDate: requestType === 'VISIT' ? pick('visit_date', 'visitDate', 'date') : null,
                        visitTime: requestType === 'VISIT' ? pick('visit_time', 'visitTime', 'time') : null,
                        groupSize: requestType === 'VISIT' ? pick('group_size', 'groupSize') : null,
                        notes: `Form: ${form.title} · Gönderim: ${submission.submissionNumber}`,
                    },
                });
                await tx.notification.create({
                    data: {
                        title: 'Yeni İletişim Talebi',
                        message: `${applicant.name} (${requestType === 'MEETING' ? 'Toplantı' : requestType === 'VISIT' ? 'Ziyaret' : 'Mesaj'})`,
                        notificationType: 'NEW_CONTACT',
                        targetUrl: '/admin/iletisim',
                    },
                });
            }

            if (!application && !contactRequest && !meta.skipNotifications) {
                await tx.notification.create({
                    data: {
                        title: `Yeni form gönderimi: ${form.title}`,
                        message: `${applicant.name}${meta.context ? ` · ${meta.context.label}` : ''} · ${submission.submissionNumber}`,
                        notificationType: 'NEW_SUBMISSION',
                        targetUrl: `/admin/form-builder/${form.id}?tab=submissions`,
                    },
                });
            }

            // Uploaded files become private documents linked to the submission
            if (fileMediaIds.length > 0) {
                await tx.media.updateMany({ where: { id: { in: fileMediaIds } }, data: { usageCount: { increment: 1 } } });
                for (const mediaId of fileMediaIds) {
                    await tx.document.create({
                        data: {
                            title: `${form.title} — ${applicant.name}`,
                            category: application ? 'APPLICATION' : 'GENERAL',
                            mediaId,
                            entityType: application ? 'Application' : 'Submission',
                            entityId: application ? application.id : submission.id,
                            visibility: 'RESTRICTED',
                        },
                    });
                }
            }

            return { submission, application, contactRequest };
        });

        if (created.application) {
            await addTimelineEvent({
                entityType: 'Application',
                entityId: created.application.id,
                title: 'Başvuru Alındı',
                description: `${created.application.applicationNumber} — ${campaign?.name}`,
                eventType: 'STATUS_CHANGE',
            });
        }
        if (created.contactRequest) {
            await addTimelineEvent({
                entityType: 'ContactRequest',
                entityId: created.contactRequest.id,
                title: 'İletişim talebi alındı',
                description: form.title,
                eventType: 'STATUS_CHANGE',
            });
        }

        await logAuditEvent({
            action: 'CREATE',
            entityType: created.application ? 'Application' : 'Submission',
            entityId: created.application?.id || created.submission.id,
            diff: `Public form gönderimi: ${form.title} (${created.submission.submissionNumber})`,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
        });

        if (!meta.skipNotifications) {
            await FormSubmissionService.queueNotifications({
                form,
                campaign,
                submissionNumber: created.submission.submissionNumber,
                applicationId: created.application?.id || null,
                applicationNumber: created.application?.applicationNumber || null,
                applicant,
            });
        }

        return {
            submissionNumber: created.submission.submissionNumber,
            applicationNumber: created.application?.applicationNumber || null,
            successMessage: form.successMessage,
            duplicate: false,
            submissionId: created.submission.id,
            applicantName: applicant.name,
            applicantEmail: applicant.email,
            values: stored as Record<string, unknown>,
        };
    },

    async queueNotifications(params: {
        form: { id: string; title: string; notifyEmails: string | null; confirmationTemplateKey: string | null; formType?: string | null; slug?: string | null };
        campaign: { id: string; name: string; notificationRecipients: string | null; confirmationTemplateKey: string | null } | null;
        submissionNumber: string;
        applicationId: string | null;
        applicationNumber: string | null;
        applicant: ApplicantInfo;
    }) {
        const { form, campaign, applicant } = params;
        const reference = params.applicationNumber || params.submissionNumber;
        const variables = {
            applicant_name: applicant.name,
            name: applicant.name,
            reference,
            application_number: params.applicationNumber || '',
            form_title: form.title,
            campaign_name: campaign?.name || form.title,
            program_name: campaign?.name || form.title,
        };

        // Applicant confirmation
        if (applicant.email) {
            const templateKey = campaign?.confirmationTemplateKey || form.confirmationTemplateKey;
            const rendered = await renderTemplate(templateKey, variables);
            if (rendered) {
                await EmailOutboxService.enqueueEmail({
                    recipientEmail: applicant.email,
                    recipientName: applicant.name,
                    subject: rendered.subject,
                    templateKey: rendered.key,
                    htmlBody: rendered.html,
                    entityType: params.applicationId ? 'APPLICATION' : 'SUBMISSION',
                    entityId: params.applicationId || params.submissionNumber,
                });
            } else if (params.applicationId && params.applicationNumber) {
                await EmailOutboxService.triggerApplicationSubmittedEmails({
                    id: params.applicationId,
                    applicationNumber: params.applicationNumber,
                    applicantName: applicant.name,
                    email: applicant.email,
                    programName: campaign?.name,
                    additionalRecipients: parseRecipients(campaign?.notificationRecipients).concat(parseRecipients(form.notifyEmails)),
                });
                void IntegrationService.dispatch('application.created', { entityType: 'APPLICATION', entityId: params.applicationId, subject: `${campaign?.name || form.title} — ${params.applicationNumber}`, link: `/admin/basvurular/${params.applicationId}` });
                return;
            }
        }

        // Internal alert: super admins (always), admins with the module permission,
        // alert-rule addresses, ADMIN_NOTIFICATION_EMAIL, and campaign / form recipients.
        const event: AlertEvent = params.applicationId
            ? 'APPLICATION_NEW'
            : form.formType?.startsWith('CONTACT')
              ? 'CONTACT_NEW'
              : form.slug === MACHINE_QUOTE_FORM_SLUG
                ? 'QUOTE_REQUEST'
                : 'FORM_SUBMISSION';
        await AdminAlertService.notify(event, {
            subject: `[${form.title}] Yeni gönderim — ${reference}`,
            heading: event === 'CONTACT_NEW' ? 'Yeni iletişim talebi' : event === 'QUOTE_REQUEST' ? 'Yeni fiyat teklifi talebi' : 'Yeni form gönderimi',
            rows: [
                ['Form', form.title],
                ['Referans', reference],
                ['Gönderen', applicant.name],
                ['Kurum', applicant.companyName],
            ],
            link: params.applicationId ? `/admin/basvurular/${params.applicationId}` : event === 'CONTACT_NEW' ? '/admin/iletisim' : `/admin/form-builder/${form.id}?tab=submissions`,
            entityType: params.applicationId ? 'APPLICATION' : 'SUBMISSION',
            entityId: params.applicationId || params.submissionNumber,
            extraRecipients: [...parseRecipients(campaign?.notificationRecipients), ...parseRecipients(form.notifyEmails)],
        });
    },

    // ------------------------------------------------------------------ Admin: submissions

    async listSubmissions(params: {
        formId?: string;
        campaignId?: string;
        search?: string;
        status?: string;
        from?: Date;
        to?: Date;
        page?: number;
        limit?: number;
    }) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(200, Math.max(1, params.limit || 25));
        const where: Record<string, unknown> = {};
        if (params.formId) where.OR = [{ formId: params.formId }, { formVersion: { formId: params.formId } }];
        if (params.campaignId) where.campaignId = params.campaignId;
        if (params.status) where.status = params.status;
        if (params.from || params.to) where.createdAt = { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) };
        if (params.search) {
            const searchOr = [
                { submissionNumber: { contains: params.search, mode: 'insensitive' } },
                { applicantName: { contains: params.search, mode: 'insensitive' } },
                { applicantEmail: { contains: params.search, mode: 'insensitive' } },
            ];
            where.AND = [{ OR: searchOr }];
        }

        const [items, total] = await Promise.all([
            prisma.submission.findMany({
                where,
                include: {
                    formVersion: { select: { versionNumber: true, form: { select: { id: true, title: true, slug: true } } } },
                    campaign: { select: { id: true, name: true, applicationType: true } },
                    application: { select: { id: true, applicationNumber: true, status: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.submission.count({ where }),
        ]);

        return {
            items: items.map((s) => ({
                id: s.id,
                submissionNumber: s.submissionNumber,
                status: s.status,
                isTest: s.isTest,
                applicantName: s.applicantName,
                applicantEmail: s.applicantEmail,
                createdAt: s.createdAt,
                form: s.formVersion.form,
                versionNumber: s.formVersion.versionNumber,
                campaign: s.campaign,
                application: s.application,
            })),
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        };
    },

    async getSubmissionDetail(id: string) {
        const submission = await prisma.submission.findUnique({
            where: { id },
            include: {
                formVersion: { include: { form: { select: { id: true, title: true, slug: true, formType: true } }, fields: { orderBy: { sortOrder: 'asc' } } } },
                answers: true,
                campaign: { select: { id: true, name: true, applicationType: true, program: { select: { id: true, name: true } } } },
                application: { select: { id: true, applicationNumber: true, status: true, applicationType: true } },
                person: { select: { id: true, fullName: true } },
                organization: { select: { id: true, name: true } },
            },
        });
        if (!submission) return null;

        const { fields, sections } = versionToDefinition(submission.formVersion as never);
        const answersByKey = new Map(submission.answers.map((a) => [a.fieldKey, a]));
        const documents = await prisma.document.findMany({
            where: {
                OR: [
                    { entityType: 'Submission', entityId: submission.id },
                    ...(submission.application ? [{ entityType: 'Application', entityId: submission.application.id }] : []),
                ],
            },
            include: { media: { select: { id: true, originalName: true, mimeType: true, fileSize: true, publicUrl: true } } },
        });

        let consent: unknown = null;
        try {
            consent = submission.consentSnapshot ? JSON.parse(submission.consentSnapshot) : null;
        } catch {
            consent = null;
        }

        let context: SubmissionContext | null = null;
        try {
            context = submission.contextJson ? JSON.parse(submission.contextJson) : null;
        } catch {
            context = null;
        }

        return {
            id: submission.id,
            submissionNumber: submission.submissionNumber,
            status: submission.status,
            context,
            isTest: submission.isTest,
            createdAt: submission.createdAt,
            applicantName: submission.applicantName,
            applicantEmail: submission.applicantEmail,
            form: submission.formVersion.form,
            versionNumber: submission.formVersion.versionNumber,
            campaign: submission.campaign,
            application: submission.application,
            person: submission.person,
            organization: submission.organization,
            consent,
            documents,
            sections,
            answers: fields
                .filter((f) => !getFieldTypeMeta(String(f.fieldType)).isDisplayOnly)
                .map((f) => {
                    const a = answersByKey.get(f.fieldKey);
                    let value: unknown = null;
                    if (a) {
                        if (a.jsonValue) {
                            try {
                                value = JSON.parse(a.jsonValue);
                            } catch {
                                value = a.jsonValue;
                            }
                        } else value = a.textValue ?? a.numValue;
                    }
                    if (Array.isArray(value) && (f.options || []).length > 0) {
                        value = value.map((v) => f.options?.find((o) => o.value === v)?.label || v);
                    } else if (typeof value === 'string' && (f.options || []).length > 0) {
                        value = f.options?.find((o) => o.value === value)?.label || value;
                    }
                    return {
                        fieldKey: f.fieldKey,
                        label: f.label,
                        fieldType: f.fieldType,
                        stepNumber: f.stepNumber,
                        value,
                        isSensitive: getFieldTypeMeta(String(f.fieldType)).isSensitive === true,
                    };
                }),
        };
    },

    async updateSubmissionStatus(id: string, status: string, actor: { id: string; name?: string | null; email?: string | null }) {
        if (!['SUBMITTED', 'REVIEWED', 'SPAM', 'ARCHIVED'].includes(status)) throw new SubmissionError('Geçersiz durum.');
        const existing = await prisma.submission.findUnique({ where: { id } });
        if (!existing) throw new SubmissionError('Gönderim bulunamadı.', 404);
        const updated = await prisma.submission.update({ where: { id }, data: { status } });
        await logAuditEvent({
            actorId: actor.id,
            actorEmail: actor.email || undefined,
            actorName: actor.name || undefined,
            action: 'UPDATE',
            entityType: 'Submission',
            entityId: id,
            oldValues: { status: existing.status },
            newValues: { status },
        });
        return updated;
    },

    /** Links a submission to an existing CRM person and/or organization (explicit admin decision). */
    async linkSubmission(id: string, links: { personId?: string | null; organizationId?: string | null }, actor: { id: string; name?: string | null; email?: string | null }) {
        const updated = await prisma.submission.update({
            where: { id },
            data: {
                personId: links.personId === undefined ? undefined : links.personId,
                organizationId: links.organizationId === undefined ? undefined : links.organizationId,
            },
            include: { application: { select: { id: true } } },
        });
        if (updated.application) {
            await prisma.application.update({
                where: { id: updated.application.id },
                data: {
                    personId: links.personId === undefined ? undefined : links.personId,
                    organizationId: links.organizationId === undefined ? undefined : links.organizationId,
                },
            });
        }
        await logAuditEvent({
            actorId: actor.id,
            actorEmail: actor.email || undefined,
            actorName: actor.name || undefined,
            action: 'UPDATE',
            entityType: 'Submission',
            entityId: id,
            newValues: links,
            diff: 'Gönderim CRM kaydına bağlandı',
        });
        return updated;
    },
};
