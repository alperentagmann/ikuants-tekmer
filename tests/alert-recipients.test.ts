/**
 * Alert recipients: institution mailbox and super admins get every alert, admin-role users get
 * them at their personal e-mail unless muted, and saving keeps the stored setting row intact.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { ALERT_RULES_KEY, getAlertSettings, resolveAlertRecipients, resolveGlobalRecipients, sanitizeAlertGlobal } from '../lib/services/alert-recipients';
import { AdminAlertService } from '../lib/services/admin-alert-service';

const RUN = `qa-alert-${Date.now()}`;
const INSTITUTION = `${RUN}@kurum.example`;

describe('Alert recipients', () => {
    let snapshot: { value: string } | null = null;
    let actor: { id: string; email: string; name: string };
    let adminUser: { id: string; email: string } | null = null;

    before(async () => {
        snapshot = await prisma.siteSetting.findUnique({ where: { key: ALERT_RULES_KEY }, select: { value: true } });
        const boss = await prisma.user.findFirst({ where: { isActive: true, email: 'bilgi@ikuantstekmer.com' }, select: { id: true, email: true, name: true } });
        assert.ok(boss, 'active super admin expected');
        actor = boss;
        adminUser = await prisma.user.findFirst({
            where: { isActive: true, isSuperAdmin: false, userRoles: { some: { role: { slug: 'admin' } } } },
            select: { id: true, email: true },
        });
    });

    after(async () => {
        if (snapshot) await prisma.siteSetting.update({ where: { key: ALERT_RULES_KEY }, data: { value: snapshot.value } });
        else await prisma.siteSetting.deleteMany({ where: { key: ALERT_RULES_KEY } });
        await prisma.emailOutbox.deleteMany({ where: { templateKey: 'ALERT_TEST', recipientEmail: INSTITUTION } });
    });

    test('sanitizes global recipients', () => {
        const g = sanitizeAlertGlobal({ institutionEmails: 'Bilgi@Kurum.com; kötü, bilgi@kurum.com', notifyAdmins: false, mutedUserIds: ['abc', 'abc', 'x y'] });
        assert.deepEqual(g, { institutionEmails: ['bilgi@kurum.com'], notifyAdmins: false, mutedUserIds: ['abc'] });
        assert.equal(sanitizeAlertGlobal(undefined).notifyAdmins, true);
    });

    test('institution, super admins and admins receive every alert; muted admins do not', async () => {
        const { rules } = await getAlertSettings();
        await AdminAlertService.saveRules(rules, actor, { institutionEmails: [INSTITUTION], notifyAdmins: true, mutedUserIds: [] });
        const all = await resolveGlobalRecipients();
        assert.ok(all.some((r) => r.email === INSTITUTION && r.reason === 'INSTITUTION'));
        assert.ok(all.some((r) => r.email === actor.email.toLowerCase() && r.reason === 'SUPER_ADMIN'));
        const renewal = await resolveAlertRecipients('CONTRACT_RENEWAL');
        assert.ok(renewal.some((r) => r.email === INSTITUTION));
        if (adminUser) {
            assert.ok(all.some((r) => r.userId === adminUser!.id && r.reason === 'ADMIN'));
            await AdminAlertService.saveRules(rules, actor, { institutionEmails: [INSTITUTION], notifyAdmins: true, mutedUserIds: [adminUser.id] });
            assert.ok(!(await resolveGlobalRecipients()).some((r) => r.userId === adminUser!.id));
            assert.ok(!(await resolveAlertRecipients('APPLICATION_NEW')).some((r) => r.userId === adminUser!.id));
        }
        // Super admins cannot be muted
        await AdminAlertService.saveRules(rules, actor, { institutionEmails: [INSTITUTION], notifyAdmins: false, mutedUserIds: [actor.id] });
        assert.ok((await resolveGlobalRecipients()).some((r) => r.email === actor.email.toLowerCase()));
        // Saving rules without a global keeps the stored recipients
        await AdminAlertService.saveRules(rules, actor);
        assert.deepEqual((await getAlertSettings()).global.institutionEmails, [INSTITUTION]);
    });

    test('test e-mail is queued for every global recipient', async () => {
        const { rules } = await getAlertSettings();
        await AdminAlertService.saveRules(rules, actor, { institutionEmails: [INSTITUTION], notifyAdmins: true, mutedUserIds: [] });
        const res = await AdminAlertService.sendTest(actor);
        assert.ok(res.recipients.includes(INSTITUTION));
        assert.equal(await prisma.emailOutbox.count({ where: { templateKey: 'ALERT_TEST', recipientEmail: INSTITUTION } }), 1);
        await prisma.emailOutbox.deleteMany({ where: { templateKey: 'ALERT_TEST', recipientEmail: { not: INSTITUTION }, createdAt: { gte: new Date(Date.now() - 60000) } } });
    });
});
