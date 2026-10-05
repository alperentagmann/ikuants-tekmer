import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';
import { ReportAutomationService } from '@/lib/services/report-automation-service';
import { AutomationService } from '@/lib/services/automation-service';

/**
 * Background jobs shared by the cron endpoint (/api/cron/process-jobs) and the in-process
 * scheduler started from instrumentation.ts on long-running servers. Every job is idempotent,
 * so running it from both places or more often than needed is safe.
 */
export const SchedulerService = {
    async runAll(now: Date = new Date()) {
        const results = {
            publishedNewsCount: 0,
            cleanedSessionsCount: 0,
            processedEmails: { processed: 0, succeeded: 0, failed: 0 } as Record<string, unknown>,
            overdueTasksFlagged: 0,
            reports: null as Awaited<ReturnType<typeof ReportAutomationService.runScheduled>> | null,
            timestamp: now.toISOString(),
        };

        // 1. Scheduled news publishing
        const dueNews = await prisma.news.findMany({ where: { status: 'SCHEDULED', scheduledPublishAt: { lte: now }, isArchived: false } });
        for (const item of dueNews) {
            await prisma.news.update({ where: { id: item.id }, data: { status: 'PUBLISHED', publishedAt: now } });
            await logAuditEvent({ action: 'PUBLISH', entityType: 'News', entityId: item.id, diff: `Auto-published scheduled news: "${item.title}"` });
            results.publishedNewsCount++;
        }

        // 2. Expired sessions older than 30 days
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
        const expired = await prisma.session.deleteMany({ where: { OR: [{ isValid: false }, { expiresAt: { lt: thirtyDaysAgo } }] } });
        results.cleanedSessionsCount = expired.count;

        // 3. E-mail outbox (no-op until an SMTP provider is configured)
        results.processedEmails = await EmailOutboxService.processPendingEmails(20);

        // 4. Overdue task automations (each task is flagged once)
        results.overdueTasksFlagged = await SchedulerService.flagOverdueTasks(now);

        // 5. Automatic institutional reports (idempotent; recovers missed runs)
        results.reports = await ReportAutomationService.runScheduled(now);

        return results;
    },

    async flagOverdueTasks(now: Date): Promise<number> {
        const hasRules = await prisma.automationRule.count({ where: { triggerType: 'TASK_OVERDUE', isActive: true } });
        if (!hasRules) return 0;
        const tasks = await prisma.task.findMany({
            where: { isArchived: false, status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] }, dueDate: { lt: now }, activitiesLog: { none: { action: 'OVERDUE_FLAGGED' } } },
            select: { id: true, createdById: true },
            take: 100,
        });
        for (const t of tasks) {
            await prisma.taskActivity.create({ data: { taskId: t.id, actorId: t.createdById, actorName: 'Sistem', action: 'OVERDUE_FLAGGED', description: 'Görev gecikmeye düştü.' } });
            await AutomationService.run('TASK_OVERDUE', t.id);
        }
        return tasks.length;
    },
};
