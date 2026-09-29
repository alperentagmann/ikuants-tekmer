import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

export interface RateLimitStoreAdapter {
    get(key: string): Promise<RateLimitRecord | null> | RateLimitRecord | null;
    set(key: string, record: RateLimitRecord): Promise<void> | void;
    delete(key: string): Promise<void> | void;
}

export class MemoryRateLimitStore implements RateLimitStoreAdapter {
    private store = new Map<string, RateLimitRecord>();

    get(key: string): RateLimitRecord | null {
        return this.store.get(key) || null;
    }

    set(key: string, record: RateLimitRecord): void {
        this.store.set(key, record);
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    cleanup(now: number): void {
        for (const [key, record] of this.store.entries()) {
            if (record.resetTime < now) {
                this.store.delete(key);
            }
        }
    }
}

/**
 * Distributed KV / Redis Rate Limit Store Adapter for Serverless (Vercel / Upstash / Redis)
 */
export class DistributedRateLimitStore implements RateLimitStoreAdapter {
    private fallback = new MemoryRateLimitStore();

    async get(key: string): Promise<RateLimitRecord | null> {
        if (typeof process !== 'undefined' && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            try {
                const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`, {
                    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
                    cache: 'no-store'
                });
                const data = await res.json();
                if (data && data.result) {
                    return JSON.parse(data.result);
                }
            } catch {
                // Fallback to in-memory if remote store fails
            }
        }
        return this.fallback.get(key);
    }

    async set(key: string, record: RateLimitRecord): Promise<void> {
        if (typeof process !== 'undefined' && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            try {
                const ttl = Math.max(1, Math.ceil((record.resetTime - Date.now()) / 1000));
                await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(record))}?EX=${ttl}`, {
                    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
                    cache: 'no-store'
                });
                return;
            } catch {
                // Fallback
            }
        }
        this.fallback.set(key, record);
    }

    async delete(key: string): Promise<void> {
        if (typeof process !== 'undefined' && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            try {
                await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/del/${encodeURIComponent(key)}`, {
                    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
                    cache: 'no-store'
                });
                return;
            } catch {
                // Fallback
            }
        }
        this.fallback.delete(key);
    }
}

const memoryStore = new MemoryRateLimitStore();
const distributedStore = new DistributedRateLimitStore();

// Select active store based on environment
const activeStore: RateLimitStoreAdapter = (typeof process !== 'undefined' && process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL)
    ? distributedStore
    : memoryStore;

// Periodic cleanup of expired entries for memory store (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    const timer = setInterval(() => {
        memoryStore.cleanup(Date.now());
    }, 5 * 60 * 1000);
    if (typeof timer.unref === 'function') {
        timer.unref();
    }
}

export interface RateLimitOptions {
    limit: number;        // Max allowed requests in the window
    windowSeconds: number; // Duration of the window in seconds
    keyPrefix?: string;
}

/**
 * Check rate limit for a client identifier (IP or Key)
 */
export function checkEndpointRateLimit(
    identifier: string,
    options: RateLimitOptions
): { isAllowed: boolean; remaining: number; resetSeconds: number } {
    const now = Date.now();
    const prefix = options.keyPrefix || 'global';
    const storeKey = `${prefix}:${identifier}`;

    const existing = memoryStore.get(storeKey);

    if (!existing || existing.resetTime < now) {
        // New window
        const resetTime = now + options.windowSeconds * 1000;
        memoryStore.set(storeKey, { count: 1, resetTime });
        return {
            isAllowed: true,
            remaining: options.limit - 1,
            resetSeconds: options.windowSeconds,
        };
    }

    if (existing.count >= options.limit) {
        const resetSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
        return {
            isAllowed: false,
            remaining: 0,
            resetSeconds,
        };
    }

    existing.count++;
    const resetSeconds = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
    return {
        isAllowed: true,
        remaining: options.limit - existing.count,
        resetSeconds,
    };
}

/**
 * Helper to extract client IP from NextRequest
 */
export function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers.get('x-real-ip');
    if (realIp) {
        return realIp.trim();
    }
    return '127.0.0.1';
}

/**
 * Convenience wrapper returning 429 response if rate limited
 */
export function enforceRateLimit(
    req: NextRequest,
    options: RateLimitOptions,
    customIdentifier?: string
): NextResponse | null {
    const ip = customIdentifier || getClientIp(req);
    const result = checkEndpointRateLimit(ip, options);

    if (!result.isAllowed) {
        return NextResponse.json(
            {
                success: false,
                error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.',
                retryAfter: result.resetSeconds,
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(result.resetSeconds),
                    'X-RateLimit-Limit': String(options.limit),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(result.resetSeconds),
                },
            }
        );
    }

    return null;
}
