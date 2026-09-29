import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { addTimelineEvent } from '@/lib/timeline';

export interface ContactData {
    requestType?: string; // MESSAGE, MEETING, VISIT
    fullName: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
    meetingTopic?: string;
    meetWith?: string;
    meetingDate?: string;
    meetingTime?: string;
    visitTopic?: string;
    visitWho?: string;
    visitDate?: string;
    visitTime?: string;
    groupSize?: string;
    notes?: string;
}

export const ContactService = {
    async submitPublicContact(data: ContactData) {
        const item = await prisma.contactRequest.create({
            data: {
                requestType: data.requestType || 'MESSAGE',
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                company: data.company,
                message: data.message,
                meetingTopic: data.meetingTopic,
                meetWith: data.meetWith,
                meetingDate: data.meetingDate,
                meetingTime: data.meetingTime,
                visitTopic: data.visitTopic,
                visitWho: data.visitWho,
                visitDate: data.visitDate,
                visitTime: data.visitTime,
                groupSize: data.groupSize,
                notes: data.notes,
                status: 'NEW',
            },
        });

        await addTimelineEvent({
            entityType: 'ContactRequest',
            entityId: item.id,
            title: `Yeni ${item.requestType} Talebi Alındı`,
            description: `${item.fullName} (${item.email}) talep oluşturdu.`,
            eventType: 'STATUS_CHANGE',
        });

        return item;
    },

    async getAdminContacts(params?: {
        requestType?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const { requestType, status, search, page = 1, limit = 50 } = params || {};
        const where: any = { isArchived: false };

        if (requestType) where.requestType = requestType;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.contactRequest.findMany({
                where,
                include: { assignedTo: { select: { id: true, name: true, email: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.contactRequest.count({ where }),
        ]);

        return { items, total, page, totalPages: Math.ceil(total / limit) };
    },

    async updateStatus(id: string, status: string, actor?: { id: string; name: string; email: string }) {
        const old = await prisma.contactRequest.findUnique({ where: { id } });
        if (!old) throw new Error('Contact request not found');

        const updated = await prisma.contactRequest.update({
            where: { id },
            data: { status },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'ContactRequest',
            entityId: id,
            oldValues: { status: old.status },
            newValues: { status },
            diff: `Contact request status changed from ${old.status} to ${status}`,
        });

        return updated;
    },

    async assignStaff(id: string, assignedToId: string | null, actor?: { id: string; name: string; email: string }) {
        const updated = await prisma.contactRequest.update({
            where: { id },
            data: { assignedToId },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorName: actor?.name,
            action: 'UPDATE',
            entityType: 'ContactRequest',
            entityId: id,
            diff: `Assigned contact request to user ID ${assignedToId}`,
        });

        return updated;
    }
};
