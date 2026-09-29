import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createRevision } from '@/lib/revision';

export const SettingService = {
    async getPublicSettings() {
        try {
            const settings = await prisma.siteSetting.findMany({
                where: { isPublic: true },
            });
            const result: Record<string, string> = {};
            for (const s of settings) {
                result[s.key] = s.value;
            }
            return result;
        } catch {
            return {};
        }
    },

    async getAllSettings() {
        return prisma.siteSetting.findMany({
            orderBy: [{ group: 'asc' }, { key: 'asc' }],
        });
    },

    async updateSetting(key: string, value: string, actor?: { id: string; name: string; email: string }) {
        const old = await prisma.siteSetting.findUnique({ where: { key } });

        const updated = await prisma.siteSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });

        // Revision
        await createRevision({
            entityType: 'SiteSetting',
            entityId: key,
            data: { key, value },
            changeSummary: `Updated setting ${key}`,
            authorId: actor?.id,
            authorName: actor?.name,
        });

        // Audit log
        await logAuditEvent({
            actorId: actor?.id,
            actorName: actor?.name,
            action: 'SETTINGS_CHANGE',
            entityType: 'SiteSetting',
            entityId: key,
            oldValues: old ? { value: old.value } : null,
            newValues: { value },
            diff: `Setting "${key}" updated`,
        });

        return updated;
    },

    async getPartners() {
        return prisma.partner.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    },

    async getRedirects() {
        return prisma.redirect.findMany({
            where: { isActive: true },
        });
    }
};
