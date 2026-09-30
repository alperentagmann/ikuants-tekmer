import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export class EntrepreneurProgramService {
    static async getEntrepreneurPrograms(entrepreneurId: string) {
        return prisma.entrepreneurProgram.findMany({
            where: { entrepreneurId },
            include: {
                program: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        programType: true,
                        duration: true,
                        colorCode: true,
                        logoUrl: true,
                        coverUrl: true,
                    },
                },
                assignedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: [{ joinedAt: 'desc' }, { createdAt: 'desc' }],
        });
    }

    static async assignProgram(data: {
        entrepreneurId: string;
        programId: string;
        cohort?: string;
        status?: string;
        joinedAt?: Date | string;
        notes?: string;
        isPublic?: boolean;
    }, actorId?: string) {
        const entrepreneur = await prisma.entrepreneur.findUnique({ where: { id: data.entrepreneurId } });
        if (!entrepreneur) throw new Error('Girişimci bulunamadı');

        const program = await prisma.program.findUnique({ where: { id: data.programId } });
        if (!program) throw new Error('Program bulunamadı');

        const assignment = await prisma.entrepreneurProgram.create({
            data: {
                entrepreneurId: data.entrepreneurId,
                programId: data.programId,
                cohort: data.cohort || null,
                status: data.status || 'ACTIVE',
                joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
                notes: data.notes || null,
                isPublic: data.isPublic !== undefined ? data.isPublic : true,
                assignedById: actorId || null,
            },
            include: {
                program: { select: { id: true, name: true, slug: true } },
                entrepreneur: { select: { id: true, name: true } },
            },
        });

        // Also update the legacy program field on entrepreneur if empty or requested
        if (!entrepreneur.program) {
            await prisma.entrepreneur.update({
                where: { id: data.entrepreneurId },
                data: { program: program.name },
            });
        }

        await logAuditEvent({
            actorId,
            action: 'ASSIGN',
            entityType: 'EntrepreneurProgram',
            entityId: assignment.id,
            newValues: {
                entrepreneurName: entrepreneur.name,
                programName: program.name,
                status: assignment.status,
                cohort: assignment.cohort,
            },
        });

        return assignment;
    }

    static async updateAssignmentStatus(id: string, data: {
        status?: string;
        cohort?: string;
        completedAt?: Date | string | null;
        leftAt?: Date | string | null;
        notes?: string;
        isPublic?: boolean;
    }, actorId?: string) {
        const existing = await prisma.entrepreneurProgram.findUnique({
            where: { id },
            include: {
                entrepreneur: { select: { name: true } },
                program: { select: { name: true } },
            },
        });
        if (!existing) throw new Error('Program atama kaydı bulunamadı');

        const updateData: any = {};
        if (data.status !== undefined) updateData.status = data.status;
        if (data.cohort !== undefined) updateData.cohort = data.cohort;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

        if (data.completedAt !== undefined) {
            updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;
        }
        if (data.leftAt !== undefined) {
            updateData.leftAt = data.leftAt ? new Date(data.leftAt) : null;
        }

        if (data.status === 'COMPLETED' && !data.completedAt) {
            updateData.completedAt = new Date();
        }
        if (data.status === 'WITHDRAWN' && !data.leftAt) {
            updateData.leftAt = new Date();
        }

        const updated = await prisma.entrepreneurProgram.update({
            where: { id },
            data: updateData,
            include: {
                program: { select: { id: true, name: true, slug: true } },
                entrepreneur: { select: { id: true, name: true } },
            },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'EntrepreneurProgram',
            entityId: id,
            oldValues: { status: existing.status },
            newValues: { status: updated.status },
        });

        return updated;
    }

    static async removeProgramAssignment(id: string, actorId?: string) {
        const existing = await prisma.entrepreneurProgram.findUnique({
            where: { id },
            include: {
                entrepreneur: { select: { name: true } },
                program: { select: { name: true } },
            },
        });
        if (!existing) throw new Error('Program atama kaydı bulunamadı');

        // We can update status to WITHDRAWN or hard delete depending on admin choice
        const deleted = await prisma.entrepreneurProgram.delete({ where: { id } });

        await logAuditEvent({
            actorId,
            action: 'DELETE',
            entityType: 'EntrepreneurProgram',
            entityId: id,
            oldValues: {
                entrepreneurName: existing.entrepreneur.name,
                programName: existing.program.name,
                status: existing.status,
            },
        });

        return { success: true, deleted };
    }

    static async getProgramAssignedEntrepreneurs(programId: string, publicOnly: boolean = false) {
        const where: any = { programId };
        if (publicOnly) {
            where.isPublic = true;
            where.status = { in: ['ACTIVE', 'ACCEPTED', 'COMPLETED'] };
            where.entrepreneur = { isPublished: true, isArchived: false };
        }

        return prisma.entrepreneurProgram.findMany({
            where,
            include: {
                entrepreneur: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logoUrl: true,
                        sector: true,
                        shortDesc: true,
                        status: true,
                        website: true,
                    },
                },
            },
            orderBy: [{ joinedAt: 'desc' }],
        });
    }
}
