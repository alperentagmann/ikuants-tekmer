import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission, canAssignRole } from '@/lib/rbac';
import { UserManagementService } from '@/lib/services/user-management-service';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || (!hasPermission(user, 'view', 'users') && !user.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.toLowerCase().trim();
        const role = searchParams.get('role');
        const department = searchParams.get('department');
        const status = searchParams.get('status');

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.userRoles = { some: { role: { slug: role } } };
        }

        if (department) {
            where.department = department;
        }

        if (status) {
            where.status = status;
        }

        const [users, roles] = await Promise.all([
            prisma.user.findMany({
                where,
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
                    lastLoginAt: true,
                    lastLoginIp: true,
                    createdAt: true,
                    userRoles: {
                        include: { role: true },
                    },
                    sessions: {
                        where: { isValid: true, expiresAt: { gte: new Date() } },
                        select: { id: true, ipAddress: true, userAgent: true, createdAt: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.role.findMany({ orderBy: { name: 'asc' } }),
        ]);

        return NextResponse.json({ success: true, users, roles });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'create', 'users') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Kullanıcı oluşturma yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const body = await request.json();
        const { email, name, title, department, phone, roleId, isSuperAdmin, passwordMethod, tempPassword, notes } = body;

        if (!email || !name || !roleId) {
            return NextResponse.json({ success: false, message: 'E-posta, ad soyad ve rol seçimi zorunludur.' }, { status: 400 });
        }

        // Check role hierarchy
        const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
        if (!targetRole) {
            return NextResponse.json({ success: false, message: 'Geçersiz rol.' }, { status: 400 });
        }

        if (!canAssignRole(caller, targetRole.slug)) {
            return NextResponse.json({ success: false, message: 'Bu rolü atama yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const result = await UserManagementService.createUser({
            email,
            name,
            title,
            department,
            phone,
            roleId,
            isSuperAdmin: !!isSuperAdmin,
            passwordMethod: passwordMethod === 'TEMP_PASSWORD' ? 'TEMP_PASSWORD' : 'INVITE',
            tempPassword,
            notes,
            actorId: caller.id,
        });

        return NextResponse.json({
            success: true,
            user: result.user,
            inviteToken: result.inviteToken,
            message: passwordMethod === 'INVITE' ? 'Davet e-postası kuyruğa eklendi.' : 'Kullanıcı başarıyla oluşturuldu.',
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Kullanıcı oluşturulamadı.' }, { status: 400 });
    }
}
