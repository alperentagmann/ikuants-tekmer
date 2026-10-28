import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';
import { FacilityUnitService } from '@/lib/services/facility-unit-service';
import { PdksService } from '@/lib/services/pdks-service';
import { ParameterService } from '@/lib/services/parameter-service';
import { RenewalAlertService } from '@/lib/services/renewal-alert-service';

/**
 * Operasyon göstergeleri (yönetim paneli): doluluk, PDKS, sözleşmeler, trendler, aksiyon masası, girişim sağlığı.
 * Her blok gerçek veriden gelir; kullanıcının yetkisi olmayan blok `null` döner (arayüz göstermez).
 * Eşik / hedef parametresi tanımlı değilse ilgili değer `null` döner (uydurulmaz).
 */

type PermissionUser = Parameters<typeof hasPermission>[0] & { id: string };

export const ALLOWED_WINDOWS = [7, 14, 30, 60, 90] as const;
export function parseWindow(v: string | null): number {
    const n = Number(v);
    return (ALLOWED_WINDOWS as readonly number[]).includes(n) ? n : 30;
}

const DAY = 86400000;
const MONTH_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit' });
const monthKey = (d: Date) => MONTH_FMT.format(d).slice(0, 7);
const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
function lastMonths(n: number) {
    const now = new Date();
    return Array.from({ length: n }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 15);
        const key = monthKey(d);
        return { key, label: `${MONTHS_TR[Number(key.slice(5)) - 1]} ${key.slice(2, 4)}` };
    });
}
const daysUntil = (d: Date) => Math.ceil((+d - Date.now()) / DAY);

export async function getOperationsDashboard(user: PermissionUser, windowDays: number) {
    const can = (a: string, r: string) => hasPermission(user, a, r);
    const now = new Date();
    const windowEnd = new Date(+now + windowDays * DAY);
    const months12 = lastMonths(12);
    const months6 = lastMonths(6);
    const since12 = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const since30 = new Date(+now - 30 * DAY);

    const [renewal, unsigned] = await Promise.all([
        can('view', 'rent') || can('view', 'facilities') ? RenewalAlertService.scan() : null,
        can('view', 'rent') ? prisma.rentContract.count({ where: { status: 'ACTIVE', documents: { none: { documentType: 'SIGNED_CONTRACT' } } } }) : null,
    ]);
    const [occupancy, unlinked, expiringPolicies, pdks, pdksDaily, appRows, rentRows, rentContracts, expiringRent, expiringProjects, projectStatus, mentorMonth, approvals, health] = await Promise.all([
        can('view', 'facilities') ? FacilityUnitService.occupancySummary() : null,
        can('view', 'facilities') && can('view', 'rent') ? FacilityUnitService.unlinkedActiveAssignments() : null,
        can('view', 'facilities') ? FacilityUnitService.expiringPolicies(windowDays) : null,
        can('view', 'pdks') ? PdksService.onSiteNow() : null,
        can('view', 'pdks') ? PdksService.dailyEntries(14) : null,
        can('view', 'applications') ? prisma.application.findMany({ where: { createdAt: { gte: since12 } }, select: { createdAt: true, applicationType: true } }) : null,
        can('view', 'rent') ? prisma.rentAccrual.findMany({ where: { dueDate: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1), lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) }, status: { notIn: ['CANCELLED', 'WAIVED'] } }, select: { dueDate: true, totalDue: true, paidAmount: true, currency: true } }) : null,
        can('view', 'rent') ? prisma.rentContract.groupBy({ by: ['status'], _count: { _all: true } }) : null,
        can('view', 'rent') ? prisma.rentContract.findMany({ where: { status: 'ACTIVE', endDate: { gte: now, lte: windowEnd } }, orderBy: { endDate: 'asc' }, take: 20, select: { id: true, contractNo: true, spaceName: true, endDate: true, autoRenew: true, entrepreneur: { select: { name: true } } } }) : null,
        can('view', 'projects') ? prisma.project.findMany({ where: { status: { in: ['APPROVED', 'ACTIVE'] }, endDate: { gte: now, lte: windowEnd } }, orderBy: { endDate: 'asc' }, take: 20, select: { id: true, title: true, endDate: true, entrepreneur: { select: { name: true } } } }) : null,
        can('view', 'projects') ? prisma.project.groupBy({ by: ['status'], _count: { _all: true } }) : null,
        can('view', 'mentors') ? prisma.mentorSession.findMany({ where: { status: 'COMPLETED', sessionDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } }, select: { durationMinutes: true, feedbackRating: true } }) : null,
        prisma.workflowApproval.count({ where: { status: 'PENDING', OR: [{ reviewerId: user.id }, { reviewerId: null }] } }).catch(() => null),
        can('view', 'entrepreneurs') ? entrepreneurHealth(can('view', 'pdks'), can('view', 'mentors'), since30) : null,
    ]);

    const applicationsTrend = appRows ? months12.map((m) => ({ ...m, count: appRows.filter((a) => monthKey(a.createdAt) === m.key).length })) : null;
    const applicationTypes = appRows ? Object.entries(appRows.reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.applicationType]: (acc[a.applicationType] ?? 0) + 1 }), {})).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count) : null;
    // Kira: yalnız TRY toplanır; diğer para birimleri ayrıca sayılır (kur çevirisi yapılmaz)
    const rentTrend = rentRows ? months6.map((m) => {
        const rows = rentRows.filter((r) => monthKey(r.dueDate) === m.key && r.currency === 'TRY');
        return { ...m, accrued: Math.round(rows.reduce((s, r) => s + r.totalDue, 0)), collected: Math.round(rows.reduce((s, r) => s + Math.min(r.paidAmount, r.totalDue), 0)) };
    }) : null;
    const otherCurrencyAccruals = rentRows ? rentRows.filter((r) => r.currency !== 'TRY').length : 0;
    const monthTotals = mentorMonth ? { sessions: mentorMonth.length, hours: Math.round((mentorMonth.reduce((s, x) => s + x.durationMinutes, 0) / 60) * 10) / 10, avgRating: (() => { const r = mentorMonth.filter((x) => typeof x.feedbackRating === 'number'); return r.length ? Math.round((r.reduce((s, x) => s + (x.feedbackRating ?? 0), 0) / r.length) * 10) / 10 : null; })(), targetHours: await ParameterService.getNumberOrNull('MENTORING', 'monthly_target_hours') } : null;

    return {
        generatedAt: now.toISOString(),
        windowDays,
        kpis: {
            occupancy: occupancy && { byAreaPct: occupancy.byAreaPct, byCountPct: occupancy.byCountPct, occupiedUnits: occupancy.occupiedUnits, rentableUnits: occupancy.rentableUnits, available: occupancy.available, desks: occupancy.desks, offices: occupancy.offices },
            onSite: pdks && { total: pdks.total, staff: pdks.staff, members: pdks.members, visitors: pdks.visitors, entriesToday: pdks.entriesToday },
            contracts: rentContracts && { active: rentContracts.find((c) => c.status === 'ACTIVE')?._count._all ?? 0, total: rentContracts.reduce((s, c) => s + c._count._all, 0), unlinkedAssignments: unlinked, unsigned },
            expiring: { rent: expiringRent?.length ?? null, policies: expiringPolicies?.length ?? null, projects: expiringProjects?.length ?? null },
            approvals,
        },
        charts: {
            applicationsTrend, applicationTypes,
            occupancyByBuilding: occupancy?.buildings ?? null,
            pdksDaily,
            rentTrend, otherCurrencyAccruals,
            projectStatus: projectStatus?.map((p) => ({ status: p.status, count: p._count._all })) ?? null,
        },
        actionDesk: {
            expiringRent: expiringRent?.map((c) => ({ id: c.id, title: c.entrepreneur.name, detail: `${c.contractNo} · ${c.spaceName}${c.autoRenew ? ' · otomatik yenilenir' : ''}`, endDate: c.endDate, daysLeft: daysUntil(c.endDate), href: `/admin/finans/kiralar?contract=${c.id}` })) ?? null,
            expiringPolicies: expiringPolicies?.slice(0, 20).map((p) => ({ id: p.id, title: p.targetLabel, detail: `${p.policyTypeLabel} · ${p.insurer} · ${p.policyNo}`, endDate: p.endDate, daysLeft: p.daysLeft, href: '/admin/alan-yonetimi/policeler' })) ?? null,
            expiringProjects: expiringProjects?.map((p) => ({ id: p.id, title: p.title, detail: p.entrepreneur?.name ?? '', endDate: p.endDate!, daysLeft: daysUntil(p.endDate!), href: `/admin/projeler?id=${p.id}` })) ?? null,
        },
        renewal: renewal && {
            criticalDays: renewal.criticalDays,
            items: [...renewal.overdue, ...renewal.critical].filter((r) => (r.kind === 'RENT' ? can('view', 'rent') : can('view', 'facilities'))).map((r) => ({ ...r, endDate: r.endDate.toISOString() })),
        },
        mentoring: monthTotals,
        health,
    };
}

