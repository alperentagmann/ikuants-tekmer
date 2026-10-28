import { prisma } from '@/lib/prisma';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';

/**
 * Who is told about incoming work and operational alerts (applications, contact requests,
 * rent / contract renewals…). Every alert reaches the institution mailbox(es), all super admins
 * (cannot be removed) and admin-role users (unless switched off or muted). Users holding the
 * module's view permission are added unless the event rule turns that off; extra addresses come
 * from the rule and from ADMIN_NOTIFICATION_EMAIL. Kept free of e-mail code so any service can import it.
 */
export type AlertEvent = 'APPLICATION_NEW' | 'CONTACT_NEW' | 'FORM_SUBMISSION' | 'RESERVATION_NEW' | 'QUOTE_REQUEST' | 'CONTRACT_RENEWAL' | 'POLICY_RENEWAL' | 'RENT_OVERDUE';

export const ALERT_EVENTS: Record<AlertEvent, { label: string; description: string; perm: [string, string] }> = {
    APPLICATION_NEW: { label: 'Yeni başvuru', description: 'Program, TEKMER ve kampanya başvuruları', perm: ['view', 'applications'] },
    CONTACT_NEW: { label: 'Yeni iletişim talebi', description: 'Mesaj, toplantı ve ziyaret talepleri', perm: ['view', 'contacts'] },
    FORM_SUBMISSION: { label: 'Yeni form gönderimi', description: 'Başvuru / iletişim dışındaki form gönderimleri', perm: ['view', 'forms'] },
    RESERVATION_NEW: { label: 'Yeni rezervasyon talebi', description: 'Alan ve makine rezervasyon talepleri', perm: ['view', 'reservations'] },
    QUOTE_REQUEST: { label: 'Makine fiyat teklifi talebi', description: 'Lazer kesim, dizgi ve 3D baskı teklif talepleri', perm: ['view', 'reservations'] },
    CONTRACT_RENEWAL: { label: 'Kira sözleşmesi yenileme', description: 'Bitişine kritik gün (varsayılan 15) kalan veya süresi dolan sözleşmeler', perm: ['view', 'rent'] },
    POLICY_RENEWAL: { label: 'Poliçe yenileme', description: 'Bitişine kritik gün kalan bina / bölüm poliçeleri', perm: ['view', 'facilities'] },
    RENT_OVERDUE: { label: 'Geciken kira', description: 'Vadesi geçmiş, ödenmemiş kira tahakkukları (firma bazında)', perm: ['view', 'rent'] },
};
export const ALERT_EVENT_KEYS = Object.keys(ALERT_EVENTS) as AlertEvent[];

export interface AlertRule {
    notifyPermissionHolders: boolean;
    extraEmails: string[];
}
export type AlertRules = Record<AlertEvent, AlertRule>;

/**
 * Recipients that apply to every event. The institution mailbox (e.g. bilgi@…) receives all
 * alerts; users holding the "admin" role receive all alerts at their personal account e-mail
 * unless switched off; individual users can be muted (super admins cannot).
 */
export interface AlertGlobal {
    institutionEmails: string[];
    notifyAdmins: boolean;
    mutedUserIds: string[];
}

export const ALERT_RULES_KEY = 'alert_rules';
const GLOBAL_KEY = '_global';
const DEFAULT_RULE: AlertRule = { notifyPermissionHolders: true, extraEmails: [] };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanEmails(value: unknown, max: number): string[] {
    const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,;\s]+/) : [];
    return Array.from(new Set(list.map((e) => String(e).trim().toLowerCase()).filter((e) => EMAIL.test(e)))).slice(0, max);
}

export function sanitizeAlertGlobal(input: unknown): AlertGlobal {
    const g = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    return {
        institutionEmails: cleanEmails(g.institutionEmails, 10),
        notifyAdmins: g.notifyAdmins !== false,
        mutedUserIds: Array.isArray(g.mutedUserIds) ? Array.from(new Set(g.mutedUserIds.map(String).filter((v) => /^[\w-]{1,64}$/.test(v)))).slice(0, 500) : [],
    };
}

export function sanitizeAlertRules(input: unknown): AlertRules {
    const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    const out = {} as AlertRules;
    for (const key of ALERT_EVENT_KEYS) {
        const r = (raw[key] && typeof raw[key] === 'object' ? raw[key] : {}) as Record<string, unknown>;
        out[key] = {
            notifyPermissionHolders: r.notifyPermissionHolders !== false,
            extraEmails: cleanEmails(r.extraEmails, 20),
        };
    }
    return out;
}

/** Event rules and global recipients live in one setting row ({ ...events, _global }). */
export async function getAlertSettings(): Promise<{ rules: AlertRules; global: AlertGlobal }> {
    const row = await prisma.siteSetting.findUnique({ where: { key: ALERT_RULES_KEY } }).catch(() => null);
    let raw: Record<string, unknown> = {};
    try {
        raw = row ? (JSON.parse(row.value) as Record<string, unknown>) : {};
    } catch {
        raw = {};
    }
    return { rules: sanitizeAlertRules(raw), global: sanitizeAlertGlobal(raw[GLOBAL_KEY]) };
}

