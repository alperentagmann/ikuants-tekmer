import { prisma } from '@/lib/prisma';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';

/**
 * Who is told about incoming work (applications, contact requests, reservations, quotes…).
 * Super admins are always included and cannot be removed; users holding the module's view
 * permission are included unless the rule turns that off; extra addresses come from the rule
 * and from ADMIN_NOTIFICATION_EMAIL. Kept free of e-mail code so any service can import it.
 */
export type AlertEvent = 'APPLICATION_NEW' | 'CONTACT_NEW' | 'FORM_SUBMISSION' | 'RESERVATION_NEW' | 'QUOTE_REQUEST';

export const ALERT_EVENTS: Record<AlertEvent, { label: string; description: string; perm: [string, string] }> = {
    APPLICATION_NEW: { label: 'Yeni başvuru', description: 'Program, TEKMER ve kampanya başvuruları', perm: ['view', 'applications'] },
    CONTACT_NEW: { label: 'Yeni iletişim talebi', description: 'Mesaj, toplantı ve ziyaret talepleri', perm: ['view', 'contacts'] },
    FORM_SUBMISSION: { label: 'Yeni form gönderimi', description: 'Başvuru / iletişim dışındaki form gönderimleri', perm: ['view', 'forms'] },
    RESERVATION_NEW: { label: 'Yeni rezervasyon talebi', description: 'Alan ve makine rezervasyon talepleri', perm: ['view', 'reservations'] },
    QUOTE_REQUEST: { label: 'Makine fiyat teklifi talebi', description: 'Lazer kesim, dizgi ve 3D baskı teklif talepleri', perm: ['view', 'reservations'] },
};
export const ALERT_EVENT_KEYS = Object.keys(ALERT_EVENTS) as AlertEvent[];

export interface AlertRule {
    notifyPermissionHolders: boolean;
    extraEmails: string[];
}
export type AlertRules = Record<AlertEvent, AlertRule>;

export const ALERT_RULES_KEY = 'alert_rules';
const DEFAULT_RULE: AlertRule = { notifyPermissionHolders: true, extraEmails: [] };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeAlertRules(input: unknown): AlertRules {
    const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    const out = {} as AlertRules;
    for (const key of ALERT_EVENT_KEYS) {
        const r = (raw[key] && typeof raw[key] === 'object' ? raw[key] : {}) as Record<string, unknown>;
        const emails = Array.isArray(r.extraEmails) ? r.extraEmails : typeof r.extraEmails === 'string' ? r.extraEmails.split(/[,;\s]+/) : [];
        out[key] = {
            notifyPermissionHolders: r.notifyPermissionHolders !== false,
            extraEmails: Array.from(new Set(emails.map((e) => String(e).trim().toLowerCase()).filter((e) => EMAIL.test(e)))).slice(0, 20),
        };
    }
    return out;
}

export async function getAlertRules(): Promise<AlertRules> {
    const row = await prisma.siteSetting.findUnique({ where: { key: ALERT_RULES_KEY } }).catch(() => null);
    if (!row) return sanitizeAlertRules({});
    try {
        return sanitizeAlertRules(JSON.parse(row.value));
    } catch {
        return sanitizeAlertRules({});
    }
}

export function envAdminEmails(): string[] {
    return (process.env.ADMIN_NOTIFICATION_EMAIL || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter((e) => EMAIL.test(e));
}

export type AlertRecipient = { email: string; name: string; userId: string | null; reason: 'SUPER_ADMIN' | 'PERMISSION' | 'RULE' | 'ENV' | 'EXTRA' };

/** Resolves recipients of an event; `extra` adds context-specific addresses (form / campaign settings). */
export async function resolveAlertRecipients(event: AlertEvent, extra: string[] = []): Promise<AlertRecipient[]> {
    const rule = (await getAlertRules())[event] || DEFAULT_RULE;
    const [action, resource] = ALERT_EVENTS[event].perm;
    const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
            id: true, name: true, email: true, isActive: true, isSuperAdmin: true,
            userRoles: { select: { role: { select: { slug: true, permissions: { select: { permission: { select: { action: true, resource: true } } } } } } } },
            userPermissions: { select: { isGranted: true, permission: { select: { action: true, resource: true } } } },
        },
    });
    const seen = new Map<string, AlertRecipient>();
    const add = (r: AlertRecipient) => {
        const key = r.email.trim().toLowerCase();
        if (EMAIL.test(key) && !seen.has(key)) seen.set(key, { ...r, email: key });
    };
    for (const u of users) {
        if (u.isSuperAdmin) add({ email: u.email, name: u.name, userId: u.id, reason: 'SUPER_ADMIN' });
    }
    if (rule.notifyPermissionHolders) {
        for (const u of users) {
            if (!u.isSuperAdmin && hasPermission(u as unknown as UserWithPermissions, action, resource)) add({ email: u.email, name: u.name, userId: u.id, reason: 'PERMISSION' });
        }
    }
    for (const e of rule.extraEmails) add({ email: e, name: 'İKÜANTS TEKMER', userId: null, reason: 'RULE' });
    for (const e of envAdminEmails()) add({ email: e, name: 'İKÜANTS TEKMER', userId: null, reason: 'ENV' });
    for (const e of extra) add({ email: e, name: 'İKÜANTS TEKMER', userId: null, reason: 'EXTRA' });
    return Array.from(seen.values());
}
