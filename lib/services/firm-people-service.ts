import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { fieldError, parseOrThrow, type Actor } from '@/lib/validate';
import { PersonService } from '@/lib/services/person-service';
import { OrganizationService } from '@/lib/services/organization-service';

/**
 * Girişimin (firma) personeli: rehberdeki kişiler, girişimin şirket kaydına (Organization) üyelikle bağlanır.
 * Yeni kişi rehbere kaydedilir; şirket kaydı yoksa girişim adıyla oluşturulup girişime bağlanır.
 * Tek kaynak: Person + PersonOrganizationMembership (ayrı bir "personel" listesi tutulmaz).
 */

export const PEOPLE_ROLES = ['FOUNDER', 'CO_FOUNDER', 'CEO', 'CTO', 'EMPLOYEE', 'FINANCE_CONTACT', 'LEGAL_CONTACT', 'AUTHORIZED_PERSON', 'OTHER'] as const;
export const PEOPLE_ROLE_LABELS: Record<string, string> = {
    FOUNDER: 'Kurucu', CO_FOUNDER: 'Kurucu ortak', CEO: 'CEO', CTO: 'CTO', EMPLOYEE: 'Çalışan', FINANCE_CONTACT: 'Finans yetkilisi',
    LEGAL_CONTACT: 'Hukuk yetkilisi', AUTHORIZED_PERSON: 'İmza yetkilisi', OTHER: 'Diğer',
};

const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optStr = (max = 200) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional());
const bool = z.preprocess((v) => v === true || v === 'true', z.boolean()).default(false);

const addSchema = z.object({
    personId: z.preprocess(blankToNull, z.string().uuid().nullable().optional()),
    newPerson: z.object({
        firstName: z.string().trim().min(1, 'Ad gerekli').max(100),
        lastName: z.string().trim().min(1, 'Soyad gerekli').max(100),
        email: z.preprocess(blankToNull, z.string().trim().email('Geçerli e-posta girin').nullable().optional()),
        phone: optStr(40),
        tcNumber: optStr(11),
    }).nullable().optional(),
    role: z.enum(PEOPLE_ROLES).default('EMPLOYEE'),
    position: optStr(),
    department: optStr(),
    employmentType: z.preprocess(blankToNull, z.enum(['FULL_TIME', 'PART_TIME', 'INTERN', 'CONSULTANT', 'CONTRACT', 'VOLUNTEER']).nullable().optional()),
    isPrimaryContact: bool,
    isFinanceContact: bool,
    isAuthorizedSignatory: bool,
    isRdStaff: bool,
});

