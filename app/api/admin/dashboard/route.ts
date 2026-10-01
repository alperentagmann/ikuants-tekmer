import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentAdminUser();
        if (!user) return NextResponse.json({ success: false }, { status: 401 });

        const [
            totalEntrepreneurs,
            activeEntrepreneurs,
            totalMentors,
            activeMentors,
            totalApplications,
            newApplications,
            underReviewApplications,
            acceptedApplications,
            rejectedApplications,
            totalContacts,
            newContacts,
            recentAuditLogs,
            recentNews,
            mentorsWithoutPhoto,
            draftNews,
            totalPrograms,
            activePrograms,
            activeRentContracts,
            pendingTasksCount,
            recentApplications,
        ] = await Promise.all([
            prisma.entrepreneur.count({ where: { isArchived: false } }).catch(() => 0),
            prisma.entrepreneur.count({ where: { status: 'ACTIVE', isArchived: false } }).catch(() => 0),
            prisma.mentor.count({ where: { isArchived: false } }).catch(() => 0),
            prisma.mentor.count({ where: { isActive: true, isArchived: false } }).catch(() => 0),
            prisma.application.count({ where: { isArchived: false } }).catch(() => 0),
            prisma.application.count({ where: { status: 'NEW', isArchived: false } }).catch(() => 0),
            prisma.application.count({ where: { status: { in: ['PRE_REVIEW', 'UNDER_EVALUATION', 'JURY'] }, isArchived: false } }).catch(() => 0),
            prisma.application.count({ where: { status: 'ACCEPTED', isArchived: false } }).catch(() => 0),
            prisma.application.count({ where: { status: 'REJECTED', isArchived: false } }).catch(() => 0),
            prisma.contactRequest.count({ where: { isArchived: false } }).catch(() => 0),
            prisma.contactRequest.count({ where: { status: 'NEW', isArchived: false } }).catch(() => 0),
            prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 8,
            }).catch(() => []),
            prisma.news.findMany({
                where: { isArchived: false },
                include: { category: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }).catch(() => []),
            prisma.mentor.count({ where: { imageUrl: null, isArchived: false } }).catch(() => 0),
            prisma.news.count({ where: { status: 'DRAFT', isArchived: false } }),
            prisma.program.count({ where: { isArchived: false } }).catch(() => 0),
            prisma.program.count({ where: { applyStatus: 'OPEN', isArchived: false } }).catch(() => 0),
            prisma.rentContract.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
            prisma.task.count({ where: { status: { not: 'COMPLETED' }, isArchived: false } }).catch(() => 0),
            prisma.application.findMany({
                where: { isArchived: false },
                orderBy: { createdAt: 'desc' },
                take: 6,
                include: {
                    program: { select: { name: true } },
                }
            }).catch(() => []),
        ]);

        // Status breakdown
        const applicationStatusCounts = {
            NEW: newApplications,
            IN_REVIEW: underReviewApplications,
            ACCEPTED: acceptedApplications,
            REJECTED: rejectedApplications,
        };

        // Attention needed items
        const attentionItems = [];
        if (newApplications > 0) {
            attentionItems.push({
                type: 'application',
                title: `${newApplications} yeni başvuru inceleme bekliyor`,
                actionUrl: '/admin/basvurular?status=NEW',
                severity: 'high',
            });
        }
        if (newContacts > 0) {
            attentionItems.push({
                type: 'contact',
                title: `${newContacts} cevap bekleyen iletişim talebi var`,
                actionUrl: '/admin/iletisim?status=NEW',
                severity: 'high',
            });
        }
        if (mentorsWithoutPhoto > 0) {
            attentionItems.push({
                type: 'mentor',
                title: `${mentorsWithoutPhoto} mentörün profil fotoğrafı eksik`,
                actionUrl: '/admin/mentorler',
                severity: 'medium',
            });
        }
        if (draftNews > 0) {
            attentionItems.push({
                type: 'news',
                title: `${draftNews} haber taslak aşamasında bekliyor`,
                actionUrl: '/admin/haberler?status=DRAFT',
                severity: 'low',
            });
        }

        return NextResponse.json({
            success: true,
            metrics: {
                totalEntrepreneurs,
                activeEntrepreneurs,
                totalMentors,
                activeMentors,
                totalApplications,
                newApplications,
                underReviewApplications,
                acceptedApplications,
                rejectedApplications,
                totalContacts,
                newContacts,
                totalPrograms,
                activePrograms,
                activeRentContracts,
                pendingTasksCount,
            },
            applicationStatusCounts,
            attentionItems,
            recentAuditLogs,
            recentNews,
            recentApplications: recentApplications.map(app => ({
                id: app.id,
                applicantName: app.applicantName,
                applicantEmail: app.email,
                companyName: app.companyName,
                programName: app.program?.name,
                status: app.status,
                createdAt: app.createdAt,
            })),
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ success: false, message: 'Veriler alınamadı' }, { status: 500 });
    }
}
