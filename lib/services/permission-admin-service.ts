import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';

type Actor = UserWithPermissions & { id: string; name: string; email: string };
export type OverrideState = 'inherit' | 'grant' | 'deny';

/** Only super admins and holders of roles:manage edit roles and personal permissions. */
function assertCanManage(actor: Actor) {
    if (!actor.isSuperAdmin && !hasPermission(actor, 'manage', 'roles')) throw new DomainError('Yetki yönetimi için roles:manage izni gerekir.', 403);
}

/** A non-super admin can only hand out permissions they hold themselves. */
function assertCanGrant(actor: Actor, perms: { action: string; resource: string }[]) {
    if (actor.isSuperAdmin) return;
    const missing = perms.filter((p) => !hasPermission(actor, p.action, p.resource));
    if (missing.length) throw new DomainError(`Sahip olmadığınız izinleri veremezsiniz: ${missing.map((p) => `${p.resource}:${p.action}`).join(', ')}`, 403);
}

export const PermissionAdminService = {
    async catalog() {
        return prisma.permission.findMany({ select: { id: true, action: true, resource: true, description: true }, orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
    },

    /** Role permissions of a user plus personal overrides (grant / deny). */
    async userState(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, name: true, email: true, isSuperAdmin: true,
                userRoles: { select: { role: { select: { id: true, name: true, slug: true, permissions: { select: { permissionId: true } } } } } },
                userPermissions: { select: { permissionId: true, isGranted: true } },
            },
        });
        if (!user) throw new DomainError('Kullanıcı bulunamadı.', 404);
        return {
            user: { id: user.id, name: user.name, email: user.email, isSuperAdmin: user.isSuperAdmin },
            roles: user.userRoles.map((ur) => ({ id: ur.role.id, name: ur.role.name, slug: ur.role.slug })),
            rolePermissionIds: Array.from(new Set(user.userRoles.flatMap((ur) => ur.role.permissions.map((p) => p.permissionId)))),
            overrides: user.userPermissions.map((p) => ({ permissionId: p.permissionId, state: (p.isGranted ? 'grant' : 'deny') as OverrideState })),
        };
    },

    async setUserOverrides(userId: string, overrides: { permissionId: string; state: OverrideState }[], actor: Actor) {
        assertCanManage(actor);
        const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, isSuperAdmin: true } });
        if (!target) throw new DomainError('Kullanıcı bulunamadı.', 404);
        if (target.isSuperAdmin) throw new DomainError('Süper Yöneticinin yetkileri kısıtlanamaz veya genişletilemez.');
        if (target.id === actor.id && !actor.isSuperAdmin) throw new DomainError('Kendi yetkilerinizi değiştiremezsiniz.', 403);

        const clean = overrides.filter((o) => ['inherit', 'grant', 'deny'].includes(o.state) && typeof o.permissionId === 'string');
        const perms = await prisma.permission.findMany({ where: { id: { in: clean.map((o) => o.permissionId) } }, select: { id: true, action: true, resource: true } });
        const byId = new Map(perms.map((p) => [p.id, p]));
        assertCanGrant(actor, clean.filter((o) => o.state === 'grant').map((o) => byId.get(o.permissionId)).filter((p): p is { id: string; action: string; resource: string } => Boolean(p)));

        const before = await prisma.userPermission.findMany({ where: { userId }, select: { permissionId: true, isGranted: true } });
        await prisma.$transaction(async (tx) => {
            for (const o of clean) {
                if (!byId.has(o.permissionId)) continue;
                if (o.state === 'inherit') await tx.userPermission.deleteMany({ where: { userId, permissionId: o.permissionId } });
                else await tx.userPermission.upsert({ where: { userId_permissionId: { userId, permissionId: o.permissionId } }, update: { isGranted: o.state === 'grant' }, create: { userId, permissionId: o.permissionId, isGranted: o.state === 'grant' } });
            }
        });
        const after = await prisma.userPermission.findMany({ where: { userId }, select: { permissionId: true, isGranted: true } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'ROLE_CHANGE', entityType: 'User', entityId: userId, oldValues: { overrides: before }, newValues: { overrides: after }, diff: `Kişisel yetkiler güncellendi: ${target.email}` });
        return this.userState(userId);
    },

    async createRole(input: { name: string; description?: string | null; permissionIds: string[] }, actor: Actor) {
        assertCanManage(actor);
        const name = input.name.trim();
        if (name.length < 2) throw new DomainError('Rol adı en az 2 karakter olmalıdır.');
        const slug = name.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || `rol-${Date.now().toString(36)}`;
        if (await prisma.role.findFirst({ where: { OR: [{ slug }, { name }] } })) throw new DomainError('Bu adda bir rol zaten var.');
        const perms = await prisma.permission.findMany({ where: { id: { in: input.permissionIds } }, select: { id: true, action: true, resource: true } });
        assertCanGrant(actor, perms);
        const role = await prisma.role.create({ data: { name, slug, description: input.description?.trim() || null, isSystem: false, permissions: { create: perms.map((p) => ({ permissionId: p.id })) } } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'Role', entityId: role.id, newValues: { name, permissions: perms.map((p) => `${p.resource}:${p.action}`) } });
        return role;
    },

    async updateRole(roleId: string, input: { name?: string; description?: string | null; permissionIds?: string[] }, actor: Actor) {
        assertCanManage(actor);
        const role = await prisma.role.findUnique({ where: { id: roleId }, include: { permissions: { include: { permission: true } } } });
        if (!role) throw new DomainError('Rol bulunamadı.', 404);
        if (role.slug === 'super-admin') throw new DomainError('Süper Yönetici rolü değiştirilemez.');
        let perms: { id: string; action: string; resource: string }[] | null = null;
        if (input.permissionIds) {
            perms = await prisma.permission.findMany({ where: { id: { in: input.permissionIds } }, select: { id: true, action: true, resource: true } });
            const existing = new Set(role.permissions.map((p) => p.permissionId));
            assertCanGrant(actor, perms.filter((p) => !existing.has(p.id)));
        }
        await prisma.$transaction(async (tx) => {
            await tx.role.update({ where: { id: roleId }, data: { name: input.name?.trim() || undefined, description: input.description === undefined ? undefined : input.description?.trim() || null } });
            if (perms) {
                await tx.rolePermission.deleteMany({ where: { roleId } });
                if (perms.length) await tx.rolePermission.createMany({ data: perms.map((p) => ({ roleId, permissionId: p.id })) });
            }
        });
        await logAuditEvent({
            actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'Role', entityId: roleId,
            oldValues: { name: role.name, permissions: role.permissions.map((p) => `${p.permission.resource}:${p.permission.action}`) },
            newValues: { name: input.name ?? role.name, permissions: perms ? perms.map((p) => `${p.resource}:${p.action}`) : undefined },
        });
        return prisma.role.findUnique({ where: { id: roleId }, include: { permissions: { include: { permission: true } }, _count: { select: { userRoles: true } } } });
    },

    async deleteRole(roleId: string, actor: Actor) {
        assertCanManage(actor);
        const role = await prisma.role.findUnique({ where: { id: roleId }, include: { _count: { select: { userRoles: true } } } });
        if (!role) throw new DomainError('Rol bulunamadı.', 404);
        if (role.isSystem) throw new DomainError('Sistem rolleri silinemez; izinlerini düzenleyebilirsiniz.');
        if (role._count.userRoles > 0) throw new DomainError('Bu role atanmış kullanıcılar var. Önce kullanıcıları başka role taşıyın.');
        await prisma.role.delete({ where: { id: roleId } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'DELETE', entityType: 'Role', entityId: roleId, oldValues: { name: role.name } });
    },
};
