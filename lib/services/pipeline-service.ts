import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreatePipelineStatusInput {
    moduleKey: string; // APPLICATION, TASK, PROJECT, ACTIVITY
    statusKey: string;
    displayLabel: string;
    colorCode?: string;
    sortOrder?: number;
    isInitial?: boolean;
    isTerminal?: boolean;
    allowedTransitions?: string[];
    actorId?: string;
}

export class PipelineService {
    /**
     * Get all statuses for a module
     */
    static async getStatuses(moduleKey: string) {
        return prisma.pipelineStatus.findMany({
            where: { moduleKey, isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }

    /**
     * Create a new pipeline status
     */
    static async createStatus(input: CreatePipelineStatusInput) {
        const statusKey = input.statusKey.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

        const existing = await prisma.pipelineStatus.findUnique({
            where: {
                moduleKey_statusKey: {
                    moduleKey: input.moduleKey,
                    statusKey,
                },
            },
        });

        if (existing) {
            throw new Error(`"${input.moduleKey}" modülünde "${statusKey}" durumu zaten mevcut.`);
        }

        const created = await prisma.pipelineStatus.create({
            data: {
                moduleKey: input.moduleKey,
                statusKey,
                displayLabel: input.displayLabel,
                colorCode: input.colorCode || '#6366f1',
                sortOrder: input.sortOrder || 0,
                isInitial: input.isInitial || false,
                isTerminal: input.isTerminal || false,
                allowedTransitions: input.allowedTransitions ? JSON.stringify(input.allowedTransitions) : null,
            },
        });

        await logAuditEvent({
            actorId: input.actorId,
            action: 'CREATE',
            entityType: 'PipelineStatus',
            entityId: created.id,
            diff: `Created status "${input.displayLabel}" (${statusKey}) for module ${input.moduleKey}`,
        });

        return created;
    }

    /**
     * Update pipeline status
     */
    static async updateStatus(id: string, data: Partial<CreatePipelineStatusInput>, actorId?: string) {
        const updated = await prisma.pipelineStatus.update({
            where: { id },
            data: {
                displayLabel: data.displayLabel,
                colorCode: data.colorCode,
                sortOrder: data.sortOrder,
                isInitial: data.isInitial,
                isTerminal: data.isTerminal,
                allowedTransitions: data.allowedTransitions ? JSON.stringify(data.allowedTransitions) : undefined,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'PipelineStatus',
            entityId: id,
            diff: `Updated pipeline status ${updated.statusKey} on module ${updated.moduleKey}`,
        });

        return updated;
    }

    /**
     * Delete pipeline status
     */
    static async deleteStatus(id: string, actorId?: string) {
        const status = await prisma.pipelineStatus.findUnique({ where: { id } });
        if (!status) throw new Error('Durum bulunamadı.');

        await prisma.pipelineStatus.delete({ where: { id } });

        await logAuditEvent({
            actorId,
            action: 'DELETE',
            entityType: 'PipelineStatus',
            entityId: id,
            diff: `Deleted pipeline status ${status.statusKey} from module ${status.moduleKey}`,
        });

        return { success: true };
    }

    /**
     * Validate status transition
     */
    static async validateTransition(moduleKey: string, fromStatus: string, toStatus: string): Promise<boolean> {
        if (fromStatus === toStatus) return true;

        const currentStatus = await prisma.pipelineStatus.findUnique({
            where: {
                moduleKey_statusKey: { moduleKey, statusKey: fromStatus },
            },
        });

        if (!currentStatus || !currentStatus.allowedTransitions) {
            // If no specific transitions configured, allow transition by default
            return true;
        }

        try {
            const allowed = JSON.parse(currentStatus.allowedTransitions) as string[];
            return allowed.includes(toStatus);
        } catch {
            return true;
        }
    }
}
