import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export class TerminologyService {
    // In-memory cache for fast UI rendering
    private static cache: Map<string, string> = new Map();
    private static cacheLoadedAt: number = 0;
    private static CACHE_TTL_MS = 60 * 1000; // 1 minute

    /**
     * Get all labels with fallback values
     */
    static async getAllLabels(forceRefresh: boolean = false) {
        const now = Date.now();
        if (!forceRefresh && this.cache.size > 0 && now - this.cacheLoadedAt < this.CACHE_TTL_MS) {
            return Array.from(this.cache.entries()).map(([key, label]) => ({ key, label }));
        }

        const dbRecords = await prisma.terminologyLabel.findMany({
            orderBy: [{ group: 'asc' }, { key: 'asc' }],
        });

        this.cache.clear();
        for (const item of dbRecords) {
            this.cache.set(item.key, item.customLabel || item.defaultLabel);
        }
        this.cacheLoadedAt = now;

        return dbRecords;
    }

    /**
     * Get single label by key with safe fallback
     */
    static async getLabel(key: string, fallback: string): Promise<string> {
        const now = Date.now();
        if (this.cache.size > 0 && now - this.cacheLoadedAt < this.CACHE_TTL_MS) {
            return this.cache.get(key) || fallback;
        }

        const record = await prisma.terminologyLabel.findUnique({
            where: { key },
        });

        const label = record ? (record.customLabel || record.defaultLabel) : fallback;
        this.cache.set(key, label);
        return label;
    }

    /**
     * Update single terminology label
     */
    static async updateLabel(key: string, customLabel: string | null, actorId?: string) {
        const existing = await prisma.terminologyLabel.findUnique({ where: { key } });
        if (!existing) {
            throw new Error(`"${key}" anahtarına sahip terim kaydı bulunamadı.`);
        }

        const updated = await prisma.terminologyLabel.update({
            where: { key },
            data: { customLabel: customLabel ? customLabel.trim() : null },
        });

        this.cache.set(key, updated.customLabel || updated.defaultLabel);

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'TerminologyLabel',
            entityId: updated.id,
            diff: `Updated terminology label for "${key}": "${existing.customLabel || existing.defaultLabel}" -> "${updated.customLabel || updated.defaultLabel}"`,
        });

        return updated;
    }

    /**
     * Bulk update terminology labels
     */
    static async bulkUpdateLabels(items: Array<{ key: string; customLabel: string | null }>, actorId?: string) {
        for (const item of items) {
            await prisma.terminologyLabel.updateMany({
                where: { key: item.key },
                data: { customLabel: item.customLabel ? item.customLabel.trim() : null },
            });
            if (item.customLabel) {
                this.cache.set(item.key, item.customLabel.trim());
            } else {
                this.cache.delete(item.key);
            }
        }

        this.cacheLoadedAt = 0; // Force refresh

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'TerminologyLabel',
            diff: `Bulk updated ${items.length} terminology labels`,
        });

        return { success: true, count: items.length };
    }

    /**
     * Reset a label back to default
     */
    static async resetLabel(key: string, actorId?: string) {
        return this.updateLabel(key, null, actorId);
    }
}
