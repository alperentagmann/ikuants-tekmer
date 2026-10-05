import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { isSmtpConfigured } from '@/lib/env';
import { resolveAlertRecipients } from '@/lib/services/alert-recipients';

export interface EnqueueEmailInput {
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    templateKey?: string;
    htmlBody: string;
    textBody?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
}

export const EMAIL_PROVIDER_NOT_CONFIGURED =
    'E-posta sağlayıcısı yapılandırılmadı (PENDING_EXTERNAL_CONFIGURATION). Kayıt outbox kuyruğunda bekliyor.';

export function escapeHtml(value: string | number | null | undefined): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

type DeliveryResult =
    | { delivered: true; messageId: string }
    | { delivered: false; reason: 'NOT_CONFIGURED' };

export class EmailOutboxService {
    private static transporter: nodemailer.Transporter | null = null;
    private static injectedTransport: nodemailer.Transporter | null = null;

    /**
     * Overrides the delivery transport. Automated tests use nodemailer's jsonTransport,
     * which accepts messages without sending them anywhere.
     */
    static useTransport(transport: nodemailer.Transporter | null) {
        this.injectedTransport = transport;
    }

    static isProviderConfigured(): boolean {
        return this.injectedTransport !== null || isSmtpConfigured();
    }

    private static getTransporter(): nodemailer.Transporter | null {
        if (this.injectedTransport) return this.injectedTransport;
        if (!isSmtpConfigured()) return null;
        if (!this.transporter) {
            const port = parseInt(process.env.SMTP_PORT || '587', 10);
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port,
                secure: process.env.SMTP_SECURE === 'true' || port === 465,
                auth: { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string },
            });
        }
        return this.transporter;
    }

    /**
     * Delivers one outbox item. A message is reported as sent only when a real
     * transport accepted it.
     */
    private static async deliver(item: {
        recipientEmail: string;
        recipientName: string | null;
        subject: string;
        htmlBody: string;
        textBody: string | null;
    }): Promise<DeliveryResult> {
        const transport = this.getTransporter();
        if (!transport) return { delivered: false, reason: 'NOT_CONFIGURED' };

        const info = await transport.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: item.recipientName
                ? `"${item.recipientName.replace(/"/g, '')}" <${item.recipientEmail}>`
                : item.recipientEmail,
            subject: item.subject,
            html: item.htmlBody,
            text: item.textBody || undefined,
        });
        return { delivered: true, messageId: String(info.messageId) };
    }

    /**
     * Enqueue a new email into the outbox
     */
    static async enqueueEmail(input: EnqueueEmailInput) {
        const row = await prisma.emailOutbox.create({
            data: {
                recipientEmail: input.recipientEmail.toLowerCase().trim(),
                recipientName: input.recipientName,
                subject: input.subject,
                templateKey: input.templateKey,
                htmlBody: input.htmlBody,
                textBody: input.textBody,
                status: 'PENDING',
                entityType: input.entityType,
                entityId: input.entityId,
                metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            },
        });
        // Always-on delivery: with a provider configured, try to send right away instead of
        // waiting for the scheduler. Failures stay in the outbox for the normal retry cycle.
        if (this.isProviderConfigured()) void this.processPendingEmails(1, [row.id]).catch(() => undefined);
        return row;
    }

    /**
     * Helper to render a template with variables
     */
    static renderTemplate(templateHtml: string, variables: Record<string, string | number | undefined | null>): string {
        let result = templateHtml;
        for (const [key, val] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, escapeHtml(val));
        }
        return result;
    }

    /**
     * Process pending and retryable emails in the outbox.
     * Without a configured provider the queue is left untouched (status PENDING),
     * so the items go out automatically once a provider is configured.
     */
    static async processPendingEmails(batchSize: number = 20, onlyIds?: string[]) {
        const providerConfigured = this.isProviderConfigured();
        const results = {
            processed: 0,
            succeeded: 0,
            failed: 0,
            pendingProvider: 0,
            providerStatus: providerConfigured ? 'CONFIGURED' : 'PENDING_EXTERNAL_CONFIGURATION',
        };

        if (!providerConfigured) {
            results.pendingProvider = await prisma.emailOutbox.count({ where: { status: 'PENDING' } });
            return results;
        }

        const now = new Date();
        const pendingList = await prisma.emailOutbox.findMany({
            where: {
                ...(onlyIds ? { id: { in: onlyIds } } : {}),
                OR: [
                    { status: 'PENDING', OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] },
                    {
                        status: 'FAILED',
                        retryCount: { lt: 3 },
                        nextRetryAt: { lte: now },
                    },
                ],
            },
            take: batchSize,
            orderBy: { createdAt: 'asc' },
        });

        for (const item of pendingList) {
            results.processed++;
            try {
                await prisma.emailOutbox.update({
                    where: { id: item.id },
                    data: { status: 'PROCESSING' },
                });

                const delivery = await this.deliver(item);
                if (!delivery.delivered) {
                    await prisma.emailOutbox.update({
                        where: { id: item.id },
                        data: { status: 'PENDING', errorMessage: EMAIL_PROVIDER_NOT_CONFIGURED },
                    });
                    results.pendingProvider++;
                    continue;
                }

                await prisma.emailOutbox.update({
                    where: { id: item.id },
                    data: {
                        status: 'SENT',
                        sentAt: new Date(),
                        providerMessageId: delivery.messageId,
                        errorMessage: null,
                    },
                });
                results.succeeded++;
            } catch (error: any) {
                results.failed++;
                const newRetryCount = item.retryCount + 1;
                const backoffMinutes = Math.pow(2, newRetryCount); // 2m, 4m, 8m
                const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

                await prisma.emailOutbox.update({
                    where: { id: item.id },
                    data: {
                        status: 'FAILED',
                        retryCount: newRetryCount,
                        nextRetryAt,
                        errorMessage: error.message || String(error),
                    },
                });
            }
        }

        return results;
    }

    /**
     * Send an email immediately by ID. Without a provider the item stays in the
     * outbox as PENDING with an explanatory message.
     */
    static async sendEmailImmediately(emailId: string) {
        const item = await prisma.emailOutbox.findUnique({ where: { id: emailId } });
        if (!item) throw new Error('E-posta kaydı bulunamadı.');

        try {
            const delivery = await this.deliver(item);
            if (!delivery.delivered) {
                return prisma.emailOutbox.update({
                    where: { id: emailId },
                    data: { status: 'PENDING', errorMessage: EMAIL_PROVIDER_NOT_CONFIGURED },
                });
            }

            return prisma.emailOutbox.update({
                where: { id: emailId },
                data: {
                    status: 'SENT',
                    sentAt: new Date(),
                    providerMessageId: delivery.messageId,
                    errorMessage: null,
                },
            });
        } catch (error: any) {
            return prisma.emailOutbox.update({
                where: { id: emailId },
                data: {
                    status: 'FAILED',
                    retryCount: { increment: 1 },
                    errorMessage: error.message || String(error),
                },
            });
        }
    }

    /**
     * Retry a failed or cancelled email
     */
    static async retryEmail(emailId: string) {
        return prisma.emailOutbox.update({
            where: { id: emailId },
            data: {
                status: 'PENDING',
                nextRetryAt: new Date(),
                errorMessage: null,
            },
        });
    }

    /**
     * Cancel an email in the queue
     */
    static async cancelEmail(emailId: string) {
        return prisma.emailOutbox.update({
            where: { id: emailId },
            data: {
                status: 'CANCELLED',
            },
        });
    }

    /**
     * Get outbox statistics
     */
    static async getOutboxStats() {
        const [total, pending, sent, failed, cancelled] = await Promise.all([
            prisma.emailOutbox.count(),
            prisma.emailOutbox.count({ where: { status: 'PENDING' } }),
            prisma.emailOutbox.count({ where: { status: 'SENT' } }),
            prisma.emailOutbox.count({ where: { status: 'FAILED' } }),
            prisma.emailOutbox.count({ where: { status: 'CANCELLED' } }),
        ]);

        return {
            total,
            pending,
            sent,
            failed,
            cancelled,
            providerStatus: this.isProviderConfigured() ? 'CONFIGURED' : 'PENDING_EXTERNAL_CONFIGURATION',
        };
    }

    /**
     * Recipients for internal notifications. Configured via ADMIN_NOTIFICATION_EMAIL
     * (comma separated). Returns an empty list when nothing is configured.
     */
    static getAdminNotificationRecipients(): string[] {
        return (process.env.ADMIN_NOTIFICATION_EMAIL || '')
            .split(',')
            .map((e) => e.trim())
            .filter((e) => e.includes('@'));
    }

    /**
     * Automated Trigger: Application Submitted
     */
    static async triggerApplicationSubmittedEmails(application: {
        id: string;
        applicationNumber: string;
        applicantName: string;
        email: string;
        programName?: string;
        additionalRecipients?: string[];
    }) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        const programTitle = application.programName || 'İKÜANTS TEKMER Başvurusu';
        const safeName = escapeHtml(application.applicantName);
        const safeTitle = escapeHtml(programTitle);
        const safeNumber = escapeHtml(application.applicationNumber);

        // 1. Applicant confirmation email (NO PII)
        await this.enqueueEmail({
            recipientEmail: application.email,
            recipientName: application.applicantName,
            subject: `Başvurunuz Alındı: ${application.applicationNumber} — ${programTitle}`,
            templateKey: 'APPLICATION_RECEIVED',
            htmlBody: `
                <div style="font-family:sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;padding:24px;">
                    <div style="text-align:center;border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;">
                        <h2 style="color:#4f46e5;margin:0;">İKÜANTS TEKMER</h2>
                        <p style="color:#64748b;margin:4px 0 0;">Girişimcilik ve İnovasyon Merkezi</p>
                    </div>
                    <p>Sayın <strong>${safeName}</strong>,</p>
                    <p><strong>${safeTitle}</strong> için yapmış olduğunuz başvuru başarıyla sistemimize kaydedilmiştir.</p>
                    <div style="background:#f8fafc;border-left:4px solid #4f46e5;padding:12px 16px;margin:20px 0;">
                        <p style="margin:0;font-size:14px;color:#64748b;">Başvuru Takip Numaranız:</p>
                        <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#1e293b;letter-spacing:1px;">${safeNumber}</p>
                    </div>
                    <p>Başvurunuz değerlendirme komitemiz tarafından incelenecek olup, süreçle ilgili gelişmeler e-posta yoluyla tarafınıza bildirilecektir.</p>
                    <p style="color:#64748b;font-size:13px;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px;">
                        Bu e-posta otomatik olarak gönderilmiştir.
                    </p>
                </div>
            `,
            entityType: 'APPLICATION',
            entityId: application.id,
        });

        // 2. Internal notification: super admins, admins with the applications permission,
        //    configured alert addresses and campaign specific recipients
        const adminUrl = `${appUrl}/admin/basvurular/${application.id}`;
        const recipients = await resolveAlertRecipients('APPLICATION_NEW', application.additionalRecipients || []);

        for (const recipient of recipients) {
            await this.enqueueEmail({
                recipientEmail: recipient.email,
                recipientName: recipient.name,
                subject: `[Yeni Başvuru] ${application.applicationNumber} — ${programTitle}`,
                templateKey: 'APPLICATION_NEW_ADMIN',
                htmlBody: `
                    <div style="font-family:sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;padding:24px;">
                        <h3 style="color:#4f46e5;margin-top:0;">Yeni Başvuru Alındı</h3>
                        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                            <tr><td style="padding:6px 0;color:#64748b;width:140px;">Başvuru No:</td><td style="font-weight:bold;">${safeNumber}</td></tr>
                            <tr><td style="padding:6px 0;color:#64748b;">Başvuru:</td><td>${safeTitle}</td></tr>
                            <tr><td style="padding:6px 0;color:#64748b;">Başvuran:</td><td>${safeName}</td></tr>
                        </table>
                        <p><a href="${escapeHtml(adminUrl)}" style="background:#4f46e5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">Başvuruyu Yönetim Panelinde İncele</a></p>
                        <p style="color:#64748b;font-size:12px;margin-top:20px;">Hassas kişisel veriler (T.C. Kimlik No vb.) e-posta gövdesine eklenmemiştir.</p>
                    </div>
                `,
                entityType: 'APPLICATION',
                entityId: application.id,
            });
        }
    }

    /**
     * Automated Trigger: Task Assigned
     */
    static async triggerTaskAssignedEmail(task: {
        id: string;
        title: string;
        priority: string;
        dueDate?: Date | null;
        assigneeName: string;
        assigneeEmail: string;
        assignerName: string;
    }) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        const taskUrl = `${appUrl}/admin/gorevler?taskId=${task.id}`;
        const dueDateFormatted = task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : 'Belirtilmedi';

        await this.enqueueEmail({
            recipientEmail: task.assigneeEmail,
            recipientName: task.assigneeName,
            subject: `Yeni Görev Atandı: ${task.title}`,
            templateKey: 'TASK_ASSIGNED',
            htmlBody: `
                <div style="font-family:sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;padding:24px;">
                    <h3 style="color:#4f46e5;margin-top:0;">Size Yeni Bir Görev Atandı</h3>
                    <p>Merhaba <strong>${escapeHtml(task.assigneeName)}</strong>,</p>
                    <p><strong>${escapeHtml(task.assignerName)}</strong> tarafından size bir görev atanmıştır:</p>
                    <div style="background:#f8fafc;border-left:4px solid #4f46e5;padding:12px 16px;margin:16px 0;">
                        <p style="margin:0;font-size:16px;font-weight:bold;color:#1e293b;">${escapeHtml(task.title)}</p>
                        <p style="margin:6px 0 0;font-size:14px;color:#64748b;">Öncelik: <strong>${escapeHtml(task.priority)}</strong> | Son Tarih: <strong>${dueDateFormatted}</strong></p>
                    </div>
                    <p><a href="${escapeHtml(taskUrl)}" style="background:#4f46e5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">Görevi Görüntüle ve Yönet</a></p>
                </div>
            `,
            entityType: 'TASK',
            entityId: task.id,
        });
    }
}
