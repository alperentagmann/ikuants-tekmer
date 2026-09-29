import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, checkRateLimit, logLoginAttempt } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'E-posta ve parola zorunludur.' },
                { status: 400 }
            );
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || '';

        // Rate limiting / Brute force check
        const rateCheck = await checkRateLimit(email, ip);
        if (!rateCheck.isAllowed) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Çok fazla başarısız giriş denemesi. Lütfen ${rateCheck.waitMinutes} dakika sonra tekrar deneyin.`,
                },
                { status: 429 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user || !user.isActive) {
            await logLoginAttempt(email, ip, false, 'User not found or inactive', userAgent);
            return NextResponse.json(
                { success: false, message: 'Geçersiz e-posta veya parola.' },
                { status: 401 }
            );
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            await logLoginAttempt(email, ip, false, 'Incorrect password', userAgent);
            return NextResponse.json(
                { success: false, message: 'Geçersiz e-posta veya parola.' },
                { status: 401 }
            );
        }

        // Create DB-tracked session
        const { sessionToken, expiresAt } = await createSession(user.id, ip, userAgent);
        await logLoginAttempt(email, ip, true, undefined, userAgent);

        await logAuditEvent({
            actorId: user.id,
            actorEmail: user.email,
            actorName: user.name,
            action: 'LOGIN',
            entityType: 'User',
            entityId: user.id,
            diff: 'Admin successfully logged in',
            ipAddress: ip,
            userAgent,
        });

        const response = NextResponse.json({
            success: true,
            message: 'Giriş başarılı.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isSuperAdmin: user.isSuperAdmin,
            },
        });

        // Set HttpOnly, Secure cookie
        response.cookies.set({
            name: process.env.ADMIN_SESSION_COOKIE_NAME || '__session',
            value: sessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Login error:', error);
        const errMsg = (error?.message || '').toLowerCase();
        const errCode = error?.code || '';
        const isDbError =
            errMsg.includes("can't reach database server") ||
            errMsg.includes('econnrefused') ||
            errMsg.includes('connect') ||
            errMsg.includes('database') ||
            errMsg.includes('prisma') ||
            errCode === 'P1001' ||
            errCode === 'P1000' ||
            errCode === 'P1002' ||
            errCode === 'P1003' ||
            errCode === 'P1017';

        const errorMessage = isDbError
            ? 'Veritabanı bağlantısı kurulamadı (localhost:5432). Lütfen PostgreSQL sunucusunun çalıştığından emin olun.'
            : 'Sunucu hatası oluştu. Lütfen tekrar deneyin.';

        return NextResponse.json(
            { success: false, message: errorMessage },
            { status: isDbError ? 503 : 500 }
        );
    }
}