/** Girişim sağlığı: son 30 gün ofis girişi (PDKS) ve mentörlük saati; eşikler parametreden. */
async function entrepreneurHealth(withPdks: boolean, withMentors: boolean, since30: Date) {
    const [rows, entries, minEntries, minHours] = await Promise.all([
        prisma.entrepreneur.findMany({
            where: { isArchived: false, status: 'ACTIVE' }, orderBy: { name: 'asc' }, take: 200,
            select: { id: true, name: true, ...(withMentors ? { mentorSessions: { where: { status: 'COMPLETED', sessionDate: { gte: since30 } }, select: { durationMinutes: true } } } : {}) },
        }),
        withPdks ? PdksService.entriesByEntrepreneur(30) : Promise.resolve(null),
        ParameterService.getNumberOrNull('MENTORING', 'health_min_entries_30d'),
        ParameterService.getNumberOrNull('MENTORING', 'health_min_mentor_hours_30d'),
    ]);
    const thresholdsSet = minEntries !== null || minHours !== null;
    return {
        thresholds: { minEntries, minHours },
        rows: rows.map((e) => {
            const sessions = (e as { mentorSessions?: { durationMinutes: number }[] }).mentorSessions;
            const mentorHours = sessions ? Math.round((sessions.reduce((s, x) => s + x.durationMinutes, 0) / 60) * 10) / 10 : null;
            const officeEntries = entries ? entries.get(e.id) ?? 0 : null;
            const checks = [minEntries !== null && officeEntries !== null ? officeEntries >= minEntries : null, minHours !== null && mentorHours !== null ? mentorHours >= minHours : null].filter((x) => x !== null);
            const status = !thresholdsSet || !checks.length ? null : checks.every(Boolean) ? 'HEALTHY' : checks.some(Boolean) ? 'WATCH' : 'RISK';
            return { id: e.id, name: e.name, officeEntries, mentorHours, status };
        }),
    };
}

export type OperationsDashboard = Awaited<ReturnType<typeof getOperationsDashboard>>;
