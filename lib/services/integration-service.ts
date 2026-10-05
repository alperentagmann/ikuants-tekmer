import crypto from 'crypto';
import dns from 'dns/promises';
import net from 'net';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { hasPermission, type UserWithPermissions } from '@/lib/rbac';
import { hintOf, openSecret, sealSecret } from '@/lib/secret-box';
import { API_SCOPES, PROVIDERS, WEBHOOK_EVENTS, providerOf, type AuthType } from '@/lib/integration-catalog';

type Actor = UserWithPermissions & { id: string; name: string; email: string };

function assertManage(actor: Actor) {
    if (!actor.isSuperAdmin && !hasPermission(actor, 'manage', 'integrations')) throw new DomainError('Entegrasyon yönetimi için integrations:manage izni gerekir.', 403);
}

function isPrivateIp(ip: string): boolean {
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split('.').map(Number);
        return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
    }
    const v6 = ip.toLowerCase();
    return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80') || v6.startsWith('::ffff:127.') || v6.startsWith('::ffff:10.') || v6.startsWith('::ffff:192.168.');
}

/**
 * Outgoing requests may only reach public HTTPS hosts. Blocks localhost and private ranges
 * (including DNS names that resolve to them) so a saved connection cannot probe the internal network.
 */
export async function assertSafeUrl(raw: string): Promise<URL> {
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        throw new DomainError('Geçerli bir adres girin (https://…).');
    }
    if (url.protocol !== 'https:') throw new DomainError('Yalnızca https:// adreslerine bağlanılabilir.');
    if (url.username || url.password) throw new DomainError('Adres içinde kullanıcı adı / parola kullanmayın; kimlik bilgilerini ilgili alanlara girin.');
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new DomainError('İç ağ adreslerine bağlantı engellendi.');
    const addresses = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true }).catch(() => { throw new DomainError('Alan adı çözümlenemedi.'); })).map((a) => a.address);
    if (!addresses.length || addresses.some(isPrivateIp)) throw new DomainError('İç ağ adreslerine bağlantı engellendi.');
    return url;
}

interface ConnectionConfig {
    headerName?: string;
    queryParam?: string;
    testPath?: string;
    notes?: string;
    [key: string]: string | undefined;
}

function parseConfig(raw: string | null): ConnectionConfig {
    try {
        const v = raw ? JSON.parse(raw) : {};
        return v && typeof v === 'object' ? (v as ConnectionConfig) : {};
    } catch {
        return {};
    }
}

function authHeaders(authType: string, config: ConnectionConfig, secrets: Record<string, string>): Record<string, string> {
    switch (authType as AuthType) {
        case 'API_KEY_HEADER':
            return secrets.apiKey ? { [config.headerName || 'X-API-Key']: secrets.apiKey } : {};
        case 'BEARER':
            return secrets.apiKey ? { Authorization: `Bearer ${secrets.apiKey}` } : {};
        case 'BASIC':
            return secrets.password || config.username ? { Authorization: `Basic ${Buffer.from(`${config.username || ''}:${secrets.password || ''}`).toString('base64')}` } : {};
        default:
            return {};
    }
}

async function logCall(entry: { connectionId?: string | null; webhookId?: string | null; direction: string; method: string; url: string; statusCode?: number | null; durationMs?: number | null; ok: boolean; error?: string | null; summary?: string | null }) {
    // Never log query strings: they may carry API keys
    const safeUrl = entry.url.split('?')[0];
    await prisma.integrationLog.create({ data: { ...entry, url: safeUrl.slice(0, 500), error: entry.error?.slice(0, 500) || null, summary: entry.summary?.slice(0, 500) || null } });
}

