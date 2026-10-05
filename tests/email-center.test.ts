/**
 * Email center: real-data variables, unresolved variables block sending, drafts,
 * scheduling, and no fake SENT status without a provider.
 * Records use the "qa-ec-" marker and are removed by exact id.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import { EmailCenterService, fillTemplate } from '../lib/services/email-center-service';
import { EmailOutboxService } from '../lib/services/email-outbox-service';

const RUN = `qa-ec-${Date.now().toString(36)}`;
const created = { emails: [] as string[], persons: [] as string[] };

describe('Email center', () => {
    let actor: { id: string; name: string; email: string };

    before(async () => {
        const u = await prisma.user.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true } });
        assert.ok(u);
        actor = u;
        const p = await prisma.person.create({ data: { fullName: `${RUN} Ayşe Deneme`, firstName: 'Ayşe', lastName: 'Deneme', email: `${RUN}@example.com` } });
        created.persons.push(p.id);
    });

    after(async () => {
        EmailOutboxService.useTransport(null);
        const ids = (await prisma.emailOutbox.findMany({ where: { OR: [{ id: { in: created.emails } }, { recipientEmail: { startsWith: RUN } }] }, select: { id: true } })).map((e) => e.id);
        await prisma.auditLog.deleteMany({ where: { entityType: 'EmailOutbox', entityId: { in: ids } } });
        await prisma.emailOutbox.deleteMany({ where: { id: { in: ids } } });
        await prisma.person.deleteMany({ where: { id: { in: created.persons } } });
        await prisma.$disconnect();
    });

    test('fillTemplate reports unresolved variables instead of inventing them', () => {
        const r = fillTemplate('Sayın {{person.fullName}}, {{rent.period}}', { 'person.fullName': 'Ayşe' });
        assert.equal(r.text, 'Sayın Ayşe, {{rent.period}}');
        assert.deepEqual(r.missing, ['rent.period']);
    });

    test('preview fills variables from the linked person record', async () => {
        const p = await EmailCenterService.preview({ subject: 'Merhaba {{person.firstName}}', body: 'Sayın {{person.fullName}}', entityType: 'Person', entityId: created.persons[0] });
        assert.equal(p.subject, `Merhaba ${RUN}`);
        assert.equal(p.body, `Sayın ${RUN} Ayşe Deneme`);
        assert.equal(p.recipient.email, `${RUN}@example.com`);
        assert.deepEqual(p.missing, []);
    });

    test('sending is blocked while variables are unresolved', async () => {
        await assert.rejects(
            () => EmailCenterService.compose({ to: `${RUN}@example.com`, subject: 'Kira {{rent.period}}', body: 'x', entityType: 'Person', entityId: created.persons[0], mode: 'send' }, actor),
            /Doldurulamayan değişkenler/
        );
    });

    test('without a provider a sent email stays PENDING, never SENT', async () => {
        EmailOutboxService.useTransport(null);
        if (EmailOutboxService.isProviderConfigured()) return; // SMTP configured in this environment
        const r = await EmailCenterService.compose({ to: `${RUN}@example.com`, subject: 'Bilgi', body: 'Sayın {{person.fullName}}', entityType: 'Person', entityId: created.persons[0], mode: 'send' }, actor);
        created.emails.push(...r.items.map((i) => i.id));
        assert.equal(r.sent, 0);
        assert.equal(r.items[0].status, 'PENDING');
        assert.equal(r.items[0].htmlBody, `Sayın ${RUN} Ayşe Deneme`);
    });

    test('with a transport the email is delivered and marked SENT', async () => {
        EmailOutboxService.useTransport(nodemailer.createTransport({ jsonTransport: true }));
        const r = await EmailCenterService.compose({ to: `${RUN}-b@example.com, ${RUN}-c@example.com`, subject: 'Bilgi', body: '<b>etiket</b> korunur', mode: 'send' }, actor);
        created.emails.push(...r.items.map((i) => i.id));
        assert.equal(r.sent, 2, 'one message per recipient');
        assert.ok(r.items[0].htmlBody.includes('&lt;b&gt;'), 'body is HTML-escaped');
        EmailOutboxService.useTransport(null);
    });

    test('draft → update → schedule; scheduled items are not processed early', async () => {
        const d = await EmailCenterService.compose({ to: `${RUN}-d@example.com`, subject: 'Taslak {{person.fullName}}', body: 'İçerik', entityType: 'Person', entityId: created.persons[0], mode: 'draft' }, actor);
        const draftId = d.items[0].id;
        created.emails.push(draftId);
        assert.equal(d.items[0].status, 'DRAFT');
        assert.equal(d.items[0].subject, 'Taslak {{person.fullName}}', 'drafts keep original variables');
        await EmailCenterService.updateDraft(draftId, { to: `${RUN}-d@example.com`, subject: 'Güncel {{person.fullName}}', body: 'Yeni içerik', entityType: 'Person', entityId: created.persons[0] }, actor);

        const when = new Date(Date.now() + 3 * 86400000).toISOString();
        const s = await EmailCenterService.sendDraft(draftId, actor, when);
        created.emails.push(...s.items.map((i) => i.id));
        assert.equal(s.items[0].status, 'PENDING');
        assert.ok(s.items[0].scheduledAt);
        assert.equal(s.items[0].subject, `Güncel ${RUN} Ayşe Deneme`);
        assert.equal((await prisma.emailOutbox.findUnique({ where: { id: draftId } }))?.status, 'CANCELLED');

        EmailOutboxService.useTransport(nodemailer.createTransport({ jsonTransport: true }));
        await EmailOutboxService.processPendingEmails(200, [s.items[0].id]);
        assert.equal((await prisma.emailOutbox.findUnique({ where: { id: s.items[0].id } }))?.status, 'PENDING', 'future-scheduled email must wait');
        EmailOutboxService.useTransport(null);

        const list = await EmailCenterService.list({ tab: 'scheduled', search: RUN });
        assert.ok(list.items.some((i) => i.id === s.items[0].id));
    });

    test('scheduling in the past is rejected', async () => {
        await assert.rejects(() => EmailCenterService.compose({ to: `${RUN}-e@example.com`, subject: 'x', body: 'y', mode: 'schedule', scheduledAt: new Date(Date.now() - 1000).toISOString() }, actor), /ileri bir tarih/);
    });
});
