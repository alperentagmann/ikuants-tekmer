import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { EmailOutboxService, escapeHtml } from '@/lib/services/email-outbox-service';
import { formatIstanbul } from '@/lib/services/space-reservation-service';
import { assignmentLabel } from '@/lib/program-track';

/**
 * Email center: compose, drafts, scheduling and outbox views on top of EmailOutbox.
 * Template variables are filled from the linked record's real data. Variables that cannot
 * be resolved stay visible and block sending, so no recipient receives invented values.
 */

type Actor = { id: string; name: string; email: string };

export const EMAIL_TABS = {
    drafts: { status: ['DRAFT'] },
    outbox: { status: ['PENDING', 'PROCESSING'] },
    scheduled: { status: ['PENDING'] },
    sent: { status: ['SENT'] },
    failed: { status: ['FAILED'] },
    cancelled: { status: ['CANCELLED'] },
} as const;
export type EmailTab = keyof typeof EMAIL_TABS;

export const EMAIL_ENTITY_TYPES = ['Person', 'Organization', 'Entrepreneur', 'Application', 'RentContract', 'Reservation'] as const;

export const TEMPLATE_VARIABLES = [
    { tag: 'person.fullName', label: 'Kişi adı soyadı' },
    { tag: 'person.firstName', label: 'Kişi adı' },
    { tag: 'organization.name', label: 'Kurum / şirket adı' },
    { tag: 'entrepreneur.name', label: 'Girişim adı' },
    { tag: 'program.name', label: 'Program adı' },
    { tag: 'application.reference', label: 'Başvuru no' },
    { tag: 'rent.period', label: 'Kira dönemi' },
    { tag: 'rent.remainingAmount', label: 'Kalan kira tutarı' },
    { tag: 'rent.dueDate', label: 'Son ödeme tarihi' },
    { tag: 'space.name', label: 'Alan adı' },
    { tag: 'reservation.date', label: 'Rezervasyon tarihi' },
    { tag: 'reservation.time', label: 'Rezervasyon saati' },
    { tag: 'reservation.attendees', label: 'Katılımcı sayısı' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(value: string | null | undefined): string[] {
    return (value || '').split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/** Collects real values for template variables from the linked record. */
export async function resolveVariables(entityType?: string | null, entityId?: string | null): Promise<{ values: Record<string, string>; recipient: { email: string | null; name: string | null } }> {
    const values: Record<string, string> = {};
    const recipient: { email: string | null; name: string | null } = { email: null, name: null };
    if (!entityType || !entityId) return { values, recipient };
    const setPerson = (fullName?: string | null) => {
        if (!fullName) return;
        values['person.fullName'] = fullName;
        values['person.firstName'] = fullName.split(/\s+/)[0];
    };
    const fmtDate = (d: Date) => formatIstanbul(d, { dateStyle: 'long' });

    if (entityType === 'Person') {
        const p = await prisma.person.findUnique({ where: { id: entityId }, include: { memberships: { where: { status: 'ACTIVE' }, orderBy: { isPrimaryContact: 'desc' }, include: { organization: { select: { name: true } } }, take: 1 } } });
        if (p) {
            setPerson(p.fullName);
            if (p.memberships[0]) values['organization.name'] = p.memberships[0].organization.name;
            recipient.email = p.email;
            recipient.name = p.fullName;
        }
    } else if (entityType === 'Organization') {
        const o = await prisma.organization.findUnique({ where: { id: entityId } });
        if (o) {
            values['organization.name'] = o.name;
            recipient.email = o.email;
            recipient.name = o.name;
        }
    } else if (entityType === 'Entrepreneur') {
        const e = await prisma.entrepreneur.findUnique({ where: { id: entityId }, include: { programAssignments: { where: { status: 'ACTIVE' }, include: { program: { select: { name: true } } }, take: 1 }, founderMembers: { orderBy: [{ isLead: 'desc' }, { sortOrder: 'asc' }], take: 1 } } });
        if (e) {
            const lead = e.founderMembers[0];
            values['entrepreneur.name'] = e.name;
            values['organization.name'] = e.name;
            setPerson(lead?.fullName);
            if (e.programAssignments[0]) values['program.name'] = assignmentLabel(e.programAssignments[0]);
            recipient.email = e.email || lead?.email || null;
            recipient.name = lead?.fullName || e.name;
        }
    } else if (entityType === 'Application') {
        const a = await prisma.application.findUnique({ where: { id: entityId }, include: { program: { select: { name: true } }, campaign: { select: { name: true } } } });
        if (a) {
            setPerson(a.applicantName);
            values['application.reference'] = a.applicationNumber;
            if (a.companyName) values['organization.name'] = a.companyName;
            const program = a.program?.name || a.campaign?.name;
            if (program) values['program.name'] = program;
            recipient.email = a.email;
            recipient.name = a.applicantName;
        }
    } else if (entityType === 'RentContract') {
        const c = await prisma.rentContract.findUnique({
            where: { id: entityId },
            include: { entrepreneur: true, financeContactPerson: { select: { fullName: true, email: true } }, accruals: { where: { remainingAmount: { gt: 0 }, status: { notIn: ['PAID', 'WAIVED', 'CANCELLED'] } }, orderBy: [{ year: 'asc' }, { month: 'asc' }], take: 1 } },
        });
        if (c) {
            values['entrepreneur.name'] = c.entrepreneur.name;
            values['organization.name'] = c.entrepreneur.name;
            values['space.name'] = c.spaceName;
            setPerson(c.financeContactPerson?.fullName || c.contactPersonName);
            const acc = c.accruals[0];
            if (acc) {
                values['rent.period'] = acc.periodLabel;
                values['rent.remainingAmount'] = `${acc.remainingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${acc.currency}`;
                values['rent.dueDate'] = fmtDate(acc.dueDate);
            }
            recipient.email = c.financeContactPerson?.email || c.contactEmail || c.entrepreneur.email;
            recipient.name = c.financeContactPerson?.fullName || c.contactPersonName || c.entrepreneur.name;
        }
    } else if (entityType === 'Reservation') {
        const r = await prisma.reservation.findUnique({ where: { id: entityId }, include: { resource: { select: { name: true } }, user: { select: { name: true, email: true } } } });
        if (r) {
            setPerson(r.requesterName || r.user?.name);
            values['space.name'] = r.resource.name;
            values['reservation.date'] = fmtDate(r.startTime);
            values['reservation.time'] = `${formatIstanbul(r.startTime, { hour: '2-digit', minute: '2-digit' })}–${formatIstanbul(r.endTime, { hour: '2-digit', minute: '2-digit' })}`;
            if (r.attendeeCount) values['reservation.attendees'] = String(r.attendeeCount);
            if (r.requesterOrganization) values['organization.name'] = r.requesterOrganization;
            recipient.email = r.requesterEmail || r.user?.email || null;
            recipient.name = r.requesterName || r.user?.name || null;
        }
    }
    return { values, recipient };
}

export function fillTemplate(text: string, values: Record<string, string>): { text: string; missing: string[] } {
    const missing = new Set<string>();
    const out = text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) => {
        if (values[key] !== undefined && values[key] !== '') return values[key];
        missing.add(key);
        return match;
    });
    return { text: out, missing: Array.from(missing) };
}

function toHtml(body: string): string {
    return escapeHtml(body).replace(/\r?\n/g, '<br/>');
}

export interface ComposeInput {
    to: string;
    cc?: string | null;
    subject: string;
    body: string;
    templateKey?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    mode: 'draft' | 'send' | 'schedule';
    scheduledAt?: string | null;
}

async function validateAndRender(input: ComposeInput, requireComplete: boolean) {
    const to = parseEmails(input.to);
    const cc = parseEmails(input.cc);
    if (requireComplete && to.length === 0) throw new DomainError('En az bir alıcı e-posta adresi girin.');
    const invalid = [...to, ...cc].filter((e) => !EMAIL_RE.test(e));
    if (invalid.length) throw new DomainError(`Geçersiz e-posta adresi: ${invalid.join(', ')}`);
    if (requireComplete && (!input.subject.trim() || !input.body.trim())) throw new DomainError('Konu ve içerik zorunludur.');
    if (input.entityType && !EMAIL_ENTITY_TYPES.includes(input.entityType as (typeof EMAIL_ENTITY_TYPES)[number])) throw new DomainError('Geçersiz kayıt türü.');
    const { values } = await resolveVariables(input.entityType, input.entityId);
    const subject = fillTemplate(input.subject, values);
    const body = fillTemplate(input.body, values);
    const missing = Array.from(new Set([...subject.missing, ...body.missing]));
    if (requireComplete && missing.length) {
        throw new DomainError(`Doldurulamayan değişkenler var: ${missing.map((m) => `{{${m}}}`).join(', ')}. İlgili kaydı seçin veya metni düzenleyin.`);
    }
    return { to, cc, subject: subject.text, body: body.text, missing };
}

export const EmailCenterService = {
    providerStatus() {
        const configured = EmailOutboxService.isProviderConfigured();
        return {
            configured,
            status: configured ? 'CONFIGURED' : 'PENDING_EXTERNAL_CONFIGURATION',
            from: configured ? process.env.SMTP_FROM || process.env.SMTP_USER || null : null,
            message: configured ? 'E-postalar yapılandırılmış SMTP sağlayıcısı üzerinden gönderilir.' : 'E-posta sağlayıcısı (SMTP) yapılandırılmadı. Gönderilen e-postalar outbox\'ta bekler ve sağlayıcı tanımlanınca otomatik gönderilir.',
        };
    },

    async list(params: { tab: EmailTab | 'all'; search?: string; page?: number; limit?: number }) {
        const where: Record<string, unknown> = {};
        const now = new Date();
        if (params.tab !== 'all') where.status = { in: [...EMAIL_TABS[params.tab].status] };
        if (params.tab === 'scheduled') where.scheduledAt = { gt: now };
        if (params.tab === 'outbox') where.OR = [{ scheduledAt: null }, { scheduledAt: { lte: now } }];
        if (params.search) {
            const s = { contains: params.search, mode: 'insensitive' };
            where.AND = [{ OR: [{ recipientEmail: s }, { subject: s }, { recipientName: s }] }];
        }
        const limit = Math.min(100, params.limit || 25);
        const page = Math.max(1, params.page || 1);
        const [items, total, counts, scheduled] = await Promise.all([
            prisma.emailOutbox.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, select: { id: true, recipientEmail: true, recipientName: true, ccEmails: true, subject: true, templateKey: true, status: true, retryCount: true, errorMessage: true, entityType: true, entityId: true, scheduledAt: true, sentAt: true, createdAt: true } }),
            prisma.emailOutbox.count({ where }),
            prisma.emailOutbox.groupBy({ by: ['status'], _count: true }),
            prisma.emailOutbox.count({ where: { status: 'PENDING', scheduledAt: { gt: now } } }),
        ]);
        const c = Object.fromEntries(counts.map((x) => [x.status, x._count])) as Record<string, number>;
        return {
            items,
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            counts: { drafts: c.DRAFT || 0, outbox: (c.PENDING || 0) + (c.PROCESSING || 0) - scheduled, scheduled, sent: c.SENT || 0, failed: c.FAILED || 0, cancelled: c.CANCELLED || 0 },
        };
    },

    async get(id: string) {
        const item = await prisma.emailOutbox.findUnique({ where: { id } });
        if (!item) throw new DomainError('E-posta bulunamadı.', 404);
        return item;
    },

    async preview(input: Pick<ComposeInput, 'subject' | 'body' | 'entityType' | 'entityId'>) {
        const { values, recipient } = await resolveVariables(input.entityType, input.entityId);
        const subject = fillTemplate(input.subject || '', values);
        const body = fillTemplate(input.body || '', values);
        return { subject: subject.text, body: body.text, missing: Array.from(new Set([...subject.missing, ...body.missing])), recipient };
    },

    async compose(input: ComposeInput, actor: Actor) {
        const isDraft = input.mode === 'draft';
        const r = await validateAndRender(input, !isDraft);
        let scheduledAt: Date | null = null;
        if (input.mode === 'schedule') {
            scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
            if (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() + 60000) throw new DomainError('Zamanlama için ileri bir tarih ve saat seçin.');
        }
        const recipients = isDraft ? [r.to.join(', ')] : r.to;
        const created = [];
        for (const to of recipients) {
            created.push(
                await prisma.emailOutbox.create({
                    data: {
                        recipientEmail: to,
                        ccEmails: r.cc.length ? r.cc.join(', ') : null,
                        // Drafts keep the original text so variables can still be resolved later
                        subject: isDraft ? input.subject : r.subject,
                        htmlBody: isDraft ? toHtml(input.body) : toHtml(r.body),
                        textBody: isDraft ? input.body : r.body,
                        templateKey: input.templateKey || 'CUSTOM_EMAIL',
                        status: isDraft ? 'DRAFT' : 'PENDING',
                        scheduledAt,
                        entityType: input.entityType || null,
                        entityId: input.entityId || null,
                        createdById: actor.id,
                    },
                })
            );
        }
        const results = [];
        for (const item of created) {
            results.push(input.mode === 'send' ? await EmailOutboxService.sendEmailImmediately(item.id) : item);
        }
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: isDraft ? 'EMAIL_DRAFT' : input.mode === 'schedule' ? 'EMAIL_SCHEDULE' : 'EMAIL_SEND', entityType: 'EmailOutbox', entityId: created[0]?.id, newValues: { recipients: r.to.length, subject: r.subject, entityType: input.entityType || null, entityId: input.entityId || null, scheduledAt } });
        const sent = results.filter((x) => x.status === 'SENT').length;
        return { items: results, sent, queued: results.filter((x) => x.status === 'PENDING').length, provider: this.providerStatus() };
    },

    async updateDraft(id: string, input: Omit<ComposeInput, 'mode'>, actor: Actor) {
        const item = await this.get(id);
        if (item.status !== 'DRAFT') throw new DomainError('Yalnızca taslaklar düzenlenebilir.', 409);
        const r = await validateAndRender({ ...input, mode: 'draft' }, false);
        const updated = await prisma.emailOutbox.update({
            where: { id },
            data: { recipientEmail: r.to.join(', '), ccEmails: r.cc.join(', ') || null, subject: input.subject, htmlBody: toHtml(input.body), textBody: input.body, templateKey: input.templateKey || item.templateKey, entityType: input.entityType || null, entityId: input.entityId || null },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'EmailOutbox', entityId: id, diff: 'E-posta taslağı güncellendi' });
        return updated;
    },

    async sendDraft(id: string, actor: Actor, scheduledAt?: string | null) {
        const item = await this.get(id);
        if (item.status !== 'DRAFT') throw new DomainError('Bu kayıt taslak değil.', 409);
        const result = await this.compose(
            { to: item.recipientEmail, cc: item.ccEmails, subject: item.subject, body: item.textBody || '', templateKey: item.templateKey, entityType: item.entityType, entityId: item.entityId, mode: scheduledAt ? 'schedule' : 'send', scheduledAt },
            actor
        );
        await prisma.emailOutbox.update({ where: { id }, data: { status: 'CANCELLED', errorMessage: 'Taslak gönderime dönüştürüldü' } });
        return result;
    },

    async cancel(id: string, actor: Actor) {
        const item = await this.get(id);
        if (!['DRAFT', 'PENDING', 'FAILED'].includes(item.status)) throw new DomainError('Bu e-posta iptal edilemez.', 409);
        await prisma.emailOutbox.update({ where: { id }, data: { status: 'CANCELLED' } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CANCEL', entityType: 'EmailOutbox', entityId: id, diff: item.subject });
    },

    async retry(id: string, actor: Actor) {
        const item = await this.get(id);
        if (item.status !== 'FAILED') throw new DomainError('Yalnızca başarısız e-postalar yeniden denenebilir.', 409);
        await EmailOutboxService.retryEmail(id);
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'RETRY', entityType: 'EmailOutbox', entityId: id, diff: item.subject });
        return EmailOutboxService.sendEmailImmediately(id);
    },
};
