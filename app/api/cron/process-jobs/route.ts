import { NextRequest, NextResponse } from 'next/server';
import { SchedulerService } from '@/lib/services/scheduler-service';

export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || cronSecret.length < 16) {
        return NextResponse.json(
            { error: 'Scheduler is not configured', status: 'PENDING_EXTERNAL_CONFIGURATION' },
            { status: 503 }
        );
    }

    // Vercel Cron and external schedulers send the secret as a bearer token.
    // Headers such as x-vercel-cron can be spoofed and secrets in query strings leak into logs.
    if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    try {
        const results = await SchedulerService.runAll(new Date());
        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Cron job processing failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
