import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';

type Actor = { id: string; name: string; email: string };

const TRANSITIONS: Record<string, string[]> = {
    PLANNED: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['ENDED'],
    ENDED: [],
    CANCELLED: [],
};

/** Long-term allocation of a facility (desk/office) to an organization or entrepreneur. */
export const SpaceAssignmentService = {
    async list(params: { status?: string; facilityId?: string; organizationId?: string; entrepreneurId?: string }) {
        return prisma.spaceAssignment.findMany({
            where: {
                status: params.status || undefined,
                facilityId: params.facilityId || undefined,
                organizationId: params.organizationId || undefined,
                entrepreneurId: params.entrepreneurId || undefined,
            },
            include: {
                facility: { select: { id: true, title: true } },
                organization: { select: { id: true, name: true } },
                entrepreneur: { select: { id: true, name: true } },
                application: { select: { id: true, applicationNumber: true } },
                rentContract: { select: { id: true, contractNo: true, status: true } },
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        });
    },

    async create(params: { facilityId: string; organizationId?: string | null; entrepreneurId?: string | null; unitLabel?: string | null; startDate?: string | null; endDate?: string | null; notes?: string | null }, actor: Actor) {
        if (!params.facilityId) throw new DomainError('Alan seçin.');
        if (!params.organizationId && !params.entrepreneurId) throw new DomainError('Kurum veya girişim seçin.');
        const assignment = await prisma.spaceAssignment.create({
            data: {
                facilityId: params.facilityId,
                organizationId: params.organizationId || null,
                entrepreneurId: params.entrepreneurId || null,
                unitLabel: params.unitLabel || null,
                startDate: params.startDate ? new Date(params.startDate) : null,
                endDate: params.endDate ? new Date(params.endDate) : null,
                notes: params.notes || null,
                status: 'PLANNED',
                createdById: actor.id,
            },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'SpaceAssignment', entityId: assignment.id, newValues: { facilityId: params.facilityId, organizationId: params.organizationId, entrepreneurId: params.entrepreneurId } });
        return assignment;
    },

    async update(id: string, params: { status?: string; unitLabel?: string | null; startDate?: string | null; endDate?: string | null; notes?: string | null; rentContractId?: string | null }, actor: Actor) {
        const existing = await prisma.spaceAssignment.findUnique({ where: { id } });
        if (!existing) throw new DomainError('Tahsis bulunamadı.', 404);
        if (params.status && params.status !== existing.status && !(TRANSITIONS[existing.status] || []).includes(params.status)) {
            throw new DomainError(`"${existing.status}" durumundan "${params.status}" durumuna geçilemez.`);
        }
        if (params.status === 'ACTIVE' && !existing.startDate && !params.startDate) throw new DomainError('Aktifleştirmek için başlangıç tarihi girin.');
        if (params.rentContractId) {
            const contract = await prisma.rentContract.findUnique({ where: { id: params.rentContractId } });
            if (!contract) throw new DomainError('Sözleşme bulunamadı.', 404);
        }
        const updated = await prisma.spaceAssignment.update({
            where: { id },
            data: {
                status: params.status || undefined,
                unitLabel: params.unitLabel === undefined ? undefined : params.unitLabel,
                startDate: params.startDate === undefined ? undefined : params.startDate ? new Date(params.startDate) : null,
                endDate: params.endDate === undefined ? (params.status === 'ENDED' && !existing.endDate ? new Date() : undefined) : params.endDate ? new Date(params.endDate) : null,
                notes: params.notes === undefined ? undefined : params.notes,
                rentContractId: params.rentContractId === undefined ? undefined : params.rentContractId,
            },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'SpaceAssignment', entityId: id, oldValues: { status: existing.status, rentContractId: existing.rentContractId }, newValues: { status: updated.status, rentContractId: updated.rentContractId } });
        return updated;
    },
};
