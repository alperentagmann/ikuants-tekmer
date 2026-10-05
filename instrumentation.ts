/**
 * Always-on background jobs for long-running servers (`npm start`, Docker, VM).
 * Runs the same idempotent jobs as /api/cron/process-jobs every 5 minutes, so e-mails, scheduled
 * news, overdue-task automations and automatic reports keep working without an external cron.
 * Serverless hosts (e.g. Vercel) should keep using the cron endpoint; there this is harmless.
 *
 * INTERNAL_SCHEDULER=off disables it; INTERNAL_SCHEDULER=on also enables it in development.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;
    const mode = process.env.INTERNAL_SCHEDULER;
    if (mode === 'off') return;
    if (process.env.NODE_ENV !== 'production' && mode !== 'on') return;

    const g = globalThis as typeof globalThis & { __ikuantsScheduler?: ReturnType<typeof setInterval> };
    if (g.__ikuantsScheduler) return;

    const { SchedulerService } = await import('./lib/services/scheduler-service');
    let running = false;
    const tick = async () => {
        if (running) return;
        running = true;
        try {
            await SchedulerService.runAll(new Date());
        } catch (error) {
            console.error('[scheduler] background jobs failed', error);
        } finally {
            running = false;
        }
    };
    g.__ikuantsScheduler = setInterval(tick, 5 * 60 * 1000);
    setTimeout(tick, 30 * 1000);
}
