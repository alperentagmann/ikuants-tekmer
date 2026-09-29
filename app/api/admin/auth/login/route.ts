import { NextRequest, NextResponse } from 'next/server';
import { prisma, getSafeDatabaseErrorMessage } from '@/lib/prisma';
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

        const normalizedEmail = email.toLowerCase().trim();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || '';

        // Rate limiting / Brute force check
        const rateCheck = await checkRateLimit(normalizedEmail, ip);
        if (!rateCheck.isAllowed) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Çok fazla başarısız giriş denemesi. Lütfen ${rateCheck.waitMinutes} dakika sonra tekrar deneyin.`,
                },
                { status: 429 }
            );
        }

        // Production legacy admin guard: admin@ikuantstekmer.com is disabled in production
        if (process.env.NODE_ENV === 'production' && normalizedEmail === 'admin@ikuantstekmer.com') {
            await logLoginAttempt(normalizedEmail, ip, false, 'Legacy admin account is disabled in production', userAgent);
            return NextResponse.json(
                { success: false, message: 'Bu hesap üretim ortamında devre dışı bırakılmıştır.' },
                { status: 403 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user || !user.isActive) {
            await logLoginAttempt(normalizedEmail, ip, false, 'User not found or inactive', userAgent);
            return NextResponse.json(
                { success: false, message: 'Geçersiz e-posta veya parola.' },
                { status: 401 }
            );
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            await logLoginAttempt(normalizedEmail, ip, false, 'Incorrect password', userAgent);
            return NextResponse.json(
                { success: false, message: 'Geçersiz e-posta veya parola.' },
                { status: 401 }
            );
        }

        // Production default credential guard (Item 93)
        if (process.env.NODE_ENV === 'production' && (password === 'admin' || password === 'password' || password === 'AdminTekmer2026!')) {
            return NextResponse.json(
                { success: false, message: 'Varsayılan geliştirme parolalarının üretim ortamında kullanılması engellenmiştir.' },
                { status: 403 }
            );
        }

        // MFA Challenge check (Item 75)
        if (user.isMfaEnabled && user.mfaSecret) {
            return NextResponse.json({
                success: true,
                requiresMfa: true,
                userId: user.id,
                message: 'Lütfen 6 haneli doğrulama kodunuzu giriniz.',
            });
        }

        // Create DB-tracked session
        const { sessionToken, expiresAt } = await createSession(user.id, ip, userAgent);
        await logLoginAttempt(normalizedEmail, ip, true, undefined, userAgent);

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
        const { message, isDbError } = getSafeDatabaseErrorMessage(error);
        return NextResponse.json(
            { success: false, message },
            { status: isDbError ? 503 : 500 }
        );
    }
}
