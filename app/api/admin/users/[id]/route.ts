import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission, canAssignRole } from '@/lib/rbac';
import { UserManagementService } from '@/lib/services/user-management-service';
import { sanitizeStaffProfile } from '@/lib/hr';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'view', 'users') && !caller.isSuperAdmin && caller.id !== id)) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                title: true,
                department: true,
                phone: true,
                avatarUrl: true,
                employmentType: true,
                sgkStatus: true,
                hireDate: true,
                isActive: true,
                status: true,
                isSuperAdmin: true,
                mustChangePassword: true,
                isMfaEnabled: true,
                notes: true,
                lastLoginAt: true,
                lastLoginIp: true,
                createdAt: true,
                updatedAt: true,
                userRoles: {
                    include: { role: true },
                },
                sessions: {
                    where: { isValid: true, expiresAt: { gte: new Date() } },
                    select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'edit', 'users') && !caller.isSuperAdmin && caller.id !== id)) {
            return NextResponse.json({ success: false, message: 'Düzenleme yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const body = await request.json();
        const { name, title, department, phone, avatarUrl, roleId, isSuperAdmin, isActive, status, mustChangePassword, notes } = body;
        const staff = sanitizeStaffProfile(body);
        const cleanAvatar = typeof avatarUrl === 'string' ? ((avatarUrl.startsWith('/') && !avatarUrl.startsWith('//')) || /^https:\/\//.test(avatarUrl) ? avatarUrl.slice(0, 500) : '') : undefined;

        // If updating roles or admin status, caller must have 'users:assign_role'
        if (roleId || isSuperAdmin !== undefined) {
            if (!caller.isSuperAdmin && !hasPermission(caller, 'assign_role', 'users')) {
                return NextResponse.json({ success: false, message: 'Rol değiştirme yetkiniz bulunmamaktadır.' }, { status: 403 });
            }

            if (roleId) {
                const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
                if (targetRole && !canAssignRole(caller, targetRole.slug)) {
                    return NextResponse.json({ success: false, message: 'Bu rolü atama yetkiniz bulunmamaktadır.' }, { status: 403 });
                }
            }
        }

        const updated = await UserManagementService.updateUser({
            id,
            name,
            title,
            department,
            phone,
            avatarUrl: cleanAvatar,
            roleId,
            isSuperAdmin: caller.isSuperAdmin ? isSuperAdmin : undefined,
            isActive,
            status,
            mustChangePassword,
            notes,
            ...staff,
            actorId: caller.id,
        });

        return NextResponse.json({ success: true, user: updated, message: 'Kullanıcı başarıyla güncellendi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Güncelleme başarısız.' }, { status: 400 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'delete', 'users') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Kullanıcı silme yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        await UserManagementService.deleteUser(id, caller.id);

        return NextResponse.json({ success: true, message: 'Kullanıcı başarıyla silindi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Silme işlemi başarısız.' }, { status: 400 });
    }
}
