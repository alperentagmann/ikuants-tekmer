import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { getCampaignStages } from '@/lib/services/application-campaign-service';
import { istanbulDayKey, istanbulDayRange } from '@/lib/time';
import { WorkTeamService } from '@/lib/services/work-team-service';
import { MACHINE_QUOTE_FORM_SLUG } from '@/lib/machines';

type Attention = { key: string; title: string; href: string; severity: 'high' | 'medium' | 'low'; count: number };

/**
 * Role-aware operational dashboard. Every block is computed from live data and only
 * for modules the current user is allowed to see; nothing is estimated or hardcoded.
 */
export async function GET() {
    const user = await getCurrentAdminUser();
    if (!user) return NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 });
    const can = (action: string, resource: string) => hasPermission(user, action, resource);

    try {
        const now = new Date();
        const today = istanbulDayRange(istanbulDayKey(now));
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        const in30Days = new Date(now.getTime() + 30 * 86400000);
        const attention: Attention[] = [];
        const result: Record<string, unknown> = { generatedAt: now.toISOString() };

        if (can('view', 'tasks')) {
            const mine = { isArchived: false, assignees: { some: { userId: user.id } }, status: { notIn: ['DONE', 'CANCELLED'] } };
            const [open, overdue, dueToday, awaitingMyReview, myTasks] = await Promise.all([
                prisma.task.count({ where: mine }),
                prisma.task.count({ where: { ...mine, dueDate: { lt: today.start } } }),
                prisma.task.count({ where: { ...mine, dueDate: { gte: today.start, lt: today.end } } }),
                prisma.task.count({ where: { isArchived: false, status: 'IN_REVIEW', createdById: user.id } }),
                prisma.task.findMany({ where: mine, orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }], take: 6, select: { id: true, title: true, status: true, priority: true, dueDate: true } }),
            ]);
            result.tasks = { open, overdue, dueToday, awaitingMyReview, items: myTasks };
            if (overdue) attention.push({ key: 'tasks-overdue', title: `${overdue} görevinizin termini geçti`, href: '/admin/gorevler?scope=overdue', severity: 'high', count: overdue });
            if (awaitingMyReview) attention.push({ key: 'tasks-review', title: `${awaitingMyReview} görev kontrolünüzü bekliyor`, href: '/admin/gorevler?scope=created&status=IN_REVIEW', severity: 'medium', count: awaitingMyReview });
        }

        if (can('view', 'applications')) {
            const apps = await prisma.application.findMany({
                where: { isArchived: false },
                select: { id: true, applicationNumber: true, applicantName: true, companyName: true, applicationType: true, status: true, createdAt: true, campaign: { select: { name: true, workflowStages: true, applicationType: true } }, program: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
            });
            const isPending = (a: (typeof apps)[number]) => {
                const stage = getCampaignStages(a.campaign).find((s) => s.key === a.status);
                return stage ? !stage.isTerminal && !stage.outcome : !['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(a.status);
            };
            const funnel: Record<string, number> = { NEW: 0, IN_REVIEW: 0, ACCEPTED: 0, REJECTED: 0 };
            for (const a of apps) {
                const stage = getCampaignStages(a.campaign).find((s) => s.key === a.status);
                if (a.status === 'NEW') funnel.NEW++;
                else if (stage?.outcome === 'ACCEPTED' || a.status === 'ACCEPTED') funnel.ACCEPTED++;
                else if (stage?.outcome === 'REJECTED' || a.status === 'REJECTED') funnel.REJECTED++;
                else if (isPending(a)) funnel.IN_REVIEW++;
            }
            const pendingProgram = apps.filter((a) => a.applicationType === 'PROGRAM' && isPending(a)).length;
            const pendingTekmer = apps.filter((a) => a.applicationType === 'TEKMER' && isPending(a)).length;
            const lastWeek = apps.filter((a) => a.createdAt >= weekAgo).length;
            result.applications = {
                total: apps.length,
                pendingProgram,
                pendingTekmer,
                pendingOther: apps.filter((a) => !['PROGRAM', 'TEKMER'].includes(a.applicationType) && isPending(a)).length,
                lastWeek,
                funnel,
                recent: apps.slice(0, 6).map((a) => ({ id: a.id, number: a.applicationNumber, applicantName: a.applicantName, companyName: a.companyName, type: a.applicationType, context: a.campaign?.name || a.program?.name || null, status: getCampaignStages(a.campaign).find((s) => s.key === a.status)?.label || a.status, createdAt: a.createdAt })),
            };
            if (funnel.NEW) attention.push({ key: 'apps-new', title: `${funnel.NEW} yeni başvuru ön inceleme bekliyor`, href: '/admin/basvurular?status=NEW', severity: 'high', count: funnel.NEW });
        }

        if (can('view', 'entrepreneurs')) {
            const [total, active, withoutProgram] = await Promise.all([
                prisma.entrepreneur.count({ where: { isArchived: false } }),
                prisma.entrepreneur.count({ where: { isArchived: false, status: 'ACTIVE' } }),
                prisma.entrepreneur.count({ where: { isArchived: false, programAssignments: { none: { status: { notIn: ['WITHDRAWN', 'REJECTED', 'COMPLETED'] } } } } }),
            ]);
            result.entrepreneurs = { total, active, withoutProgram };
        }

        if (can('view', 'mentors')) {
            const [total, active, withoutPhoto] = await Promise.all([
                prisma.mentor.count({ where: { isArchived: false } }),
                prisma.mentor.count({ where: { isArchived: false, isActive: true } }),
                prisma.mentor.count({ where: { isArchived: false, imageUrl: null } }),
            ]);
            result.mentors = { total, active };
            if (withoutPhoto) attention.push({ key: 'mentor-photo', title: `${withoutPhoto} mentörün profil fotoğrafı eksik`, href: '/admin/mentorler', severity: 'low', count: withoutPhoto });
        }

        if (can('view', 'programs')) {
            const [total, open] = await Promise.all([prisma.program.count({ where: { isArchived: false } }), prisma.program.count({ where: { isArchived: false, applyStatus: 'OPEN' } })]);
            result.programs = { total, open };
        }

        if (can('view', 'rent')) {
            const [activeContracts, overdue, expiring] = await Promise.all([
                prisma.rentContract.count({ where: { status: 'ACTIVE' } }),
                prisma.rentAccrual.findMany({ where: { remainingAmount: { gt: 0 }, dueDate: { lt: now }, status: { notIn: ['PAID', 'WAIVED', 'CANCELLED'] } }, select: { remainingAmount: true, currency: true } }),
                prisma.rentContract.count({ where: { status: 'ACTIVE', endDate: { gte: now, lte: in30Days } } }),
            ]);
            // Amounts in different currencies are reported separately, never summed together
            const overdueByCurrency = overdue.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.currency]: (acc[r.currency] || 0) + r.remainingAmount }), {});
            result.rent = { activeContracts, overdueCount: overdue.length, overdueByCurrency, expiringContracts: expiring };
            if (overdue.length) attention.push({ key: 'rent-overdue', title: `${overdue.length} kira tahakkuku gecikmede`, href: '/admin/finans/kiralar', severity: 'high', count: overdue.length });
            if (expiring) attention.push({ key: 'contracts-expiring', title: `${expiring} sözleşme 30 gün içinde bitiyor`, href: '/admin/finans/kiralar', severity: 'medium', count: expiring });
        }

        // Work OS: passes waiting for me and team load
        if (can('view', 'tasks')) {
            const [pendingPasses, teams] = await Promise.all([prisma.taskHandoff.count({ where: { toUserId: user.id, status: 'PENDING' } }), WorkTeamService.list()]);
            result.work = { pendingPasses, teams: teams.map((t) => ({ id: t.id, name: t.name, color: t.color, members: t.members.length, openTasks: t.openTasks, overdueTasks: t.overdueTasks, doneLast30: t.doneLast30 })) };
            if (pendingPasses) attention.push({ key: 'handoffs', title: `${pendingPasses} iş size paslandı, yanıt bekliyor`, href: '/admin/is-takip?tab=inbox', severity: 'high', count: pendingPasses });
        }

        if (can('view', 'finance')) {
            const open = await prisma.salesInvoice.findMany({ where: { status: { in: ['ISSUED', 'PARTIALLY_PAID'] } }, select: { grandTotal: true, paidAmount: true, dueDate: true, currency: true } });
            const tryOpen = open.filter((i) => i.currency === 'TRY');
            const overdueInvoices = tryOpen.filter((i) => i.dueDate && i.dueDate < now);
            result.finance = {
                receivable: Math.round(tryOpen.reduce((a, i) => a + i.grandTotal - i.paidAmount, 0) * 100) / 100,
                overdue: Math.round(overdueInvoices.reduce((a, i) => a + i.grandTotal - i.paidAmount, 0) * 100) / 100,
                overdueCount: overdueInvoices.length,
                drafts: await prisma.salesInvoice.count({ where: { status: 'DRAFT' } }),
            };
            if (overdueInvoices.length) attention.push({ key: 'invoices-overdue', title: `${overdueInvoices.length} satış faturasının vadesi geçti`, href: '/admin/muhasebe', severity: 'high', count: overdueInvoices.length });
        }

        if (can('view', 'forms') || can('view', 'reservations')) {
            const quoteForm = await prisma.form.findUnique({ where: { slug: MACHINE_QUOTE_FORM_SLUG }, select: { id: true } });
            const quotes = quoteForm ? await prisma.submission.count({ where: { status: 'SUBMITTED', formId: quoteForm.id } }) : 0;
            result.quotes = { pending: quotes };
            if (quotes && quoteForm) attention.push({ key: 'machine-quotes', title: `${quotes} makine fiyat teklifi talebi bekliyor`, href: `/admin/form-builder/${quoteForm.id}?tab=submissions`, severity: 'medium', count: quotes });
        }

        if (can('view', 'integrations')) {
            const failing = await prisma.integrationConnection.count({ where: { status: 'ERROR' } });
            if (failing) attention.push({ key: 'integrations', title: `${failing} entegrasyon bağlantısında hata var`, href: '/admin/entegrasyon-merkezi', severity: 'medium', count: failing });
        }

        if (can('view', 'reservations')) {
            const [pending, todayCount] = await Promise.all([
                prisma.reservation.count({ where: { status: 'PENDING_APPROVAL' } }),
                prisma.reservation.count({ where: { status: 'CONFIRMED', startTime: { gte: today.start, lt: today.end } } }),
            ]);
            result.reservations = { pending, today: todayCount };
            if (pending) attention.push({ key: 'reservations', title: `${pending} rezervasyon talebi onay bekliyor`, href: '/admin/alanlar?tab=rezervasyonlar', severity: 'medium', count: pending });
        }

        if (can('view', 'contacts')) {
            const [total, newCount] = await Promise.all([prisma.contactRequest.count({ where: { isArchived: false } }), prisma.contactRequest.count({ where: { isArchived: false, status: 'NEW' } })]);
            result.contacts = { total, new: newCount };
            if (newCount) attention.push({ key: 'contacts', title: `${newCount} iletişim talebi yanıt bekliyor`, href: '/admin/iletisim', severity: 'high', count: newCount });
        }

        if (can('view', 'forms')) {
            result.forms = { submissionsLastWeek: await prisma.submission.count({ where: { createdAt: { gte: weekAgo } } }) };
        }

        if (can('view', 'news')) {
            const [drafts, recent] = await Promise.all([
                prisma.news.count({ where: { isArchived: false, status: 'DRAFT' } }),
                prisma.news.findMany({ where: { isArchived: false }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, status: true, createdAt: true } }),
            ]);
            result.news = { drafts, recent };
            if (drafts) attention.push({ key: 'news-drafts', title: `${drafts} haber taslak aşamasında`, href: '/admin/haberler', severity: 'low', count: drafts });
        }

        if (can('manage', 'email_outbox')) {
            const [pending, failed] = await Promise.all([prisma.emailOutbox.count({ where: { status: 'PENDING' } }), prisma.emailOutbox.count({ where: { status: 'FAILED' } })]);
            result.email = { pending, failed };
            if (failed) attention.push({ key: 'email-failed', title: `${failed} e-posta gönderilemedi`, href: '/admin/eposta-merkezi?tab=failed', severity: 'medium', count: failed });
        }

        if (can('view', 'audit_logs')) {
            result.auditLogs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, action: true, entityType: true, actorName: true, actorEmail: true, createdAt: true } });
        }

        const order = { high: 0, medium: 1, low: 2 };
        result.attention = attention.sort((a, b) => order[a.severity] - order[b.severity]);
        result.user = { name: user.name, isSuperAdmin: user.isSuperAdmin };
        result.canUseAi = can('use', 'ai');
        result.shortcuts = {
            createEntrepreneur: can('create', 'entrepreneurs'),
            createMentor: can('create', 'mentors'),
            createNews: can('create', 'news'),
            createTask: can('create', 'tasks'),
            rent: can('view', 'rent'),
            forms: can('view', 'forms'),
        };
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ success: false, message: 'Veriler alınamadı' }, { status: 500 });
    }
}
