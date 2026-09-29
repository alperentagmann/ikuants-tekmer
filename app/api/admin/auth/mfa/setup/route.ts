import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { generateBase32Secret, generateOtpAuthUri, generateBackupCodes, hashBackupCodes, verifyTotpCode } from '@/lib/mfa';

export async function POST() {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller) {
            return NextResponse.json({ success: false, error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }

        // Generate base32 secret and otpauth URI
        const secret = generateBase32Secret(20);
        const otpAuthUri = generateOtpAuthUri(caller.email, 'IKUANTS TEKMER', secret);

        // Store secret temporarily
        await prisma.user.update({
            where: { id: caller.id },
            data: { mfaSecret: secret },
        });

        return NextResponse.json({
            success: true,
            secret,
            otpAuthUri,
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'MFA kurulumu başlatılamadı.' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller) {
            return NextResponse.json({ success: false, error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }

        const body = await request.json();
        const { token } = body;

        const user = await prisma.user.findUnique({ where: { id: caller.id } });
        if (!user || !user.mfaSecret) {
            return NextResponse.json({ success: false, error: 'MFA kurulumu başlatılmamış.' }, { status: 400 });
        }

        const isValid = verifyTotpCode(user.mfaSecret, token);
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Girilen 6 haneli doğrulama kodu hatalı.' }, { status: 400 });
        }

        // Generate and hash 8 backup codes
        const backupCodes = generateBackupCodes(8);
        const hashedCodes = await hashBackupCodes(backupCodes);

        await prisma.user.update({
            where: { id: caller.id },
            data: {
                isMfaEnabled: true,
                mfaBackupCodes: JSON.stringify(hashedCodes),
            },
        });

        await logAuditEvent({
            actorId: caller.id,
            action: 'UPDATE',
            entityType: 'User',
            entityId: caller.id,
            diff: 'Activated TOTP Two-Factor Authentication (MFA)',
        });

        return NextResponse.json({
            success: true,
            message: 'MFA başarıyla etkinleştirildi.',
            backupCodes, // Plaintext returned only once for the user to write down
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'MFA doğrulanamadı.' }, { status: 500 });
    }
}
