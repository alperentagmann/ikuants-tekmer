/**
 * İKÜANTS TEKMER — Entrepreneur & Mentor Self-Service Portal Service
 * 
 * Provides scoped access for Entrepreneurs to manage their company profile,
 * documents, and milestones; and for Mentors to manage their availability,
 * assigned startups, and session reports.
 */

import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export class PortalService {
    /**
     * Get portal context for authenticated user
     */
    static async getPortalProfile(userId: string) {
        const portalAccount = await prisma.portalAccount.findFirst({
            where: { userId, isActive: true },
            include: {
                entrepreneur: {
                    include: {
                        founderMembers: true,
                        relationalInvestments: true,
                        relationalPatents: true,
                        relationalGrants: true,
                        relationalMilestones: true,
                        relationalDocuments: true,
                    },
                },
                mentor: {
                    include: {
                        mentorPrograms: { include: { program: true } },
                        mentorSessions: {
                            include: { entrepreneur: true },
                            orderBy: { sessionDate: 'desc' },
                        },
                    },
                },
                user: { select: { id: true, name: true, email: true, phone: true } },
            },
        });

        if (portalAccount) {
            await prisma.portalAccount.update({
                where: { id: portalAccount.id },
                data: { lastAccessedAt: new Date() },
            });
        }

        return portalAccount;
    }

    /**
     * Submit entrepreneurial profile updates (scoped to their own company)
     */
    static async updateEntrepreneurProfile(
        entrepreneurId: string,
        userId: string,
        data: {
            website?: string;
            linkedin?: string;
            shortDesc?: string;
            longDesc?: string;
            phone?: string;
        }
    ) {
        // Verify ownership
        const account = await prisma.portalAccount.findFirst({
            where: { userId, entrepreneurId, isActive: true },
        });

        if (!account) {
            throw new Error('Bu girişimci profili üzerinde düzenleme yetkiniz bulunmamaktadır.');
        }

        const updated = await prisma.entrepreneur.update({
            where: { id: entrepreneurId },
            data,
        });

        await logAuditEvent({
            actorId: userId,
            action: 'PORTAL_UPDATE_ENTREPRENEUR',
            entityType: 'Entrepreneur',
            entityId: entrepreneurId,
            diff: JSON.stringify(data),
        });

        return updated;
    }

    /**
     * Submit mentor session report from mentor portal
     */
    static async submitMentorSessionReport(
        mentorId: string,
        userId: string,
        data: {
            entrepreneurId: string;
            sessionDate: Date;
            durationMinutes: number;
            topic: string;
            summaryNotes: string;
            rating?: number;
        }
    ) {
        // Verify mentor ownership
        const account = await prisma.portalAccount.findFirst({
            where: { userId, mentorId, isActive: true },
        });

        if (!account) {
            throw new Error('Bu mentör hesabı üzerinde işlem yetkiniz bulunmamaktadır.');
        }

        const session = await prisma.mentorSession.create({
            data: {
                mentorId,
                entrepreneurId: data.entrepreneurId,
                sessionDate: data.sessionDate,
                durationMinutes: data.durationMinutes,
                topic: data.topic,
                summaryNotes: data.summaryNotes,
                rating: data.rating,
                status: 'COMPLETED',
            },
            include: { entrepreneur: true },
        });

        // Increment mentor total hours
        const hoursToAdd = Number((data.durationMinutes / 60).toFixed(2));
        await prisma.mentor.update({
            where: { id: mentorId },
            data: { totalHours: { increment: hoursToAdd } },
        });

        await logAuditEvent({
            actorId: userId,
            action: 'PORTAL_SUBMIT_MENTOR_SESSION',
            entityType: 'MentorSession',
            entityId: session.id,
            diff: `Recorded session with ${session.entrepreneur.name} (${data.durationMinutes} min)`,
        });

        return session;
    }
}
