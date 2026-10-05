/**
 * Work tracking: task handoffs between admins, time tracking, recurring to-dos and the
 * work report scope. Records use the "qa-wt-" marker and are removed by exact id.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { WorkTrackingService } from '../lib/services/work-tracking-service';
import { TodoService } from '../lib/services/todo-service';
import type { UserWithPermissions } from '../lib/rbac';

const RUN = `qa-wt-${Date.now().toString(36)}`;
const created = { tasks: [] as string[], todos: [] as string[] };

type Actor = UserWithPermissions & { id: string; name: string; email: string };
const actor = (u: { id: string; name: string; email: string }, perms: [string, string][]): Actor => ({
    id: u.id, name: u.name, email: u.email, isActive: true, isSuperAdmin: false,
    userRoles: [{ role: { slug: 'qa', permissions: perms.map(([action, resource]) => ({ permission: { action, resource } })) } }],
});

describe('Work tracking', () => {
    let a: Actor;
    let b: Actor;
    before(async () => {
        const users = await prisma.user.findMany({ where: { isActive: true }, take: 2, orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true } });
        assert.ok(users.length >= 2, 'two active users required');
        a = actor(users[0], [['view', 'tasks'], ['edit', 'tasks']]);
        b = actor(users[1], [['view', 'tasks'], ['edit', 'tasks']]);
    });
    after(async () => {
        await prisma.notification.deleteMany({ where: { message: { contains: RUN } } });
        // Only rows created by this run, matched by exact id
        const entryIds = (await prisma.taskTimeEntry.findMany({ where: { OR: [{ taskId: { in: created.tasks } }, { todoId: { in: created.todos } }] }, select: { id: true } })).map((e) => e.id);
        await prisma.auditLog.deleteMany({ where: { OR: [{ entityId: { in: created.tasks } }, { entityType: 'TaskTimeEntry', entityId: { in: entryIds } }] } });
        await prisma.activityTimeline.deleteMany({ where: { entityType: 'Task', entityId: { in: created.tasks } } });
        await prisma.taskTimeEntry.deleteMany({ where: { OR: [{ taskId: { in: created.tasks } }, { todoId: { in: created.todos } }] } });
        await prisma.task.deleteMany({ where: { id: { in: created.tasks } } });
        await prisma.personalTodo.deleteMany({ where: { id: { in: created.todos } } });
        await prisma.$disconnect();
    });

    test('a task is passed, returned with a note, passed again and accepted', async () => {
        const task = await prisma.task.create({ data: { title: `${RUN} pas`, createdById: a.id, assignees: { create: { userId: a.id } } } });
        created.tasks.push(task.id);

        await assert.rejects(() => WorkTrackingService.handoff(task.id, a.id, null, a), /kendinize/);
        const h1 = await WorkTrackingService.handoff(task.id, b.id, `${RUN} lütfen bak`, a);
        let assignees = (await prisma.taskAssignee.findMany({ where: { taskId: task.id } })).map((x) => x.userId);
        assert.deepEqual(assignees, [b.id], 'assignment moves to the receiver');
        await assert.rejects(() => WorkTrackingService.handoff(task.id, a.id, null, b), /yanıt bekleyen/);
        await assert.rejects(() => WorkTrackingService.respond(h1.id, 'return', '', b), /nedenini/);
        await assert.rejects(() => WorkTrackingService.respond(h1.id, 'accept', null, a), /bulunamadı/);

        await WorkTrackingService.respond(h1.id, 'return', `${RUN} yoğunum`, b);
        assignees = (await prisma.taskAssignee.findMany({ where: { taskId: task.id } })).map((x) => x.userId);
        assert.deepEqual(assignees, [a.id], 'returned to the sender');

        const h2 = await WorkTrackingService.handoff(task.id, b.id, null, a);
        await WorkTrackingService.respond(h2.id, 'accept', null, b);
        assert.equal((await prisma.taskHandoff.findUnique({ where: { id: h2.id } }))?.status, 'ACCEPTED');
        const inbox = await WorkTrackingService.listHandoffs(b, 'inbox');
        assert.ok(inbox.some((h) => h.id === h1.id && h.status === 'RETURNED'));
    });

    test('an unrelated admin cannot pass someone else’s task', async () => {
        const task = await prisma.task.create({ data: { title: `${RUN} izinsiz`, createdById: a.id, assignees: { create: { userId: a.id } } } });
        created.tasks.push(task.id);
        await assert.rejects(() => WorkTrackingService.handoff(task.id, a.id, null, b), /üzerinde çalıştığınız/);
    });

    test('timer and manual entries update the task’s logged hours', async (t) => {
        // Starting a timer stops the user's running one; never touch a real running timer
        if (await WorkTrackingService.runningTimer(a.id)) return t.skip('The user has a real running timer.');
        const task = await prisma.task.create({ data: { title: `${RUN} süre`, createdById: a.id, assignees: { create: { userId: a.id } } } });
        created.tasks.push(task.id);
        await WorkTrackingService.startTimer({ taskId: task.id }, a);
        const running = await WorkTrackingService.runningTimer(a.id);
        assert.equal(running?.taskId, task.id);
        await WorkTrackingService.stopTimer(a);
        assert.equal(await WorkTrackingService.runningTimer(a.id), null);
        await WorkTrackingService.addManualEntry({ taskId: task.id, date: '2026-01-05', minutes: 90 }, a);
        assert.equal((await prisma.task.findUnique({ where: { id: task.id } }))?.actualHours, 1.5);
        await assert.rejects(() => WorkTrackingService.addManualEntry({ taskId: task.id, date: '2026-01-05', minutes: 0 }, a), /1 dakika/);
        await assert.rejects(() => WorkTrackingService.startTimer({ taskId: task.id }, b), /süre tutamazsınız/);
    });

    test('completing a recurring to-do creates the next occurrence with a fresh checklist', async () => {
        const todo = await TodoService.create(a.id, { title: `${RUN} haftalık rapor`, dueDate: '2026-01-05', recurrence: 'WEEKLY', checklist: [{ title: 'Verileri topla', done: true }] });
        created.todos.push(todo.id);
        const { next } = await TodoService.toggle(todo.id, a.id);
        assert.ok(next);
        created.todos.push(next.id);
        assert.equal(next.dueDate?.toISOString().slice(0, 10), '2026-01-12');
        assert.equal(JSON.parse(next.checklistJson || '[]')[0].done, false);
        await assert.rejects(() => TodoService.update(todo.id, b.id, { title: 'x' }), /bulunamadı/);
    });

    test('the work report limits users without view-all to their own figures', async () => {
        const own = await WorkTrackingService.workReport({ from: '2026-01-01', to: '2026-01-31' }, a);
        assert.equal(own.scope, 'self');
        assert.deepEqual(own.perUser.map((u) => u.userId), [a.id]);
        assert.ok(own.perUser[0].hoursLogged >= 1.5);
        const team = await WorkTrackingService.workReport({ from: '2026-01-01', to: '2026-01-31', userIds: [a.id, b.id] }, { ...a, isSuperAdmin: true });
        assert.equal(team.scope, 'team');
        assert.equal(team.perUser.length, 2);
        await assert.rejects(() => WorkTrackingService.workReport({ from: '2026-02-01', to: '2026-01-01' }, a), /tarih aralığı/);
    });
});
