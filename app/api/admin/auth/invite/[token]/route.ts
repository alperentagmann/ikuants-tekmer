import { NextRequest, NextResponse } from 'next/server';
import { UserManagementService } from '@/lib/services/user-management-service';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;
        const validation = await UserManagementService.validateInviteToken(token);

        if (!validation.isValid) {
            return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, invite: validation.invite });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Davet doğrulanamadı.' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;
        const body = await request.json();
        const { password, name } = body;

        if (!password || password.length < 8) {
            return NextResponse.json({ success: false, message: 'Parola en az 8 karakter olmalıdır.' }, { status: 400 });
        }

        const user = await UserManagementService.acceptInvite(token, password, name);

        return NextResponse.json({
            success: true,
            message: 'Hesabınız başarıyla etkinleştirildi! Şimdi giriş yapabilirsiniz.',
            email: user.email,
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Davet kabul edilemedi.' }, { status: 400 });
    }
}
