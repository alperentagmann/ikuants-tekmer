import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserManagementService } from '@/lib/services/user-management-service';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;
        const tokenHash = UserManagementService.hashToken(token);

        const record = await prisma.passwordResetToken.findUnique({
            where: { tokenHash },
            include: { user: { select: { email: true, name: true } } },
        });

        if (!record || record.usedAt || record.expiresAt < new Date()) {
            return NextResponse.json({
                success: false,
                message: 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.',
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            user: { email: record.user.email, name: record.user.name },
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;
        const body = await request.json();
        const { password } = body;

        if (!password || password.length < 8) {
            return NextResponse.json({ success: false, message: 'Yeni parola en az 8 karakter olmalıdır.' }, { status: 400 });
        }

        await UserManagementService.resetPasswordWithToken(token, password);

        return NextResponse.json({
            success: true,
            message: 'Parolanız başarıyla güncellendi. Yeni parolanızla giriş yapabilirsiniz.',
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Şifre sıfırlanamadı.' }, { status: 400 });
    }
}
