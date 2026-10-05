import { prisma } from '@/lib/prisma';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';

/**
 * Permission-aware global search used by Ctrl+K and record pickers. Only modules the user
 * may view are searched. Sensitive identity fields are never searched or returned.
 */
export type SearchResult = { id: string; type: string; category: string; title: string; subtitle?: string | null; url: string; email?: string | null };

export const SEARCH_TYPES = ['Person', 'Organization', 'Entrepreneur', 'Mentor', 'Application', 'Program', 'Form', 'Task', 'Facility', 'Reservation', 'RentContract', 'News', 'Project', 'Document'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

const PERMISSION: Record<SearchType, [string, string]> = {
    Person: ['view', 'persons'],
    Organization: ['view', 'persons'],
    Entrepreneur: ['view', 'entrepreneurs'],
    Mentor: ['view', 'mentors'],
    Application: ['view', 'applications'],
    Program: ['view', 'programs'],
    Form: ['view', 'forms'],
    Task: ['view', 'tasks'],
    Facility: ['view', 'facilities'],
    Reservation: ['view', 'reservations'],
    RentContract: ['view', 'rent'],
    News: ['view', 'news'],
    Project: ['view', 'projects'],
    Document: ['view', 'documents'],
};

export async function globalSearch(user: UserWithPermissions & { id: string }, query: string, types?: SearchType[], perType = 5): Promise<SearchResult[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const wanted = (types && types.length ? types : [...SEARCH_TYPES]).filter((t) => hasPermission(user, PERMISSION[t][0], PERMISSION[t][1]));
    const ci = { contains: q, mode: 'insensitive' as const };
    const take = Math.min(20, perType);
    const viewAllTasks = hasPermission(user, 'view_all', 'tasks');

    const jobs: Promise<SearchResult[]>[] = wanted.map(async (t) => {
        switch (t) {
            case 'Person':
                return (await prisma.person.findMany({ where: { status: { not: 'ARCHIVED' }, OR: [{ fullName: ci }, { email: ci }, { phone: ci }] }, take, select: { id: true, fullName: true, email: true, title: true } })).map((p) => ({ id: p.id, type: t, category: 'Kişi', title: p.fullName, subtitle: [p.title, p.email].filter(Boolean).join(' · ') || null, url: `/admin/rehber?personId=${p.id}`, email: p.email }));
            case 'Organization':
                return (await prisma.organization.findMany({ where: { OR: [{ name: ci }, { email: ci }] }, take, select: { id: true, name: true, email: true, sector: true } })).map((o) => ({ id: o.id, type: t, category: 'Kurum', title: o.name, subtitle: o.sector, url: `/admin/rehber?organizationId=${o.id}`, email: o.email }));
            case 'Entrepreneur':
                return (await prisma.entrepreneur.findMany({ where: { isArchived: false, OR: [{ name: ci }, { sector: ci }, { email: ci }] }, take, select: { id: true, name: true, sector: true, email: true } })).map((e) => ({ id: e.id, type: t, category: 'Girişim', title: e.name, subtitle: e.sector, url: `/admin/girisimciler/${e.id}`, email: e.email }));
            case 'Mentor':
                return (await prisma.mentor.findMany({ where: { isArchived: false, OR: [{ name: ci }, { surname: ci }, { company: ci }] }, take, select: { id: true, name: true, surname: true, company: true, email: true } })).map((m) => ({ id: m.id, type: t, category: 'Mentör', title: `${m.name} ${m.surname || ''}`.trim(), subtitle: m.company, url: `/admin/mentorler?id=${m.id}`, email: m.email }));
            case 'Application':
                return (await prisma.application.findMany({ where: { isArchived: false, OR: [{ applicationNumber: ci }, { applicantName: ci }, { companyName: ci }, { email: ci }] }, take, orderBy: { createdAt: 'desc' }, select: { id: true, applicationNumber: true, applicantName: true, companyName: true, email: true } })).map((a) => ({ id: a.id, type: t, category: 'Başvuru', title: `${a.applicationNumber} — ${a.applicantName}`, subtitle: a.companyName, url: `/admin/basvurular/${a.id}`, email: a.email }));
            case 'Program':
                return (await prisma.program.findMany({ where: { isArchived: false, name: ci }, take, select: { id: true, name: true } })).map((p) => ({ id: p.id, type: t, category: 'Program', title: p.name, url: '/admin/programlar' }));
            case 'Form':
                return (await prisma.form.findMany({ where: { isArchived: false, OR: [{ title: ci }, { slug: ci }] }, take, select: { id: true, title: true, slug: true } })).map((f) => ({ id: f.id, type: t, category: 'Form', title: f.title, subtitle: f.slug, url: `/admin/form-builder/${f.id}` }));
            case 'Task':
                return (await prisma.task.findMany({ where: { isArchived: false, title: ci, ...(viewAllTasks ? {} : { OR: [{ createdById: user.id }, { assignees: { some: { userId: user.id } } }] }) }, take, orderBy: { updatedAt: 'desc' }, select: { id: true, title: true, status: true } })).map((x) => ({ id: x.id, type: t, category: 'Görev', title: x.title, subtitle: x.status, url: `/admin/gorevler?taskId=${x.id}` }));
            case 'Facility':
                return (await prisma.facility.findMany({ where: { isActive: true, title: ci }, take, select: { id: true, title: true } })).map((f) => ({ id: f.id, type: t, category: 'Alan', title: f.title, url: '/admin/alanlar' }));
            case 'Reservation':
                return (await prisma.reservation.findMany({ where: { OR: [{ title: ci }, { requesterName: ci }, { requesterOrganization: ci }] }, take, orderBy: { startTime: 'desc' }, select: { id: true, title: true, requesterName: true, requesterEmail: true, startTime: true } })).map((r) => ({ id: r.id, type: t, category: 'Rezervasyon', title: r.title, subtitle: r.requesterName, url: '/admin/alanlar?tab=rezervasyonlar', email: r.requesterEmail }));
            case 'RentContract':
                return (await prisma.rentContract.findMany({ where: { OR: [{ contractNo: ci }, { spaceName: ci }, { entrepreneur: { name: ci } }] }, take, select: { id: true, contractNo: true, spaceName: true, contactEmail: true, entrepreneur: { select: { id: true, name: true } } } })).map((c) => ({ id: c.id, type: t, category: 'Kira sözleşmesi', title: `${c.contractNo} — ${c.entrepreneur.name}`, subtitle: c.spaceName, url: `/admin/girisimciler/${c.entrepreneur.id}/finans-kira`, email: c.contactEmail }));
            case 'News':
                return (await prisma.news.findMany({ where: { isArchived: false, OR: [{ title: ci }, { excerpt: ci }] }, take, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, status: true } })).map((n) => ({ id: n.id, type: t, category: 'Haber', title: n.title, subtitle: n.status, url: '/admin/haberler' }));
            case 'Project':
                return (await prisma.project.findMany({ where: { title: ci }, take, select: { id: true, title: true, status: true } })).map((p) => ({ id: p.id, type: t, category: 'Proje', title: p.title, subtitle: p.status, url: '/admin/projeler' }));
            case 'Document': {
                const restricted = hasPermission(user, 'view_restricted', 'documents');
                return (await prisma.document.findMany({ where: { isArchived: false, ...(restricted ? {} : { visibility: 'INTERNAL' }), title: ci }, take, select: { id: true, title: true, category: true } })).map((d) => ({ id: d.id, type: t, category: 'Doküman', title: d.title, subtitle: d.category, url: `/admin/dokumanlar?search=${encodeURIComponent(d.title)}` }));
            }
        }
    });
    const settled = await Promise.allSettled(jobs);
    return settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : []));
}
