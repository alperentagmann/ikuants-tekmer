import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { AutomationService } from '@/lib/services/automation-service';
import { RECURRENCES } from '@/lib/services/task-followups';

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
    personId?: string;
    organizationId?: string;
    projectId?: string;
    reservationId?: string;
    rentContractId?: string;
    // Work OS
    teamId?: string;
    parentTaskId?: string;
    recurrence?: string | null;
    watcherIds?: string[];
}

export const TaskService = {
    async getTasks(params: {
        userId?: string;
        scope?: 'all' | 'assigned' | 'created' | 'today' | 'overdue' | 'completed';
        status?: string;
        priority?: string;
        search?: string;
        teamId?: string;
        includeSubtasks?: boolean;
        visibility?: Record<string, unknown>;
        relation?: { field: 'applicationId' | 'entrepreneurId' | 'programId' | 'personId' | 'organizationId' | 'projectId' | 'reservationId' | 'rentContractId'; id: string };
    }) {
        const where: Record<string, any> = { isArchived: false, ...(params.visibility || {}) };
        if (params.relation) where[params.relation.field] = params.relation.id;

        if (params.status) {
            where.status = params.status;
        }

        if (params.priority) {
            where.priority = params.priority;
        }

        if (params.teamId) where.teamId = params.teamId === 'none' ? null : params.teamId;
        // Sub-tasks are shown inside their parent unless asked for
        if (!params.includeSubtasks) where.parentTaskId = null;

        if (params.search) {
            where.AND = [{ OR: [{ title: { contains: params.search, mode: 'insensitive' } }, { description: { contains: params.search, mode: 'insensitive' } }] }];
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
            where.status = { notIn: ['DONE', 'CANCELLED'] };
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
                _count: { select: { comments: true, attachments: true, subTasks: true } },
                team: { select: { id: true, name: true, color: true } },
                subTasks: { where: { isArchived: false }, select: { id: true, status: true } },
                entrepreneur: { select: { id: true, name: true, slug: true } },
                program: { select: { id: true, name: true, slug: true } },
                event: { select: { id: true, title: true, slug: true } },
                training: { select: { id: true, title: true, slug: true } },
                application: { select: { id: true, applicationNumber: true, applicantName: true } },
                person: { select: { id: true, fullName: true } },
                organization: { select: { id: true, name: true } },
                project: { select: { id: true, title: true } },
                reservation: { select: { id: true, title: true, startTime: true } },
                rentContract: { select: { id: true, contractNo: true } },
                mentor: { select: { id: true, name: true, surname: true } },
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
                team: { select: { id: true, name: true, color: true } },
                parentTask: { select: { id: true, title: true } },
                subTasks: { where: { isArchived: false }, orderBy: { createdAt: 'asc' }, include: { assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } } },
                watchers: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
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
                personId: input.personId,
                organizationId: input.organizationId,
                projectId: input.projectId,
                reservationId: input.reservationId,
                rentContractId: input.rentContractId,
                teamId: input.teamId || null,
                parentTaskId: input.parentTaskId || null,
                recurrence: input.recurrence && input.recurrence in RECURRENCES && input.dueDate ? input.recurrence : null,
                watchers: input.watcherIds?.length ? { create: Array.from(new Set(input.watcherIds)).map((userId) => ({ userId })) } : undefined,
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

        await AutomationService.run('TASK_CREATED', task.id, { actorId: input.createdById });
        return task;
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
