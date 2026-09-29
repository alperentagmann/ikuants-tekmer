import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

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

export class EmailOutboxService {
    private static transporter: nodemailer.Transporter | null = null;

    /**
     * Get or create Nodemailer transporter
     */
    private static getTransporter(): nodemailer.Transporter {
        if (!this.transporter) {
            const host = process.env.SMTP_HOST || 'smtp.gmail.com';
            const port = parseInt(process.env.SMTP_PORT || '587', 10);
            const user = process.env.SMTP_USER || '';
            const pass = process.env.SMTP_PASS || '';

            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: user && pass ? { user, pass } : undefined,
            });
        }
        return this.transporter;
    }

    /**
     * Enqueue a new email into the outbox
     */
    static async enqueueEmail(input: EnqueueEmailInput) {
        return prisma.emailOutbox.create({
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
    }

    /**
     * Helper to render a template with variables
     */
    static renderTemplate(templateHtml: string, variables: Record<string, string | number | undefined | null>): string {
        let result = templateHtml;
        for (const [key, val] of Object.entries(variables)) {
            const stringVal = val !== undefined && val !== null ? String(val) : '';
            // Escape HTML for safety
            const escaped = stringVal
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, escaped);
        }
        return result;
    }

    /**
     * Process pending and retryable emails in the outbox
     */
    static async processPendingEmails(batchSize: number = 20) {
        const now = new Date();

        const pendingList = await prisma.emailOutbox.findMany({
            where: {
                OR: [
                    { status: 'PENDING' },
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

        const results = {
            processed: 0,
            succeeded: 0,
            failed: 0,
        };

        const fromEmail = process.env.SMTP_FROM || 'IKUANTS TEKMER <bilgi@ikuanstekmer.com>';

        for (const item of pendingList) {
            results.processed++;
            try {
                // Mark as PROCESSING
                await prisma.emailOutbox.update({
                    where: { id: item.id },
                    data: { status: 'PROCESSING' },
                });

                const isLiveSmtp = process.env.SMTP_USER && 
                                   process.env.SMTP_PASS && 
                                   process.env.SMTP_HOST !== 'smtp.example.com' &&
                                   process.env.NODE_ENV !== 'test';

                // Check if live SMTP is configured
                if (isLiveSmtp) {
                    const info = await this.getTransporter().sendMail({
                        from: fromEmail,
                        to: item.recipientName ? `"${item.recipientName}" <${item.recipientEmail}>` : item.recipientEmail,
                        subject: item.subject,
                        html: item.htmlBody,
                        text: item.textBody || undefined,
                    });

                    await prisma.emailOutbox.update({
                        where: { id: item.id },
                        data: {
                            status: 'SENT',
                            sentAt: new Date(),
                            providerMessageId: info.messageId,
                            errorMessage: null,
                        },
                    });
                } else {
                    // Development / Simulation / Test Mode: Log delivery without error
                    await prisma.emailOutbox.update({
                        where: { id: item.id },
                        data: {
                            status: 'SENT',
                            sentAt: new Date(),
                            providerMessageId: `simulated-${Date.now()}`,
                            errorMessage: null,
                        },
                    });
                }

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
     * Send an email immediately by ID
     */
    static async sendEmailImmediately(emailId: string) {
        const item = await prisma.emailOutbox.findUnique({ where: { id: emailId } });
        if (!item) throw new Error('E-posta kaydı bulunamadı.');

        const fromEmail = process.env.SMTP_FROM || 'IKUANTS TEKMER <bilgi@ikuanstekmer.com>';

        const isLiveSmtp = process.env.SMTP_USER && 
                           process.env.SMTP_PASS && 
                           process.env.SMTP_HOST !== 'smtp.example.com' &&
                           process.env.NODE_ENV !== 'test';

        try {
            if (isLiveSmtp) {
                const info = await this.getTransporter().sendMail({
                    from: fromEmail,
                    to: item.recipientName ? `"${item.recipientName}" <${item.recipientEmail}>` : item.recipientEmail,
                    subject: item.subject,
                    html: item.htmlBody,
                    text: item.textBody || undefined,
                });

                return prisma.emailOutbox.update({
                    where: { id: emailId },
                    data: {
                        status: 'SENT',
                        sentAt: new Date(),
                        providerMessageId: info.messageId,
                        errorMessage: null,
                    },
                });
            } else {
                return prisma.emailOutbox.update({
                    where: { id: emailId },
                    data: {
                        status: 'SENT',
                        sentAt: new Date(),
                        providerMessageId: `simulated-${Date.now()}`,
                        errorMessage: null,
                    },
                });
            }
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

        return { total, pending, sent, failed, cancelled };
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
    }) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ikuants-tekmer.vercel.app';
        const programTitle = application.programName || 'İKÜANTS TEKMER Kuluçka / Ön Kuluçka Programı';

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
                    <p>Sayın <strong>${application.applicantName}</strong>,</p>
                    <p><strong>${programTitle}</strong> için yapmış olduğunuz başvuru başarıyla sistemimize kaydedilmiştir.</p>
                    <div style="background:#f8fafc;border-left:4px solid #4f46e5;padding:12px 16px;margin:20px 0;">
                        <p style="margin:0;font-size:14px;color:#64748b;">Başvuru Takip Numaranız:</p>
                        <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#1e293b;letter-spacing:1px;">${application.applicationNumber}</p>
                    </div>
                    <p>Başvurunuz değerlendirme komitemiz tarafından incelenecek olup, süreçle ilgili gelişmeler e-posta yoluyla tarafınıza bildirilecektir.</p>
                    <p style="color:#64748b;font-size:13px;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:16px;">
                        Bu e-posta otomatik olarak gönderilmiştir. Sorularınız için <a href="mailto:info@ikuantstekmer.com" style="color:#4f46e5;">info@ikuantstekmer.com</a> üzerinden bize ulaşabilirsiniz.
                    </p>
                </div>
            `,
            entityType: 'APPLICATION',
            entityId: application.id,
        });

        // 2. Admin & Program Team notification email
        const adminUrl = `${appUrl}/admin/basvurular/${application.id}`;
        const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'bilgi@ikuanstekmer.com';

        await this.enqueueEmail({
            recipientEmail: adminNotificationEmail,
            recipientName: 'İKÜANTS Başvuru Ekibi',
            subject: `[Yeni Başvuru] ${application.applicationNumber} — ${programTitle}`,
            templateKey: 'APPLICATION_NEW_ADMIN',
            htmlBody: `
                <div style="font-family:sans-serif;line-height:1.6;color:#1e293b;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;padding:24px;">
                    <h3 style="color:#4f46e5;margin-top:0;">Yeni Başvuru Alındı</h3>
                    <p>Sisteme yeni bir girişimcilik başvurusu kaydedilmiştir:</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                        <tr><td style="padding:6px 0;color:#64748b;width:140px;">Başvuru No:</td><td style="font-weight:bold;">${application.applicationNumber}</td></tr>
                        <tr><td style="padding:6px 0;color:#64748b;">Program:</td><td>${programTitle}</td></tr>
                        <tr><td style="padding:6px 0;color:#64748b;">Başvuran:</td><td>${application.applicantName}</td></tr>
                    </table>
                    <p><a href="${adminUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">Başvuruyu Yönetim Panelinde İncele</a></p>
                    <p style="color:#64748b;font-size:12px;margin-top:20px;">Güvenlik uyarısı: Hassas PII verileri (T.C. Kimlik No vb.) e-posta gövdesine eklenmemiştir.</p>
                </div>
            `,
            entityType: 'APPLICATION',
            entityId: application.id,
        });
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
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ikuants-tekmer.vercel.app';
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
                    <p>Merhaba <strong>${task.assigneeName}</strong>,</p>
                    <p><strong>${task.assignerName}</strong> tarafından size bir görev atanmıştır:</p>
                    <div style="background:#f8fafc;border-left:4px solid #4f46e5;padding:12px 16px;margin:16px 0;">
                        <p style="margin:0;font-size:16px;font-weight:bold;color:#1e293b;">${task.title}</p>
                        <p style="margin:6px 0 0;font-size:14px;color:#64748b;">Öncelik: <strong>${task.priority}</strong> | Son Tarih: <strong>${dueDateFormatted}</strong></p>
                    </div>
                    <p><a href="${taskUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">Görevi Görüntüle ve Yönet</a></p>
                </div>
            `,
            entityType: 'TASK',
            entityId: task.id,
        });
    }
}
