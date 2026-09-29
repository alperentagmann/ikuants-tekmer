import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { addTimelineEvent } from '@/lib/timeline';
import { maskTcNumber } from '@/lib/utils';

import { APPLICATION_STATUSES } from '@/lib/constants/application';
export { APPLICATION_STATUSES };


export async function generateApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.application.count();
    const sequence = String(count + 1).padStart(6, '0');
    return `ANTS-${year}-${sequence}`;
}

export const ApplicationService = {
    async submitPublicApplication(params: {
        formVersionId: string;
        programId?: string;
        answers: Record<string, any>; // { fieldKey: value } or { fieldId: value }
        applicantName: string;
        companyName?: string;
        email: string;
        phone?: string;
        tcNumber?: string;
        idempotencyKey?: string;
        ipAddress?: string;
        userAgent?: string;
        isTest?: boolean;
    }) {
        // Idempotency check
        if (params.idempotencyKey) {
            const existing = await prisma.submission.findUnique({
                where: { idempotencyKey: params.idempotencyKey },
                include: { application: true },
            });
            if (existing && existing.application) {
                return existing.application;
            }
        }

        // Duplicate warning detection
        let duplicateWarning: string | null = null;
        const duplicateMatches = await prisma.application.findFirst({
            where: {
                OR: [
                    { email: params.email },
                    params.phone ? { phone: params.phone } : {},
                ].filter(Boolean),
            },
        });

        if (duplicateMatches) {
            duplicateWarning = `Aynı e-posta/telefon ile mevcut başvuru var: ${duplicateMatches.applicationNumber}`;
        }

        const appNumber = await generateApplicationNumber();
        const subNumber = `SUB-${Date.now().toString().slice(-6)}`;

        // Fetch version fields to map relational answers
        const version = await prisma.formVersion.findUnique({
            where: { id: params.formVersionId },
            include: { fields: true },
        });

        if (!version) throw new Error('Form version not found');

        const submission = await prisma.submission.create({
            data: {
                formVersionId: params.formVersionId,
                submissionNumber: subNumber,
                isTest: params.isTest || false,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                idempotencyKey: params.idempotencyKey,
                rawSnapshot: JSON.stringify(params.answers),
            },
        });

        // Insert relational answers
        for (const field of version.fields) {
            const val = params.answers[field.fieldKey] ?? params.answers[field.id];
            if (val !== undefined && val !== null) {
                let textVal: string | null = null;
                let numVal: number | null = null;
                let jsonVal: string | null = null;

                if (typeof val === 'number') {
                    numVal = val;
                    textVal = String(val);
                } else if (typeof val === 'object') {
                    jsonVal = JSON.stringify(val);
                } else {
                    textVal = String(val);
                }

                await prisma.submissionAnswer.create({
                    data: {
                        submissionId: submission.id,
                        fieldId: field.id,
                        fieldKey: field.fieldKey,
                        fieldLabel: field.label,
                        textValue: textVal,
                        numValue: numVal,
                        jsonValue: jsonVal,
                    },
                });
            }
        }

        const application = await prisma.application.create({
            data: {
                applicationNumber: appNumber,
                formVersionId: params.formVersionId,
                submissionId: submission.id,
                programId: params.programId,
                applicantName: params.applicantName,
                companyName: params.companyName,
                email: params.email,
                phone: params.phone,
                tcNumberMasked: maskTcNumber(params.tcNumber),
                tcNumberEncrypted: params.tcNumber, // Can be protected with app encryption
                status: 'NEW',
                duplicateWarning,
            },
        });

        // Add Initial Timeline Event
        await addTimelineEvent({
            entityType: 'Application',
            entityId: application.id,
            title: 'Başvuru Alındı',
            description: `${appNumber} numaralı başvuru sisteme kaydedildi.`,
            eventType: 'STATUS_CHANGE',
        });

        return application;
    },

    async getAdminApplications(params?: {
        search?: string;
        status?: string;
        programId?: string;
        assignedToId?: string;
        page?: number;
        limit?: number;
    }) {
        const { search, status, programId, assignedToId, page = 1, limit = 50 } = params || {};
        const where: any = { isArchived: false };

        if (status) where.status = status;
        if (programId) where.programId = programId;
        if (assignedToId) where.assignedToId = assignedToId;
        if (search) {
            where.OR = [
                { applicationNumber: { contains: search, mode: 'insensitive' } },
                { applicantName: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.application.findMany({
                where,
                include: {
                    program: { select: { name: true, slug: true } },
                    assignedTo: { select: { id: true, name: true, email: true } },
                    evaluations: { select: { totalScore: true, isCompleted: true } },
                    _count: { select: { notes: true, files: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.application.count({ where }),
        ]);

        const sanitizedItems = items.map((item: any) => {
            const { tcNumberEncrypted, ...rest } = item;
            return rest;
        });

        return { items: sanitizedItems, total, page, totalPages: Math.ceil(total / limit) };
    },

    async getApplicationDetails(id: string) {
        return prisma.application.findUnique({
            where: { id },
            include: {
                program: true,
                assignedTo: true,
                formVersion: {
                    include: {
                        form: true,
                        fields: { orderBy: { sortOrder: 'asc' } },
                    },
                },
                submission: {
                    include: {
                        answers: {
                            include: { field: true },
                        },
                    },
                },
                statusHistory: { orderBy: { createdAt: 'desc' } },
                notes: {
                    include: { author: { select: { name: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                files: { orderBy: { createdAt: 'desc' } },
                evaluations: {
                    include: {
                        evaluator: { select: { id: true, name: true } },
                        scores: { include: { criterion: true } },
                    },
                },
            },
        });
    },

    async updateStatus(params: {
        applicationId: string;
        toStatus: string;
        reason?: string;
        actor?: { id: string; name: string; email: string; ip?: string; userAgent?: string };
    }) {
        const app = await prisma.application.findUnique({ where: { id: params.applicationId } });
        if (!app) throw new Error('Application not found');

        const fromStatus = app.status;
        if (fromStatus === params.toStatus) return app;

        const updated = await prisma.application.update({
            where: { id: params.applicationId },
            data: { status: params.toStatus },
        });

        await prisma.applicationStatusHistory.create({
            data: {
                applicationId: params.applicationId,
                fromStatus,
                toStatus: params.toStatus,
                reason: params.reason,
                changedById: params.actor?.id,
                changedByName: params.actor?.name,
            },
        });

        await addTimelineEvent({
            entityType: 'Application',
            entityId: params.applicationId,
            title: `Durum Değiştirildi: ${params.toStatus}`,
            description: `${params.actor?.name || 'Sistem'} tarafından durum "${fromStatus}" -> "${params.toStatus}" olarak güncellendi.`,
            eventType: 'STATUS_CHANGE',
            actorId: params.actor?.id,
            actorName: params.actor?.name,
        });

        await logAuditEvent({
            actorId: params.actor?.id,
            actorEmail: params.actor?.email,
            actorName: params.actor?.name,
            action: 'UPDATE',
            entityType: 'Application',
            entityId: params.applicationId,
            fieldName: 'status',
            oldValues: { status: fromStatus },
            newValues: { status: params.toStatus },
            diff: `Status changed from ${fromStatus} to ${params.toStatus}`,
            ipAddress: params.actor?.ip,
            userAgent: params.actor?.userAgent,
        });

        return updated;
    },

    async addInternalNote(params: {
        applicationId: string;
        noteText: string;
        mentions?: string[];
        fileUrl?: string;
        actor: { id: string; name: string; email: string };
    }) {
        const note = await prisma.applicationNote.create({
            data: {
                applicationId: params.applicationId,
                authorId: params.actor.id,
                authorName: params.actor.name,
                noteText: params.noteText,
                mentions: params.mentions ? JSON.stringify(params.mentions) : null,
                fileUrl: params.fileUrl,
                isInternal: true,
            },
        });

        await prisma.application.update({
            where: { id: params.applicationId },
            data: { internalNotesCount: { increment: 1 } },
        });

        await addTimelineEvent({
            entityType: 'Application',
            entityId: params.applicationId,
            title: 'Dahili Not Eklendi',
            description: `${params.actor.name}: ${params.noteText.slice(0, 100)}...`,
            eventType: 'NOTE_ADDED',
            actorId: params.actor.id,
            actorName: params.actor.name,
        });

        return note;
    }
};
