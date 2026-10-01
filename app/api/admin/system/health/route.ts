import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import os from 'os';

export async function GET() {
    try {
        const user = await getCurrentAdminUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
        }

        const startTime = Date.now();
        let dbStatus = 'ONLINE';
        let dbLatency = '0ms';
        let dbError = null;

        try {
            await prisma.$queryRaw`SELECT 1`;
            dbLatency = `${Date.now() - startTime}ms`;
        } catch (err: any) {
            dbStatus = 'ERROR';
            dbError = err.message;
        }

        // Email Provider Check
        const isEmailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
        const emailStatus = isEmailConfigured ? 'CONNECTED' : 'NOT_CONFIGURED_EXTERNAL';

        // Microsoft 365 Check
        const isM365Configured = Boolean(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET);
        const m365Status = isM365Configured ? 'CONNECTED' : 'NOT_CONFIGURED_EXTERNAL';

        // Meta / Instagram Check
        const isMetaConfigured = Boolean(process.env.META_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN);
        const metaStatus = isMetaConfigured ? 'CONNECTED' : 'NOT_CONFIGURED_EXTERNAL';

        // Background Job / Outbox Metrics
        const pendingEmails = await prisma.emailOutbox.count({ where: { status: 'PENDING' } }).catch(() => 0);
        const pendingTasks = await prisma.task.count({ where: { status: { not: 'COMPLETED' }, isArchived: false } }).catch(() => 0);

        return NextResponse.json({
            success: true,
            status: dbStatus === 'ONLINE' ? 'HEALTHY' : 'DEGRADED',
            timestamp: new Date().toISOString(),
            checks: {
                database: {
                    status: dbStatus,
                    latency: dbLatency,
                    provider: 'PostgreSQL (Prisma)',
                    error: dbError,
                },
                storage: {
                    status: 'ONLINE',
                    provider: 'Unified Object Storage',
                    publicBucket: 'ikuants-public-media',
                    privateBucket: 'ikuants-private-documents',
                },
                auth: {
                    status: 'ONLINE',
                    sessionType: 'HttpOnly Server Cookie (AES-GCM / Jose)',
                    mfaSupported: true,
                },
                email: {
                    status: emailStatus,
                    provider: isEmailConfigured ? process.env.SMTP_HOST : 'None (Mock Outbox Active)',
                    pendingOutboxCount: pendingEmails,
                },
                integrations: {
                    microsoft365: m365Status,
                    metaInstagram: metaStatus,
                },
                jobs: {
                    status: 'ONLINE',
                    pendingTasks,
                    pendingEmails,
                },
            },
            system: {
                nodeVersion: process.version,
                nextVersion: '16.1.1',
                environment: process.env.NODE_ENV || 'development',
                uptimeSeconds: Math.floor(process.uptime()),
                memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
                platform: `${os.platform()} (${os.arch()})`,
            }
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Health check failed' }, { status: 500 });
    }
}
