import test from 'node:test';
import assert from 'node:assert/strict';
import { PersonalWorkspaceService } from '../lib/services/personal-workspace-service';
import { ReportingService } from '../lib/services/reporting-service';
import { prisma } from '../lib/prisma';

test('1. Personal Workspace - Benim Günüm Daily Summary Aggregation', async () => {
    // Get test user
    const user = await prisma.user.findFirst({ where: { isSuperAdmin: true, status: 'ACTIVE' } });
    assert.ok(user, 'Super admin user must exist');

    const summary = await PersonalWorkspaceService.getMyDaySummary(user.id);
    assert.ok(summary, 'My day summary must be returned');
    assert.ok(Array.isArray(summary.todayTodos), 'Today todos must be array');
    assert.ok(Array.isArray(summary.todayEvents), 'Today events must be array');
    assert.ok(Array.isArray(summary.personalNotes), 'Personal notes must be array');
    assert.ok(summary.summaryStats, 'Summary stats must exist');
    assert.strictEqual(typeof summary.summaryStats.totalTodayTodos, 'number');
});

test('2. Personal To-Do - CRUD, Priority & Conversion to Task', async () => {
    const user = await prisma.user.findFirst({ where: { isSuperAdmin: true, status: 'ACTIVE' } });
    assert.ok(user);

    // 1. Create Private To-Do
    const todo = await PersonalWorkspaceService.createTodo(user.id, {
        title: 'Mentörlük oturum hazırlığı',
        description: 'ANTsPARK girişimcisi ile yapılacak görüşme için notları hazırla.',
        priority: 'HIGH',
        category: 'MEETING',
        dueDate: new Date(),
    });

    assert.ok(todo.id, 'Todo ID should exist');
    assert.strictEqual(todo.isCompleted, false);
    assert.strictEqual(todo.priority, 'HIGH');

    // 2. Toggle Todo Completion
    const toggled = await PersonalWorkspaceService.toggleTodo(todo.id, user.id);
    assert.strictEqual(toggled.isCompleted, true, 'Todo must toggle to completed');

    // 3. Convert Todo to Task
    const task = await PersonalWorkspaceService.convertTodoToTask(todo.id, user.id, {
        id: user.id,
        name: user.name || 'Admin',
        email: user.email,
    });
    assert.ok(task.id, 'Converted Task must exist');
    assert.strictEqual(task.title, todo.title);

    // Clean up
    await PersonalWorkspaceService.deleteTodo(todo.id, user.id);
    await prisma.task.delete({ where: { id: task.id } }).catch(() => {});
});

test('3. Quick Notes & Reminders Management', async () => {
    const user = await prisma.user.findFirst({ where: { isSuperAdmin: true, status: 'ACTIVE' } });
    assert.ok(user);

    // Note test
    const note = await PersonalWorkspaceService.createNote(user.id, {
        title: 'KOSGEB Destek Notu',
        content: 'Ar-Ge desteği için evraklar 15 Ekim tarihine kadar tamamlanmalı.',
        isShared: true,
    });
    assert.ok(note.id);
    assert.strictEqual(note.isShared, true);

    const notes = await PersonalWorkspaceService.getNotes(user.id);
    assert.ok(notes.some((n) => n.id === note.id));

    // Reminder test
    const reminder = await PersonalWorkspaceService.createReminder(user.id, {
        title: 'Yarın 10:00 Toplantı Hatırlatması',
        remindAt: new Date(Date.now() + 86400000),
        channel: 'IN_APP',
    });
    assert.ok(reminder.id);
    assert.strictEqual(reminder.isTriggered, false);

    // Clean up
    await PersonalWorkspaceService.deleteNote(note.id, user.id);
    await prisma.userReminder.delete({ where: { id: reminder.id } });
});

test('4. Favorites, Recents & Global Search (Ctrl+K)', async () => {
    const user = await prisma.user.findFirst({ where: { isSuperAdmin: true, status: 'ACTIVE' } });
    assert.ok(user);

    // Track Recent Item
    const recent = await PersonalWorkspaceService.trackRecentItem(user.id, {
        entityType: 'Entrepreneur',
        entityId: 'ent_123',
        title: 'Örnek Girişim',
        url: '/admin/girisimciler#ent_123',
    });
    assert.ok(recent.id);

    // Global Search
    const searchResults = await PersonalWorkspaceService.globalSearch('TEKMER');
    assert.ok(Array.isArray(searchResults), 'Search results must be an array');

    // Clean up
    await prisma.recentItem.delete({ where: { id: recent.id } }).catch(() => {});
});

test('5. Management Intelligence - Daily & Yearly Corporate Reports', async () => {
    const user = await prisma.user.findFirst({ where: { isSuperAdmin: true, status: 'ACTIVE' } });
    assert.ok(user);

    // Daily Report Data
    const dailyData = await ReportingService.generateDailyReportData(user.id, new Date());
    assert.ok(dailyData.date);
    assert.ok(dailyData.defaultDraft);

    // Yearly Corporate Report Data (10 sections)
    const yearlyData = await ReportingService.generateYearlyCorporateReportData(2026);
    assert.strictEqual(yearlyData.year, 2026);
    assert.ok(yearlyData.executiveSummary);
    assert.ok(yearlyData.sections.entrepreneurship, 'Must include entrepreneurship section');
    assert.ok(yearlyData.sections.mentorship, 'Must include mentorship section');
    assert.ok(yearlyData.sections.trainings, 'Must include trainings section');
    assert.ok(yearlyData.sections.events, 'Must include events section');
    assert.ok(yearlyData.sections.applications, 'Must include applications section');
    assert.ok(yearlyData.sections.socialMedia, 'Must include social media section');

    // Save and Approve Report
    const saved = await ReportingService.saveReport(
        {
            title: 'Test 2026 Yıllık Raporu',
            reportType: 'YEARLY',
            periodStart: new Date(2026, 0, 1),
            periodEnd: new Date(2026, 11, 31),
            executiveSummary: yearlyData.executiveSummary,
            metricsJson: yearlyData.sections,
            status: 'DRAFT',
        },
        user.id,
        { id: user.id, name: user.name || 'Admin', email: user.email }
    );
    assert.ok(saved.id);
    assert.strictEqual(saved.status, 'DRAFT');

    const approved = await ReportingService.approveReport(saved.id, user.id, {
        id: user.id,
        name: user.name || 'Admin',
        email: user.email,
    });
    assert.strictEqual(approved.status, 'APPROVED');

    // Clean up
    await prisma.operationalReport.delete({ where: { id: saved.id } });
});
