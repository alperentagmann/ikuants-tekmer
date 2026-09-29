import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export class UndoService {
    /**
     * Restore / Undo a recently archived or soft-deleted entity
     */
    static async undoAction(entityType: string, entityId: string, actorId?: string) {
        const type = entityType.toUpperCase();

        switch (type) {
            case 'ENTREPRENEUR':
                await prisma.entrepreneur.update({
                    where: { id: entityId },
                    data: { isArchived: false, status: 'ACTIVE' },
                });
                break;
            case 'MENTOR':
                await prisma.mentor.update({
                    where: { id: entityId },
                    data: { isArchived: false, isActive: true },
                });
                break;
            case 'PROGRAM':
                await prisma.program.update({
                    where: { id: entityId },
                    data: { isArchived: false },
                });
                break;
            case 'NEWS':
                await prisma.news.update({
                    where: { id: entityId },
                    data: { isArchived: false },
                });
                break;
            case 'EVENT':
                await prisma.event.update({
                    where: { id: entityId },
                    data: { isArchived: false },
                });
                break;
            case 'HEROSLIDE':
                await prisma.heroSlide.update({
                    where: { id: entityId },
                    data: { isArchived: false, isActive: true },
                });
                break;
            default:
                throw new Error(`"${entityType}" varlığı için geri alma işlemi desteklenmiyor.`);
        }

        await logAuditEvent({
            actorId,
            action: 'RESTORE',
            entityType,
            entityId,
            diff: `Undid archive action and restored ${entityType} record ID ${entityId}`,
        });

        return { success: true, message: `${entityType} kaydı başarıyla geri yüklendi.` };
    }
}