/** Integration Hub: connections to agencies and vendors, outgoing webhooks and API keys for inbound access. */
export const IntegrationService = {
    catalog() {
        return PROVIDERS;
    },

    async listConnections() {
        const rows = await prisma.integrationConnection.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
        return rows.map((c) => {
            let secretHints: Record<string, string> = {};
            let secretError: string | null = null;
            try {
                secretHints = Object.fromEntries(Object.entries(openSecret(c.secretEnc)).map(([k, v]) => [k, hintOf(v)]));
            } catch (e) {
                secretError = e instanceof Error ? e.message : 'Sır çözülemedi';
            }
            return { id: c.id, provider: c.provider, name: c.name, category: c.category, baseUrl: c.baseUrl, authType: c.authType, config: parseConfig(c.configJson), secretHints, secretError, status: c.status, lastTestAt: c.lastTestAt, lastTestOk: c.lastTestOk, lastError: c.lastError, updatedAt: c.updatedAt };
        });
    },

    async saveConnection(input: { id?: string; provider?: string; name?: string; baseUrl?: string | null; authType?: string; config?: Record<string, unknown>; secrets?: Record<string, unknown>; disabled?: boolean }, actor: Actor) {
        assertManage(actor);
        const def = providerOf(String(input.provider || ''));
        if (!def) throw new DomainError('Bilinmeyen entegrasyon türü.');
        const existing = input.id ? await prisma.integrationConnection.findUnique({ where: { id: input.id } }) : null;
        if (input.id && !existing) throw new DomainError('Bağlantı bulunamadı.', 404);
        const baseUrl = input.baseUrl?.trim() ? (await assertSafeUrl(input.baseUrl.trim())).toString().replace(/\/$/, '') : null;
        const authType = (['NONE', 'API_KEY_HEADER', 'BEARER', 'BASIC', 'QUERY_KEY'] as const).find((a) => a === input.authType) || def.defaultAuth;
        const config: ConnectionConfig = {};
        for (const [k, v] of Object.entries(input.config || {})) if (typeof v === 'string' && v.trim() && k.length <= 40) config[k] = v.trim().slice(0, 300);
        // Secrets: empty input keeps the stored value; "-" clears it
        const secrets = { ...(existing ? openSecret(existing.secretEnc) : {}) };
        for (const [k, v] of Object.entries(input.secrets || {})) {
            if (typeof v !== 'string' || !def.fields.some((f) => f.key === k && f.secret)) continue;
            if (v === '-') delete secrets[k];
            else if (v.trim()) secrets[k] = v.trim().slice(0, 2000);
        }
        const hasSecrets = Object.keys(secrets).length > 0;
        const status = input.disabled ? 'DISABLED' : baseUrl && (authType === 'NONE' || hasSecrets) ? (existing?.lastTestOk ? 'ACTIVE' : 'CONFIGURED') : 'NOT_CONFIGURED';
        const data = { provider: def.key, name: input.name?.trim() || def.name, category: def.category, baseUrl, authType, configJson: JSON.stringify(config), secretEnc: hasSecrets ? sealSecret(secrets) : null, status };
        const row = existing ? await prisma.integrationConnection.update({ where: { id: existing.id }, data }) : await prisma.integrationConnection.create({ data: { ...data, createdById: actor.id } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: existing ? 'UPDATE' : 'CREATE', entityType: 'IntegrationConnection', entityId: row.id, newValues: { provider: def.key, baseUrl, authType, config, secretKeys: Object.keys(secrets), status } });
        return row;
    },

    async deleteConnection(id: string, actor: Actor) {
        assertManage(actor);
        const row = await prisma.integrationConnection.delete({ where: { id } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'DELETE', entityType: 'IntegrationConnection', entityId: id, oldValues: { provider: row.provider, name: row.name } });
    },

    /** Sends one authenticated request through a saved connection (used by tests and future sync jobs). */
    async request(connectionId: string, opts: { method?: string; path?: string; body?: unknown } = {}) {
        const c = await prisma.integrationConnection.findUnique({ where: { id: connectionId } });
        if (!c || !c.baseUrl) throw new DomainError('Bağlantının servis adresi girilmemiş.');
        if (c.status === 'DISABLED') throw new DomainError('Bağlantı devre dışı.');
        const config = parseConfig(c.configJson);
        const secrets = openSecret(c.secretEnc);
        const path = (opts.path ?? config.testPath ?? '').trim();
        if (path && (/^[a-z]+:/i.test(path) || path.startsWith('//'))) throw new DomainError('Yol yalnızca servis adresinin altında olabilir.');
        const url = await assertSafeUrl(`${c.baseUrl}${path ? (path.startsWith('/') ? path : `/${path}`) : ''}`);
        if (c.authType === 'QUERY_KEY' && secrets.apiKey) url.searchParams.set(config.queryParam || 'api_key', secrets.apiKey);
        const method = (opts.method || 'GET').toUpperCase();
        const started = Date.now();
        try {
            const res = await fetch(url, {
                method,
                headers: { Accept: 'application/json', ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...authHeaders(c.authType, config, secrets) },
                body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
                redirect: 'manual',
                signal: AbortSignal.timeout(10000),
            });
            const text = await res.text().catch(() => '');
            await logCall({ connectionId: c.id, direction: 'OUTBOUND', method, url: url.toString(), statusCode: res.status, durationMs: Date.now() - started, ok: res.ok, summary: text.slice(0, 200) });
            return { ok: res.ok, status: res.status, body: text.slice(0, 5000) };
        } catch (e) {
            const message = e instanceof Error ? e.message : 'İstek başarısız';
            await logCall({ connectionId: c.id, direction: 'OUTBOUND', method, url: url.toString(), durationMs: Date.now() - started, ok: false, error: message });
            return { ok: false, status: 0, body: '', error: message };
        }
    },

    async testConnection(id: string, actor: Actor) {
        assertManage(actor);
        const result = await IntegrationService.request(id, { method: 'GET' });
        const ok = result.ok;
        await prisma.integrationConnection.update({
            where: { id },
            data: { lastTestAt: new Date(), lastTestOk: ok, lastError: ok ? null : (result.error || `HTTP ${result.status}`).slice(0, 300), status: ok ? 'ACTIVE' : 'ERROR' },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'IntegrationConnection', entityId: id, diff: `Bağlantı testi: ${ok ? 'başarılı' : 'başarısız'} (HTTP ${result.status})` });
        return result;
    },

    async logs(params: { connectionId?: string; webhookId?: string; limit?: number } = {}) {
        return prisma.integrationLog.findMany({
            where: { ...(params.connectionId ? { connectionId: params.connectionId } : {}), ...(params.webhookId ? { webhookId: params.webhookId } : {}) },
            orderBy: { createdAt: 'desc' },
            take: Math.min(200, params.limit || 50),
        });
    },

    // ------------------------------------------------------------------ outgoing webhooks

    async listWebhooks() {
        const rows = await prisma.webhookSubscription.findMany({ orderBy: { createdAt: 'desc' } });
        return rows.map((w) => ({ id: w.id, name: w.name, url: w.url, events: JSON.parse(w.eventsJson) as string[], isActive: w.isActive, lastStatus: w.lastStatus, lastDeliveredAt: w.lastDeliveredAt, failureCount: w.failureCount }));
    },

    async saveWebhook(input: { id?: string; name?: string; url?: string; events?: unknown; isActive?: boolean }, actor: Actor) {
        assertManage(actor);
        const url = (await assertSafeUrl(String(input.url || ''))).toString();
        const events = (Array.isArray(input.events) ? input.events : []).map(String).filter((e) => e in WEBHOOK_EVENTS);
        if (!events.length) throw new DomainError('En az bir olay seçin.');
        const name = input.name?.trim() || new URL(url).hostname;
        let secret: string | null = null;
        let row;
        if (input.id) {
            row = await prisma.webhookSubscription.update({ where: { id: input.id }, data: { name, url, eventsJson: JSON.stringify(events), isActive: input.isActive !== false } });
        } else {
            secret = `whsec_${crypto.randomBytes(24).toString('base64url')}`;
            row = await prisma.webhookSubscription.create({ data: { name, url, eventsJson: JSON.stringify(events), secretEnc: sealSecret({ secret }), isActive: input.isActive !== false, createdById: actor.id } });
        }
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: input.id ? 'UPDATE' : 'CREATE', entityType: 'WebhookSubscription', entityId: row.id, newValues: { name, url, events } });
        // The signing secret is shown once, at creation
        return { id: row.id, secret };
    },

    async deleteWebhook(id: string, actor: Actor) {
        assertManage(actor);
        await prisma.webhookSubscription.delete({ where: { id } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'DELETE', entityType: 'WebhookSubscription', entityId: id });
    },

    /**
     * Delivers an event to subscribed endpoints with an HMAC-SHA256 signature
     * (header X-Ikuants-Signature: t=<unix>,v1=<hex of HMAC("<t>.<body>")>). Payloads carry
     * references only, never personal identity data. Failures are logged, never thrown.
     */
    async dispatch(event: string, data: Record<string, unknown>) {
        try {
            const subs = await prisma.webhookSubscription.findMany({ where: { isActive: true } });
            for (const sub of subs) {
                const events = JSON.parse(sub.eventsJson) as string[];
                if (!events.includes(event)) continue;
                const body = JSON.stringify({ id: crypto.randomUUID(), event, createdAt: new Date().toISOString(), data });
                const t = Math.floor(Date.now() / 1000);
                const started = Date.now();
                let status = 0;
                let error: string | null = null;
                try {
                    await assertSafeUrl(sub.url);
                    const secret = openSecret(sub.secretEnc).secret || '';
                    const sig = crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
                    const res = await fetch(sub.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'IKUANTS-TEKMER-Webhook/1', 'X-Ikuants-Event': event, 'X-Ikuants-Signature': `t=${t},v1=${sig}` }, body, redirect: 'manual', signal: AbortSignal.timeout(8000) });
                    status = res.status;
                    if (!res.ok) error = `HTTP ${res.status}`;
                } catch (e) {
                    error = e instanceof Error ? e.message : 'Gönderim hatası';
                }
                await prisma.webhookSubscription.update({ where: { id: sub.id }, data: { lastStatus: status || null, lastDeliveredAt: new Date(), failureCount: error ? { increment: 1 } : 0 } });
                await logCall({ webhookId: sub.id, direction: 'WEBHOOK', method: 'POST', url: sub.url, statusCode: status || null, durationMs: Date.now() - started, ok: !error, error, summary: event });
            }
        } catch (e) {
            console.error('Webhook dispatch failed', e);
        }
    },

    // ------------------------------------------------------------------ API keys (inbound)

    async listApiKeys() {
        const rows = await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
        return rows.map((k) => ({ id: k.id, name: k.name, prefix: k.prefix, scopes: JSON.parse(k.scopesJson) as string[], lastUsedAt: k.lastUsedAt, expiresAt: k.expiresAt, revokedAt: k.revokedAt, createdAt: k.createdAt }));
    },

    async createApiKey(input: { name?: string; scopes?: unknown; expiresInDays?: number | null }, actor: Actor) {
        assertManage(actor);
        const name = input.name?.trim();
        if (!name) throw new DomainError('Anahtar adı zorunludur (ör. KOSGEB senkronizasyonu).');
        const scopes = (Array.isArray(input.scopes) ? input.scopes : []).map(String).filter((s) => s in API_SCOPES);
        if (!scopes.length) throw new DomainError('En az bir yetki kapsamı seçin.');
        const prefix = crypto.randomBytes(4).toString('hex');
        const secret = crypto.randomBytes(24).toString('base64url');
        const token = `ik_${prefix}_${secret}`;
        const expiresAt = input.expiresInDays && input.expiresInDays > 0 ? new Date(Date.now() + Math.min(730, input.expiresInDays) * 86400000) : null;
        const row = await prisma.apiKey.create({ data: { name, prefix, keyHash: crypto.createHash('sha256').update(token).digest('hex'), scopesJson: JSON.stringify(scopes), expiresAt, createdById: actor.id } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'ApiKey', entityId: row.id, newValues: { name, prefix, scopes, expiresAt } });
        // Shown once; only the hash is stored
        return { id: row.id, token };
    },

    async revokeApiKey(id: string, actor: Actor) {
        assertManage(actor);
        await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'ApiKey', entityId: id, diff: 'API anahtarı iptal edildi' });
    },

    /** Validates "Authorization: Bearer ik_…" and the required scope. */
    async verifyApiKey(authorization: string | null, scope: string | null): Promise<{ id: string; name: string } | null> {
        const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
        if (!/^ik_[a-f0-9]{8}_[A-Za-z0-9_-]{20,}$/.test(token)) return null;
        const row = await prisma.apiKey.findUnique({ where: { keyHash: crypto.createHash('sha256').update(token).digest('hex') } });
        if (!row || row.revokedAt || (row.expiresAt && row.expiresAt < new Date())) return null;
        const scopes = JSON.parse(row.scopesJson) as string[];
        if (scope && !scopes.includes(scope)) return null;
        await prisma.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
        return { id: row.id, name: row.name };
    },
};
