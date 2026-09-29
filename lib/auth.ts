import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

// Re-export maskTcNumber from utils so existing imports continue to work
export { maskTcNumber } from '@/lib/utils';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'super-secure-ikuants-tekmer-jwt-secret-key-change-in-production-2026'
);

const SESSION_COOKIE_NAME = process.env.ADMIN_SESSION_COOKIE_NAME || '__session';
const SESSION_EXPIRY_DAYS = parseInt(process.env.SESSION_EXPIRY_DAYS || '7', 10);

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    // Generate secure JWT token for the session
    const sessionToken = await new SignJWT({ userId, type: 'admin_session' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
        .sign(JWT_SECRET);

    // Save session in database for server-side revocation capability
    const session = await prisma.session.create({
        data: {
            userId,
            sessionToken,
            ipAddress,
            userAgent,
            expiresAt,
            isValid: true,
        },
    });

    // Update last login details on User
    await prisma.user.update({
        where: { id: userId },
        data: {
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
        },
    });

    return { sessionToken, expiresAt, session };
}

export async function validateSession(sessionToken: string) {
    try {
        const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
        const userId = payload.userId as string;

        if (!userId) return null;

        // Verify with database record
        const dbSession = await prisma.session.findUnique({
            where: { sessionToken },
            include: {
                user: {
                    include: {
                        userRoles: {
                            include: {
                                role: {
                                    include: {
                                        permissions: {
                                            include: {
                                                permission: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        userPermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!dbSession || !dbSession.isValid || dbSession.expiresAt < new Date()) {
            return null;
        }

        if (!dbSession.user || !dbSession.user.isActive) {
            return null;
        }

        return {
            user: dbSession.user,
            session: dbSession,
        };
    } catch {
        return null;
    }
}

export async function getCurrentAdminUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

        if (!token) return null;

        const authData = await validateSession(token);
        return authData?.user || null;
    } catch {
        return null;
    }
}

export async function revokeSession(sessionToken: string) {
    await prisma.session.updateMany({
        where: { sessionToken },
        data: { isValid: false },
    });
}

export async function revokeAllUserSessions(userId: string) {
    await prisma.session.updateMany({
        where: { userId },
        data: { isValid: false },
    });
}

export async function checkRateLimit(email: string, ipAddress: string): Promise<{ isAllowed: boolean; waitMinutes?: number }> {
    const windowMinutes = 15;
    const maxAttempts = 5;
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const failedAttempts = await prisma.loginAttempt.count({
        where: {
            OR: [{ email }, { ipAddress }],
            isSuccess: false,
            createdAt: { gte: since },
        },
    });

    if (failedAttempts >= maxAttempts) {
        return { isAllowed: false, waitMinutes: windowMinutes };
    }

    return { isAllowed: true };
}

export async function logLoginAttempt(
    email: string,
    ipAddress: string,
    isSuccess: boolean,
    failureReason?: string,
    userAgent?: string
) {
    try {
        await prisma.loginAttempt.create({
            data: {
                email,
                ipAddress,
                userAgent,
                isSuccess,
                failureReason,
            },
        });
    } catch (e) {
        console.error('Failed to log login attempt:', e);
    }
}



export async function requireAuth(req?: any): Promise<{ authenticated: boolean; user?: any; session?: any; error?: string }> {
    try {
        let token: string | undefined;
        if (req && typeof req.cookies?.get === 'function') {
            token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
        }
        if (!token) {
            const cookieStore = await cookies();
            token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        }
        if (!token && req && typeof req.headers?.get === 'function') {
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        if (!token) {
            return { authenticated: false, error: 'Oturum açmanız gerekiyor.' };
        }
        const authData = await validateSession(token);
        if (!authData || !authData.user) {
            return { authenticated: false, error: 'Geçersiz veya süresi dolmuş oturum.' };
        }
        return { authenticated: true, user: authData.user, session: authData.session };
    } catch {
        return { authenticated: false, error: 'Kimlik doğrulama başarısız.' };
    }
}

export async function logPiiAccess(
    actorId: string,
    entityType: string,
    entityId: string,
    piiFieldName: string,
    ipAddress?: string,
    userAgent?: string
) {
    try {
        await prisma.auditLog.create({
            data: {
                actorId,
                action: 'PII_ACCESS',
                entityType,
                entityId,
                fieldName: piiFieldName,
                diff: `Accessed sensitive field: ${piiFieldName}`,
                isPiiAccess: true,
                ipAddress,
                userAgent,
            },
        });
    } catch (e) {
        console.error('Failed to log PII access:', e);
    }
}

