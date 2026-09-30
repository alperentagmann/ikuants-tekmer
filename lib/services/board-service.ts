import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface BoardMemberData {
    fullName: string;
    title: string;
    organization?: string;
    duty?: string;
    boardType?: 'YONETIM' | 'DEGERLENDIRME' | 'DANISMA';
    imageUrl?: string;
    imageStyle?: string;
    bio?: string;
    email?: string;
    linkedin?: string;
    sortOrder?: number;
    isActive?: boolean;
    isPublished?: boolean;
}

export const BoardService = {
    async getPublicBoardMembers(boardType?: string) {
        try {
            const where: any = { isActive: true, isPublished: true };
            if (boardType) where.boardType = boardType.toUpperCase();

            return await prisma.boardMember.findMany({
                where,
                orderBy: { sortOrder: 'asc' },
            });
        } catch (error) {
            console.error('Error fetching public board members:', error);
            return [];
        }
    },

    async getAdminBoardMembers(boardType?: string) {
        const where: any = {};
        if (boardType) where.boardType = boardType.toUpperCase();

        return prisma.boardMember.findMany({
            where,
            orderBy: [{ boardType: 'asc' }, { sortOrder: 'asc' }],
        });
    },

    async getBoardMemberById(id: string) {
        return prisma.boardMember.findUnique({ where: { id } });
    },

    async createBoardMember(data: BoardMemberData, actor?: any) {
        const member = await prisma.boardMember.create({
            data: {
                fullName: data.fullName,
                title: data.title,
                organization: data.organization,
                duty: data.duty,
                boardType: data.boardType || 'YONETIM',
                imageUrl: data.imageUrl,
                imageStyle: data.imageStyle,
                bio: data.bio,
                email: data.email,
                linkedin: data.linkedin,
                sortOrder: data.sortOrder ?? 0,
                isActive: data.isActive ?? true,
                isPublished: data.isPublished ?? true,
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'CREATE',
            entityType: 'BoardMember',
            entityId: member.id,
            newValues: member,
        });

        return member;
    },

    async updateBoardMember(id: string, data: Partial<BoardMemberData>, actor?: any) {
        const oldMember = await prisma.boardMember.findUnique({ where: { id } });
        const { id: _id, createdAt: _c, updatedAt: _u, ...cleanData } = data as any;
        const member = await prisma.boardMember.update({
            where: { id },
            data: cleanData,
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'UPDATE',
            entityType: 'BoardMember',
            entityId: id,
            oldValues: oldMember,
            newValues: member,
        });

        return member;
    },

    async deleteBoardMember(id: string, actor?: any) {
        const oldMember = await prisma.boardMember.findUnique({ where: { id } });
        const member = await prisma.boardMember.delete({ where: { id } });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'DELETE',
            entityType: 'BoardMember',
            entityId: id,
            oldValues: oldMember,
        });

        return member;
    },

    async reorderBoardMembers(orderedIds: string[], actor?: any) {
        const updates = orderedIds.map((id, index) =>
            prisma.boardMember.update({
                where: { id },
                data: { sortOrder: index },
            })
        );
        const result = await prisma.$transaction(updates);

        await logAuditEvent({
            actorId: actor?.id,
            action: 'REORDER',
            entityType: 'BoardMember',
            newValues: { orderedIds },
        });

        return result;
    }
};
