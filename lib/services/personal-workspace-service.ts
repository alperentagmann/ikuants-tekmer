import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface PersonalTodoInput {
    title: string;
    description?: string;
    dueDate?: Date | string;
    dueTime?: string;
    priority?: string;
    category?: string;
    reminderDate?: Date | string;
    reminderChannel?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
}

export interface PersonalNoteInput {
    title: string;
    content: string;
    isShared?: boolean;
    sharedWithRoles?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    isPinned?: boolean;
    color?: string;
}

export interface UserReminderInput {
    title: string;
    description?: string;
    remindAt: Date | string;
    channel?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    actionUrl?: string;
}

export const PersonalWorkspaceService = {
    // 1. Benim Günüm (Daily Hub Summary)
    async getMyDaySummary(userId: string) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [
            todayTodos,
            overdueTodos,
            assignedTasks,
            overdueTasks,
            todayEvents,
            upcomingEvents,
            pendingApprovals,
            recentApplications,
            recentNotifications,
            activeReminders,
            personalNotes,
            recentItems,
            favorites,
        ] = await Promise.all([
            // 1. Today's private to-dos
            prisma.personalTodo.findMany({
                where: {
                    userId,
                    isCompleted: false,
                    dueDate: { gte: todayStart, lte: todayEnd },
                },
                orderBy: { priority: 'desc' },
            }),
            // 2. Overdue private to-dos
            prisma.personalTodo.findMany({
                where: {
                    userId,
                    isCompleted: false,
                    dueDate: { lt: todayStart },
                },
                orderBy: { dueDate: 'asc' },
            }),
            // 3. Assigned tasks due today
            prisma.task.findMany({
                where: {
                    createdById: userId,
                    status: { notIn: ['DONE', 'CANCELLED'] },
                    dueDate: { gte: todayStart, lte: todayEnd },
                },
                take: 10,
            }).catch(() => []),
            // 4. Overdue assigned tasks
            prisma.task.findMany({
                where: {
                    createdById: userId,
                    status: { notIn: ['DONE', 'CANCELLED'] },
                    dueDate: { lt: todayStart },
                },
                take: 10,
            }).catch(() => []),
            // 5. Today's meetings/events
            prisma.event.findMany({
                where: {
                    startDate: { gte: todayStart, lte: todayEnd },
                },
                orderBy: { startDate: 'asc' },
                take: 10,
            }).catch(() => []),
            // 6. Upcoming events (next 7 days)
            prisma.event.findMany({
                where: {
                    startDate: { gt: todayEnd },
                },
                orderBy: { startDate: 'asc' },
                take: 5,
            }).catch(() => []),
            // 7. Pending approvals
            prisma.workflowApproval.findMany({
                where: {
                    status: 'PENDING',
                },
                take: 5,
            }).catch(() => []),
            // 8. Recent new applications
            prisma.application.findMany({
                where: {
                    status: 'DRAFT',
                },
                select: { id: true, applicationNumber: true, companyName: true, applicantName: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }).catch(() => []),
            // 9. Recent in-app notifications
            prisma.notification.findMany({
                where: {
                    userId,
                    isRead: false,
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }).catch(() => []),
            // 10. Active reminders
            prisma.userReminder.findMany({
                where: {
                    userId,
                    isTriggered: false,
                    remindAt: { lte: todayEnd },
                },
                orderBy: { remindAt: 'asc' },
            }),
            // 11. Pinned or recent personal notes
            prisma.personalNote.findMany({
                where: { userId },
                orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
                take: 6,
            }),
            // 12. Recent viewed items
            prisma.recentItem.findMany({
                where: { userId },
                orderBy: { viewedAt: 'desc' },
                take: 10,
            }),
            // 13. Favorites
            prisma.userFavorite.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);

        return {
            todayTodos,
            overdueTodos,
            assignedTasks,
            overdueTasks,
            todayEvents,
            upcomingEvents,
            pendingApprovals,
            recentApplications,
            recentNotifications,
            activeReminders,
            personalNotes,
            recentItems,
            favorites,
            summaryStats: {
                totalTodayTodos: todayTodos.length,
                totalOverdueTodos: overdueTodos.length,
                totalAssignedTasks: assignedTasks.length,
                totalTodayMeetings: todayEvents.length,
                totalPendingApprovals: pendingApprovals.length,
                totalNewApplications: recentApplications.length,
                totalUnreadNotifications: recentNotifications.length,
            },
        };
    },

    // 2. Kişisel To-Do CRUD & Convert to Task
    async getTodos(userId: string, filter?: { completed?: boolean; category?: string }) {
        const where: any = { userId };
        if (filter?.completed !== undefined) where.isCompleted = filter.completed;
        if (filter?.category) where.category = filter.category;

        return prisma.personalTodo.findMany({
            where,
            orderBy: [{ isCompleted: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }],
        });
    },

    async createTodo(userId: string, data: PersonalTodoInput) {
        return prisma.personalTodo.create({
            data: {
                userId,
                title: data.title,
                description: data.description,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                dueTime: data.dueTime,
                priority: data.priority || 'MEDIUM',
                category: data.category || 'GENERAL',
                reminderDate: data.reminderDate ? new Date(data.reminderDate) : null,
                reminderChannel: data.reminderChannel || 'IN_APP',
                relatedEntityType: data.relatedEntityType,
                relatedEntityId: data.relatedEntityId,
            },
        });
    },

    async toggleTodo(id: string, userId: string) {
        const existing = await prisma.personalTodo.findFirst({ where: { id, userId } });
        if (!existing) throw new Error('To-do bulunamadı.');

        const isCompleted = !existing.isCompleted;
        return prisma.personalTodo.update({
            where: { id },
            data: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
            },
        });
    },

    async convertTodoToTask(id: string, userId: string, actor?: { id: string; name: string; email: string }) {
        const todo = await prisma.personalTodo.findFirst({ where: { id, userId } });
        if (!todo) throw new Error('To-do bulunamadı.');

        const task = await prisma.task.create({
            data: {
                title: todo.title,
                description: todo.description || 'Kişisel To-Do listesinden dönüştürüldü.',
                priority: todo.priority || 'MEDIUM',
                status: todo.isCompleted ? 'DONE' : 'TODO',
                dueDate: todo.dueDate,
                createdById: userId,
            },
        });

        await prisma.personalTodo.update({
            where: { id },
            data: { convertedTaskId: task.id },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'CREATE',
            entityType: 'Task',
            entityId: task.id,
            diff: `TODO_CONVERTED_TO_TASK: "${todo.title}" -> Task ID ${task.id}`,
        });

        return task;
    },

    async deleteTodo(id: string, userId: string) {
        return prisma.personalTodo.deleteMany({
            where: { id, userId },
        });
    },

    // 3. Hızlı Notlar (Personal & Shared Notes)
    async getNotes(userId: string, includeShared = true) {
        const where: any = includeShared
            ? { OR: [{ userId }, { isShared: true }] }
            : { userId };

        return prisma.personalNote.findMany({
            where,
            orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        });
    },

    async createNote(userId: string, data: PersonalNoteInput) {
        return prisma.personalNote.create({
            data: {
                userId,
                title: data.title,
                content: data.content,
                isShared: data.isShared || false,
                sharedWithRoles: data.sharedWithRoles,
                relatedEntityType: data.relatedEntityType,
                relatedEntityId: data.relatedEntityId,
                isPinned: data.isPinned || false,
                color: data.color || '#0f172a',
            },
        });
    },

    async updateNote(id: string, userId: string, data: Partial<PersonalNoteInput>) {
        return prisma.personalNote.updateMany({
            where: { id, userId },
            data,
        });
    },

    async deleteNote(id: string, userId: string) {
        return prisma.personalNote.deleteMany({
            where: { id, userId },
        });
    },

    // 4. Hatırlatma Merkezi
    async createReminder(userId: string, data: UserReminderInput) {
        return prisma.userReminder.create({
            data: {
                userId,
                title: data.title,
                description: data.description,
                remindAt: new Date(data.remindAt),
                channel: data.channel || 'IN_APP',
                relatedEntityType: data.relatedEntityType,
                relatedEntityId: data.relatedEntityId,
                actionUrl: data.actionUrl,
            },
        });
    },

    async getReminders(userId: string) {
        return prisma.userReminder.findMany({
            where: { userId },
            orderBy: [{ isTriggered: 'asc' }, { remindAt: 'asc' }],
        });
    },

    async dismissReminder(id: string, userId: string) {
        return prisma.userReminder.updateMany({
            where: { id, userId },
            data: { isTriggered: true, triggeredAt: new Date() },
        });
    },

    // 5. Favoriler & Son Görüntülenenler
    async toggleFavorite(userId: string, item: { entityType: string; entityId: string; title: string; url: string }) {
        const existing = await prisma.userFavorite.findUnique({
            where: {
                userId_entityType_entityId: {
                    userId,
                    entityType: item.entityType,
                    entityId: item.entityId,
                },
            },
        });

        if (existing) {
            await prisma.userFavorite.delete({ where: { id: existing.id } });
            return { favorited: false };
        } else {
            const created = await prisma.userFavorite.create({
                data: {
                    userId,
                    entityType: item.entityType,
                    entityId: item.entityId,
                    title: item.title,
                    url: item.url,
                },
            });
            return { favorited: true, favorite: created };
        }
    },

    async trackRecentItem(userId: string, item: { entityType: string; entityId: string; title: string; url: string }) {
        return prisma.recentItem.upsert({
            where: {
                userId_entityType_entityId: {
                    userId,
                    entityType: item.entityType,
                    entityId: item.entityId,
                },
            },
            create: {
                userId,
                entityType: item.entityType,
                entityId: item.entityId,
                title: item.title,
                url: item.url,
                viewedAt: new Date(),
            },
            update: {
                title: item.title,
                url: item.url,
                viewedAt: new Date(),
            },
        });
    },

    // 6. Toplantı Notları & Teams Toplantısı Oluştur
    async createMeetingNote(
        data: {
            title: string;
            meetingId?: string;
            agenda?: string;
            attendees?: string;
            notes: string;
            decisions?: string;
            actionsJson?: string;
            filesJson?: string;
            teamsJoinUrl?: string;
        },
        userId: string,
        actor?: { id: string; name: string; email: string }
    ) {
        const note = await prisma.meetingNote.create({
            data: {
                ...data,
                createdById: userId,
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'CREATE',
            entityType: 'MeetingNote',
            entityId: note.id,
            diff: `MEETING_NOTE_RECORDED: "${note.title}"`,
        });

        return note;
    },

    // 7. Görev & İzin Delegasyonu
    async createDelegation(
        userId: string,
        data: { delegateUserId: string; startDate: Date | string; endDate: Date | string; scope?: string; reason?: string },
        actor?: { id: string; name: string; email: string }
    ) {
        const delegation = await prisma.userDelegation.create({
            data: {
                userId,
                delegateUserId: data.delegateUserId,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                scope: data.scope || 'ALL',
                reason: data.reason,
                isActive: true,
            },
        });

        await logAuditEvent({
            actorId: actor?.id,
            actorEmail: actor?.email,
            actorName: actor?.name,
            action: 'CREATE',
            entityType: 'UserDelegation',
            entityId: delegation.id,
            diff: `USER_DELEGATION_CREATED: User ${userId} delegated to ${data.delegateUserId} (${data.startDate} - ${data.endDate})`,
        });

        return delegation;
    },

    async getDelegations(userId: string) {
        return prisma.userDelegation.findMany({
            where: {
                OR: [{ userId }, { delegateUserId: userId }],
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                delegate: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    // 8. Global Search (Ctrl+K Command Palette)
    async globalSearch(query: string, limit = 15) {
        const q = (query || '').trim();
        if (!q) return [];

        const [
            entrepreneurs,
            mentors,
            tasks,
            events,
            programs,
            news,
            applications,
        ] = await Promise.all([
            prisma.entrepreneur.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { sector: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, name: true, sector: true },
                take: 4,
            }).catch(() => []),
            prisma.mentor.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { surname: { contains: q, mode: 'insensitive' } },
                        { company: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, name: true, surname: true, company: true },
                take: 4,
            }).catch(() => []),
            prisma.task.findMany({
                where: {
                    title: { contains: q, mode: 'insensitive' },
                },
                select: { id: true, title: true, status: true },
                take: 4,
            }).catch(() => []),
            prisma.event.findMany({
                where: {
                    title: { contains: q, mode: 'insensitive' },
                },
                select: { id: true, title: true, startDate: true },
                take: 4,
            }).catch(() => []),
            prisma.program.findMany({
                where: {
                    name: { contains: q, mode: 'insensitive' },
                },
                select: { id: true, name: true, slug: true },
                take: 4,
            }).catch(() => []),
            prisma.news.findMany({
                where: {
                    title: { contains: q, mode: 'insensitive' },
                },
                select: { id: true, title: true, slug: true },
                take: 4,
            }).catch(() => []),
            prisma.application.findMany({
                where: {
                    OR: [
                        { applicationNumber: { contains: q, mode: 'insensitive' } },
                        { companyName: { contains: q, mode: 'insensitive' } },
                        { applicantName: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, applicationNumber: true, companyName: true },
                take: 4,
            }).catch(() => []),
        ]);

        const results = [
            ...entrepreneurs.map((e) => ({
                id: e.id,
                type: 'GİRİŞİMCİ',
                title: e.name,
                subtitle: e.sector,
                url: `/admin/girisimciler#${e.id}`,
            })),
            ...mentors.map((m) => ({
                id: m.id,
                type: 'MENTÖR',
                title: `${m.name} ${m.surname}`,
                subtitle: m.company || 'Mentör Havuzu',
                url: `/admin/mentorler#${m.id}`,
            })),
            ...tasks.map((t) => ({
                id: t.id,
                type: 'GÖREV',
                title: t.title,
                subtitle: `Durum: ${t.status}`,
                url: `/admin/gorevler#${t.id}`,
            })),
            ...events.map((ev) => ({
                id: ev.id,
                type: 'ETKİNLİK',
                title: ev.title,
                subtitle: new Date(ev.startDate).toLocaleDateString('tr-TR'),
                url: `/admin/etkinlikler#${ev.id}`,
            })),
            ...programs.map((p) => ({
                id: p.id,
                type: 'PROGRAM',
                title: p.name,
                subtitle: 'Hızlandırma / Kuluçka',
                url: `/admin/programlar#${p.id}`,
            })),
            ...news.map((n) => ({
                id: n.id,
                type: 'HABER',
                title: n.title,
                subtitle: 'Yayın & İçerik',
                url: `/admin/haberler#${n.id}`,
            })),
            ...applications.map((a) => ({
                id: a.id,
                type: 'BAŞVURU',
                title: a.applicationNumber,
                subtitle: a.companyName || 'Girişimci Başvurusu',
                url: `/admin/basvurular/${a.id}`,
            })),
        ];

        return results.slice(0, limit);
    },
};
