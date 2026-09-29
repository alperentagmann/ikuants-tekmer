import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export interface LogSecurityEventInput {
    eventType: string; // FAILED_LOGIN, LOCKED_ACCOUNT, MFA_DISABLED, SUSPICIOUS_IP, MASS_EXPORT, PII_BULK_ACCESS, SUPER_ADMIN_MODIFIED, SESSION_REVOKED
    severity?: 'INFO' | 'WARN' | 'HIGH' | 'CRITICAL';
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: string | Record<string, any>;
}

export class SecurityCenterService {
    /**
     * Log a security event
     */
    static async logSecurityEvent(input: LogSecurityEventInput) {
        const detailsString = typeof input.details === 'object' ? JSON.stringify(input.details) : input.details;

        return prisma.securityEvent.create({
            data: {
                eventType: input.eventType,
                severity: input.severity || 'WARN',
                userId: input.userId,
                userEmail: input.userEmail,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                details: detailsString,
            },
        });
    }

    /**
     * Get security overview statistics
     */
    static async getSecurityOverview() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            activeUsers,
            lockedUsers,
            mfaEnabledUsers,
            superAdmins,
            failedLogins24h,
            activeSessions,
            piiAccesses24h,
            unresolvedSecurityEvents,
            recentEvents,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true, status: 'ACTIVE' } }),
            prisma.user.count({ where: { status: 'LOCKED' } }),
            prisma.user.count({ where: { isMfaEnabled: true } }),
            prisma.user.count({ where: { isSuperAdmin: true, isActive: true } }),
            prisma.loginAttempt.count({ where: { isSuccess: false, createdAt: { gte: oneDayAgo } } }),
            prisma.session.count({ where: { isValid: true, expiresAt: { gte: new Date() } } }),
            prisma.auditLog.count({ where: { isPiiAccess: true, createdAt: { gte: oneDayAgo } } }),
            prisma.securityEvent.count({ where: { isResolved: false } }),
            prisma.securityEvent.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, email: true } } },
            }),
        ]);

        const mfaComplianceRate = totalUsers > 0 ? Math.round((mfaEnabledUsers / totalUsers) * 100) : 0;

        return {
            totalUsers,
            activeUsers,
            lockedUsers,
            mfaEnabledUsers,
            superAdmins,
            failedLogins24h,
            activeSessions,
            piiAccesses24h,
            unresolvedSecurityEvents,
            mfaComplianceRate,
            recentEvents,
        };
    }

    /**
     * Get filtered security events
     */
    static async getSecurityEvents(params: {
        severity?: string;
        eventType?: string;
        isResolved?: boolean;
        page?: number;
        limit?: number;
    }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (params.severity) where.severity = params.severity;
        if (params.eventType) where.eventType = params.eventType;
        if (params.isResolved !== undefined) where.isResolved = params.isResolved;

        const [items, total] = await Promise.all([
            prisma.securityEvent.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, name: true, email: true } } },
            }),
            prisma.securityEvent.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Mark security event as resolved
     */
    static async resolveEvent(id: string, actorId?: string) {
        const updated = await prisma.securityEvent.update({
            where: { id },
            data: {
                isResolved: true,
                resolvedAt: new Date(),
                resolvedById: actorId,
            },
        });

        await logAuditEvent({
            actorId,
            action: 'UPDATE',
            entityType: 'SecurityEvent',
            entityId: id,
            diff: `Marked security event ${id} as resolved`,
        });

        return updated;
    }
}
