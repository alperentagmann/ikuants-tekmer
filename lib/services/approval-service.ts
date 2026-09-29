import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export const ApprovalService = {
    async getPendingApprovals(reviewerId?: string) {
        const where: any = { status: 'PENDING' };
        if (reviewerId) {
            where.OR = [{ reviewerId }, { reviewerId: null }];
        }

        return prisma.workflowApproval.findMany({
            where,
            include: {
                requester: { select: { id: true, name: true, email: true, avatarUrl: true } },
                reviewer: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
            orderBy: { submittedAt: 'desc' },
        });
    },

    async requestApproval(params: {
        entityType: string;
        entityId: string;
        entityTitle: string;
        requestedById: string;
        reviewerId?: string;
        requestNote?: string;
    }) {
        const approval = await prisma.workflowApproval.create({
            data: {
                entityType: params.entityType,
                entityId: params.entityId,
                entityTitle: params.entityTitle,
                requestedById: params.requestedById,
                reviewerId: params.reviewerId,
                requestNote: params.requestNote,
                status: 'PENDING',
            },
        });

        // Notify admins / reviewer
        await prisma.notification.create({
            data: {
                userId: params.reviewerId || null,
                title: 'Yeni Onay Talebi',
                message: `"${params.entityTitle}" için yayın onayı talep edildi.`,
                notificationType: 'APPROVAL_REQUESTED',
                targetUrl: `/admin/onaylar?id=${approval.id}`,
            },
        });

        return approval;
    },

    async processApproval(params: {
        approvalId: string;
        action: 'APPROVE' | 'REJECT';
        reviewerId: string;
        reviewerName?: string;
        reviewNote?: string;
    }) {
        const approval = await prisma.workflowApproval.findUnique({
            where: { id: params.approvalId },
        });

        if (!approval) throw new Error('Onay kaydı bulunamadı');

        const newStatus = params.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

        const updated = await prisma.workflowApproval.update({
            where: { id: params.approvalId },
            data: {
                status: newStatus,
                reviewerId: params.reviewerId,
                reviewNote: params.reviewNote,
                reviewedAt: new Date(),
            },
        });

        // Apply published status to the target entity if approved
        if (params.action === 'APPROVE') {
            if (approval.entityType === 'News') {
                await prisma.news.update({
                    where: { id: approval.entityId },
                    data: {
                        status: 'PUBLISHED',
                        approvalStatus: 'APPROVED',
                        approvedById: params.reviewerId,
                        publishedAt: new Date(),
                    },
                });
            } else if (approval.entityType === 'HeroSlide') {
                await prisma.heroSlide.update({
                    where: { id: approval.entityId },
                    data: { status: 'PUBLISHED', isActive: true },
                });
            }
        } else {
            if (approval.entityType === 'News') {
                await prisma.news.update({
                    where: { id: approval.entityId },
                    data: { approvalStatus: 'REJECTED' },
                });
            }
        }

        // Notify requester
        await prisma.notification.create({
            data: {
                userId: approval.requestedById,
                title: params.action === 'APPROVE' ? 'Talebiniz Onaylandı' : 'Talebiniz Reddedildi',
                message: `"${approval.entityTitle}" başlıklı içerik ${params.action === 'APPROVE' ? 'onaylandı ve yayına alındı' : 'reddedildi'}.`,
                notificationType: 'INFO',
                targetUrl: `/admin/onaylar?id=${approval.id}`,
            },
        });

        await logAuditEvent({
            actorId: params.reviewerId,
            actorName: params.reviewerName,
            action: params.action === 'APPROVE' ? 'PUBLISH' : 'UPDATE',
            entityType: approval.entityType,
            entityId: approval.entityId,
            diff: `İçerik onay durumu: ${newStatus}. Not: ${params.reviewNote || '-'}`,
        });

        return updated;
    },
};
