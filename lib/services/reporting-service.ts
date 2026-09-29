import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface ReportFilterConfig {
    source: string; // tasks, applications, entrepreneurs, mentors, programs, trainings, events, activities, projects, news, social
    fields?: string[];
    dateFrom?: string | Date;
    dateTo?: string | Date;
    status?: string;
    department?: string;
    groupBy?: string;
}

export const ReportingService = {
    // 1. Kullanıcı Günlük Raporu (Daily Operational Auto-Draft)
    async generateDailyReportData(userId: string, targetDate = new Date()) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const [
            user,
            completedTasks,
            createdTasks,
            todayEvents,
            activities,
            newsAuthored,
            auditActions,
        ] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, email: true, department: true, title: true },
            }),
            prisma.task.findMany({
                where: {
                    createdById: userId,
                    status: 'DONE',
                    updatedAt: { gte: startOfDay, lte: endOfDay },
                },
                select: { id: true, title: true, priority: true, updatedAt: true },
            }).catch(() => []),
            prisma.task.findMany({
                where: {
                    createdById: userId,
                    createdAt: { gte: startOfDay, lte: endOfDay },
                },
                select: { id: true, title: true, status: true, priority: true },
            }).catch(() => []),
            prisma.event.findMany({
                where: {
                    startDate: { gte: startOfDay, lte: endOfDay },
                },
                select: { id: true, title: true, eventType: true, startDate: true, location: true },
            }).catch(() => []),
            prisma.corporateActivity.findMany({
                where: {
                    activityDate: { gte: startOfDay, lte: endOfDay },
                },
                select: { id: true, title: true, category: true, description: true },
            }).catch(() => []),
            prisma.news.findMany({
                where: {
                    createdAt: { gte: startOfDay, lte: endOfDay },
                },
                select: { id: true, title: true, status: true },
            }).catch(() => []),
            prisma.auditLog.findMany({
                where: {
                    actorId: userId,
                    createdAt: { gte: startOfDay, lte: endOfDay },
                },
                select: { id: true, action: true, entityType: true, diff: true, createdAt: true },
                take: 20,
            }).catch(() => []),
        ]);

        const completedTaskTitles = completedTasks.map((t) => t.title);
        const meetingTitles = todayEvents.map((e) => e.title);
        const activityTitles = activities.map((a) => `${a.category}: ${a.title}`);
        const newsTitles = newsAuthored.map((n) => n.title);

        const autoSummaryText = [
            `Bugün ${completedTasks.length} adet görev tamamlandı.`,
            todayEvents.length > 0 ? `${todayEvents.length} adet toplantı/etkinlik oturumu gerçekleştirildi.` : null,
            activities.length > 0 ? `${activities.length} kurumsal faaliyet işlendi.` : null,
            newsAuthored.length > 0 ? `${newsAuthored.length} adet haber/içerik hazırlandı.` : null,
        ].filter(Boolean).join(' ');

        return {
            date: startOfDay.toISOString().split('T')[0],
            user,
            department: user?.department || 'Operasyon',
            completedTasks,
            createdTasks,
            todayEvents,
            activities,
            newsAuthored,
            auditActionsCount: auditActions.length,
            autoSummaryText,
            defaultDraft: {
                completedWorks: completedTaskTitles.join('\n') || '(Tamamlanan görev bulunmuyor)',
                inProgressWorks: createdTasks.filter((t) => t.status !== 'DONE').map((t) => t.title).join('\n') || '(Devam eden iş bulunmuyor)',
                meetings: meetingTitles.join('\n') || '(Toplantı kaydı bulunmuyor)',
                importantDevelopments: [...activityTitles, ...newsTitles].join('\n') || '(Önemli gelişme kaydedilmedi)',
                risks: '',
                tomorrowPlans: '',
            },
        };
    },

    // 2. Aylık Kullanıcı Raporu
    async generateMonthlyUserReportData(userId: string, month: number, year: number) {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        const [
            user,
            completedTasksCount,
            createdTasksCount,
            overdueTasksCount,
            eventsCount,
            activitiesCount,
            authoredNewsCount,
        ] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, email: true, department: true, title: true },
            }),
            prisma.task.count({
                where: {
                    createdById: userId,
                    status: 'DONE',
                    updatedAt: { gte: startOfMonth, lte: endOfMonth },
                },
            }).catch(() => 0),
            prisma.task.count({
                where: {
                    createdById: userId,
                    createdAt: { gte: startOfMonth, lte: endOfMonth },
                },
            }).catch(() => 0),
            prisma.task.count({
                where: {
                    createdById: userId,
                    status: { notIn: ['DONE', 'CANCELLED'] },
                    dueDate: { lt: endOfMonth },
                },
            }).catch(() => 0),
            prisma.event.count({
                where: {
                    startDate: { gte: startOfMonth, lte: endOfMonth },
                },
            }).catch(() => 0),
            prisma.corporateActivity.count({
                where: {
                    activityDate: { gte: startOfMonth, lte: endOfMonth },
                },
            }).catch(() => 0),
            prisma.news.count({
                where: {
                    createdAt: { gte: startOfMonth, lte: endOfMonth },
                },
            }).catch(() => 0),
        ]);

        return {
            period: `${year}-${String(month).padStart(2, '0')}`,
            user,
            metrics: {
                completedTasksCount,
                createdTasksCount,
                overdueTasksCount,
                eventsCount,
                activitiesCount,
                authoredNewsCount,
            },
            generatedAt: new Date(),
        };
    },

    // 3. Super Admin Yıllık Kurumsal Rapor (10 Bölüm)
    async generateYearlyCorporateReportData(year: number) {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

        const [
            totalEntrepreneurs,
            newEntrepreneursThisYear,
            entrepreneursBySector,
            totalMentors,
            totalPrograms,
            totalTrainings,
            totalEvents,
            totalApplications,
            applicationsByStatus,
            totalProjects,
            totalActivities,
            totalNews,
            socialMediaPosts,
            socialNewsConverted,
        ] = await Promise.all([
            // 1. Girişimcilik
            prisma.entrepreneur.count(),
            prisma.entrepreneur.count({
                where: { createdAt: { gte: startOfYear, lte: endOfYear } },
            }),
            prisma.entrepreneur.groupBy({
                by: ['sector'],
                _count: { id: true },
            }).catch(() => []),
            // 2. Mentörlük
            prisma.mentor.count(),
            // 3. Programlar
            prisma.program.count({ where: { isArchived: false } }),
            // 4. Eğitimler
            prisma.training.count({
                where: { startDate: { gte: startOfYear, lte: endOfYear } },
            }).catch(() => 0),
            // 5. Etkinlikler
            prisma.event.count({
                where: { startDate: { gte: startOfYear, lte: endOfYear } },
            }).catch(() => 0),
            // 6. Başvurular
            prisma.application.count({
                where: { createdAt: { gte: startOfYear, lte: endOfYear } },
            }).catch(() => 0),
            prisma.application.groupBy({
                by: ['status'],
                _count: { id: true },
                where: { createdAt: { gte: startOfYear, lte: endOfYear } },
            }).catch(() => []),
            // 7. Projeler
            prisma.project.count().catch(() => 0),
            // 8. Faaliyetler
            prisma.corporateActivity.count({
                where: { activityDate: { gte: startOfYear, lte: endOfYear } },
            }).catch(() => 0),
            // 9. Dijital İçerik (Haberler)
            prisma.news.count({
                where: { createdAt: { gte: startOfYear, lte: endOfYear } },
            }).catch(() => 0),
            // 10. Sosyal Medya
            prisma.socialPost.count({
                where: { postDate: { gte: startOfYear, lte: endOfYear } },
            }).catch(() => 0),
            prisma.socialPost.count({
                where: {
                    postDate: { gte: startOfYear, lte: endOfYear },
                    syncStatus: { in: ['DRAFT_CREATED', 'PUBLISHED'] },
                },
            }).catch(() => 0),
        ]);

        return {
            year,
            title: `${year} İKÜANTS TEKMER Yıllık Kurumsal Faaliyet Raporu`,
            executiveSummary: `${year} yılı boyunca İKÜANTS TEKMER ekosisteminde toplam ${totalEntrepreneurs} girişimciye ev sahipliği yapılmış, ${newEntrepreneursThisYear} yeni girişim kuluçka ve hızlandırma süreçlerine dahil edilmiştir. ${totalMentors} aktif mentör ile girişimcilerimize destek sağlanmış, ${totalEvents} etkinlik ve ${totalTrainings} eğitim oturumu gerçekleştirilmiştir.`,
            sections: {
                entrepreneurship: {
                    totalEntrepreneurs,
                    newEntrepreneursThisYear,
                    sectors: entrepreneursBySector.map((s) => ({ sector: s.sector, count: s._count.id })),
                },
                mentorship: {
                    totalActiveMentors: totalMentors,
                },
                programs: {
                    activeProgramsCount: totalPrograms,
                },
                trainings: {
                    totalTrainingsThisYear: totalTrainings,
                },
                events: {
                    totalEventsThisYear: totalEvents,
                },
                applications: {
                    totalApplicationsThisYear: totalApplications,
                    statusBreakdown: applicationsByStatus.map((st) => ({ status: st.status, count: st._count.id })),
                },
                projects: {
                    activeProjectsCount: totalProjects,
                },
                corporateActivities: {
                    totalActivitiesThisYear: totalActivities,
                },
                digitalContent: {
                    totalNewsPublished: totalNews,
                },
                socialMedia: {
                    totalPostsIngested: socialMediaPosts,
                    convertedToNewsCount: socialNewsConverted,
                },
            },
            dataFreshness: new Date().toISOString(),
        };
    },

    // 4. Sosyal Medya Raporu
    async generateSocialMediaReportData() {
        const [totalAccounts, totalPosts, statusBreakdown, recentPosts] = await Promise.all([
            prisma.socialAccount.findMany({
                select: { id: true, provider: true, accountName: true, isActive: true, lastSyncAt: true },
            }),
            prisma.socialPost.count(),
            prisma.socialPost.groupBy({
                by: ['syncStatus'],
                _count: { id: true },
            }),
            prisma.socialPost.findMany({
                orderBy: { postDate: 'desc' },
                take: 10,
                select: { id: true, caption: true, postDate: true, syncStatus: true, mediaType: true, permalink: true },
            }),
        ]);

        return {
            totalAccounts,
            totalPosts,
            statusBreakdown: statusBreakdown.map((s) => ({ status: s.syncStatus, count: s._count.id })),
            recentPosts,
            generatedAt: new Date(),
        };
    },

    // 5. Custom Report Builder Query
    async queryCustomReport(config: ReportFilterConfig) {
        const { source, dateFrom, dateTo, status, limit = 50 } = config as any;
        const where: any = {};

        const dateField = source === 'tasks' ? 'createdAt' : source === 'events' ? 'startDate' : 'createdAt';
        if (dateFrom || dateTo) {
            where[dateField] = {};
            if (dateFrom) where[dateField].gte = new Date(dateFrom);
            if (dateTo) where[dateField].lte = new Date(dateTo);
        }

        if (status) {
            where.status = status;
        }

        let items: any[] = [];
        let totalCount = 0;

        switch (source) {
            case 'entrepreneurs':
                [items, totalCount] = await Promise.all([
                    prisma.entrepreneur.findMany({ where, take: limit }),
                    prisma.entrepreneur.count({ where }),
                ]);
                break;
            case 'mentors':
                [items, totalCount] = await Promise.all([
                    prisma.mentor.findMany({ where, take: limit }),
                    prisma.mentor.count({ where }),
                ]);
                break;
            case 'applications':
                [items, totalCount] = await Promise.all([
                    prisma.application.findMany({ where, take: limit }),
                    prisma.application.count({ where }),
                ]);
                break;
            case 'events':
                [items, totalCount] = await Promise.all([
                    prisma.event.findMany({ where, take: limit }),
                    prisma.event.count({ where }),
                ]);
                break;
            case 'tasks':
            default:
                [items, totalCount] = await Promise.all([
                    prisma.task.findMany({ where, take: limit }),
                    prisma.task.count({ where }),
                ]);
                break;
        }

        return { source, items, totalCount, generatedAt: new Date() };
    },

    // 6. Report CRUD & Workflow
    async saveReport(
        data: {
            title: string;
            reportType: string;
            periodStart: Date | string;
            periodEnd: Date | string;
            executiveSummary?: string;
            contentJson?: any;
            metricsJson?: any;
            department?: string;
            status?: string;
        },
        userId: string,
        actor?: { id: string; name: string; email: string }
    ) {
        function slugify(text: string) {
            return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
        }

        const slug = `${slugify(data.title)}-${Date.now().toString().slice(-4)}`;

        const report = await prisma.operationalReport.create({
            data: {
                title: data.title,
                slug,
                reportType: data.reportType,
                periodStart: new Date(data.periodStart),
                periodEnd: new Date(data.periodEnd),
                authorId: userId,
                department: data.department,
                status: data.status || 'DRAFT',
                executiveSummary: data.executiveSummary,
                contentJson: data.contentJson ? JSON.stringify(data.contentJson) : null,
                metricsJson: data.metricsJson ? JSON.stringify(data.metricsJson) : null,
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'CREATE',
            entityType: 'OperationalReport',
            entityId: report.id,
            diff: `REPORT_CREATED: "${report.title}" (${report.reportType})`,
        });

        return report;
    },

    async getAllReports(filter?: { reportType?: string; status?: string; authorId?: string }) {
        const where: any = {};
        if (filter?.reportType) where.reportType = filter.reportType;
        if (filter?.status) where.status = filter.status;
        if (filter?.authorId) where.authorId = filter.authorId;

        return prisma.operationalReport.findMany({
            where,
            include: {
                author: { select: { id: true, name: true, email: true, department: true } },
                approvedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    async getReportById(id: string) {
        return prisma.operationalReport.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true, email: true, department: true } },
                approvedBy: { select: { id: true, name: true } },
            },
        });
    },

    async approveReport(id: string, approverId: string, actor?: { id: string; name: string; email: string }) {
        const updated = await prisma.operationalReport.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedById: approverId,
                approvedAt: new Date(),
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'APPROVE',
            entityType: 'OperationalReport',
            entityId: id,
            diff: `REPORT_APPROVED: "${updated.title}" by ${approverId}`,
        });

        return updated;
    },
};
