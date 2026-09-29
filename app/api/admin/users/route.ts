import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser, hashPassword, revokeAllUserSessions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'users')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                avatarUrl: true,
                isActive: true,
                isSuperAdmin: true,
                lastLoginAt: true,
                lastLoginIp: true,
                createdAt: true,
                userRoles: {
                    include: { role: true },
                },
                sessions: {
                    where: { isValid: true },
                    select: { id: true, ipAddress: true, userAgent: true, createdAt: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, users });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'manage', 'users')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, name, phone, roleId, isSuperAdmin } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ success: false, message: 'E-posta, ad soyad ve parola zorunludur.' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (existing) {
            return NextResponse.json({ success: false, message: 'Bu e-posta adresiyle kayıtlı kullanıcı zaten var.' }, { status: 400 });
        }

        const passwordHash = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                email: email.toLowerCase().trim(),
                name,
                phone,
                passwordHash,
                isSuperAdmin: !!isSuperAdmin,
                isActive: true,
                userRoles: roleId ? { create: { roleId } } : undefined,
            },
        });

        await logAuditEvent({
            actorId: user.id,
            actorEmail: user.email,
            actorName: user.name,
            action: 'CREATE',
            entityType: 'User',
            entityId: newUser.id,
            diff: `Created admin user "${newUser.name}" (${newUser.email})`,
        });

        return NextResponse.json({ success: true, user: newUser });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'manage', 'users')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const { id, isActive, roleId, password, isSuperAdmin } = body;

        // Security check: prevent deactivating the last active super admin
        if (isActive === false || isSuperAdmin === false) {
            const targetUser = await prisma.user.findUnique({ where: { id } });
            if (targetUser?.isSuperAdmin) {
                const superAdminCount = await prisma.user.count({
                    where: { isSuperAdmin: true, isActive: true },
                });
                if (superAdminCount <= 1) {
                    return NextResponse.json({
                        success: false,
                        message: 'Sistemdeki son Süper Yönetici hesabı devre dışı bırakılamaz veya yetkisi düşürülemez.',
                    }, { status: 400 });
                }
            }
        }

        const updateData: any = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isSuperAdmin !== undefined && user.isSuperAdmin) updateData.isSuperAdmin = isSuperAdmin;
        if (password) updateData.passwordHash = await hashPassword(password);

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        // If user was deactivated, revoke all active sessions immediately
        if (isActive === false) {
            await revokeAllUserSessions(id);
        }

        // Update role if specified
        if (roleId) {
            await prisma.userRole.deleteMany({ where: { userId: id } });
            await prisma.userRole.create({ data: { userId: id, roleId } });
        }

        await logAuditEvent({
            actorId: user.id,
            actorEmail: user.email,
            actorName: user.name,
            action: 'UPDATE',
            entityType: 'User',
            entityId: id,
            diff: `Updated user account "${updatedUser.name}" (isActive: ${updatedUser.isActive})`,
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
