import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { UserManagementService } from '@/lib/services/user-management-service';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'reset_password', 'users') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Şifre sıfırlama yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' }, { status: 404 });
        }

        const body = await request.json().catch(() => ({}));
        const { method, tempPassword } = body;

        if (method === 'TEMP_PASSWORD') {
            await UserManagementService.updateUser({
                id,
                mustChangePassword: true,
                actorId: caller.id,
            });

            if (tempPassword) {
                const { hashPassword } = await import('@/lib/auth');
                const passwordHash = await hashPassword(tempPassword);
                await prisma.user.update({
                    where: { id },
                    data: { passwordHash, mustChangePassword: true },
                });
            }

            // Revoke active sessions for safety
            await UserManagementService.revokeAllUserSessions(id, caller.id);

            return NextResponse.json({
                success: true,
                message: 'Geçici şifre belirlendi ve kullanıcının açık oturumları sonlandırıldı.',
            });
        } else {
            // Default: Send secure reset link email
            await UserManagementService.requestPasswordReset(user.email, caller.id);
            return NextResponse.json({
                success: true,
                message: `Şifre sıfırlama bağlantısı ${user.email} adresine gönderildi.`,
            });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'İşlem başarısız.' }, { status: 400 });
    }
}
