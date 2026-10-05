import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { istanbulMonthRange, istanbulNow } from '@/lib/time';

type Item = { id: string; title: string; type: string; startDate: string; endDate?: string; location?: string; status?: string; priority?: string; description?: string; url?: string };

/**
 * Unified calendar. Each source is included only when the user may view that module:
 * tasks, trainings, events, activities, reservations, interaction follow-ups,
 * contract end dates and rent due dates.
 */
export async function GET(request: NextRequest) {
    const user = await getCurrentAdminUser();
    if (!user) return NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 });
    const can = (a: string, r: string) => hasPermission(user, a, r);

    try {
        const sp = request.nextUrl.searchParams;
        const now = istanbulNow();
        const defaultRange = { start: istanbulMonthRange(now.year, now.month).start, end: istanbulMonthRange(now.month === 12 ? now.year + 1 : now.year, now.month === 12 ? 1 : now.month + 1).end };
        const start = sp.get('startDate') ? new Date(String(sp.get('startDate'))) : defaultRange.start;
        const end = sp.get('endDate') ? new Date(String(sp.get('endDate'))) : defaultRange.end;
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start || end.getTime() - start.getTime() > 400 * 86400000) {
            return NextResponse.json({ success: false, message: 'Geçersiz tarih aralığı' }, { status: 400 });
        }
        const range = { gte: start, lt: end };
        const items: Item[] = [];
        const jobs: Promise<void>[] = [];

        if (can('view', 'tasks')) {
            const scope = can('view_all', 'tasks') ? {} : { OR: [{ createdById: user.id }, { assignees: { some: { userId: user.id } } }] };
            jobs.push(
                prisma.task.findMany({ where: { isArchived: false, dueDate: range, ...scope }, select: { id: true, title: true, dueDate: true, priority: true, status: true } }).then((rows) => {
                    for (const t of rows) items.push({ id: `task-${t.id}`, title: `Görev: ${t.title}`, type: 'TASK', startDate: t.dueDate!.toISOString(), priority: t.priority, status: t.status, url: `/admin/gorevler?taskId=${t.id}` });
                })
            );
        }
        if (can('view', 'trainings')) {
            jobs.push(
                prisma.training.findMany({ where: { startDate: range }, select: { id: true, title: true, startDate: true, endDate: true, location: true } }).then((rows) => {
                    for (const t of rows) items.push({ id: `training-${t.id}`, title: `Eğitim: ${t.title}`, type: 'TRAINING', startDate: t.startDate.toISOString(), endDate: t.endDate?.toISOString(), location: t.location || undefined, url: '/admin/programlar' });
                })
            );
        }
        if (can('view', 'events')) {
            jobs.push(
                prisma.event.findMany({ where: { startDate: range }, select: { id: true, title: true, startDate: true, endDate: true, location: true } }).then((rows) => {
                    for (const e of rows) items.push({ id: `event-${e.id}`, title: `Etkinlik: ${e.title}`, type: 'EVENT', startDate: e.startDate.toISOString(), endDate: e.endDate?.toISOString(), location: e.location || undefined, url: '/admin/etkinlikler' });
                })
            );
        }
        if (can('view', 'activities')) {
            jobs.push(
                prisma.corporateActivity.findMany({ where: { activityDate: range, status: { not: 'CANCELLED' } }, select: { id: true, title: true, activityDate: true, endDate: true, location: true } }).then((rows) => {
                    for (const a of rows) items.push({ id: `activity-${a.id}`, title: `Faaliyet: ${a.title}`, type: 'ACTIVITY', startDate: a.activityDate.toISOString(), endDate: a.endDate?.toISOString(), location: a.location || undefined, url: '/admin/faaliyetler' });
                })
            );
        }
        if (can('view', 'reservations')) {
            jobs.push(
                prisma.reservation.findMany({ where: { startTime: range, status: { in: ['CONFIRMED', 'PENDING_APPROVAL'] } }, select: { id: true, title: true, startTime: true, endTime: true, status: true, resource: { select: { name: true } } } }).then((rows) => {
                    for (const r of rows) items.push({ id: `reservation-${r.id}`, title: `${r.status === 'PENDING_APPROVAL' ? 'Talep' : 'Rezervasyon'}: ${r.title}`, type: 'RESERVATION', startDate: r.startTime.toISOString(), endDate: r.endTime.toISOString(), location: r.resource.name, status: r.status, url: '/admin/alanlar?tab=rezervasyonlar' });
                })
            );
        }
        if (can('view', 'interactions')) {
            jobs.push(
                prisma.dailyInteraction.findMany({ where: { followUpDate: range, ...(can('view_all', 'tasks') ? {} : { hostUserId: user.id }) }, select: { id: true, contactName: true, subject: true, followUpDate: true } }).then((rows) => {
                    for (const i of rows) items.push({ id: `followup-${i.id}`, title: `Takip: ${i.contactName} — ${i.subject}`, type: 'FOLLOW_UP', startDate: i.followUpDate!.toISOString(), url: '/admin/gorusmeler' });
                })
            );
        }
        if (can('view', 'rent')) {
            jobs.push(
                prisma.rentContract.findMany({ where: { status: 'ACTIVE', endDate: range }, select: { id: true, contractNo: true, endDate: true, entrepreneur: { select: { id: true, name: true } } } }).then((rows) => {
                    for (const c of rows) items.push({ id: `contract-${c.id}`, title: `Sözleşme bitişi: ${c.entrepreneur.name} (${c.contractNo})`, type: 'CONTRACT', startDate: c.endDate.toISOString(), url: `/admin/girisimciler/${c.entrepreneur.id}/finans-kira` });
                })
            );
            jobs.push(
                prisma.rentAccrual.findMany({ where: { dueDate: range, remainingAmount: { gt: 0 }, status: { notIn: ['PAID', 'WAIVED', 'CANCELLED'] } }, select: { id: true, periodLabel: true, dueDate: true, remainingAmount: true, currency: true, status: true, entrepreneur: { select: { id: true, name: true } } } }).then((rows) => {
                    for (const a of rows) items.push({ id: `rent-${a.id}`, title: `Kira vadesi: ${a.entrepreneur.name} — ${a.remainingAmount.toLocaleString('tr-TR')} ${a.currency}`, type: 'RENT', startDate: a.dueDate.toISOString(), status: a.status, description: a.periodLabel, url: `/admin/girisimciler/${a.entrepreneur.id}/finans-kira` });
                })
            );
        }

        await Promise.all(jobs);
        items.sort((a, b) => a.startDate.localeCompare(b.startDate));
        return NextResponse.json({ success: true, items, range: { start: start.toISOString(), end: end.toISOString() } });
    } catch (error) {
        console.error('Calendar error:', error);
        return NextResponse.json({ success: false, message: 'Takvim verileri alınamadı' }, { status: 500 });
    }
}