export function serializeAlertSettings(rules: AlertRules, global: AlertGlobal): string {
    return JSON.stringify({ ...rules, [GLOBAL_KEY]: global });
}

export async function getAlertRules(): Promise<AlertRules> {
    return (await getAlertSettings()).rules;
}

export function envAdminEmails(): string[] {
    return (process.env.ADMIN_NOTIFICATION_EMAIL || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter((e) => EMAIL.test(e));
}

export type AlertRecipientReason = 'INSTITUTION' | 'SUPER_ADMIN' | 'ADMIN' | 'PERMISSION' | 'RULE' | 'ENV' | 'EXTRA';
export type AlertRecipient = { email: string; name: string; userId: string | null; reason: AlertRecipientReason };

const recipientUserSelect = {
    id: true, name: true, email: true, isActive: true, isSuperAdmin: true,
    userRoles: { select: { role: { select: { slug: true, name: true, permissions: { select: { permission: { select: { action: true, resource: true } } } } } } } },
    userPermissions: { select: { isGranted: true, permission: { select: { action: true, resource: true } } } },
} as const;

/** Recipients of every alert (institution, super admins, admin-role users); `event` adds the module rule. */
async function collectRecipients(event: AlertEvent | null, extra: string[]): Promise<AlertRecipient[]> {
    const { rules, global } = await getAlertSettings();
    const rule = event ? rules[event] || DEFAULT_RULE : null;
    const users = await prisma.user.findMany({ where: { isActive: true }, select: recipientUserSelect, orderBy: { name: 'asc' } });
    const muted = new Set(global.mutedUserIds);
    const seen = new Map<string, AlertRecipient>();
    const add = (r: AlertRecipient) => {
        const key = r.email.trim().toLowerCase();
        if (EMAIL.test(key) && !seen.has(key)) seen.set(key, { ...r, email: key });
    };
    for (const e of global.institutionEmails) add({ email: e, name: 'İKÜANTS TEKMER', userId: null, reason: 'INSTITUTION' });
    for (const u of users) {
        if (u.isSuperAdmin || u.userRoles.some((ur) => ur.role.slug === 'super-admin')) add({ email: u.email, name: u.name, userId: u.id, reason: 'SUPER_ADMIN' });
    }
    if (global.notifyAdmins) {
        for (const u of users) {
            if (!muted.has(u.id) && u.userRoles.some((ur) => ur.role.slug === 'admin')) add({ email: u.email, name: u.name, userId: u.id, reason: 'ADMIN' });
        }
    }
    if (event && rule?.notifyPermissionHolders) {
        const [action, resource] = ALERT_EVENTS[event].perm;
        for (const u of users) {
            if (!muted.has(u.id) && hasPermission(u as unknown as UserWithPermissions, action, resource)) add({ email: u.email, name: u.name, userId: u.id, reason: 'PERMISSION' });
        }
    }
    for (const e of rule?.extraEmails || []) add({ email: e, name: 'İKÜANTS TEKMER', userId: null, reason: 'RULE' });
    for (const e of envAdminEmails()) add({ email: e, name: 'İKÜANTS TEKMER', userId: null, reason: 'ENV' });
    for (const e of extra) add({ email: e, name: 'İKÜANTS TEKMER', userId: null, reason: 'EXTRA' });
    return Array.from(seen.values());
}

/** Resolves recipients of an event; `extra` adds context-specific addresses (form / campaign settings). */
export async function resolveAlertRecipients(event: AlertEvent, extra: string[] = []): Promise<AlertRecipient[]> {
    return collectRecipients(event, extra);
}

/** Addresses that receive every alert, whatever the event. */
export async function resolveGlobalRecipients(): Promise<AlertRecipient[]> {
    return collectRecipients(null, []);
}

/** Active panel users that can be switched on / off as alert recipients. */
export async function listAlertPeople() {
    const { global } = await getAlertSettings();
    const users = await prisma.user.findMany({
        where: { isActive: true, OR: [{ isSuperAdmin: true }, { userRoles: { some: {} } }] },
        select: { id: true, name: true, email: true, isSuperAdmin: true, userRoles: { select: { role: { select: { slug: true, name: true } } } } },
        orderBy: [{ isSuperAdmin: 'desc' }, { name: 'asc' }],
    });
    const muted = new Set(global.mutedUserIds);
    return users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isSuperAdmin: u.isSuperAdmin || u.userRoles.some((r) => r.role.slug === 'super-admin'),
        isAdmin: u.userRoles.some((r) => r.role.slug === 'admin'),
        roles: u.userRoles.map((r) => r.role.name),
        muted: muted.has(u.id),
    }));
}
