import { PrismaClient } from '@prisma/client';

// Production environment database URL validator (fail-fast)
function validateDatabaseUrl() {
    const isVercelProduction = process.env.VERCEL === '1';
    const dbUrl = process.env.DATABASE_URL;

    if (isVercelProduction) {
        if (!dbUrl) {
            throw new Error(
                'CONFIGURATION ERROR: DATABASE_URL environment variable is required in production environment. Please configure a managed PostgreSQL connection.'
            );
        }

        const isLocalhost =
            dbUrl.includes('localhost') ||
            dbUrl.includes('127.0.0.1') ||
            dbUrl.includes('0.0.0.0') ||
            dbUrl.includes('::1');

        if (isLocalhost) {
            throw new Error(
                'CONFIGURATION ERROR: Localhost database connection string detected in production environment. Production must use a managed PostgreSQL provider (e.g. Neon, Supabase, Railway, Vercel Postgres).'
            );
        }
    }
}

// Run validation during module load in runtime
try {
    validateDatabaseUrl();
} catch (e: any) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
        console.error('CRITICAL DATABASE CONFIGURATION ERROR:', e.message);
    }
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Standardized database error sanitizer for public and admin API routes
 */
export function getSafeDatabaseErrorMessage(error: any): { message: string; isDbError: boolean } {
    const errMsg = (error?.message || '').toLowerCase();
    const errCode = error?.code || '';
    const isDbError =
        errMsg.includes("can't reach database server") ||
        errMsg.includes('econnrefused') ||
        errMsg.includes('connect') ||
        errMsg.includes('database') ||
        errMsg.includes('prisma') ||
        errMsg.includes('p1001') ||
        errMsg.includes('p1000') ||
        errMsg.includes('p1002') ||
        errMsg.includes('p1003') ||
        errMsg.includes('p1017') ||
        errCode === 'P1001' ||
        errCode === 'P1000' ||
        errCode === 'P1002' ||
        errCode === 'P1003' ||
        errCode === 'P1017';

    if (isDbError) {
        return {
            message: 'Sistem veritabanına şu anda erişilemiyor. Lütfen daha sonra tekrar deneyin.',
            isDbError: true,
        };
    }

    return {
        message: 'Sunucu hatası oluştu. Lütfen tekrar deneyin.',
        isDbError: false,
    };
}
