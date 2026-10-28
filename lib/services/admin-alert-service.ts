import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { EmailOutboxService, escapeHtml } from '@/lib/services/email-outbox-service';
import { IntegrationService } from '@/lib/services/integration-service';
import { ALERT_EVENTS, ALERT_RULES_KEY, getAlertRules, getAlertSettings, resolveAlertRecipients, resolveGlobalRecipients, sanitizeAlertGlobal, sanitizeAlertRules, serializeAlertSettings, type AlertEvent, type AlertGlobal, type AlertRules } from '@/lib/services/alert-recipients';

const WEBHOOK_EVENT_OF: Record<AlertEvent, string> = {
    APPLICATION_NEW: 'application.created',
    CONTACT_NEW: 'contact.created',
    FORM_SUBMISSION: 'form.submitted',
    RESERVATION_NEW: 'reservation.created',
    QUOTE_REQUEST: 'quote.requested',
    CONTRACT_RENEWAL: 'contract.expiring',
    POLICY_RENEWAL: 'policy.expiring',
    RENT_OVERDUE: 'rent.overdue',
};

export interface AlertMessage {
    subject: string;
    heading: string;
    /** Label / value rows shown in the e-mail; values must not contain sensitive identity data. */
    rows: [string, string | number | null | undefined][];
    /** Admin path, e.g. /admin/basvurular/123 */
    link: string;
    entityType: string;
    entityId: string;
    /** Context-specific addresses (form / campaign notification settings). */
    extraRecipients?: string[];
}

/**
 * Sends internal alerts for incoming work. Every alert reaches all super admins, plus admins
 * with the module permission and configured addresses. Without an SMTP provider the e-mails
 * wait in the outbox as PENDING (never reported as sent).
 */
export const AdminAlertService = {
    async notify(event: AlertEvent, msg: AlertMessage): Promise<number> {
        const recipients = await resolveAlertRecipients(event, msg.extraRecipients || []);
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
        const rows = msg.rows
            .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
            .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#64748b;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 0;color:#0f172a"><strong>${escapeHtml(String(v))}</strong></td></tr>`)
            .join('');
        const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
            <div style="font-size:12px;letter-spacing:.08em;color:#7c3aed;font-weight:700;text-transform:uppercase">${escapeHtml(ALERT_EVENTS[event].label)}</div>
            <h2 style="margin:6px 0 16px">${escapeHtml(msg.heading)}</h2>
            <table style="border-collapse:collapse;font-size:14px">${rows}</table>
            <p style="margin-top:20px"><a href="${escapeHtml(appUrl + msg.link)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Yönetim panelinde aç</a></p>
            <p style="color:#94a3b8;font-size:12px">Bu bildirim İKÜANTS TEKMER yönetim sisteminden otomatik gönderildi. Hassas kişisel veriler e-postaya eklenmez.</p>
        </div>`;
        for (const r of recipients) {
            await EmailOutboxService.enqueueEmail({
                recipientEmail: r.email,
                recipientName: r.name,
                subject: msg.subject,
                templateKey: `ALERT_${event}`,
                htmlBody: html,
                entityType: msg.entityType,
                entityId: msg.entityId,
            });
        }
        // External systems subscribed to this event (references only, no personal data)
        void IntegrationService.dispatch(WEBHOOK_EVENT_OF[event], { entityType: msg.entityType, entityId: msg.entityId, subject: msg.subject, link: msg.link });
        return recipients.length;
    },

    getRules: getAlertRules,

    getSettings: getAlertSettings,

    /** Saves event rules and, when given, the global recipients (omitted global keeps the stored one). */
    async saveRules(input: unknown, actor: { id: string; email: string; name: string }, globalInput?: unknown): Promise<{ rules: AlertRules; global: AlertGlobal }> {
        const before = await getAlertSettings();
        const rules = sanitizeAlertRules(input);
        const global = globalInput === undefined ? before.global : sanitizeAlertGlobal(globalInput);
        const value = serializeAlertSettings(rules, global);
        await prisma.siteSetting.upsert({
            where: { key: ALERT_RULES_KEY },
            update: { value },
            create: { key: ALERT_RULES_KEY, value, group: 'NOTIFICATIONS', isPublic: false, description: 'Admin bildirim kuralları ve alıcılar' },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'AlertRules', entityId: ALERT_RULES_KEY, oldValues: before, newValues: { rules, global } });
        return { rules, global };
    },

    /** Queues a test e-mail to everyone who receives every alert, so the recipient list can be checked end to end. */
    async sendTest(actor: { id: string; email: string; name: string }): Promise<{ queued: number; recipients: string[] }> {
        const recipients = await resolveGlobalRecipients();
        const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
            <div style="font-size:12px;letter-spacing:.08em;color:#7c3aed;font-weight:700;text-transform:uppercase">Test bildirimi</div>
            <h2 style="margin:6px 0 16px">Bildirim e-postaları bu adrese ulaşıyor</h2>
            <p>Bu ileti ${escapeHtml(actor.name)} tarafından Ayarlar › Bildirimler ekranından gönderildi. Başvuru, kira, sözleşme ve poliçe uyarıları bu adrese de gelecektir.</p>
            <p style="color:#94a3b8;font-size:12px">İKÜANTS TEKMER yönetim sistemi</p>
        </div>`;
        for (const r of recipients) {
            await EmailOutboxService.enqueueEmail({ recipientEmail: r.email, recipientName: r.name, subject: 'İKÜANTS TEKMER — Test bildirimi', templateKey: 'ALERT_TEST', htmlBody: html, entityType: 'AlertRules', entityId: ALERT_RULES_KEY });
        }
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'AlertTestEmail', entityId: ALERT_RULES_KEY, newValues: { recipients: recipients.map((r) => r.email) } });
        return { queued: recipients.length, recipients: recipients.map((r) => r.email) };
    },

    async preview(event: AlertEvent) {
        return resolveAlertRecipients(event);
    },
};
