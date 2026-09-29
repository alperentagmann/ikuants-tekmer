import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { verifyTotpCode, verifyAndConsumeBackupCode } from '@/lib/mfa';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, mfaCode, backupCode } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Kullanıcı kimliği eksik.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isActive || !user.isMfaEnabled || !user.mfaSecret) {
            return NextResponse.json({ success: false, error: 'Geçersiz MFA doğrulaması.' }, { status: 400 });
        }

        let isVerified = false;

        if (mfaCode) {
            isVerified = verifyTotpCode(user.mfaSecret, mfaCode);
        } else if (backupCode) {
            const backupResult = await verifyAndConsumeBackupCode(backupCode, user.mfaBackupCodes);
            if (backupResult.isValid) {
                isVerified = true;
                // Update remaining backup codes
                await prisma.user.update({
                    where: { id: user.id },
                    data: { mfaBackupCodes: backupResult.remainingHashedCodesJson },
                });
            }
        }

        if (!isVerified) {
            return NextResponse.json({ success: false, error: 'Doğrulama kodu veya kurtarma kodu geçersiz.' }, { status: 401 });
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || 'Unknown';

        // Create new session
        const sessionData = await createSession(user.id, ip, userAgent);

        const cookieName = process.env.ADMIN_SESSION_COOKIE_NAME || '__session';
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isSuperAdmin: user.isSuperAdmin,
            },
        });

        response.cookies.set({
            name: cookieName,
            value: sessionData.sessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: sessionData.expiresAt,
            path: '/',
        });

        await logAuditEvent({
            actorId: user.id,
            action: 'LOGIN',
            entityType: 'Session',
            entityId: sessionData.session.id,
            diff: `Completed MFA challenge login: ${user.email}`,
            ipAddress: ip,
            userAgent,
        });

        return response;
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'MFA doğrulaması başarısız.' }, { status: 500 });
    }
}
