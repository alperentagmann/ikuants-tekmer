import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';

type Actor = UserWithPermissions & { id: string; name: string; email: string };

const OPEN = ['TODO', 'IN_PROGRESS', 'IN_REVIEW'];
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function slugify(name: string) {
    const map: Record<string, string> = { ı: 'i', ğ: 'g', ü: 'u', ş: 's', ö: 'o', ç: 'c', İ: 'i' };
    return name.replace(/[ıİğüşöç]/g, (c) => map[c] || c).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || `ekip-${Date.now().toString(36)}`;
}

function assertManage(actor: Actor) {
    if (!actor.isSuperAdmin && !hasPermission(actor, 'manage', 'teams')) throw new DomainError('Ekip yönetimi için teams:manage izni gerekir.', 403);
}

export interface TeamInput {
    name?: string;
    description?: string | null;
    color?: string;
    icon?: string | null;
    leadUserId?: string | null;
    members?: { userId: string; role?: 'LEAD' | 'MEMBER' }[];
}

/**
 * Departments / teams (Yönetim, Uzmanlar, Muhasebe, Kurumsal İletişim, Tanıtım…). Tasks can belong
 * to a team; team boards, workload and reports are filtered by it.
 */
export const WorkTeamService = {
    async list() {
        const now = new Date();
        const since = new Date(now.getTime() - 30 * 86400000);
        const teams = await prisma.workTeam.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: {
                lead: { select: { id: true, name: true, avatarUrl: true, title: true } },
                members: { include: { user: { select: { id: true, name: true, avatarUrl: true, title: true, isActive: true } } }, orderBy: { createdAt: 'asc' } },
            },
        });
        const ids = teams.map((t) => t.id);
        const [open, overdue, done] = await Promise.all([
            prisma.task.groupBy({ by: ['teamId'], where: { teamId: { in: ids }, isArchived: false, status: { in: OPEN } }, _count: true }),
            prisma.task.groupBy({ by: ['teamId'], where: { teamId: { in: ids }, isArchived: false, status: { in: OPEN }, dueDate: { lt: now } }, _count: true }),
            prisma.task.groupBy({ by: ['teamId'], where: { teamId: { in: ids }, isArchived: false, status: 'DONE', completedAt: { gte: since } }, _count: true }),
        ]);
        const count = (rows: { teamId: string | null; _count: number }[], id: string) => rows.find((r) => r.teamId === id)?._count || 0;
        return teams.map((t) => ({
            id: t.id, name: t.name, slug: t.slug, description: t.description, color: t.color, icon: t.icon, sortOrder: t.sortOrder,
            lead: t.lead,
            members: t.members.filter((m) => m.user.isActive).map((m) => ({ userId: m.userId, role: m.role, name: m.user.name, avatarUrl: m.user.avatarUrl, title: m.user.title })),
            openTasks: count(open, t.id), overdueTasks: count(overdue, t.id), doneLast30: count(done, t.id),
        }));
    },

    async create(input: TeamInput, actor: Actor) {
        assertManage(actor);
        const name = (input.name || '').trim();
        if (name.length < 2) throw new DomainError('Ekip adı en az 2 karakter olmalıdır.');
        let slug = slugify(name);
        if (await prisma.workTeam.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
        const team = await prisma.workTeam.create({
            data: {
                name, slug,
                description: input.description?.trim() || null,
                color: input.color && HEX.test(input.color) ? input.color : '#7c3aed',
                icon: input.icon || null,
                leadUserId: input.leadUserId || null,
                members: { create: WorkTeamService.normalizeMembers(input.members || [], input.leadUserId) },
            },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'WorkTeam', entityId: team.id, newValues: { name, members: (input.members || []).length } });
        return team;
    },

    async update(id: string, input: TeamInput, actor: Actor) {
        assertManage(actor);
        const before = await prisma.workTeam.findUnique({ where: { id }, include: { members: true } });
        if (!before) throw new DomainError('Ekip bulunamadı.', 404);
        const leadUserId = input.leadUserId === undefined ? before.leadUserId : input.leadUserId || null;
        await prisma.$transaction(async (tx) => {
            await tx.workTeam.update({
                where: { id },
                data: {
                    name: input.name?.trim() || undefined,
                    description: input.description === undefined ? undefined : input.description?.trim() || null,
                    color: input.color && HEX.test(input.color) ? input.color : undefined,
                    icon: input.icon === undefined ? undefined : input.icon || null,
                    leadUserId,
                },
            });
            if (input.members) {
                await tx.workTeamMember.deleteMany({ where: { teamId: id } });
                const members = WorkTeamService.normalizeMembers(input.members, leadUserId);
                if (members.length) await tx.workTeamMember.createMany({ data: members.map((m) => ({ ...m, teamId: id })) });
            }
        });
        await logAuditEvent({
            actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'WorkTeam', entityId: id,
            oldValues: { name: before.name, leadUserId: before.leadUserId, members: before.members.map((m) => m.userId) },
            newValues: { name: input.name ?? before.name, leadUserId, members: input.members?.map((m) => m.userId) },
        });
    },

    async archive(id: string, actor: Actor) {
        assertManage(actor);
        const team = await prisma.workTeam.update({ where: { id }, data: { isActive: false } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'ARCHIVE', entityType: 'WorkTeam', entityId: id, oldValues: { name: team.name } });
    },

    /** The lead is always a member; duplicates are dropped. */
    normalizeMembers(members: { userId: string; role?: string }[], leadUserId?: string | null) {
        const map = new Map<string, 'LEAD' | 'MEMBER'>();
        for (const m of members) if (typeof m.userId === 'string' && m.userId) map.set(m.userId, m.role === 'LEAD' ? 'LEAD' : 'MEMBER');
        if (leadUserId) map.set(leadUserId, 'LEAD');
        return Array.from(map.entries()).map(([userId, role]) => ({ userId, role }));
    },

    async leadsOf(teamId: string): Promise<string[]> {
        const team = await prisma.workTeam.findUnique({ where: { id: teamId }, select: { leadUserId: true, members: { where: { role: 'LEAD' }, select: { userId: true } } } });
        if (!team) return [];
        return Array.from(new Set([...(team.leadUserId ? [team.leadUserId] : []), ...team.members.map((m) => m.userId)]));
    },
};
