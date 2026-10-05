import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { DomainError } from '@/lib/errors';
import { TaskService } from '@/lib/services/task-service';
import { TaskWorkflowService } from '@/lib/services/task-workflow-service';
import { FormService } from '@/lib/services/form-service';
import { ApplicationService } from '@/lib/services/application-service';
import { getCampaignStages } from '@/lib/services/application-campaign-service';
import { EntrepreneurProgramService } from '@/lib/services/entrepreneur-program-service';
import { SpaceReservationService, toIstanbulDate, formatIstanbul } from '@/lib/services/space-reservation-service';
import { getFieldTypeMeta, normalizeFieldType, slugifyFieldKey, FIELD_TYPES } from '@/lib/forms/schema';
import type { AiActionDefinition, ActionContext, EntityRef, ResultCard } from './types';
import { LEGACY_ACTIONS } from './legacy-actions';

const trDate = (d: Date | null | undefined) => (d ? formatIstanbul(d, { dateStyle: 'medium' }) : '—');
const money = (n: number, currency: string) => `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

/** Resolves a form by free text: campaign name, program name, form title or slug. */
async function findForm(query: string | undefined, ctx: ActionContext) {
    if (!query && ctx.context.entityType === 'Form' && ctx.context.entityId) {
        return prisma.form.findUnique({ where: { id: ctx.context.entityId } });
    }
    const q = (query || '').trim();
    if (!q) return null;
    const lower = q.toLocaleLowerCase('tr');
    if (lower.includes('tekmer') && !lower.includes('program')) {
        const c = await prisma.applicationCampaign.findFirst({ where: { applicationType: 'TEKMER', formId: { not: null }, status: { not: 'ARCHIVED' } }, orderBy: { createdAt: 'desc' } });
        if (c?.formId) return prisma.form.findUnique({ where: { id: c.formId } });
    }
    const campaign = await prisma.applicationCampaign.findFirst({
        where: { formId: { not: null }, OR: [{ name: { contains: q, mode: 'insensitive' } }, { program: { name: { contains: q, mode: 'insensitive' } } }] },
    });
    if (campaign?.formId) return prisma.form.findUnique({ where: { id: campaign.formId } });
    return prisma.form.findFirst({ where: { isArchived: false, OR: [{ title: { contains: q, mode: 'insensitive' } }, { slug: { contains: slugifyFieldKey(q).replace(/_/g, '-'), mode: 'insensitive' } }] } });
}

async function resolveEntrepreneur(name: string | undefined, ctx: ActionContext) {
    if (ctx.context.entityType === 'Entrepreneur' && ctx.context.entityId && !name) return prisma.entrepreneur.findUnique({ where: { id: ctx.context.entityId } });
    if (ctx.context.lastEntity?.type === 'Entrepreneur' && !name) return prisma.entrepreneur.findUnique({ where: { id: ctx.context.lastEntity.id } });
    if (!name) return null;
    const matches = await prisma.entrepreneur.findMany({ where: { name: { contains: name, mode: 'insensitive' }, isArchived: false }, take: 3 });
    if (matches.length > 1) throw new DomainError(`"${name}" için birden fazla girişim bulundu: ${matches.map((m) => m.name).join(', ')}. Lütfen tam adı yazın.`);
    return matches[0] || null;
}

function contextRelation(ctx: ActionContext): { field: string; id: string; label: string } | null {
    const t = ctx.context.entityType || ctx.context.lastEntity?.type;
    const id = ctx.context.entityId || ctx.context.lastEntity?.id;
    if (!t || !id) return null;
    const map: Record<string, string> = { Application: 'applicationId', Entrepreneur: 'entrepreneurId', Person: 'personId', Organization: 'organizationId', Program: 'programId', Project: 'projectId', Reservation: 'reservationId', RentContract: 'rentContractId' };
    return map[t] ? { field: map[t], id, label: ctx.context.lastEntity?.label || t } : null;
}

const pendingStages = (stages: { key: string; outcome?: string | null; isTerminal?: boolean }[]) => stages.filter((s) => !s.isTerminal && !s.outcome).map((s) => s.key);

// ---------------------------------------------------------------------------
// READ / SEARCH / ANALYZE
// ---------------------------------------------------------------------------

const tasksToday: AiActionDefinition<{ scope?: 'today' | 'overdue' }> = {
    id: 'tasks.today',
    name: 'Bugünkü işlerim',
    description: 'Bana atanan, bugün termini olan, geciken veya devam eden görevler.',
    domain: 'TASK',
    kind: 'READ',
    permission: ['view', 'tasks'],
    risk: 'LOW',
    input: z.object({ scope: z.enum(['today', 'overdue']).optional() }),
    examples: ['Bugünkü işlerim', 'Geciken görevlerim'],
    async execute(input, { actor }) {
        const startOfDay = toIstanbulDate(new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }), '00:00');
        const endOfDay = new Date(startOfDay.getTime() + 86400000);
        const tasks = await prisma.task.findMany({
            where: {
                isArchived: false,
                status: { notIn: ['DONE', 'CANCELLED'] },
                assignees: { some: { userId: actor.id } },
                ...(input.scope === 'overdue' ? { dueDate: { lt: startOfDay } } : { OR: [{ dueDate: { lt: endOfDay } }, { status: 'IN_PROGRESS' }] }),
            },
            orderBy: [{ dueDate: 'asc' }],
            take: 50,
        });
        return {
            card: {
                title: input.scope === 'overdue' ? 'Geciken görevleriniz' : 'Bugünkü işleriniz',
                status: tasks.length ? 'info' : 'empty',
                summary: `${tasks.length} görev`,
                table: { columns: ['Görev', 'Durum', 'Termin'], rows: tasks.map((t) => ({ cells: [t.title, t.status, trDate(t.dueDate)], href: `/admin/gorevler?taskId=${t.id}` })) },
                links: [{ label: 'Görevlere git', href: '/admin/gorevler?scope=assigned' }],
            },
        };
    },
};

const applicationsPending: AiActionDefinition<{ type: 'PROGRAM' | 'TEKMER' | 'ALL' }> = {
    id: 'applications.pending',
    name: 'Bekleyen başvurular',
    description: 'Sonuçlanmamış başvurular. Program başvuruları ile TEKMER yer edinme başvuruları ayrı listelenir.',
    domain: 'APPLICATION',
    kind: 'READ',
    permission: ['view', 'applications'],
    risk: 'LOW',
    input: z.object({ type: z.enum(['PROGRAM', 'TEKMER', 'ALL']) }),
    examples: ['Bekleyen program başvuruları', 'Bekleyen TEKMER yer edinme başvuruları'],
    async execute(input) {
        const apps = await prisma.application.findMany({
            where: { isArchived: false, ...(input.type === 'ALL' ? {} : { applicationType: input.type }) },
            include: { campaign: true },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        const pending = apps.filter((a) => pendingStages(getCampaignStages(a.campaign)).includes(a.status));
        const label = input.type === 'TEKMER' ? 'Bekleyen TEKMER yer edinme başvuruları' : input.type === 'PROGRAM' ? 'Bekleyen program başvuruları' : 'Bekleyen başvurular';
        return {
            card: {
                title: label,
                status: pending.length ? 'info' : 'empty',
                summary: `${pending.length} başvuru`,
                table: {
                    columns: ['Referans', 'Başvuran', 'Kampanya', 'Aşama', 'Tarih'],
                    rows: pending.slice(0, 50).map((a) => ({ cells: [a.applicationNumber, a.applicantName, a.campaign?.name || '—', getCampaignStages(a.campaign).find((s) => s.key === a.status)?.label || a.status, trDate(a.createdAt)], href: `/admin/basvurular/${a.id}` })),
                },
                links: [{ label: 'Başvuru Merkezi', href: `/admin/basvurular?view=${input.type === 'TEKMER' ? 'tekmer' : input.type === 'PROGRAM' ? 'program' : 'all'}` }],
            },
        };
    },
};

const rentOverdue: AiActionDefinition<Record<string, never>> = {
    id: 'rent.overdue',
    name: 'Geciken kiralar',
    description: 'Son ödeme tarihi geçmiş ve kalan borcu olan kira tahakkukları.',
    domain: 'FINANCE',
    kind: 'READ',
    permission: ['view', 'rent'],
    risk: 'LOW',
    input: z.object({}),
    examples: ['Geciken kiraları göster'],
    async execute() {
        const rows = await prisma.rentAccrual.findMany({
            where: { remainingAmount: { gt: 0 }, dueDate: { lt: new Date() }, status: { notIn: ['PAID', 'WAIVED', 'CANCELLED'] } },
            include: { entrepreneur: { select: { id: true, name: true } } },
            orderBy: { dueDate: 'asc' },
            take: 100,
        });
        // Different currencies are never summed together
        const totals = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.currency]: (acc[r.currency] || 0) + r.remainingAmount }), {});
        return {
            card: {
                title: 'Geciken kiralar',
                status: rows.length ? 'warning' : 'empty',
                summary: rows.length ? `${rows.length} tahakkuk · ${Object.entries(totals).map(([c, v]) => money(v, c)).join(' + ')}` : 'Geciken kira yok.',
                table: { columns: ['Girişim', 'Dönem', 'Kalan', 'Son ödeme'], rows: rows.map((r) => ({ cells: [r.entrepreneur.name, r.periodLabel, money(r.remainingAmount, r.currency), trDate(r.dueDate)], href: `/admin/girisimciler/${r.entrepreneur.id}/finans-kira` })) },
                links: [{ label: 'Kira yönetimi', href: '/admin/finans/kiralar' }],
            },
        };
    },
};

const contractsExpiring: AiActionDefinition<{ days?: number }> = {
    id: 'contracts.expiring',
    name: 'Biten sözleşmeler',
    description: 'Belirtilen gün içinde bitecek aktif kira sözleşmeleri.',
    domain: 'FINANCE',
    kind: 'READ',
    permission: ['view', 'rent'],
    risk: 'LOW',
    input: z.object({ days: z.number().int().min(1).max(365).optional() }),
    examples: ['30 gün içinde bitecek sözleşmeler'],
    async execute(input) {
        const days = input.days || 30;
        const rows = await prisma.rentContract.findMany({
            where: { status: 'ACTIVE', endDate: { gte: new Date(), lte: new Date(Date.now() + days * 86400000) } },
            include: { entrepreneur: { select: { id: true, name: true } } },
            orderBy: { endDate: 'asc' },
        });
        return {
            card: {
                title: `${days} gün içinde bitecek sözleşmeler`,
                status: rows.length ? 'warning' : 'empty',
                summary: `${rows.length} sözleşme`,
                table: { columns: ['Sözleşme', 'Girişim', 'Alan', 'Bitiş'], rows: rows.map((r) => ({ cells: [r.contractNo, r.entrepreneur.name, r.spaceName, trDate(r.endDate)], href: `/admin/girisimciler/${r.entrepreneur.id}/finans-kira` })) },
            },
        };
    },
};

const facilitiesExperience: AiActionDefinition<{ has3D: boolean }> = {
    id: 'facilities.experience',
    name: '3D durumuna göre alanlar',
    description: '3D / 360° varlığı olan veya olmayan alanlar. Varlığı olmayan alan için model uydurulmaz.',
    domain: 'FACILITY',
    kind: 'READ',
    permission: ['view', 'facilities'],
    risk: 'LOW',
    input: z.object({ has3D: z.boolean() }),
    examples: ['3D modeli olmayan alanlar', '3D modeli bulunan alanları göster'],
    async execute(input) {
        const facilities = await prisma.facility.findMany({ where: { isActive: true }, include: { experience: true }, orderBy: { sortOrder: 'asc' } });
        const rows = facilities.filter((f) => {
            const has = Boolean(f.experience && (f.experience.modelUrl || f.experience.panoramaUrl));
            return input.has3D ? has : !has;
        });
        return {
            card: {
                title: input.has3D ? '3D / 360° görünümü olan alanlar' : '3D / 360° varlığı olmayan alanlar',
                status: rows.length ? 'info' : 'empty',
                summary: `${rows.length} alan`,
                table: { columns: ['Alan', 'Durum'], rows: rows.map((f) => ({ cells: [f.title, f.experience?.isPublic && f.experience.isEnabled ? 'Public' : f.experience ? 'Gizli' : 'Varlık yok'], href: '/admin/alanlar' })) },
                links: [{ label: 'Alanlar & 3D yönetimi', href: '/admin/alanlar' }],
            },
        };
    },
};

const reservationAvailability: AiActionDefinition<{ date: string; startTime: string; endTime: string; participants: number }> = {
    id: 'reservations.availability',
    name: 'Müsait alanlar',
    description: 'Belirtilen tarih, saat aralığı ve kişi sayısı için müsait alanlar.',
    domain: 'RESERVATION',
    kind: 'READ',
    permission: ['view', 'reservations'],
    risk: 'LOW',
    input: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/), participants: z.number().int().min(1).max(500) }),
    examples: ['Yarın 14:00–16:00 arasında 8 kişi için hangi alanlar müsait?'],
    async execute(input) {
        const facilities = await SpaceReservationService.listBookableFacilities(false);
        const rows: { cells: string[]; href?: string }[] = [];
        for (const { facility, settings } of facilities) {
            const r = await SpaceReservationService.checkAvailability({ facilityId: facility.id, date: input.date, startTime: input.startTime, endTime: input.endTime, participants: input.participants });
            if (r.isAvailable) rows.push({ cells: [facility.title, settings.capacity !== null ? `${settings.capacity} kişi` : 'Kapasite bilgisi girilmemiş'], href: `/admin/alanlar?tab=rezervasyonlar&action=create-reservation` });
        }
        return {
            card: {
                title: `${input.date} ${input.startTime}–${input.endTime} · ${input.participants} kişi için müsait alanlar`,
                status: rows.length ? 'success' : 'empty',
                summary: rows.length ? `${rows.length} alan müsait` : 'Bu aralıkta uygun alan yok.',
                table: { columns: ['Alan', 'Kapasite'], rows },
                links: [{ label: 'Rezervasyon oluştur', href: '/admin/alanlar?tab=rezervasyonlar&action=create-reservation' }],
            },
        };
    },
};

const formQuestions: AiActionDefinition<{ form: string; requiredOnly?: boolean }> = {
    id: 'forms.questions',
    name: 'Form soruları',
    description: 'Bir formun yayındaki (veya taslak) sorularını, zorunlu olanları ve soru sayısını gösterir.',
    domain: 'FORM',
    kind: 'READ',
    permission: ['view', 'forms'],
    risk: 'LOW',
    input: z.object({ form: z.string().min(1), requiredOnly: z.boolean().optional() }),
    examples: ['ANTSPARK formundaki soruları göster', 'TEKMER formunda kaç soru var?', 'Bu formdaki zorunlu sorular'],
    async execute(input, ctx) {
        const form = await findForm(input.form, ctx);
        if (!form) return { card: { title: 'Form bulunamadı', status: 'empty', summary: `"${input.form}" ile eşleşen form yok.`, links: [{ label: 'Form Merkezi', href: '/admin/form-builder' }] } };
        const detail = await FormService.getFormDetail(form.id);
        const fields = (detail?.editing.fields || []).filter((f) => !getFieldTypeMeta(String(f.fieldType)).isDisplayOnly);
        const list = input.requiredOnly ? fields.filter((f) => f.isRequired) : fields;
        const entity: EntityRef = { type: 'Form', id: form.id, label: form.title, href: `/admin/form-builder/${form.id}` };
        return {
            entity,
            card: {
                title: `${form.title}${input.requiredOnly ? ' — zorunlu sorular' : ''}`,
                status: 'info',
                summary: `${detail?.editing.isDraft ? 'Taslak' : 'Yayındaki'} v${detail?.editing.versionNumber}: ${fields.length} soru (${fields.filter((f) => f.isRequired).length} zorunlu)`,
                table: { columns: ['Bölüm', 'Soru', 'Tür', 'Zorunlu'], rows: list.map((f) => ({ cells: [String(f.stepTitle || f.stepNumber), f.label, getFieldTypeMeta(String(f.fieldType)).label, f.isRequired ? 'Evet' : 'Hayır'] })) },
                links: [{ label: 'Formu aç', href: entity.href }],
                entity,
            },
        };
    },
};

const formWhereUsed: AiActionDefinition<{ form: string }> = {
    id: 'forms.where_used',
    name: 'Formun kullanıldığı yerler',
    description: 'Formun bağlı olduğu kampanyalar ve public sayfalar.',
    domain: 'FORM',
    kind: 'READ',
    permission: ['view', 'forms'],
    risk: 'LOW',
    input: z.object({ form: z.string().min(1) }),
    examples: ['ANTSPARK formunun kullanıldığı yerleri göster'],
    async execute(input, ctx) {
        const form = await findForm(input.form, ctx);
        if (!form) return { card: { title: 'Form bulunamadı', status: 'empty' } };
        const detail = await FormService.getFormDetail(form.id);
        return {
            card: {
                title: `${form.title} — kullanıldığı yerler`,
                status: detail?.whereUsed.length ? 'info' : 'empty',
                table: { columns: ['Tür', 'Yer'], rows: (detail?.whereUsed || []).map((u) => ({ cells: [u.kind, u.label], href: u.href || u.publicPath || undefined })) },
                links: [{ label: 'Formu aç', href: `/admin/form-builder/${form.id}?tab=usage` }],
            },
        };
    },
};

const formCompare: AiActionDefinition<{ formA: string; formB: string }> = {
    id: 'forms.compare',
    name: 'Form karşılaştırma',
    description: 'İki formun (ör. Program ve TEKMER başvuru formu) soru farklarını gösterir.',
    domain: 'FORM',
    kind: 'ANALYZE',
    permission: ['view', 'forms'],
    risk: 'LOW',
    input: z.object({ formA: z.string(), formB: z.string() }),
    examples: ['Program ve TEKMER formlarının farklarını göster'],
    async execute(input, ctx) {
        const [a, b] = await Promise.all([findForm(input.formA, ctx), findForm(input.formB, ctx)]);
        if (!a || !b) return { card: { title: 'Formlardan biri bulunamadı', status: 'empty' } };
        const [da, db] = await Promise.all([FormService.getFormDetail(a.id), FormService.getFormDetail(b.id)]);
        const fa = new Map((da?.editing.fields || []).filter((f) => !getFieldTypeMeta(String(f.fieldType)).isDisplayOnly).map((f) => [f.label, f]));
        const fb = new Map((db?.editing.fields || []).filter((f) => !getFieldTypeMeta(String(f.fieldType)).isDisplayOnly).map((f) => [f.label, f]));
        const rows = [
            ...Array.from(fa.keys()).filter((k) => !fb.has(k)).map((k) => ({ cells: [k, `Yalnız ${a.title}`] })),
            ...Array.from(fb.keys()).filter((k) => !fa.has(k)).map((k) => ({ cells: [k, `Yalnız ${b.title}`] })),
        ];
        return {
            card: {
                title: `${a.title} ↔ ${b.title}`,
                status: 'info',
                summary: `Ortak ${Array.from(fa.keys()).filter((k) => fb.has(k)).length} soru, ${rows.length} farklı soru. Formlar birbirinden bağımsızdır.`,
                table: { columns: ['Soru', 'Bulunduğu form'], rows },
            },
        };
    },
};

const crmFind: AiActionDefinition<{ query: string }> = {
    id: 'crm.find',
    name: 'Kişi / kurum / girişim bul',
    description: 'Rehberde kişi, kurum veya girişim arar ve kaydı açar. Hassas kimlik bilgisi gösterilmez.',
    domain: 'CRM',
    kind: 'SEARCH',
    permission: ['view', 'persons'],
    risk: 'LOW',
    input: z.object({ query: z.string().min(2) }),
    examples: ['ABC Teknoloji\'yi aç', 'Ayşe Demir kim?'],
    async execute(input) {
        const q = input.query.trim();
        const [persons, orgs, ents] = await Promise.all([
            prisma.person.findMany({ where: { status: { not: 'ARCHIVED' }, OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }, take: 5, select: { id: true, fullName: true, email: true, phone: true } }),
            prisma.organization.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, take: 5, select: { id: true, name: true } }),
            prisma.entrepreneur.findMany({ where: { isArchived: false, name: { contains: q, mode: 'insensitive' } }, take: 5, select: { id: true, name: true } }),
        ]);
        const rows = [
            ...ents.map((e) => ({ cells: ['Girişim', e.name, ''], href: `/admin/girisimciler/${e.id}` })),
            ...orgs.map((o) => ({ cells: ['Kurum', o.name, ''], href: `/admin/rehber?organizationId=${o.id}` })),
            ...persons.map((p) => ({ cells: ['Kişi', p.fullName, [p.email ? '' : 'E-posta eksik', p.phone ? '' : 'Telefon eksik'].filter(Boolean).join(', ')], href: `/admin/rehber?personId=${p.id}` })),
        ];
        const single = rows.length === 1;
        const entity: EntityRef | null = single
            ? ents[0] ? { type: 'Entrepreneur', id: ents[0].id, label: ents[0].name, href: `/admin/girisimciler/${ents[0].id}` }
                : orgs[0] ? { type: 'Organization', id: orgs[0].id, label: orgs[0].name, href: `/admin/rehber?organizationId=${orgs[0].id}` }
                    : { type: 'Person', id: persons[0].id, label: persons[0].fullName, href: `/admin/rehber?personId=${persons[0].id}` }
            : null;
        return {
            entity,
            card: { title: `"${q}" için sonuçlar`, status: rows.length ? 'info' : 'empty', summary: rows.length ? `${rows.length} kayıt` : 'Kayıt bulunamadı.', table: { columns: ['Tür', 'Ad', 'Eksik bilgi'], rows }, entity, links: entity ? [{ label: `${entity.label} kaydını aç`, href: entity.href }] : [] },
        };
    },
};

const programlessEntrepreneurs: AiActionDefinition<Record<string, never>> = {
    id: 'entrepreneurs.without_program',
    name: 'Programsız girişimler',
    description: 'Aktif program ataması olmayan girişimler.',
    domain: 'PROGRAM',
    kind: 'READ',
    permission: ['view', 'entrepreneurs'],
    risk: 'LOW',
    input: z.object({}),
    examples: ['Programı olmayan girişimler'],
    async execute() {
        const ents = await prisma.entrepreneur.findMany({
            where: { isArchived: false, programAssignments: { none: { status: { notIn: ['WITHDRAWN', 'REJECTED', 'COMPLETED'] } } } },
            select: { id: true, name: true, sector: true },
            orderBy: { name: 'asc' },
        });
        return { card: { title: 'Aktif programı olmayan girişimler', status: ents.length ? 'info' : 'empty', summary: `${ents.length} girişim`, table: { columns: ['Girişim', 'Sektör'], rows: ents.map((e) => ({ cells: [e.name, e.sector || '—'], href: `/admin/girisimciler/${e.id}` })) } } };
    },
};

const programsOverview: AiActionDefinition<Record<string, never>> = {
    id: 'programs.overview',
    name: 'Programlar ve başvuru istatistikleri',
    description: 'Programlar, aktif katılımcı sayısı ve kampanya başvuru sayıları.',
    domain: 'PROGRAM',
    kind: 'ANALYZE',
    permission: ['view', 'programs'],
    risk: 'LOW',
    input: z.object({}),
    examples: ['Programları listele', 'Kampanya istatistikleri'],
    async execute() {
        const programs = await prisma.program.findMany({
            where: { isArchived: false },
            include: { _count: { select: { entrepreneurPrograms: { where: { status: 'ACTIVE' } } } }, campaigns: { include: { _count: { select: { applications: true } } } } },
            orderBy: { name: 'asc' },
        });
        return {
            card: {
                title: 'Programlar',
                status: programs.length ? 'info' : 'empty',
                table: { columns: ['Program', 'Aktif katılımcı', 'Kampanya', 'Başvuru'], rows: programs.map((p) => ({ cells: [p.name, String(p._count.entrepreneurPrograms), String(p.campaigns.length), String(p.campaigns.reduce((s, c) => s + c._count.applications, 0))], href: '/admin/programlar' })) },
            },
        };
    },
};

// ---------------------------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------------------------

const taskCreate: AiActionDefinition<{ title: string; dueDate?: string | null; assigneeName?: string | null; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }> = {
    id: 'task.create',
    name: 'Görev oluştur',
    description: 'Görev oluşturur; sayfadaki veya son açılan kayıt varsa göreve bağlanır.',
    domain: 'TASK',
    kind: 'CREATE',
    permission: ['create', 'tasks'],
    risk: 'MEDIUM',
    input: z.object({ title: z.string().min(2).max(200), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), assigneeName: z.string().nullable().optional(), priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional() }),
    examples: ['Bunun için görev oluştur', 'Yarın ABC ile görüşme görevi oluştur'],
    async preview(input, ctx) {
        const rel = contextRelation(ctx);
        const assignee = input.assigneeName ? await prisma.user.findFirst({ where: { name: { contains: input.assigneeName, mode: 'insensitive' }, isActive: true } }) : null;
        return {
            title: 'Görev oluşturulacak',
            status: 'info',
            fields: [
                { label: 'Görev', value: input.title },
                { label: 'Atanan', value: assignee?.name || ctx.actor.name },
                { label: 'Termin', value: input.dueDate || 'Belirtilmedi' },
                { label: 'Öncelik', value: input.priority || 'MEDIUM' },
                { label: 'İlişkili kayıt', value: rel ? rel.label : 'Yok' },
            ],
        };
    },
    async execute(input, ctx) {
        const rel = contextRelation(ctx);
        const assignee = input.assigneeName ? await prisma.user.findFirst({ where: { name: { contains: input.assigneeName, mode: 'insensitive' }, isActive: true } }) : null;
        const assigneeIds = [assignee?.id || ctx.actor.id];
        TaskWorkflowService.assertCanAssign(ctx.actor, assigneeIds);
        const task = await TaskService.createTask({
            title: input.title,
            priority: input.priority || 'MEDIUM',
            dueDate: input.dueDate ? toIstanbulDate(input.dueDate, '18:00') : undefined,
            assigneeIds,
            createdById: ctx.actor.id,
            actorName: `${ctx.actor.name} (AI)`,
            ...(rel ? { [rel.field]: rel.id } : {}),
        });
        const entity: EntityRef = { type: 'Task', id: task.id, label: task.title, href: `/admin/gorevler?taskId=${task.id}` };
        return {
            entity,
            undo: { taskId: task.id },
            after: { id: task.id, title: task.title },
            card: {
                title: '✓ Görev oluşturuldu',
                status: 'success',
                fields: [{ label: 'Görev', value: task.title }, { label: 'Atanan', value: assignee?.name || ctx.actor.name }, { label: 'Termin', value: input.dueDate || '—' }],
                links: [{ label: 'Görevi aç', href: entity.href }],
                entity,
            },
        };
    },
    async verify(result) {
        return Boolean(result.entity && (await prisma.task.findUnique({ where: { id: result.entity.id } })));
    },
    async undo(data, ctx) {
        await prisma.task.update({ where: { id: String(data.taskId) }, data: { isArchived: true } });
        await prisma.taskActivity.create({ data: { taskId: String(data.taskId), actorId: ctx.actor.id, actorName: ctx.actor.name, action: 'UNDONE', description: 'AI ile oluşturulan görev geri alındı (arşivlendi).' } });
        return 'Görev geri alındı (arşivlendi).';
    },
};

const formAddDraftQuestion: AiActionDefinition<{ form: string; label: string; fieldType?: string; required?: boolean }> = {
    id: 'form.add_draft_question',
    name: 'Forma taslak soru ekle',
    description: 'Formun taslağına soru ekler. Yayındaki versiyon değişmez; yayınlamak ayrı adımdır.',
    domain: 'FORM',
    kind: 'UPDATE',
    permission: ['edit', 'forms'],
    risk: 'MEDIUM',
    input: z.object({ form: z.string().min(1), label: z.string().min(2).max(300), fieldType: z.string().optional(), required: z.boolean().optional() }),
    examples: ['ANTSPARK formuna "Ekibinizde kaç kadın girişimci var?" sorusunu taslak olarak ekle'],
    async preview(input, ctx) {
        const form = await findForm(input.form, ctx);
        if (!form) throw new DomainError(`"${input.form}" formu bulunamadı.`);
        return { title: 'Taslağa soru eklenecek', status: 'info', fields: [{ label: 'Form', value: form.title }, { label: 'Soru', value: input.label }, { label: 'Tür', value: getFieldTypeMeta(input.fieldType || 'TEXT').label }, { label: 'Zorunlu', value: input.required ? 'Evet' : 'Hayır' }, { label: 'Not', value: 'Yayındaki form değişmez; taslak yayınlanınca yeni versiyon oluşur.' }] };
    },
    async execute(input, ctx) {
        const form = await findForm(input.form, ctx);
        if (!form) throw new DomainError(`"${input.form}" formu bulunamadı.`);
        const detail = await FormService.getFormDetail(form.id);
        if (!detail) throw new DomainError('Form bulunamadı.');
        const keyBase = slugifyFieldKey(input.label) || 'soru';
        let fieldKey = /^[a-z]/.test(keyBase) ? keyBase : `soru_${keyBase}`;
        let n = 2;
        while (detail.editing.fields.some((f) => f.fieldKey === fieldKey)) fieldKey = `${keyBase}_${n++}`;
        const type = FIELD_TYPES.some((t) => t.type === normalizeFieldType(input.fieldType || 'TEXT')) ? normalizeFieldType(input.fieldType || 'TEXT') : 'TEXT';
        const lastStep = Math.max(1, ...detail.editing.sections.map((s) => s.stepNumber));
        const fields = [...detail.editing.fields, { fieldKey, label: input.label, fieldType: type, isRequired: input.required === true, stepNumber: lastStep, sortOrder: 9999, options: getFieldTypeMeta(type).hasOptions ? [{ label: 'Evet', value: 'Evet' }, { label: 'Hayır', value: 'Hayır' }] : null }];
        const hadDraft = detail.editing.isDraft;
        const version = await FormService.saveDraft(form.id, { sections: detail.editing.sections, fields, changeNote: `AI: "${input.label}" sorusu eklendi` }, ctx.actor);
        const entity: EntityRef = { type: 'Form', id: form.id, label: form.title, href: `/admin/form-builder/${form.id}` };
        return {
            entity,
            undo: { formId: form.id, fieldKey, versionId: version.id, createdDraft: !hadDraft },
            card: { title: '✓ Soru taslağa eklendi', status: 'success', fields: [{ label: 'Form', value: form.title }, { label: 'Taslak', value: `v${version.versionNumber}` }, { label: 'Soru', value: input.label }], summary: 'Yayınlamak için formu açıp "Yayınla" adımını kullanın.', links: [{ label: 'Formu aç', href: entity.href }], entity },
        };
    },
    async verify(result) {
        const data = result.undo as { versionId: string; fieldKey: string };
        return Boolean(await prisma.formField.findFirst({ where: { formVersionId: data.versionId, fieldKey: data.fieldKey } }));
    },
    async undo(data, ctx) {
        const detail = await FormService.getFormDetail(String(data.formId));
        if (!detail || !detail.editing.isDraft || detail.editing.versionId !== data.versionId) throw new DomainError('Taslak değiştiği için geri alınamıyor.');
        if (data.createdDraft) {
            await FormService.discardDraft(String(data.formId), ctx.actor);
            return 'AI ile oluşturulan taslak silindi.';
        }
        await FormService.saveDraft(String(data.formId), { sections: detail.editing.sections, fields: detail.editing.fields.filter((f) => f.fieldKey !== data.fieldKey) }, ctx.actor);
        return 'Soru taslaktan kaldırıldı.';
    },
};

const applicationChangeStage: AiActionDefinition<{ application?: string | null; stage: string }> = {
    id: 'application.change_stage',
    name: 'Başvuru aşamasını değiştir',
    description: 'Başvuruyu kendi kampanyasının iş akışındaki bir aşamaya taşır.',
    domain: 'APPLICATION',
    kind: 'UPDATE',
    permission: ['edit', 'applications'],
    risk: 'HIGH',
    input: z.object({ application: z.string().nullable().optional(), stage: z.string().min(2) }),
    examples: ['Bu başvuruyu değerlendirmeye al', 'PRG-2026-00012 başvurusunu kabul et'],
    async preview(input, ctx) {
        const app = await resolveApplication(input.application, ctx);
        const stages = getCampaignStages(app.campaign);
        const stage = matchStage(stages, input.stage);
        return { title: 'Başvuru aşaması değişecek', status: 'warning', fields: [{ label: 'Başvuru', value: `${app.applicationNumber} · ${app.applicantName}` }, { label: 'Tür', value: app.applicationType }, { label: 'Mevcut', value: stages.find((s) => s.key === app.status)?.label || app.status }, { label: 'Yeni', value: stage.label }] };
    },
    async execute(input, ctx) {
        const app = await resolveApplication(input.application, ctx);
        const stage = matchStage(getCampaignStages(app.campaign), input.stage);
        await ApplicationService.updateStatus({ applicationId: app.id, toStatus: stage.key, reason: 'AI Komuta Merkezi üzerinden', actor: ctx.actor });
        const entity: EntityRef = { type: 'Application', id: app.id, label: app.applicationNumber, href: `/admin/basvurular/${app.id}` };
        return { entity, undo: { applicationId: app.id, previous: app.status }, before: { status: app.status }, after: { status: stage.key }, card: { title: '✓ Başvuru aşaması güncellendi', status: 'success', fields: [{ label: 'Başvuru', value: app.applicationNumber }, { label: 'Yeni aşama', value: stage.label }], summary: stage.outcome === 'ACCEPTED' ? (app.applicationType === 'TEKMER' ? 'Sonraki adım: Alan tahsis sürecini başlatın.' : 'Sonraki adım: Programa atayın.') : undefined, links: [{ label: 'Başvuruyu aç', href: entity.href }], entity } };
    },
    async verify(result) {
        const app = await prisma.application.findUnique({ where: { id: result.entity!.id } });
        return app?.status === (result.after as { status: string }).status;
    },
    async undo(data, ctx) {
        await ApplicationService.updateStatus({ applicationId: String(data.applicationId), toStatus: String(data.previous), reason: 'AI işlemi geri alındı', actor: ctx.actor });
        return 'Başvuru önceki aşamaya alındı.';
    },
};

async function resolveApplication(ref: string | null | undefined, ctx: ActionContext) {
    const id = !ref && (ctx.context.entityType === 'Application' ? ctx.context.entityId : ctx.context.lastEntity?.type === 'Application' ? ctx.context.lastEntity.id : null);
    const app = id
        ? await prisma.application.findUnique({ where: { id }, include: { campaign: true } })
        : ref ? await prisma.application.findFirst({ where: { OR: [{ applicationNumber: ref.toUpperCase() }, { applicantName: { contains: ref, mode: 'insensitive' } }] }, include: { campaign: true } }) : null;
    if (!app) throw new DomainError('Hangi başvuru? Başvuru sayfasındayken komut verin veya başvuru numarasını yazın.');
    return app;
}

function matchStage(stages: { key: string; label: string; outcome?: string | null }[], text: string) {
    const t = text.toLocaleLowerCase('tr');
    const alias: Record<string, string> = { kabul: 'ACCEPTED', red: 'REJECTED', ret: 'REJECTED', redd: 'REJECTED', değerlendir: 'UNDER_EVALUATION', 'ön inceleme': 'PRE_REVIEW', mülakat: 'INTERVIEW', görüşme: 'INTERVIEW', jüri: 'JURY', bekleme: 'WAITLIST', eksik: 'MISSING_DOCS' };
    const key = Object.entries(alias).find(([k]) => t.includes(k))?.[1] || text.toUpperCase();
    const stage = stages.find((s) => s.key === key) || stages.find((s) => s.label.toLocaleLowerCase('tr') === t);
    if (!stage) throw new DomainError(`"${text}" bu kampanyanın iş akışında yok. Aşamalar: ${stages.map((s) => s.label).join(', ')}`);
    return stage;
}

const programAssign: AiActionDefinition<{ entrepreneur?: string | null; program: string; cohort?: string | null }> = {
    id: 'program.assign',
    name: 'Programa ata',
    description: 'Girişimi programa atar (EntrepreneurProgram). Dönem belirtilmezse boş bırakılır.',
    domain: 'PROGRAM',
    kind: 'ASSIGN',
    permission: ['edit', 'entrepreneurs'],
    risk: 'HIGH',
    input: z.object({ entrepreneur: z.string().nullable().optional(), program: z.string().min(2), cohort: z.string().nullable().optional() }),
    examples: ['Bunu ANTSPARK\'a ata', 'ABC Girişim\'i ANTSFire programına ata'],
    async preview(input, ctx) {
        const ent = await resolveEntrepreneur(input.entrepreneur || undefined, ctx);
        if (!ent) throw new DomainError('Hangi girişim? Girişim sayfasındayken komut verin veya adını yazın.');
        const program = await prisma.program.findFirst({ where: { isArchived: false, OR: [{ name: { contains: input.program, mode: 'insensitive' } }, { slug: { contains: input.program.toLowerCase() } }] } });
        if (!program) throw new DomainError(`"${input.program}" programı bulunamadı.`);
        return { title: 'Program ataması yapılacak', status: 'warning', fields: [{ label: 'Girişim', value: ent.name }, { label: 'Program', value: program.name }, { label: 'Dönem', value: input.cohort || 'Belirtilmedi' }] };
    },
    async execute(input, ctx) {
        const ent = await resolveEntrepreneur(input.entrepreneur || undefined, ctx);
        if (!ent) throw new DomainError('Girişim bulunamadı.');
        const program = await prisma.program.findFirst({ where: { isArchived: false, OR: [{ name: { contains: input.program, mode: 'insensitive' } }, { slug: { contains: input.program.toLowerCase() } }] } });
        if (!program) throw new DomainError('Program bulunamadı.');
        const active = await prisma.entrepreneurProgram.findFirst({ where: { entrepreneurId: ent.id, programId: program.id, status: { notIn: ['WITHDRAWN', 'REJECTED'] } } });
        if (active) throw new DomainError(`${ent.name} zaten ${program.name} programında.`);
        const assignment = await EntrepreneurProgramService.assignProgram({ entrepreneurId: ent.id, programId: program.id, cohort: input.cohort || undefined, status: 'ACTIVE', isPublic: false }, ctx.actor.id);
        const entity: EntityRef = { type: 'Entrepreneur', id: ent.id, label: ent.name, href: `/admin/girisimciler/${ent.id}` };
        return { entity, undo: { assignmentId: assignment.id }, card: { title: '✓ Programa atandı', status: 'success', fields: [{ label: 'Girişim', value: ent.name }, { label: 'Program', value: program.name }], links: [{ label: 'Girişimi aç', href: entity.href }], entity } };
    },
    async verify(result) {
        return Boolean(await prisma.entrepreneurProgram.findUnique({ where: { id: String((result.undo as { assignmentId: string }).assignmentId) } }));
    },
    async undo(data, ctx) {
        await EntrepreneurProgramService.removeProgramAssignment(String(data.assignmentId), ctx.actor.id);
        return 'Program ataması sonlandırıldı (geçmiş korunur).';
    },
};

const emailPrepare: AiActionDefinition<{ to?: string | null; subject: string; body: string }> = {
    id: 'email.prepare',
    name: 'E-posta taslağı hazırla',
    description: 'Alıcı, konu ve gövdeyle e-posta taslağı oluşturur. Taslak gönderilmez; göndermek ayrı bir onaydır.',
    domain: 'EMAIL',
    kind: 'EMAIL_PREPARE',
    permission: ['manage', 'email_outbox'],
    risk: 'MEDIUM',
    input: z.object({ to: z.string().email().nullable().optional(), subject: z.string().min(2).max(200), body: z.string().min(2).max(5000) }),
    examples: ['Bu şirkete toplantı daveti maili hazırla'],
    async preview(input, ctx) {
        const to = input.to || (await contextEmail(ctx));
        return { title: 'E-posta taslağı hazırlanacak', status: 'info', fields: [{ label: 'Alıcı', value: to || 'Belirtilmedi' }, { label: 'Konu', value: input.subject }, { label: 'Gövde', value: input.body.slice(0, 300) }] };
    },
    async execute(input, ctx) {
        const to = input.to || (await contextEmail(ctx));
        if (!to) throw new DomainError('Alıcı e-posta adresi bulunamadı. Adresi yazın veya ilgili kaydın sayfasında komut verin.');
        const draft = await prisma.emailOutbox.create({
            data: { recipientEmail: to.toLowerCase(), subject: input.subject, htmlBody: input.body.replace(/</g, '&lt;').replace(/\n/g, '<br/>'), textBody: input.body, status: 'DRAFT', templateKey: 'AI_DRAFT', entityType: ctx.context.entityType || null, entityId: ctx.context.entityId || null, metadata: JSON.stringify({ preparedBy: ctx.actor.id, ai: true }) },
        });
        const entity: EntityRef = { type: 'EmailDraft', id: draft.id, label: input.subject, href: `/admin/eposta-merkezi?tab=drafts&draftId=${draft.id}` };
        return { entity, undo: { draftId: draft.id }, card: { title: '✓ E-posta taslağı hazır', status: 'success', fields: [{ label: 'Alıcı', value: to }, { label: 'Konu', value: input.subject }], summary: 'Taslak gönderilmedi. Göndermek için "Taslağı gönder" komutunu onaylayın veya E-posta Merkezi\'nden gönderin.', links: [{ label: 'Taslağı aç', href: entity.href }], entity } };
    },
    async verify(result) {
        return (await prisma.emailOutbox.findUnique({ where: { id: result.entity!.id } }))?.status === 'DRAFT';
    },
    async undo(data) {
        await prisma.emailOutbox.update({ where: { id: String(data.draftId) }, data: { status: 'CANCELLED', errorMessage: 'AI taslağı geri alındı' } });
        return 'Taslak iptal edildi.';
    },
};

async function contextEmail(ctx: ActionContext): Promise<string | null> {
    const t = ctx.context.entityType || ctx.context.lastEntity?.type;
    const id = ctx.context.entityId || ctx.context.lastEntity?.id;
    if (!t || !id) return null;
    if (t === 'Person') return (await prisma.person.findUnique({ where: { id }, select: { email: true } }))?.email ?? null;
    if (t === 'Organization') return (await prisma.organization.findUnique({ where: { id }, select: { email: true } }))?.email ?? null;
    if (t === 'Entrepreneur') return (await prisma.entrepreneur.findUnique({ where: { id }, select: { email: true } }))?.email ?? null;
    if (t === 'Application') return (await prisma.application.findUnique({ where: { id }, select: { email: true } }))?.email ?? null;
    return null;
}

const emailSendDraft: AiActionDefinition<{ draftId: string }> = {
    id: 'email.send_draft',
    name: 'Taslağı gönder',
    description: 'Hazırlanan taslağı gönderim kuyruğuna alır. E-posta sağlayıcısı yoksa outbox\'ta bekler, "gönderildi" denmez.',
    domain: 'EMAIL',
    kind: 'UPDATE',
    permission: ['manage', 'email_outbox'],
    risk: 'HIGH',
    input: z.object({ draftId: z.string().uuid() }),
    examples: ['Taslağı gönder'],
    async preview(input) {
        const d = await prisma.emailOutbox.findUnique({ where: { id: input.draftId } });
        if (!d || d.status !== 'DRAFT') throw new DomainError('Gönderilecek taslak bulunamadı.');
        return { title: 'E-posta gönderim kuyruğuna alınacak', status: 'warning', fields: [{ label: 'Alıcı', value: d.recipientEmail }, { label: 'Konu', value: d.subject }] };
    },
    async execute(input) {
        const d = await prisma.emailOutbox.update({ where: { id: input.draftId }, data: { status: 'PENDING' } });
        const { EmailOutboxService } = await import('@/lib/services/email-outbox-service');
        const sent = await EmailOutboxService.sendEmailImmediately(d.id);
        const delivered = sent.status === 'SENT';
        return { entity: { type: 'EmailDraft', id: d.id, label: d.subject, href: '/admin/eposta-merkezi?tab=outbox' }, card: { title: delivered ? '✓ E-posta gönderildi' : 'E-posta kuyruğa alındı', status: delivered ? 'success' : 'warning', summary: delivered ? undefined : 'E-posta sağlayıcısı yapılandırılmadığı için ileti outbox\'ta bekliyor (PENDING_EXTERNAL_CONFIGURATION).', fields: [{ label: 'Alıcı', value: d.recipientEmail }, { label: 'Durum', value: sent.status }], links: [{ label: 'Outbox', href: '/admin/eposta-merkezi?tab=outbox' }] } };
    },
};

const newsDraft: AiActionDefinition<{ title: string; excerpt?: string | null; content: string }> = {
    id: 'cms.news_draft',
    name: 'Haber taslağı hazırla',
    description: 'Haber taslağı oluşturur (yayınlanmaz). Yayınlama CMS\'te ayrı ve yetkili bir adımdır.',
    domain: 'CMS',
    kind: 'PREPARE',
    permission: ['create', 'news'],
    risk: 'MEDIUM',
    input: z.object({ title: z.string().min(3).max(200), excerpt: z.string().max(500).nullable().optional(), content: z.string().min(3).max(20000) }),
    examples: ['"Demo Day" başlıklı haber taslağı hazırla'],
    async preview(input) {
        return { title: 'Haber taslağı oluşturulacak', status: 'info', fields: [{ label: 'Başlık', value: input.title }, { label: 'Durum', value: 'Taslak (yayınlanmaz)' }] };
    },
    async execute(input, ctx) {
        const base = slugifyFieldKey(input.title).replace(/_/g, '-') || 'haber';
        const slug = `${base}-${Date.now().toString(36)}`;
        const news = await prisma.news.create({ data: { title: input.title, slug, excerpt: input.excerpt || null, content: input.content, status: 'DRAFT', approvalStatus: 'DRAFT', author: ctx.actor.name } });
        const entity: EntityRef = { type: 'News', id: news.id, label: news.title, href: `/admin/haberler?newsId=${news.id}` };
        return { entity, undo: { newsId: news.id }, card: { title: '✓ Haber taslağı oluşturuldu', status: 'success', fields: [{ label: 'Başlık', value: news.title }, { label: 'Durum', value: 'Taslak' }], summary: 'Yayınlamak için Haberler ekranında önizleyip yayınlayın.', links: [{ label: 'Haberi aç', href: entity.href }], entity } };
    },
    async verify(result) {
        return (await prisma.news.findUnique({ where: { id: result.entity!.id } }))?.status === 'DRAFT';
    },
    async undo(data) {
        await prisma.news.update({ where: { id: String(data.newsId) }, data: { isArchived: true, status: 'ARCHIVED' } });
        return 'Haber taslağı arşivlendi.';
    },
};

const navigate: AiActionDefinition<{ target: string }> = {
    id: 'navigate',
    name: 'Sayfa aç',
    description: 'Admin modüllerinden birini açar.',
    domain: 'NAVIGATION',
    kind: 'NAVIGATE',
    permission: ['view', 'dashboard'],
    risk: 'LOW',
    input: z.object({ target: z.string() }),
    examples: ['Form merkezini aç', 'Kanban\'ı aç'],
    async execute(input) {
        const t = input.target.toLocaleLowerCase('tr');
        const routes: [string, string, string][] = [
            ['form', '/admin/form-builder', 'Form Merkezi'], ['kampanya', '/admin/basvuru-kampanyalari', 'Başvuru Kampanyaları'], ['başvuru', '/admin/basvurular', 'Başvuru Merkezi'],
            ['kanban', '/admin/gorevler/kanban', 'Kanban'], ['görev', '/admin/gorevler', 'Görevler'], ['takvim', '/admin/takvim', 'Takvim'], ['rezervasyon', '/admin/alanlar?tab=rezervasyonlar', 'Rezervasyonlar'],
            ['alan', '/admin/alanlar', 'Alanlar'], ['kira', '/admin/finans/kiralar', 'Kira yönetimi'], ['finans', '/admin/finans', 'Finans'], ['rapor', '/admin/raporlar', 'Raporlar'], ['doküman', '/admin/dokumanlar', 'Doküman Merkezi'],
            ['rehber', '/admin/rehber', 'Rehber'], ['girişim', '/admin/girisimciler', 'Girişimciler'], ['mentör', '/admin/mentorler', 'Mentörler'], ['e-posta', '/admin/eposta-merkezi', 'E-posta Merkezi'], ['haber', '/admin/haberler', 'Haberler'],
        ];
        const hit = routes.find(([k]) => t.includes(k));
        if (!hit) return { card: { title: 'Sayfa bulunamadı', status: 'empty', summary: 'Ctrl+K ile tüm sayfalarda arama yapabilirsiniz.' } };
        return { card: { title: hit[2], status: 'info', links: [{ label: `${hit[2]} sayfasını aç`, href: hit[1] }] } };
    },
};

export const AI_ACTIONS: Record<string, AiActionDefinition<never>> = Object.fromEntries(
    [
        tasksToday, applicationsPending, rentOverdue, contractsExpiring, facilitiesExperience, reservationAvailability,
        formQuestions, formWhereUsed, formCompare, crmFind, programlessEntrepreneurs, programsOverview,
        taskCreate, formAddDraftQuestion, applicationChangeStage, programAssign, emailPrepare, emailSendDraft, newsDraft, navigate,
        ...LEGACY_ACTIONS,
    ].map((a) => [a.id, a as unknown as AiActionDefinition<never>])
);

export type { ResultCard };
