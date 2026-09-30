import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface TeamMemberData {
    fullName: string;
    title: string;
    department?: string;
    bio?: string;
    imageUrl?: string;
    linkedin?: string;
    email?: string;
    phone?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export const TeamService = {
    async getPublicTeamMembers() {
        try {
            return await prisma.teamMember.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
            });
        } catch (error) {
            console.error('Error fetching public team members:', error);
            return [];
        }
    },

    async getAdminTeamMembers() {
        return prisma.teamMember.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    },

    async getTeamMemberById(id: string) {
        return prisma.teamMember.findUnique({ where: { id } });
    },

    async createTeamMember(data: TeamMemberData, actor?: any) {
        const member = await prisma.teamMember.create({
            data: {
                fullName: data.fullName,
                title: data.title,
                department: data.department || 'OPERASYON',
                bio: data.bio,
                imageUrl: data.imageUrl,
                linkedin: data.linkedin,
                email: data.email,
                phone: data.phone,
                sortOrder: data.sortOrder ?? 0,
                isActive: data.isActive ?? true,
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'CREATE',
            entityType: 'TeamMember',
            entityId: member.id,
            newValues: member,
        });

        return member;
    },

    async updateTeamMember(id: string, data: Partial<TeamMemberData>, actor?: any) {
        const oldMember = await prisma.teamMember.findUnique({ where: { id } });
        const { id: _id, createdAt: _c, updatedAt: _u, ...cleanData } = data as any;
        const member = await prisma.teamMember.update({
            where: { id },
            data: cleanData,
        });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'UPDATE',
            entityType: 'TeamMember',
            entityId: id,
            oldValues: oldMember,
            newValues: member,
        });

        return member;
    },

    async deleteTeamMember(id: string, actor?: any) {
        const oldMember = await prisma.teamMember.findUnique({ where: { id } });
        const member = await prisma.teamMember.delete({ where: { id } });

        await logAuditEvent({
            actorId: actor?.id,
            action: 'DELETE',
            entityType: 'TeamMember',
            entityId: id,
            oldValues: oldMember,
        });

        return member;
    },

    async reorderTeamMembers(orderedIds: string[], actor?: any) {
        const updates = orderedIds.map((id, index) =>
            prisma.teamMember.update({
                where: { id },
                data: { sortOrder: index },
            })
        );
        const result = await prisma.$transaction(updates);

        await logAuditEvent({
            actorId: actor?.id,
            action: 'REORDER',
            entityType: 'TeamMember',
            newValues: { orderedIds },
        });

        return result;
    }
};
