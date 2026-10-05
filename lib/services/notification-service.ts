import { prisma } from '@/lib/prisma';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';

/**
 * Role-aware notification center. Personal notifications (userId set) are visible
 * to their owner; broadcast notifications (userId null) are visible to users who
 * hold the permission of the related module. Read state is tracked per user.
 */
const TYPE_PERMISSION: Record<string, [string, string] | 'SUPER_ADMIN'> = {
    NEW_APPLICATION: ['view', 'applications'],
    NEW_SUBMISSION: ['view', 'forms'],
    NEW_CONTACT: ['view', 'contacts'],
    RESERVATION: ['view', 'reservations'],
    NEW_RESERVATION: ['view', 'reservations'],
    RENT: ['view', 'rent'],
    RENT_DUE: ['view', 'rent'],
    CONTRACT: ['view', 'rent'],
    REPORT: ['view', 'reports'],
    APPROVAL_REQUESTED: ['view', 'tasks'],
    TASK_ASSIGNED: ['view', 'tasks'],
    TASK_DUE: ['view', 'tasks'],
    SYSTEM_ALERT: 'SUPER_ADMIN',
};

function visibleTypes(user: UserWithPermissions): string[] | null {
    if (user.isSuperAdmin) return null;
    return Object.entries(TYPE_PERMISSION)
        .filter(([, perm]) => perm !== 'SUPER_ADMIN' && hasPermission(user, perm[0], perm[1]))
        .map(([type]) => type);
}

function scopeWhere(user: UserWithPermissions) {
    const types = visibleTypes(user);
    const broadcast = types === null ? { userId: null } : { userId: null, notificationType: { in: types.length ? types : ['__none__'] } };
    return { OR: [{ userId: user.id }, broadcast] };
}

export const NotificationService = {
    async list(user: UserWithPermissions & { id: string }, params: { unreadOnly?: boolean; limit?: number; cursor?: string } = {}) {
        const limit = Math.min(100, params.limit || 20);
        const items = await prisma.notification.findMany({
            where: scopeWhere(user),
            include: { notificationReads: { where: { userId: user.id }, select: { readAt: true } } },
            orderBy: { createdAt: 'desc' },
            take: params.unreadOnly ? 200 : limit,
        });
        const mapped = items.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.notificationType,
            targetUrl: n.targetUrl,
            createdAt: n.createdAt,
            isRead: n.userId ? n.isRead : n.notificationReads.length > 0,
        }));
        const filtered = params.unreadOnly ? mapped.filter((n) => !n.isRead).slice(0, limit) : mapped;
        return filtered;
    },

    async unreadCount(user: UserWithPermissions & { id: string }) {
        const where = scopeWhere(user);
        const [personal, broadcastTotal, broadcastRead] = await Promise.all([
            prisma.notification.count({ where: { userId: user.id, isRead: false } }),
            prisma.notification.count({ where: { ...where.OR[1] } }),
            prisma.notificationRead.count({ where: { userId: user.id, notification: { ...where.OR[1] } } }),
        ]);
        return personal + Math.max(0, broadcastTotal - broadcastRead);
    },

    async markRead(user: { id: string }, ids: string[]) {
        const notifications = await prisma.notification.findMany({ where: { id: { in: ids } }, select: { id: true, userId: true } });
        for (const n of notifications) {
            if (n.userId === user.id) {
                await prisma.notification.update({ where: { id: n.id }, data: { isRead: true, readAt: new Date() } });
            } else if (n.userId === null) {
                await prisma.notificationRead.upsert({
                    where: { notificationId_userId: { notificationId: n.id, userId: user.id } },
                    create: { notificationId: n.id, userId: user.id },
                    update: {},
                });
            }
        }
    },

    async markAllRead(user: UserWithPermissions & { id: string }) {
        const unread = await NotificationService.list(user, { unreadOnly: true, limit: 100 });
        await NotificationService.markRead(user, unread.map((n) => n.id));
        return unread.length;
    },
};