export class FirmPeopleService {
    /** Girişimin birincil şirket kaydı; yoksa girişim adıyla oluşturulur ve bağlanır. */
    static async ensureOrganization(entrepreneurId: string, actor: Actor) {
        const link = await prisma.entrepreneurOrganization.findFirst({ where: { entrepreneurId }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] });
        if (link) return link.organizationId;
        const ent = await prisma.entrepreneur.findUnique({ where: { id: entrepreneurId }, select: { name: true } });
        if (!ent) throw new DomainError('Girişim bulunamadı.', 404);
        const org = await prisma.organization.create({ data: { name: ent.name } });
        await prisma.entrepreneurOrganization.create({ data: { entrepreneurId, organizationId: org.id, isPrimary: true } });
        await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action: 'CREATE', entityType: 'Organization', entityId: org.id, newValues: { name: org.name, via: 'firm-people' } });
        return org.id;
    }

    static async list(entrepreneurId: string) {
        const links = await prisma.entrepreneurOrganization.findMany({ where: { entrepreneurId }, select: { organizationId: true, organization: { select: { id: true, name: true, legalName: true } } } });
        const orgIds = links.map((l) => l.organizationId);
        const members = orgIds.length ? await prisma.personOrganizationMembership.findMany({
            where: { organizationId: { in: orgIds } },
            orderBy: [{ status: 'asc' }, { isPrimaryContact: 'desc' }, { createdAt: 'asc' }],
            include: { person: { select: { id: true, fullName: true, email: true, phone: true, title: true, tcNumberMasked: true, avatarUrl: true } } },
        }) : [];
        const active = members.filter((m) => m.status === 'ACTIVE');
        return {
            organizations: links.map((l) => l.organization),
            summary: {
                total: active.length,
                byRole: Object.entries(active.reduce<Record<string, number>>((acc, m) => ({ ...acc, [m.role]: (acc[m.role] ?? 0) + 1 }), {})).map(([role, count]) => ({ role, label: PEOPLE_ROLE_LABELS[role] ?? role, count })),
                signatories: active.filter((m) => m.isAuthorizedSignatory).map((m) => m.person.fullName),
                rdStaff: active.filter((m) => m.isRdStaff).length,
            },
            members: members.map((m) => ({
                id: m.id, status: m.status, role: m.role, roleLabel: PEOPLE_ROLE_LABELS[m.role] ?? m.role, position: m.position, department: m.department, employmentType: m.employmentType,
                isPrimaryContact: m.isPrimaryContact, isFinanceContact: m.isFinanceContact, isAuthorizedSignatory: m.isAuthorizedSignatory, isRdStaff: m.isRdStaff,
                startDate: m.startDate, endDate: m.endDate, person: m.person,
            })),
        };
    }

    /** Kişi ekleme: rehberden seçilen veya yeni oluşturulan kişi firmanın şirket kaydına bağlanır (rehbere de düşer). */
    static async add(entrepreneurId: string, input: unknown, actor: Actor) {
        const v = parseOrThrow(addSchema, input);
        if (!v.personId && !v.newPerson) throw fieldError('Form alanlarını kontrol edin.', 400, 'personId', 'Rehberden kişi seçin veya yeni kişi bilgilerini girin');
        const organizationId = await this.ensureOrganization(entrepreneurId, actor);
        let personId = v.personId ?? null;
        if (!personId && v.newPerson) {
            // Aynı e-postayla rehberde kayıt varsa yenisi açılmaz, mevcut kişi bağlanır
            const existing = v.newPerson.email ? await prisma.person.findFirst({ where: { OR: [{ email: v.newPerson.email }, { workEmail: v.newPerson.email }] }, select: { id: true } }) : null;
            personId = existing?.id ?? (await PersonService.createPerson({
                firstName: v.newPerson.firstName, lastName: v.newPerson.lastName, email: v.newPerson.email ?? null, phone: v.newPerson.phone ?? null,
                tcNumber: v.newPerson.tcNumber ?? undefined, title: v.position ?? undefined, businessRoles: [v.role === 'FOUNDER' || v.role === 'CO_FOUNDER' ? 'KURUCU' : 'SIRKET_PERSONELI'],
                dataSource: 'MANUAL_ADMIN', status: 'ACTIVE',
            }, { id: actor.id, name: actor.name ?? undefined })).id;
        }
        const membership = await OrganizationService.addPersonnel({
            organizationId, personId: personId!, role: v.role, position: v.position ?? undefined, department: v.department ?? undefined,
            isPrimaryContact: v.isPrimaryContact, isFinanceContact: v.isFinanceContact, isLegalContact: false, isAuthorizedSignatory: v.isAuthorizedSignatory,
        }, { id: actor.id, name: actor.name ?? undefined });
        if (v.employmentType || v.isRdStaff) await prisma.personOrganizationMembership.update({ where: { id: membership.id }, data: { employmentType: v.employmentType ?? undefined, isRdStaff: v.isRdStaff } });
        return { membershipId: membership.id, personId, organizationId };
    }

    /** Ayrılış: üyelik "eski çalışan" olur (silinmez), bitiş tarihi bugün. */
    static async end(entrepreneurId: string, membershipId: string, actor: Actor) {
        const m = await prisma.personOrganizationMembership.findUnique({ where: { id: membershipId } });
        const link = m ? await prisma.entrepreneurOrganization.findFirst({ where: { entrepreneurId, organizationId: m.organizationId } }) : null;
        if (!m || !link) throw new DomainError('Kayıt bu firmaya ait değil.', 404);
        const row = await prisma.personOrganizationMembership.update({ where: { id: membershipId }, data: { status: 'FORMER', endDate: new Date() } });
        await logAuditEvent({ actorId: actor.id, actorName: actor.name ?? undefined, actorEmail: actor.email ?? undefined, action: 'UPDATE', entityType: 'PersonOrganizationMembership', entityId: membershipId, newValues: { status: 'FORMER' }, oldValues: { status: m.status } });
        return row;
    }
}
