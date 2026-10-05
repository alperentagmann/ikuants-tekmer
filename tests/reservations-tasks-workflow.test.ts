/**
 * Reservations (Facility/Resource, timezone, capacity, double booking, approval, CRM link)
 * and the task lifecycle (start → review → return → approve → reopen, RBAC scope).
 * Records use the "qa-rt-" marker and are removed by exact id.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { SpaceReservationService, toIstanbulDate } from '../lib/services/space-reservation-service';
import { SpaceDomainService } from '../lib/services/space-domain-service';
import { FormSubmissionService } from '../lib/services/form-submission-service';
import { TaskService } from '../lib/services/task-service';
import { TaskWorkflowService } from '../lib/services/task-workflow-service';
import type { UserWithPermissions } from '../lib/rbac';

const RUN = `qa-rt-${Date.now().toString(36)}`;
const created = { facilities: [] as string[], reservations: [] as string[], submissions: [] as string[], persons: [] as string[], tasks: [] as string[] };

type Actor = UserWithPermissions & { id: string; name: string; email: string };
function actor(user: { id: string; name: string; email: string }, perms: [string, string][]): Actor {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: true,
        isSuperAdmin: false,
        userRoles: [{ role: { slug: 'qa', permissions: perms.map(([action, resource]) => ({ permission: { action, resource } })) } }],
    };
}

function futureDate(days: number): string {
    const d = new Date(Date.now() + days * 86400000);
    return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
}

describe('Reservations and task lifecycle', () => {
    let facilityId = '';
    let smallTableId = '';
    let users: { id: string; name: string; email: string }[] = [];

    before(async () => {
        users = await prisma.user.findMany({ where: { isActive: true }, take: 3, orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true } });
        assert.ok(users.length >= 2, 'At least two users are needed for task tests');

        const { facility } = await SpaceDomainService.createFacility({
            title: `${RUN} Toplantı Alanı`,
            description: 'QA alanı',
            facilityType: 'MEETING_ROOM',
            features: { capacity: null, reservationEnabled: true, publicVisible: true, approvalRequired: true, bufferBeforeMinutes: 0, bufferAfterMinutes: 30 },
        });
        facilityId = facility.id;
        const { facility: small } = await SpaceDomainService.createFacility({
            title: `${RUN} Küçük Masa`,
            description: 'QA',
            facilityType: 'OPEN_MEETING_TABLE',
            features: { capacity: 4, reservationEnabled: true, publicVisible: true },
        });
        smallTableId = small.id;
        created.facilities.push(facilityId, smallTableId);
    });

    after(async () => {
        await prisma.reservation.deleteMany({ where: { id: { in: created.reservations } } });
        await prisma.emailOutbox.deleteMany({ where: { entityId: { in: created.reservations } } });
        await prisma.activityTimeline.deleteMany({ where: { entityId: { in: [...created.reservations, ...created.tasks] } } });
        await prisma.notification.deleteMany({ where: { message: { contains: RUN } } });
        await prisma.submission.deleteMany({ where: { id: { in: created.submissions } } });
        await prisma.resource.deleteMany({ where: { id: { in: created.facilities } } });
        await prisma.facility.deleteMany({ where: { id: { in: created.facilities } } });
        await prisma.person.deleteMany({ where: { id: { in: created.persons } } });
        await prisma.notification.deleteMany({ where: { targetUrl: { in: created.tasks.map((id) => `/admin/gorevler?taskId=${id}`) } } });
        await prisma.task.deleteMany({ where: { id: { in: created.tasks } } });
    });

    test('Times are stored as Europe/Istanbul (UTC+03:00)', () => {
        assert.strictEqual(toIstanbulDate('2030-01-02', '14:00').toISOString(), '2030-01-02T11:00:00.000Z');
    });

    test('Known capacity is enforced; unknown capacity is never replaced by a default', async () => {
        const date = futureDate(30);
        const small = await SpaceReservationService.checkAvailability({ facilityId: smallTableId, date, startTime: '10:00', endTime: '11:00', participants: 6 });
        assert.strictEqual(small.isAvailable, false);
        assert.ok(small.reasons.some((r) => r.includes('kapasitesi 4')));
        const unknown = await SpaceReservationService.checkAvailability({ facilityId, date, startTime: '10:00', endTime: '11:00', participants: 40 });
        assert.strictEqual(unknown.capacity, null);
        assert.strictEqual(unknown.isAvailable, true);
        const resource = await prisma.resource.findUnique({ where: { id: facilityId } });
        assert.strictEqual(resource?.capacity, null, 'Resource projection must not get a fake capacity');
    });

    test('Public request: PENDING, no user relation, no automatic CRM person; double booking and buffer are blocked', async () => {
        const date = futureDate(31);
        const submission = await FormSubmissionService.submitPublicForm(
            'rezervasyon-talep-formu',
            { requesterName: `${RUN} Talep Sahibi`, requesterEmail: `${RUN}@example.com`, purpose: 'Toplantı', kvkkConsent: true, _ts: Date.now() - 10000 },
            { skipNotifications: true, context: { entityType: 'Facility', entityId: facilityId, label: 'QA' } }
        );
        created.submissions.push(submission.submissionId);
        const result = await SpaceReservationService.createPublicRequest({
            facilityId, date, startTime: '14:00', endTime: '16:00', participants: 5,
            submission: { id: submission.submissionId, submissionNumber: submission.submissionNumber, applicantName: submission.applicantName, applicantEmail: submission.applicantEmail, values: submission.values },
        });
        created.reservations.push(result.reservation.id);
        assert.strictEqual(result.reservation.status, 'PENDING_APPROVAL');
        assert.strictEqual(result.reservation.userId, null);
        assert.strictEqual(result.reservation.requesterEmail, `${RUN}@example.com`);
        // Scoped to this run's email: other test files create and delete persons in parallel
        const requesterEmail = `${RUN}@example.com`;
        const personsForRequester = await prisma.person.count({ where: { OR: [{ email: requesterEmail }, { workEmail: requesterEmail }, { personalEmail: requesterEmail }] } });
        assert.strictEqual(personsForRequester, 0, 'Public reservation must not create a Person');

        const overlap = await SpaceReservationService.checkAvailability({ facilityId, date, startTime: '15:00', endTime: '17:00', participants: 2 });
        assert.strictEqual(overlap.isAvailable, false, 'Double booking must be blocked');
        const inBuffer = await SpaceReservationService.checkAvailability({ facilityId, date, startTime: '16:15', endTime: '17:00', participants: 2 });
        assert.strictEqual(inBuffer.isAvailable, false, '30 minute buffer after the booking must be respected');
        assert.ok(inBuffer.alternativeSlots.length > 0, 'Alternatives are suggested');
    });

    test('Approval re-checks rules and queues e-mail without fake SENT; requester is linked to CRM only explicitly', async () => {
        const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: created.reservations[0] } });
        const approved = await SpaceReservationService.decide(reservation.id, 'approve', {}, users[0]);
        assert.strictEqual(approved.status, 'CONFIRMED');
        const mails = await prisma.emailOutbox.findMany({ where: { entityId: reservation.id } });
        assert.ok(mails.length >= 1);
        assert.ok(mails.every((m) => m.status !== 'SENT' || Boolean(m.providerMessageId && !m.providerMessageId.startsWith('simulated-'))));

        await assert.rejects(() => SpaceReservationService.decide(reservation.id, 'cancel', {}, users[0]), /Gerekçe/);
        const linked = await SpaceReservationService.linkRequester(reservation.id, { createPerson: true }, users[0]);
        assert.ok(linked.personId);
        created.persons.push(linked.personId!);
        const person = await prisma.person.findUniqueOrThrow({ where: { id: linked.personId! } });
        assert.strictEqual(person.dataSource, 'RESERVATION');
    });

    test('Task lifecycle with review loop, permissions and history', async () => {
        const owner = actor(users[0], [['view', 'tasks'], ['edit', 'tasks'], ['create', 'tasks'], ['assign', 'tasks'], ['approve', 'tasks']]);
        const worker = actor(users[1], [['view', 'tasks'], ['edit', 'tasks'], ['create', 'tasks']]);

        assert.throws(() => TaskWorkflowService.assertCanAssign(worker, [owner.id]), /task:assign/);
        TaskWorkflowService.assertCanAssign(owner, [worker.id]);

        const task = await TaskService.createTask({ title: `${RUN} Görev`, createdById: owner.id, actorName: owner.name, assigneeIds: [worker.id] });
        created.tasks.push(task.id);

        await TaskWorkflowService.transition(task.id, 'start', worker);
        await assert.rejects(() => TaskWorkflowService.transition(task.id, 'complete', worker), /kontrol gerektiriyor/);
        await TaskWorkflowService.transition(task.id, 'submitForReview', worker);
        await assert.rejects(() => TaskWorkflowService.transition(task.id, 'approve', worker), /sonuçlandırabilir/);
        await assert.rejects(() => TaskWorkflowService.transition(task.id, 'returnForRevision', owner), /açıklama/);
        await TaskWorkflowService.transition(task.id, 'returnForRevision', owner, 'Bütçe tablosunu ekleyin');
        await TaskWorkflowService.transition(task.id, 'submitForReview', worker);
        const done = await TaskWorkflowService.transition(task.id, 'approve', owner);
        assert.strictEqual(done.status, 'DONE');
        assert.ok(done.completedAt);
        const reopened = await TaskWorkflowService.moveToStatus(task.id, 'IN_PROGRESS', owner);
        assert.strictEqual(reopened.status, 'TODO', 'Kanban drop on a DONE task maps to reopen');

        const history = await prisma.taskActivity.findMany({ where: { taskId: task.id }, orderBy: { createdAt: 'asc' } });
        const actions = history.map((h) => h.action);
        for (const a of ['CREATED', 'STARTED', 'REVIEW_REQUESTED', 'RETURNED', 'APPROVED', 'REOPENED']) assert.ok(actions.includes(a), `history contains ${a}`);
        const audits = await prisma.auditLog.count({ where: { entityType: 'Task', entityId: task.id } });
        assert.ok(audits >= 6, 'Each transition is audited');
    });

    test('Task visibility: without task:view_all users see only their own tasks', async () => {
        const outsider = actor(users[2] || users[1], [['view', 'tasks'], ['edit', 'tasks']]);
        const task = await prisma.task.findUniqueOrThrow({ where: { id: created.tasks[0] }, include: { assignees: true } });
        if ((users[2] || users[1]).id !== users[1].id) {
            assert.strictEqual(TaskWorkflowService.canSee(task, outsider), false);
            await assert.rejects(() => TaskWorkflowService.transition(task.id, 'start', outsider), /yetkiniz yok/);
        }
        const scoped = TaskWorkflowService.scopeWhere(outsider);
        assert.ok('OR' in scoped, 'Scoped query is applied for users without view_all');
        const manager = actor(users[0], [['view', 'tasks'], ['view_all', 'tasks']]);
        assert.deepStrictEqual(TaskWorkflowService.scopeWhere(manager), {});
    });
});
