import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface CreateTaskInput {
    title: string;
    description?: string;
    priority?: string; // LOW, MEDIUM, HIGH, URGENT
    startDate?: string | Date;
    dueDate?: string | Date;
    estimatedHours?: number;
    tags?: string[];
    assigneeIds?: string[];
    checklistItems?: string[];
    createdById: string;
    actorName?: string;
    // Relations
    entrepreneurId?: string;
    mentorId?: string;
    programId?: string;
    applicationId?: string;
    newsId?: string;
    eventId?: string;
    trainingId?: string;
    activityId?: string;
}

export const TaskService = {
    async getTasks(params: {
        userId?: string;
        scope?: 'all' | 'assigned' | 'created' | 'today' | 'overdue' | 'completed';
        status?: string;
        priority?: string;
        search?: string;
    }) {
        const where: any = { isArchived: false };

        if (params.status) {
            where.status = params.status;
        }

        if (params.priority) {
            where.priority = params.priority;
        }

        if (params.search) {
            where.OR = [
                { title: { contains: params.search } },
                { description: { contains: params.search } },
            ];
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (params.scope === 'assigned' && params.userId) {
            where.assignees = { some: { userId: params.userId } };
        } else if (params.scope === 'created' && params.userId) {
            where.createdById = params.userId;
        } else if (params.scope === 'today') {
            where.dueDate = { gte: startOfToday, lte: endOfToday };
        } else if (params.scope === 'overdue') {
            where.dueDate = { lt: startOfToday };
            where.status = { not: 'DONE' };
        } else if (params.scope === 'completed') {
            where.status = 'DONE';
        }

        return prisma.task.findMany({
            where,
            include: {
                creator: { select: { id: true, name: true, avatarUrl: true, email: true } },
                assignees: {
                    include: {
                        user: { select: { id: true, name: true, avatarUrl: true, email: true } },
                    },
                },
                checklistItems: { orderBy: { sortOrder: 'asc' } },
                _count: { select: { comments: true, attachments: true } },
                entrepreneur: { select: { id: true, name: true, slug: true } },
                program: { select: { id: true, name: true, slug: true } },
                event: { select: { id: true, title: true, slug: true } },
                training: { select: { id: true, title: true, slug: true } },
            },
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        });
    },

    async getTaskById(id: string) {
        return prisma.task.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, name: true, avatarUrl: true, email: true } },
                assignees: {
                    include: {
                        user: { select: { id: true, name: true, avatarUrl: true, email: true } },
                    },
                },
                checklistItems: { orderBy: { sortOrder: 'asc' } },
                comments: {
                    include: {
                        author: { select: { id: true, name: true, avatarUrl: true, email: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                attachments: true,
                activitiesLog: { orderBy: { createdAt: 'desc' } },
                entrepreneur: true,
                mentor: true,
                program: true,
                application: true,
                news: true,
                event: true,
                training: true,
                activity: true,
            },
        });
    },

    async createTask(input: CreateTaskInput) {
        const task = await prisma.task.create({
            data: {
                title: input.title,
                description: input.description,
                priority: input.priority || 'MEDIUM',
                startDate: input.startDate ? new Date(input.startDate) : null,
                dueDate: input.dueDate ? new Date(input.dueDate) : null,
                estimatedHours: input.estimatedHours,
                tags: input.tags ? JSON.stringify(input.tags) : null,
                createdById: input.createdById,
                entrepreneurId: input.entrepreneurId,
                mentorId: input.mentorId,
                programId: input.programId,
                applicationId: input.applicationId,
                newsId: input.newsId,
                eventId: input.eventId,
                trainingId: input.trainingId,
                activityId: input.activityId,
                checklistItems: input.checklistItems
                    ? {
                          create: input.checklistItems.map((item, idx) => ({
                              title: item,
                              sortOrder: idx,
                          })),
                      }
                    : undefined,
                assignees: input.assigneeIds
                    ? {
                          create: input.assigneeIds.map((uId) => ({
                              userId: uId,
                          })),
                      }
                    : undefined,
                activitiesLog: {
                    create: {
                        actorId: input.createdById,
                        actorName: input.actorName || 'Kullanıcı',
                        action: 'CREATED',
                        description: `"${input.title}" görevi oluşturuldu.`,
                    },
                },
            },
            include: {
                assignees: { include: { user: true } },
                checklistItems: true,
            },
        });

        // Generate notifications for assigned users
        if (input.assigneeIds && input.assigneeIds.length > 0) {
            for (const uId of input.assigneeIds) {
                if (uId !== input.createdById) {
                    await prisma.notification.create({
                        data: {
                            userId: uId,
                            title: 'Yeni Görev Atandı',
                            message: `Size "${input.title}" başlıklı bir görev atandı.`,
                            notificationType: 'TASK_ASSIGNED',
                            targetUrl: `/admin/gorevler?taskId=${task.id}`,
                        },
                    });
                }
            }
        }

        await logAuditEvent({
            actorId: input.createdById,
            actorName: input.actorName,
            action: 'CREATE',
            entityType: 'Task',
            entityId: task.id,
            diff: `Görev oluşturuldu: ${task.title}`,
        });

        return task;
    },

    async updateStatus(taskId: string, status: string, actor: { id: string; name?: string }) {
        const currentTask = await prisma.task.findUnique({ where: { id: taskId } });
        if (!currentTask) throw new Error('Görev bulunamadı');

        const isCompleted = status === 'DONE';

        const updated = await prisma.task.update({
            where: { id: taskId },
            data: {
                status,
                completedAt: isCompleted ? new Date() : null,
                activitiesLog: {
                    create: {
                        actorId: actor.id,
                        actorName: actor.name || 'Kullanıcı',
                        action: 'STATUS_CHANGE',
                        description: `Durum "${currentTask.status}" ➔ "${status}" olarak değiştirildi.`,
                    },
                },
            },
        });

        await logAuditEvent({
            actorId: actor.id,
            actorName: actor.name,
            action: 'UPDATE',
            entityType: 'Task',
            entityId: taskId,
            fieldName: 'status',
            diff: `Durum güncellendi: ${status}`,
        });

        return updated;
    },

    async toggleChecklistItem(itemId: string, isCompleted: boolean) {
        return prisma.taskChecklistItem.update({
            where: { id: itemId },
            data: { isCompleted },
        });
    },

    async addComment(taskId: string, comment: string, author: { id: string; name?: string }) {
        const commentRecord = await prisma.taskComment.create({
            data: {
                taskId,
                authorId: author.id,
                comment,
            },
            include: {
                author: { select: { id: true, name: true, avatarUrl: true } },
            },
        });

        await prisma.taskActivity.create({
            data: {
                taskId,
                actorId: author.id,
                actorName: author.name || 'Kullanıcı',
                action: 'COMMENT_ADDED',
                description: 'Yeni bir yorum ekledi.',
            },
        });

        return commentRecord;
    },

    async deleteTask(taskId: string, actor: { id: string; name?: string }) {
        const task = await prisma.task.update({
            where: { id: taskId },
            data: { isArchived: true },
        });

        await logAuditEvent({
            actorId: actor.id,
            actorName: actor.name,
            action: 'DELETE',
            entityType: 'Task',
            entityId: taskId,
            diff: `Görev arşivlendi: ${task.title}`,
        });

        return task;
    },
};
