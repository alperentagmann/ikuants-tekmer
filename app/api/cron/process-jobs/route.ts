import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'ikuants-cron-default-secret';

    // Verify bearer secret or Vercel cron header
    if (authHeader !== `Bearer ${cronSecret}` && req.headers.get('x-vercel-cron') !== '1') {
        const { searchParams } = new URL(req.url);
        if (searchParams.get('secret') !== cronSecret) {
            return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
        }
    }

    const results = {
        publishedNewsCount: 0,
        cleanedSessionsCount: 0,
        processedEmails: { processed: 0, succeeded: 0, failed: 0 },
        timestamp: new Date().toISOString(),
    };

    try {
        // 1. Process Scheduled News Publishing
        const now = new Date();
        const dueNews = await prisma.news.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledPublishAt: { lte: now },
                isArchived: false,
            },
        });

        for (const item of dueNews) {
            await prisma.news.update({
                where: { id: item.id },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: now,
                },
            });

            await logAuditEvent({
                action: 'PUBLISH',
                entityType: 'News',
                entityId: item.id,
                diff: `Auto-published scheduled news: "${item.title}"`,
            });

            results.publishedNewsCount++;
        }

        // 2. Clean expired sessions older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const expiredSessions = await prisma.session.deleteMany({
            where: {
                OR: [
                    { isValid: false },
                    { expiresAt: { lt: thirtyDaysAgo } },
                ],
            },
        });
        results.cleanedSessionsCount = expiredSessions.count;

        // 3. Process Pending Email Outbox Queue
        const emailResults = await EmailOutboxService.processPendingEmails(20);
        results.processedEmails = emailResults;

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Cron job processing failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
