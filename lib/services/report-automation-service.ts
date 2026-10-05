import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { istanbulDayKey, istanbulDayRange, istanbulMonthRange, istanbulNow } from '@/lib/time';

/**
 * Automatic institutional reports (daily, monthly, yearly) on Europe/Istanbul calendar
 * boundaries. Idempotent by periodKey: running the job twice never duplicates a report.
 * Missed runs are recovered by looking back over recent periods. When underlying data
 * changes after generation, the report is flagged as outdated; a new version can be
 * generated without touching the reviewed or approved version.
 */

export type AutoPeriod = 'DAILY' | 'MONTHLY' | 'YEARLY';

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const LOOKBACK = { DAILY: 7, MONTHLY: 3, YEARLY: 1 } as const;

type Period = { type: AutoPeriod; key: string; start: Date; end: Date; title: string };

function sumByCurrency(rows: { amount: number; currency: string }[]): Record<string, number> {
    return rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.currency]: Math.round(((acc[r.currency] || 0) + r.amount) * 100) / 100 }), {});
}

/** Completed periods to cover, newest first. The current (unfinished) period is never reported. */
export function periodsToCover(type: AutoPeriod, now = new Date()): Period[] {
    const out: Period[] = [];
    const { year, month } = istanbulNow(now);
    for (let i = 1; i <= LOOKBACK[type]; i++) {
        if (type === 'DAILY') {
            const key = istanbulDayKey(new Date(now.getTime() - i * 86400000));
            const { start, end } = istanbulDayRange(key);
            out.push({ type, key: `DAILY:${key}`, start, end, title: `Günlük Kurumsal Özet — ${key.split('-').reverse().join('.')}` });
        } else if (type === 'MONTHLY') {
            const m0 = month - i;
            const y = m0 <= 0 ? year - 1 : year;
            const m = m0 <= 0 ? m0 + 12 : m0;
            const { start, end } = istanbulMonthRange(y, m);
            out.push({ type, key: `MONTHLY:${y}-${String(m).padStart(2, '0')}`, start, end, title: `Aylık Kurumsal Rapor — ${MONTHS_TR[m - 1]} ${y}` });
        } else {
            const y = year - i;
            out.push({ type, key: `YEARLY:${y}`, start: istanbulMonthRange(y, 1).start, end: istanbulMonthRange(y, 12).end, title: `${y} Yıllık Kurumsal Faaliyet Raporu` });
        }
    }
    return out;
}

/** Institution-wide facts for [start, end). Only counts of real records; no estimates. */
export async function buildInstitutionMetrics(start: Date, end: Date) {
    const range = { gte: start, lt: end };
    const [
        appsByType, newEntrepreneurs, programAssignments, tasksCompleted, tasksCreated, events, trainings,
        activities, interactions, newsPublished, reservations, submissions, accruals, payments, emailsSent, assignments,
    ] = await Promise.all([
        prisma.application.groupBy({ by: ['applicationType'], where: { createdAt: range }, _count: { _all: true } }),
        prisma.entrepreneur.count({ where: { createdAt: range } }),
        prisma.entrepreneurProgram.count({ where: { createdAt: range } }),
        prisma.task.count({ where: { status: 'DONE', completedAt: range } }),
        prisma.task.count({ where: { createdAt: range } }),
        prisma.event.count({ where: { startDate: range } }),
        prisma.training.count({ where: { startDate: range } }),
        prisma.corporateActivity.count({ where: { activityDate: range, status: { not: 'CANCELLED' } } }),
        prisma.dailyInteraction.count({ where: { date: range } }),
        prisma.news.count({ where: { publishedAt: range } }),
        prisma.reservation.groupBy({ by: ['status'], where: { startTime: range }, _count: { _all: true } }),
        prisma.submission.count({ where: { createdAt: range } }),
        prisma.rentAccrual.findMany({ where: { dueDate: range }, select: { totalDue: true, currency: true } }),
        prisma.rentPayment.findMany({ where: { paymentDate: range }, select: { amount: true, currency: true } }),
        prisma.emailOutbox.count({ where: { status: 'SENT', sentAt: range } }),
        prisma.spaceAssignment.count({ where: { createdAt: range } }),
    ]);
    const applications = Object.fromEntries(appsByType.map((a) => [a.applicationType, a._count._all])) as Record<string, number>;
    return {
        applications: { total: Object.values(applications).reduce((a, b) => a + b, 0), byType: applications },
        entrepreneurs: { new: newEntrepreneurs, programAssignments, spaceAssignments: assignments },
        operations: { tasksCreated, tasksCompleted, interactions, activities },
        programsAndEvents: { events, trainings },
        communication: { newsPublished, formSubmissions: submissions, emailsSent },
        reservations: Object.fromEntries(reservations.map((r) => [r.status, r._count._all])) as Record<string, number>,
        // Currencies are reported separately and never summed together
        finance: { rentAccrued: sumByCurrency(accruals.map((a) => ({ amount: a.totalDue, currency: a.currency }))), rentCollected: sumByCurrency(payments) },
    };
}

