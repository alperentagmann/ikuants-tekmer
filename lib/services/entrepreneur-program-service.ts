import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { assignmentLabel } from '@/lib/program-track';

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
        /** Program row; null for TEKMER yer edinme or an "other" track (then programLabel is required). */
        programId?: string | null;
        programLabel?: string | null;
        cohort?: string;
        status?: string;
        joinedAt?: Date | string;
        notes?: string;
        isPublic?: boolean;
    }, actorId?: string) {
        const entrepreneur = await prisma.entrepreneur.findUnique({ where: { id: data.entrepreneurId } });
        if (!entrepreneur) throw new Error('Girişimci bulunamadı');

        const program = data.programId ? await prisma.program.findUnique({ where: { id: data.programId } }) : null;
        if (data.programId && !program) throw new Error('Program bulunamadı');
        const programLabel = program ? null : (data.programLabel || '').trim();
        if (!program && !programLabel) throw new Error('Program seçin veya "Diğer" için program adını yazın');
        const trackName = program?.name || programLabel!;

        const assignment = await prisma.entrepreneurProgram.create({
            data: {
                entrepreneurId: data.entrepreneurId,
                programId: program?.id || null,
                programLabel,
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
                data: { program: trackName },
            });
        }

        await logAuditEvent({
            actorId,
            action: 'ASSIGN',
            entityType: 'EntrepreneurProgram',
            entityId: assignment.id,
            newValues: {
                entrepreneurName: entrepreneur.name,
                programName: trackName,
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

        // Program history is never deleted: the assignment is closed as WITHDRAWN.
        const deleted = await prisma.entrepreneurProgram.update({
            where: { id },
            data: { status: 'WITHDRAWN', leftAt: existing.leftAt || new Date(), isPublic: false },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'EntrepreneurProgram',
            entityId: id,
            oldValues: {
                entrepreneurName: existing.entrepreneur.name,
                programName: assignmentLabel(existing),
                status: existing.status,
            },
            newValues: { status: 'WITHDRAWN' },
            diff: `Program ataması sonlandırıldı (kayıt korunur): ${existing.entrepreneur.name} — ${assignmentLabel(existing)}`,
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
