import type { PrismaClient } from '@prisma/client';
import { SYSTEM_PERMISSIONS, DEFAULT_ROLES } from '@/lib/rbac';

/**
 * Canonical, additive synchronization of permissions and default roles.
 *
 * - Creates permissions listed in SYSTEM_PERMISSIONS that do not exist yet.
 * - Creates default roles (matched by slug) that do not exist yet.
 * - Attaches the default permissions of each default role when missing.
 *
 * It never deletes permissions, roles or role-permission links, so changes made by
 * administrators in the Roles screen are preserved. Safe to run on every deploy.
 */
export async function syncRbacDefinitions(prisma: PrismaClient, options: { dryRun?: boolean } = {}) {
    const report = { permissionsCreated: 0, rolesCreated: 0, linksCreated: 0 };
    const wanted = new Map<string, { action: string; resource: string; description: string }>();

    for (const p of SYSTEM_PERMISSIONS) wanted.set(`${p.action}:${p.resource}`, p);
    for (const role of DEFAULT_ROLES) {
        for (const p of role.permissions) {
            const key = `${p.action}:${p.resource}`;
            if (!wanted.has(key)) wanted.set(key, { ...p, description: `${p.resource} — ${p.action}` });
        }
    }

    const permissionIds = new Map<string, string>();
    for (const [key, p] of wanted) {
        let record = await prisma.permission.findUnique({ where: { action_resource: { action: p.action, resource: p.resource } } });
        if (!record) {
            report.permissionsCreated++;
            if (!options.dryRun) {
                record = await prisma.permission.create({ data: { action: p.action, resource: p.resource, description: p.description } });
            }
        }
        if (record) permissionIds.set(key, record.id);
    }

    for (const role of DEFAULT_ROLES) {
        let record = await prisma.role.findUnique({ where: { slug: role.slug } });
        if (!record) {
            const nameTaken = await prisma.role.findUnique({ where: { name: role.name } });
            report.rolesCreated++;
            if (!options.dryRun) {
                record = await prisma.role.create({
                    data: { name: nameTaken ? `${role.name} (${role.slug})` : role.name, slug: role.slug, description: role.description, isSystem: role.isSystem },
                });
            }
        }
        if (!record) continue;

        for (const p of role.permissions) {
            const permissionId = permissionIds.get(`${p.action}:${p.resource}`);
            if (!permissionId) continue;
            const exists = await prisma.rolePermission.findUnique({ where: { roleId_permissionId: { roleId: record.id, permissionId } } });
            if (!exists) {
                report.linksCreated++;
                if (!options.dryRun) await prisma.rolePermission.create({ data: { roleId: record.id, permissionId } });
            }
        }
    }

    return report;
}
