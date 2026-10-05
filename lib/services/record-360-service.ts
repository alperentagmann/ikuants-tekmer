import { prisma } from '@/lib/prisma';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';
import { DomainError } from '@/lib/errors';

/**
 * 360° view of a person or organization: every related record the viewer may see,
 * with links to the owning module. Identity numbers are never returned unmasked.
 */
export type Related = { id: string; title: string; subtitle?: string | null; status?: string | null; date?: Date | string | null; href: string };
export type Record360 = {
    type: 'Person' | 'Organization';
    id: string;
    title: string;
    subtitle: string | null;
    email: string | null;
    phone: string | null;
    facts: { label: string; value: string }[];
    sections: { key: string; label: string; items: Related[] }[];
};

export async function getRecord360(user: UserWithPermissions & { id: string }, type: string, id: string): Promise<Record360> {
    const can = (a: string, r: string) => hasPermission(user, a, r);
    if (!can('view', 'persons')) throw new DomainError('Bu işlem için yetkiniz yok', 403);
    const sections: Record360['sections'] = [];
    const add = (key: string, label: string, items: Related[]) => {
        if (items.length) sections.push({ key, label, items });
    };
    const taskScope = can('view_all', 'tasks') ? {} : { OR: [{ createdById: user.id }, { assignees: { some: { userId: user.id } } }] };

    if (type === 'Person') {
        const p = await prisma.person.findUnique({
            where: { id },
            include: {
                memberships: { include: { organization: { select: { id: true, name: true } } }, orderBy: { isPrimaryContact: 'desc' } },
                founders: { include: { entrepreneur: { select: { id: true, name: true, status: true } } } },
                mentors: { select: { id: true, name: true, surname: true, isActive: true } },
            },
        });
        if (!p) throw new DomainError('Kişi bulunamadı', 404);
        add('organizations', 'Kurumlar', p.memberships.map((m) => ({ id: m.organization.id, title: m.organization.name, subtitle: [m.position, m.role].filter(Boolean).join(' · '), status: m.status, href: `/admin/rehber?organizationId=${m.organization.id}` })));
        if (can('view', 'entrepreneurs')) add('entrepreneurs', 'Girişimler', p.founders.map((f) => ({ id: f.entrepreneur.id, title: f.entrepreneur.name, subtitle: f.title || 'Kurucu', status: f.entrepreneur.status, href: `/admin/girisimciler/${f.entrepreneur.id}` })));
        if (can('view', 'mentors')) add('mentors', 'Mentör profili', p.mentors.map((m) => ({ id: m.id, title: `${m.name} ${m.surname || ''}`.trim(), status: m.isActive ? 'Aktif' : 'Pasif', href: `/admin/mentorler?id=${m.id}` })));
        await addCommon('personId', id, p.email);
        return {
            type: 'Person',
            id: p.id,
            title: p.fullName,
            subtitle: p.title,
            email: p.email,
            phone: p.phone,
            facts: [
                { label: 'Durum', value: p.status },
                { label: 'T.C. kimlik', value: p.tcNumberMasked || (p.tcNumberEncrypted ? 'Kayıtlı (maskeli)' : 'Girilmemiş') },
                { label: 'Kayıt', value: p.createdAt.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }) },
            ],
            sections,
        };
    }

    if (type === 'Organization') {
        const o = await prisma.organization.findUnique({
            where: { id },
            include: {
                memberships: { include: { person: { select: { id: true, fullName: true, email: true } } }, where: { status: 'ACTIVE' } },
                entrepreneurs: { include: { entrepreneur: { select: { id: true, name: true, status: true } } } },
            },
        });
        if (!o) throw new DomainError('Kurum bulunamadı', 404);
        add('people', 'Kişiler', o.memberships.map((m) => ({ id: m.person.id, title: m.person.fullName, subtitle: [m.position, m.role, m.isFinanceContact ? 'Finans yetkilisi' : null].filter(Boolean).join(' · '), href: `/admin/rehber?personId=${m.person.id}` })));
        if (can('view', 'entrepreneurs')) add('entrepreneurs', 'Girişimler', o.entrepreneurs.map((e) => ({ id: e.entrepreneur.id, title: e.entrepreneur.name, subtitle: e.relationType, status: e.entrepreneur.status, href: `/admin/girisimciler/${e.entrepreneur.id}` })));
        if (can('view', 'rent')) {
            const contracts = await prisma.rentContract.findMany({ where: { organizationId: id }, select: { id: true, contractNo: true, spaceName: true, status: true, endDate: true, entrepreneurId: true } });
            add('contracts', 'Kira sözleşmeleri', contracts.map((c) => ({ id: c.id, title: c.contractNo, subtitle: c.spaceName, status: c.status, date: c.endDate, href: `/admin/girisimciler/${c.entrepreneurId}/finans-kira` })));
        }
        if (can('view', 'projects')) {
            const projects = await prisma.project.findMany({ where: { organizationId: id }, select: { id: true, title: true, status: true } });
            add('projects', 'Projeler', projects.map((p) => ({ id: p.id, title: p.title, status: p.status, href: '/admin/projeler' })));
        }
        await addCommon('organizationId', id, o.email);
        return {
            type: 'Organization',
            id: o.id,
            title: o.name,
            subtitle: o.sector,
            email: o.email,
            phone: o.phone,
            facts: [
                { label: 'Tür', value: o.orgType || '—' },
                { label: 'Vergi no', value: o.taxNumber || 'Girilmemiş' },
                { label: 'Kayıt', value: o.createdAt.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }) },
            ],
            sections,
        };
    }
    throw new DomainError('Geçersiz kayıt türü');

    async function addCommon(field: 'personId' | 'organizationId', recordId: string, email: string | null) {
        const where = { [field]: recordId };
        const jobs: Promise<void>[] = [];
        if (can('view', 'applications')) {
            jobs.push(prisma.application.findMany({ where: { ...where, isArchived: false }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, applicationNumber: true, applicationType: true, status: true, createdAt: true, campaign: { select: { name: true } } } }).then((rows) => add('applications', 'Başvurular', rows.map((a) => ({ id: a.id, title: a.applicationNumber, subtitle: a.campaign?.name || a.applicationType, status: a.status, date: a.createdAt, href: `/admin/basvurular/${a.id}` })))));
        }
        if (can('view', 'tasks')) {
            jobs.push(prisma.task.findMany({ where: { ...where, isArchived: false, ...taskScope }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, title: true, status: true, dueDate: true } }).then((rows) => add('tasks', 'Görevler', rows.map((t) => ({ id: t.id, title: t.title, status: t.status, date: t.dueDate, href: `/admin/gorevler?taskId=${t.id}` })))));
        }
        if (can('view', 'reservations')) {
            jobs.push(prisma.reservation.findMany({ where, orderBy: { startTime: 'desc' }, take: 20, select: { id: true, title: true, status: true, startTime: true, resource: { select: { name: true } } } }).then((rows) => add('reservations', 'Rezervasyonlar', rows.map((r) => ({ id: r.id, title: r.title, subtitle: r.resource.name, status: r.status, date: r.startTime, href: '/admin/alanlar?tab=rezervasyonlar' })))));
        }
        if (can('view', 'forms') || can('view', 'applications')) {
            jobs.push(prisma.submission.findMany({ where, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, submissionNumber: true, status: true, createdAt: true, form: { select: { id: true, title: true } } } }).then((rows) => add('submissions', 'Form gönderimleri', rows.map((s) => ({ id: s.id, title: s.form?.title || s.submissionNumber, subtitle: s.submissionNumber, status: s.status, date: s.createdAt, href: s.form ? `/admin/form-builder/${s.form.id}?tab=submissions` : '/admin/form-builder' })))));
        }
        if (field === 'organizationId' && can('view', 'facilities')) {
            jobs.push(prisma.spaceAssignment.findMany({ where: { organizationId: recordId }, orderBy: { createdAt: 'desc' }, select: { id: true, status: true, startDate: true, facility: { select: { title: true } } } }).then((rows) => add('spaces', 'Alan tahsisleri', rows.map((s) => ({ id: s.id, title: s.facility.title, status: s.status, date: s.startDate, href: '/admin/alanlar?tab=tahsisler' })))));
        }
        if (can('view', 'documents')) {
            const restricted = can('view_restricted', 'documents');
            jobs.push(prisma.document.findMany({ where: { entityType: field === 'personId' ? 'Person' : 'Organization', entityId: recordId, isArchived: false, ...(restricted ? {} : { visibility: 'INTERNAL' }) }, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, category: true, createdAt: true } }).then((rows) => add('documents', 'Dokümanlar', rows.map((d) => ({ id: d.id, title: d.title, subtitle: d.category, date: d.createdAt, href: `/admin/dokumanlar?entityType=${field === 'personId' ? 'Person' : 'Organization'}&entityId=${recordId}` })))));
        }
        if (email && can('manage', 'email_outbox')) {
            jobs.push(prisma.emailOutbox.findMany({ where: { recipientEmail: email.toLowerCase(), status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, subject: true, status: true, createdAt: true } }).then((rows) => add('emails', 'E-postalar', rows.map((e) => ({ id: e.id, title: e.subject, status: e.status, date: e.createdAt, href: `/admin/eposta-merkezi?tab=${e.status === 'DRAFT' ? 'drafts' : e.status === 'SENT' ? 'sent' : 'outbox'}` })))));
        }
        await Promise.all(jobs);
    }
}