type Metrics = Awaited<ReturnType<typeof buildInstitutionMetrics>>;

function summarize(p: Period, m: Metrics): string {
    const money = (o: Record<string, number>) => (Object.keys(o).length ? Object.entries(o).map(([c, v]) => `${v.toLocaleString('tr-TR')} ${c}`).join(' + ') : '0');
    const parts = [
        `${m.applications.total} başvuru alındı (program: ${m.applications.byType.PROGRAM || 0}, TEKMER: ${m.applications.byType.TEKMER || 0}).`,
        `${m.entrepreneurs.new} yeni girişim kaydı, ${m.entrepreneurs.programAssignments} program ataması yapıldı.`,
        `${m.operations.tasksCompleted} görev tamamlandı, ${m.operations.interactions} görüşme kaydedildi.`,
        `${m.programsAndEvents.events} etkinlik ve ${m.programsAndEvents.trainings} eğitim gerçekleşti.`,
        `Kira tahakkuku: ${money(m.finance.rentAccrued)}; tahsilat: ${money(m.finance.rentCollected)}.`,
    ];
    return `${p.title}. ${parts.join(' ')} Bu özet sistem tarafından kayıtlı verilerden otomatik oluşturulmuştur; incelenip onaylanmadan resmi rapor değildir.`;
}

async function createVersion(p: Period, metrics: Metrics, previous: { id: string; version: number } | null) {
    const slugBase = p.key.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return prisma.operationalReport.create({
        data: {
            title: p.title,
            slug: `auto-${slugBase}-v${(previous?.version || 0) + 1}`,
            reportType: p.type,
            periodStart: p.start,
            periodEnd: new Date(p.end.getTime() - 1),
            authorId: null,
            status: 'AUTO_GENERATED_DRAFT',
            executiveSummary: summarize(p, metrics),
            metricsJson: JSON.stringify(metrics),
            periodKey: p.key,
            isAutoGenerated: true,
            isScheduled: true,
            version: (previous?.version || 0) + 1,
            supersedesId: previous?.id || null,
        },
    });
}

export const ReportAutomationService = {
    /** Creates missing reports for recent completed periods and flags changed ones as outdated. */
    async runScheduled(now = new Date(), types: AutoPeriod[] = ['DAILY', 'MONTHLY', 'YEARLY']) {
        const result = { created: [] as string[], outdated: [] as string[], unchanged: 0 };
        for (const type of types) {
            for (const p of periodsToCover(type, now)) {
                const latest = await prisma.operationalReport.findFirst({ where: { reportType: type, periodKey: p.key, isAutoGenerated: true }, orderBy: { version: 'desc' } });
                const metrics = await buildInstitutionMetrics(p.start, p.end);
                if (!latest) {
                    try {
                        const r = await createVersion(p, metrics, null);
                        result.created.push(p.key);
                        await logAuditEvent({ action: 'CREATE', entityType: 'OperationalReport', entityId: r.id, diff: `Otomatik rapor oluşturuldu: ${p.key}` });
                    } catch (error) {
                        // A concurrent run created the same period (unique slug) — idempotent by design
                        if ((error as { code?: string }).code !== 'P2002') throw error;
                    }
                    continue;
                }
                const changed = latest.metricsJson !== JSON.stringify(metrics);
                if (changed && !latest.isOutdated) {
                    await prisma.operationalReport.update({ where: { id: latest.id }, data: { isOutdated: true } });
                    result.outdated.push(p.key);
                } else {
                    result.unchanged++;
                }
            }
        }
        return result;
    },

    /** Generates a new version of an automatic report with fresh data; the old version is kept. */
    async regenerate(reportId: string, actor: { id: string; name: string; email: string }) {
        const old = await prisma.operationalReport.findUnique({ where: { id: reportId } });
        if (!old || !old.isAutoGenerated || !old.periodKey) throw new DomainError('Yalnızca otomatik raporlar yeniden oluşturulabilir.', 400);
        const latest = await prisma.operationalReport.findFirst({ where: { periodKey: old.periodKey, isAutoGenerated: true }, orderBy: { version: 'desc' } });
        if (latest && latest.id !== old.id) throw new DomainError('Bu raporun daha yeni bir sürümü var.', 409);
        const p: Period = { type: old.reportType as AutoPeriod, key: old.periodKey, start: old.periodStart, end: new Date(old.periodEnd.getTime() + 1), title: old.title };
        const metrics = await buildInstitutionMetrics(p.start, p.end);
        const created = await createVersion(p, metrics, { id: old.id, version: old.version });
        await prisma.operationalReport.update({ where: { id: old.id }, data: { isOutdated: true } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'OperationalReport', entityId: created.id, diff: `Otomatik rapor yeni sürüm: ${old.periodKey} v${created.version}` });
        return created;
    },
};
