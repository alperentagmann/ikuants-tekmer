import { prisma } from '@/lib/prisma';

export interface AuditLogOptions {
    actorId?: string | null;
    actorEmail?: string | null;
    actorName?: string | null;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'LOGOUT' | 'PUBLISH' | 'UNPUBLISH' | 'EXPORT' | 'PII_ACCESS' | 'SETTINGS_CHANGE';
    entityType: string;
    entityId?: string | null;
    fieldName?: string | null;
    oldValues?: Record<string, any> | null;
    newValues?: Record<string, any> | null;
    diff?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    isPiiAccess?: boolean;
}

export function calculateFieldDiffs(
    oldObj: Record<string, any> | null | undefined,
    newObj: Record<string, any> | null | undefined
): { diffSummary: string; changedFields: Array<{ field: string; oldVal: any; newVal: any }> } {
    if (!oldObj && !newObj) return { diffSummary: 'No changes', changedFields: [] };
    if (!oldObj && newObj) return { diffSummary: 'Created record', changedFields: [] };
    if (oldObj && !newObj) return { diffSummary: 'Deleted record', changedFields: [] };

    const changedFields: Array<{ field: string; oldVal: any; newVal: any }> = [];
    const allKeys = Array.from(new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]));

    // Keys to ignore from audit diff noise
    const ignoredKeys = new Set(['updatedAt', 'createdAt', 'lastLoginAt']);

    for (const key of allKeys) {
        if (ignoredKeys.has(key)) continue;

        const val1 = oldObj ? oldObj[key] : undefined;
        const val2 = newObj ? newObj[key] : undefined;

        const str1 = typeof val1 === 'object' ? JSON.stringify(val1) : String(val1 ?? '');
        const str2 = typeof val2 === 'object' ? JSON.stringify(val2) : String(val2 ?? '');

        if (str1 !== str2) {
            changedFields.push({
                field: key,
                oldVal: val1,
                newVal: val2,
            });
        }
    }

    const diffSummary = changedFields.length > 0
        ? changedFields.map(f => `${f.field}: "${String(f.oldVal ?? '')}" -> "${String(f.newVal ?? '')}"`).join('; ')
        : 'No field-level changes detected';

    return { diffSummary, changedFields };
}

export async function logAuditEvent(options: AuditLogOptions) {
    try {
        let diff = options.diff;

        if (!diff && options.oldValues && options.newValues) {
            const { diffSummary } = calculateFieldDiffs(options.oldValues, options.newValues);
            diff = diffSummary;
        }

        await prisma.auditLog.create({
            data: {
                actorId: options.actorId,
                actorEmail: options.actorEmail,
                actorName: options.actorName,
                action: options.action,
                entityType: options.entityType,
                entityId: options.entityId,
                fieldName: options.fieldName,
                oldValues: options.oldValues ? JSON.stringify(options.oldValues) : null,
                newValues: options.newValues ? JSON.stringify(options.newValues) : null,
                diff,
                ipAddress: options.ipAddress,
                userAgent: options.userAgent,
                isPiiAccess: options.isPiiAccess || false,
            },
        });
    } catch (error) {
        console.error('Audit log creation failed:', error);
    }
}

export async function logAudit(options: {
    userId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    title?: string;
    oldData?: Record<string, any> | null;
    newData?: Record<string, any> | null;
    diff?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}) {
    return logAuditEvent({
        actorId: options.userId,
        action: options.action as any,
        entityType: options.resource,
        entityId: options.resourceId,
        diff: options.title || options.diff,
        oldValues: options.oldData,
        newValues: options.newData,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
    });
}

