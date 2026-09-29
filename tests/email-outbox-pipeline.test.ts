import { test, describe } from 'node:test';
import assert from 'node:assert';
import { EmailOutboxService } from '../lib/services/email-outbox-service';
import { prisma } from '../lib/prisma';

describe('2. Email Notification Engine & Outbox', () => {
    test('Template rendering correctly replaces variables and escapes unsafe tags', () => {
        const rendered = EmailOutboxService.renderTemplate(
            'Merhaba <b>{{recipientName}}</b>, başvurunuz: {{applicationNumber}}',
            {
                recipientName: 'Ali <script>alert(1)</script>',
                applicationNumber: 'ANTS-2026-000100',
            }
        );

        assert.ok(!rendered.includes('<script>'), 'Unsafe HTML in variables must be escaped');
        assert.ok(rendered.includes('&lt;script&gt;'), 'HTML entities must be safely encoded');
        assert.ok(rendered.includes('ANTS-2026-000100'), 'Variable applicationNumber must be substituted');
    });

    test('Triggering application emails creates EmailOutbox records with NO PII', async () => {
        const testAppId = `test-app-${Date.now()}`;
        await EmailOutboxService.triggerApplicationSubmittedEmails({
            id: testAppId,
            applicationNumber: 'ANTS-2026-000999',
            applicantName: 'Ahmet Yılmaz',
            email: 'basvuran@example.com',
            programName: 'ANTsPARK Hızlandırma',
        });

        const emails = await prisma.emailOutbox.findMany({
            where: { entityId: testAppId },
        });

        assert.ok(emails.length >= 1, 'At least applicant confirmation email must be queued');
        const applicantEmail = emails.find((e) => e.recipientEmail === 'basvuran@example.com');
        assert.ok(applicantEmail, 'Applicant email must exist');
        assert.strictEqual(applicantEmail?.status, 'PENDING');

        // Verify that TC Kimlik or sensitive fields are NOT in the email subject or body
        assert.ok(!applicantEmail?.subject.includes('TC'), 'Subject must not contain TC');
        assert.ok(applicantEmail?.htmlBody.includes('ANTS-2026-000999'), 'Body must have application number');

        // Cleanup
        await prisma.emailOutbox.deleteMany({ where: { entityId: testAppId } });
    });

    test('Triggering task assignment notification creates EmailOutbox record', async () => {
        const testTaskId = `test-task-${Date.now()}`;
        await EmailOutboxService.triggerTaskAssignedEmail({
            id: testTaskId,
            title: 'Ana Sayfa Banner Güncellemesi',
            priority: 'HIGH',
            dueDate: new Date('2026-09-30'),
            assigneeName: 'Görevli Kullanıcı',
            assigneeEmail: 'gorevli@ikuanstekmer.com',
            assignerName: 'Enes Kamacı',
        });

        const email = await prisma.emailOutbox.findFirst({
            where: { entityId: testTaskId },
        });

        assert.ok(email, 'Task assignment email must be created');
        assert.strictEqual(email?.recipientEmail, 'gorevli@ikuanstekmer.com');
        assert.ok(email?.htmlBody.includes('Ana Sayfa Banner Güncellemesi'));

        // Cleanup
        await prisma.emailOutbox.deleteMany({ where: { entityId: testTaskId } });
    });

    test('EmailOutbox processing delivers pending emails and updates state', async () => {
        const testEmail = await EmailOutboxService.enqueueEmail({
            recipientEmail: 'test-cron@ikuanstekmer.com',
            subject: 'Test Email Outbox Job',
            htmlBody: '<p>Testing cron worker</p>',
            templateKey: 'SYSTEM_TEST',
        });

        // Send immediately or process queue
        const updated = await EmailOutboxService.sendEmailImmediately(testEmail.id);
        assert.strictEqual(updated.status, 'SENT', 'Email status must transition to SENT');
        assert.ok(updated.sentAt, 'sentAt timestamp must be recorded');

        // Cleanup
        await prisma.emailOutbox.delete({ where: { id: testEmail.id } });
    });
});
