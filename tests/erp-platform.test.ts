/**
 * ERP platform: pre-accounting, alert recipients, personal permissions, Work OS (teams, sub-tasks,
 * recurrence, automations), integration hub safety, machine park and staff vocabulary.
 * Records use the "qa-erp-" marker and are removed by exact id.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { computeInvoice } from '../lib/accounting-math';
import { AccountingService } from '../lib/services/accounting-service';
import { resolveAlertRecipients, sanitizeAlertRules } from '../lib/services/alert-recipients';
import { PermissionAdminService } from '../lib/services/permission-admin-service';
import { WorkTeamService } from '../lib/services/work-team-service';
import { WorkOsService, nextOccurrence } from '../lib/services/work-os-service';
import { TaskService } from '../lib/services/task-service';
import { TaskWorkflowService } from '../lib/services/task-workflow-service';
import { AutomationService } from '../lib/services/automation-service';
import { IntegrationService, assertSafeUrl } from '../lib/services/integration-service';
import { openSecret, sealSecret } from '../lib/secret-box';
import { facilityMachines, facilityPricing, sanitizeMachines, sanitizePricing } from '../lib/machines';
import { sanitizeStaffProfile } from '../lib/hr';
import type { UserWithPermissions } from '../lib/rbac';

const RUN = `qa-erp-${Date.now().toString(36)}`;
type Actor = UserWithPermissions & { id: string; name: string; email: string };
const created = { parties: [] as string[], accounts: [] as string[], invoices: [] as string[], tasks: [] as string[], teams: [] as string[], rules: [] as string[], apiKeys: [] as string[] };

const role = (u: { id: string; name: string; email: string }, perms: [string, string][], superAdmin = false): Actor => ({
    id: u.id, name: u.name, email: u.email, isActive: true, isSuperAdmin: superAdmin,
    userRoles: [{ role: { slug: 'qa', permissions: perms.map(([action, resource]) => ({ permission: { action, resource } })) } }],
});

describe('ERP platform', () => {
    let boss: Actor;
    let staff: Actor;
    let staffRecord: { id: string; isSuperAdmin: boolean };

    before(async () => {
        const superUser = await prisma.user.findFirst({ where: { isActive: true, isSuperAdmin: true }, select: { id: true, name: true, email: true } });
        const other = await prisma.user.findFirst({ where: { isActive: true, isSuperAdmin: false }, select: { id: true, name: true, email: true, isSuperAdmin: true } });
        assert.ok(superUser && other, 'an active super admin and an active admin are required');
        boss = role(superUser, [], true);
        staff = role(other, [['view', 'tasks'], ['edit', 'tasks'], ['create', 'tasks'], ['view', 'finance']]);
        staffRecord = other;
    });

    after(async () => {
        const movements = await prisma.financeMovement.findMany({ where: { OR: [{ accountId: { in: created.accounts } }, { partyId: { in: created.parties } }] }, select: { id: true, transferGroupId: true } });
        const movementIds = [...movements.map((m) => m.id), ...movements.map((m) => m.transferGroupId).filter((g): g is string => Boolean(g))];
        const taskIds = [...created.tasks, ...(await prisma.task.findMany({ where: { title: { contains: RUN } }, select: { id: true } })).map((t) => t.id)];
        await prisma.notification.deleteMany({ where: { OR: [{ message: { contains: RUN } }, { targetUrl: { in: taskIds.map((id) => `/admin/gorevler?taskId=${id}`) } }] } });
        await prisma.auditLog.deleteMany({ where: { entityId: { in: [...created.parties, ...created.accounts, ...created.invoices, ...movementIds, ...taskIds, ...created.teams, ...created.rules, ...created.apiKeys] } } });
        await prisma.activityTimeline.deleteMany({ where: { entityType: 'Task', entityId: { in: taskIds } } });
        await prisma.financeMovement.deleteMany({ where: { id: { in: movements.map((m) => m.id) } } });
        await prisma.salesInvoice.deleteMany({ where: { id: { in: created.invoices } } });
        await prisma.financeParty.deleteMany({ where: { id: { in: created.parties } } });
        await prisma.financeAccount.deleteMany({ where: { id: { in: created.accounts } } });
        await prisma.automationRule.deleteMany({ where: { id: { in: created.rules } } });
        await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
        await prisma.workTeam.deleteMany({ where: { id: { in: created.teams } } });
        await prisma.apiKey.deleteMany({ where: { id: { in: created.apiKeys } } });
        await prisma.$disconnect();
    });

    test('invoice math: discount, VAT and withholding are rounded per line', () => {
        const t = computeInvoice([{ description: 'Kira', quantity: 1, unitPrice: 10000, vatRate: 20 }, { description: 'Hizmet', quantity: 3, unitPrice: 333.33, discountRate: 10, vatRate: 20 }], 0.5);
        assert.equal(t.subtotal, 10999.99);
        assert.equal(t.discountTotal, 100);
        assert.equal(t.vatTotal, 2180);
        assert.equal(t.withholdingTotal, 1090);
        assert.equal(t.grandTotal, 10999.99 - 100 + 2180 - 1090);
    });

    test('invoice lifecycle: draft → issued (GİB number) → partial and full collection → statement', async () => {
        const party = await AccountingService.saveParty({ name: `${RUN} Örnek Teknoloji A.Ş.`, kind: 'CUSTOMER', taxNumber: '1234567890' }, boss);
        created.parties.push(party.id);
        await assert.rejects(() => AccountingService.saveParty({ name: `${RUN} hatalı`, taxNumber: '12345678901' }, boss), /10 haneli/);
        const account = await AccountingService.saveAccount({ name: `${RUN} Banka`, kind: 'BANK', currency: 'TRY', openingBalance: 1000 }, boss);
        created.accounts.push(account.id);

        await assert.rejects(() => AccountingService.saveDraft({ partyId: party.id, issueDate: '2026-10-04', lines: [] }, boss), /en az bir kalem/);
        const { id } = await AccountingService.saveDraft({ partyId: party.id, issueDate: '2026-10-04', dueDate: '2026-10-20', lines: [{ description: `${RUN} kira`, quantity: 1, unitPrice: 1000, vatRate: 20 }] }, boss);
        created.invoices.push(id);
        await assert.rejects(() => AccountingService.issue(id, staff), /finance:approve/);
        const issued = await AccountingService.issue(id, boss);
        assert.match(issued.number, /^IKT2026\d{9}$/);
        assert.equal(issued.eInvoiceStatus, 'PENDING_EXTERNAL_CONFIGURATION', 'never reported as sent without an integrator');
        await assert.rejects(() => AccountingService.saveDraft({ id, partyId: party.id, issueDate: '2026-10-04', lines: [{ description: 'x', quantity: 1, unitPrice: 1, vatRate: 20 }] }, boss), /düzenlenemez/);

        await assert.rejects(() => AccountingService.addMovement({ kind: 'COLLECTION', accountId: account.id, salesInvoiceId: id, amount: 2000, date: '2026-10-05' }, boss), /aşamaz/);
        await AccountingService.addMovement({ kind: 'COLLECTION', accountId: account.id, salesInvoiceId: id, amount: 500, date: '2026-10-05' }, boss);
        assert.equal((await prisma.salesInvoice.findUnique({ where: { id } }))?.status, 'PARTIALLY_PAID');
        await assert.rejects(() => AccountingService.cancel(id, 'test', boss), /Tahsilatı olan/);
        await AccountingService.addMovement({ kind: 'COLLECTION', accountId: account.id, salesInvoiceId: id, amount: 700, date: '2026-10-06' }, boss);
        assert.equal((await prisma.salesInvoice.findUnique({ where: { id } }))?.status, 'PAID');

        const st = await AccountingService.statement(party.id);
        assert.equal(st.balance, 0);
        const accounts = await AccountingService.listAccounts();
        assert.equal(accounts.find((a) => a.id === account.id)?.balance, 1000 + 1200);
    });

    test('transfers create a paired movement and keep both balances', async () => {
        const a = await AccountingService.saveAccount({ name: `${RUN} Kasa`, kind: 'CASH', currency: 'TRY', openingBalance: 300 }, boss);
        const b = await AccountingService.saveAccount({ name: `${RUN} POS`, kind: 'POS', currency: 'TRY', openingBalance: 0 }, boss);
        created.accounts.push(a.id, b.id);
        await AccountingService.addMovement({ kind: 'TRANSFER', accountId: a.id, targetAccountId: b.id, amount: 120, date: '2026-10-04' }, boss);
        const list = await AccountingService.listAccounts();
        assert.equal(list.find((x) => x.id === a.id)?.balance, 180);
        assert.equal(list.find((x) => x.id === b.id)?.balance, 120);
    });

    test('alerts always include every active super admin', async () => {
        const recipients = await resolveAlertRecipients('CONTACT_NEW');
        const supers = await prisma.user.findMany({ where: { isActive: true, isSuperAdmin: true }, select: { email: true } });
        for (const s of supers) assert.ok(recipients.some((r) => r.email === s.email.toLowerCase() && r.reason === 'SUPER_ADMIN'));
        const rules = sanitizeAlertRules({ CONTACT_NEW: { notifyPermissionHolders: false, extraEmails: 'a@b.co, kötü, a@b.co' } });
        assert.deepEqual(rules.CONTACT_NEW, { notifyPermissionHolders: false, extraEmails: ['a@b.co'] });
        assert.equal(rules.APPLICATION_NEW.notifyPermissionHolders, true);
    });

    test('personal permissions: admins cannot grant what they lack; super admins cannot be restricted', async () => {
        const perm = await prisma.permission.findFirst({ where: { action: 'manage', resource: 'integrations' } });
        assert.ok(perm);
        const manager = role(staff, [['manage', 'roles']]);
        const target = await prisma.user.findFirst({ where: { isActive: true, isSuperAdmin: false, id: { not: staffRecord.id } }, select: { id: true } });
        if (target) await assert.rejects(() => PermissionAdminService.setUserOverrides(target.id, [{ permissionId: perm.id, state: 'grant' }], manager), /Sahip olmadığınız/);
        await assert.rejects(() => PermissionAdminService.setUserOverrides(boss.id, [{ permissionId: perm.id, state: 'deny' }], boss), /Süper Yönetici/);
        await assert.rejects(() => PermissionAdminService.setUserOverrides(staffRecord.id, [], role(staff, [['view', 'tasks']])), /roles:manage/);
    });

    test('work OS: team, sub-task, recurrence and a completion automation', async () => {
        await assert.rejects(() => WorkTeamService.create({ name: `${RUN} ekip` }, staff), /teams:manage/);
        const team = await WorkTeamService.create({ name: `${RUN} Muhasebe`, leadUserId: boss.id, members: [{ userId: staff.id }] }, boss);
        created.teams.push(team.id);
        const listed = (await WorkTeamService.list()).find((t) => t.id === team.id);
        assert.equal(listed?.members.length, 2, 'lead is always a member');

        const rule = await AutomationService.save({ name: `${RUN} takip`, trigger: 'TASK_COMPLETED', conditions: { teamId: team.id }, actions: [{ type: 'CREATE_FOLLOW_UP', title: `${RUN} takip görevi`, dueInDays: 3 }] }, boss);
        created.rules.push(rule.id);

        const task = await TaskService.createTask({ title: `${RUN} aylık rapor`, createdById: boss.id, actorName: boss.name, assigneeIds: [boss.id], teamId: team.id, dueDate: '2026-10-31T09:00:00+03:00', recurrence: 'MONTHLY' });
        created.tasks.push(task.id);
        const sub = await WorkOsService.addSubtask(task.id, { title: `${RUN} veri topla` }, boss);
        created.tasks.push(sub.id);
        assert.equal((await prisma.task.findUnique({ where: { id: sub.id } }))?.teamId, team.id, 'sub-task inherits the team');
        await assert.rejects(() => WorkOsService.addSubtask(sub.id, { title: 'x' }, boss), /alt görev eklenemez/);

        await WorkOsService.setWatch(task.id, true, boss, staff.id);
        await TaskWorkflowService.transition(task.id, 'complete', boss);

        const next = await prisma.task.findFirst({ where: { title: `${RUN} aylık rapor`, id: { not: task.id } } });
        assert.ok(next, 'next occurrence created');
        created.tasks.push(next.id);
        assert.equal(next.recurrence, 'MONTHLY');
        assert.equal(next.dueDate?.toISOString(), nextOccurrence(new Date('2026-10-31T06:00:00Z'), 'MONTHLY').toISOString());
        assert.equal((await prisma.task.findUnique({ where: { id: task.id } }))?.recurrence, null, 'recurrence moved to the new task');

        const follow = await prisma.task.findFirst({ where: { title: `${RUN} takip görevi` } });
        assert.ok(follow, 'automation created the follow-up');
        created.tasks.push(follow.id);
        assert.ok(await prisma.notification.findFirst({ where: { userId: staff.id, targetUrl: `/admin/gorevler?taskId=${task.id}` } }), 'watcher notified');
        assert.equal((await prisma.automationRule.findUnique({ where: { id: rule.id } }))?.executionCount, 1);
    });

    test('integration hub blocks internal addresses and keeps secrets encrypted', async () => {
        await assert.rejects(() => assertSafeUrl('http://example.com'), /https/);
        await assert.rejects(() => assertSafeUrl('https://localhost/api'), /İç ağ/);
        await assert.rejects(() => assertSafeUrl('https://127.0.0.1/api'), /İç ağ/);
        await assert.rejects(() => assertSafeUrl('https://10.1.2.3/api'), /İç ağ/);
        await assert.rejects(() => assertSafeUrl('https://user:pw@1.1.1.1/'), /kullanıcı adı/);
        const sealed = sealSecret({ apiKey: 'çok-gizli' });
        assert.ok(!sealed.includes('çok-gizli'));
        assert.equal(openSecret(sealed).apiKey, 'çok-gizli');

        await assert.rejects(() => IntegrationService.createApiKey({ name: 'x', scopes: ['tasks:read'] }, staff), /integrations:manage/);
        const { id, token } = await IntegrationService.createApiKey({ name: `${RUN} anahtar`, scopes: ['tasks:read'] }, boss);
        created.apiKeys.push(id);
        assert.ok(await IntegrationService.verifyApiKey(`Bearer ${token}`, 'tasks:read'));
        assert.equal(await IntegrationService.verifyApiKey(`Bearer ${token}`, 'finance:read'), null, 'scope enforced');
        await IntegrationService.revokeApiKey(id, boss);
        assert.equal(await IntegrationService.verifyApiKey(`Bearer ${token}`, 'tasks:read'), null, 'revoked key rejected');
    });

    test('machines default to quote pricing; staff fields are normalised', () => {
        assert.equal(facilityPricing({ facilityType: 'MACHINE_LASER', featuresJson: null }).model, 'QUOTE');
        assert.equal(facilityPricing({ facilityType: 'MEETING_ROOM', featuresJson: null }).model, 'FREE');
        assert.deepEqual(sanitizePricing({ model: 'HOURLY', hourlyRate: '750.555' }), { model: 'HOURLY', hourlyRate: 750.56, currency: 'TRY', note: null });
        const machines = sanitizeMachines([{ name: 'Bambu Lab H2D', specs: [{ label: 'Hacim', value: '350×320×325 mm' }, { label: 'Boş', value: '' }], sourceUrl: 'javascript:alert(1)' }, { name: '' }]);
        assert.equal(machines.length, 1);
        assert.equal(machines[0].specs.length, 1);
        assert.equal(machines[0].sourceUrl, null);
        assert.equal(facilityMachines({ featuresJson: 'bozuk' }).length, 0);
        assert.deepEqual(sanitizeStaffProfile({ employmentType: 'INTERN', sgkStatus: '  Stajyer — zorunlu staj ', hireDate: 'yanlış' }), { employmentType: 'INTERN', sgkStatus: 'Stajyer — zorunlu staj', hireDate: null });
    });
});
