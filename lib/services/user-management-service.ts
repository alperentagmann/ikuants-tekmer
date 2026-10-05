import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { canAssignRole, hasPermission } from '@/lib/rbac';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';
import crypto from 'crypto';

export interface CreateUserInput {
    email: string;
    name: string;
    title?: string;
    department?: string;
    phone?: string;
    roleId: string;
    isSuperAdmin?: boolean;
    passwordMethod: 'INVITE' | 'TEMP_PASSWORD';
    tempPassword?: string;
    mustChangePassword?: boolean;
    notes?: string;
    actorId?: string;
}

export interface UpdateUserInput {
    id: string;
    name?: string;
    title?: string;
    department?: string;
    phone?: string;
    avatarUrl?: string;
    roleId?: string;
    isSuperAdmin?: boolean;
    isActive?: boolean;
    status?: string; // ACTIVE, INVITED, DISABLED, LOCKED, PENDING_PASSWORD_RESET
    mustChangePassword?: boolean;
    notes?: string;
    employmentType?: string | null;
    sgkStatus?: string | null;
    hireDate?: Date | null;
    actorId?: string;
}

export class UserManagementService {
    /**
     * Hash a token for database storage (single-use tokens)
     */
    static hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    /**
     * Create a new Admin user either via invite link or with a temporary password
     */
    static async createUser(input: CreateUserInput) {
        const email = input.email.toLowerCase().trim();

        // 1. Check uniqueness
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error(`"${email}" e-posta adresiyle kayıtlı bir kullanıcı zaten mevcut.`);
        }

        // 2. Fetch target role
        const targetRole = await prisma.role.findUnique({ where: { id: input.roleId } });
        if (!targetRole) {
            throw new Error('Seçilen rol bulunamadı.');
        }

        // 3. Verify actor permissions and role assignment hierarchy
        if (input.actorId) {
            const caller = await prisma.user.findUnique({
                where: { id: input.actorId },
                include: {
                    userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
                    userPermissions: { include: { permission: true } },
                },
            });

            if (!caller || !hasPermission(caller as any, 'create', 'users')) {
                throw new Error('Yeni kullanıcı oluşturma yetkiniz bulunmamaktadır.');
            }

            if (!canAssignRole(caller as any, targetRole.slug)) {
                throw new Error('Bu rolü atama yetkiniz bulunmamaktadır.');
            }
        }

        let createdUser;
        let inviteToken: string | undefined;

        if (input.passwordMethod === 'INVITE') {
            // Generate secure random token
            inviteToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = this.hashToken(inviteToken);
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Random initial dummy hash so login is blocked until invite completion
            const dummyHash = await hashPassword(crypto.randomBytes(40).toString('hex'));

            createdUser = await prisma.user.create({
                data: {
                    email,
                    name: input.name,
                    title: input.title,
                    department: input.department,
                    phone: input.phone,
                    passwordHash: dummyHash,
                    isSuperAdmin: input.isSuperAdmin || targetRole.slug === 'super-admin',
                    isActive: true,
                    status: 'INVITED',
                    mustChangePassword: true,
                    notes: input.notes,
                    userRoles: {
                        create: { roleId: targetRole.id },
                    },
                },
                include: {
                    userRoles: { include: { role: true } },
                },
            });

            // Store invite record
            await prisma.userInvite.create({
                data: {
                    email,
                    name: input.name,
                    title: input.title,
                    department: input.department,
                    tokenHash,
                    roleId: targetRole.id,
                    invitedById: input.actorId || createdUser.id,
                    expiresAt,
                },
            });

            // Enqueue invitation email
            const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://ikuants-tekmer.vercel.app';
            const inviteUrl = `${origin}/admin/invite/${inviteToken}`;

            await EmailOutboxService.enqueueEmail({
                recipientEmail: email,
                recipientName: input.name,
                subject: 'İKÜANTS TEKMER Yönetim Paneline Davet Edildiniz',
                templateKey: 'USER_INVITE',
                htmlBody: `
                    <h2>Sayın ${input.name},</h2>
                    <p>İKÜANTS TEKMER Yönetim Paneline <strong>${targetRole.name}</strong> yetkisi ile davet edildiniz.</p>
                    <p>Hesabınızı etkinleştirmek ve kendi güvenli parolanızı belirlemek için lütfen aşağıdaki bağlantıya tıklayınız:</p>
                    <p><a href="${inviteUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Şifremi Belirle ve Hesabımı Etkinleştir</a></p>
                    <p>Bu bağlantı 24 saat boyunca geçerlidir.</p>
                `,
                entityType: 'INVITE',
                entityId: createdUser.id,
            });

        } else {
            // Temporary password flow
            const tempPassword = input.tempPassword || crypto.randomBytes(8).toString('base64').slice(0, 10) + 'A1!';
            const passwordHash = await hashPassword(tempPassword);

            createdUser = await prisma.user.create({
                data: {
                    email,
                    name: input.name,
                    title: input.title,
                    department: input.department,
                    phone: input.phone,
                    passwordHash,
                    isSuperAdmin: input.isSuperAdmin || targetRole.slug === 'super-admin',
                    isActive: true,
                    status: 'ACTIVE',
                    mustChangePassword: input.mustChangePassword !== false,
                    notes: input.notes,
                    userRoles: {
                        create: { roleId: targetRole.id },
                    },
                },
                include: {
                    userRoles: { include: { role: true } },
                },
            });

            // Enqueue credentials email
            const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://ikuants-tekmer.vercel.app';
            const loginUrl = `${origin}/admin/login`;

            await EmailOutboxService.enqueueEmail({
                recipientEmail: email,
                recipientName: input.name,
                subject: 'İKÜANTS TEKMER Yönetici Hesabınız Oluşturuldu',
                templateKey: 'USER_CREDENTIALS',
                htmlBody: `
                    <h2>Sayın ${input.name},</h2>
                    <p>İKÜANTS TEKMER Yönetim Paneli hesabınız oluşturulmuştur.</p>
                    <p><strong>Giriş E-postası:</strong> ${email}</p>
                    <p><strong>Geçici Parola:</strong> ${tempPassword}</p>
                    <p><em>Not: İlk girişinizde parolanızı değiştirmeniz gerekecektir.</em></p>
                    <p><a href="${loginUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Panele Giriş Yap</a></p>
                `,
                entityType: 'USER',
                entityId: createdUser.id,
            });
        }

        // Audit log
        await logAuditEvent({
            actorId: input.actorId,
            action: 'CREATE',
            entityType: 'User',
            entityId: createdUser.id,
            diff: `Created admin user: ${email} (${targetRole.name}, method: ${input.passwordMethod})`,
        });

        return {
            user: createdUser,
            inviteToken,
        };
    }

    /**
     * Validate an invitation token
     */
    static async validateInviteToken(token: string) {
        const tokenHash = this.hashToken(token);
        const invite = await prisma.userInvite.findUnique({
            where: { tokenHash },
            include: { role: true, invitedBy: true },
        });

        if (!invite) {
            return { isValid: false, message: 'Davet bağlantısı geçersiz veya bulunamadı.' };
        }

        if (invite.usedAt) {
            return { isValid: false, message: 'Bu davet bağlantısı daha önce kullanılmış.' };
        }

        if (invite.expiresAt < new Date()) {
            return { isValid: false, message: 'Bu davet bağlantısının süresi dolmuş.' };
        }

        return {
            isValid: true,
            invite: {
                email: invite.email,
                name: invite.name,
                title: invite.title,
                department: invite.department,
                roleName: invite.role.name,
                expiresAt: invite.expiresAt,
            },
        };
    }

    /**
     * Accept invitation and set password
     */
    static async acceptInvite(token: string, password: string, name?: string) {
        if (!password || password.length < 8) {
            throw new Error('Parola en az 8 karakter uzunluğunda olmalıdır.');
        }

        const tokenHash = this.hashToken(token);
        const invite = await prisma.userInvite.findUnique({
            where: { tokenHash },
            include: { role: true },
        });

        if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
            throw new Error('Geçersiz veya süresi dolmuş davet bağlantısı.');
        }

        const passwordHash = await hashPassword(password);

        // Update user
        const user = await prisma.user.update({
            where: { email: invite.email },
            data: {
                passwordHash,
                name: name || invite.name || invite.email,
                status: 'ACTIVE',
                mustChangePassword: false,
                isActive: true,
            },
        });

        // Mark invite as used
        await prisma.userInvite.update({
            where: { id: invite.id },
            data: { usedAt: new Date() },
        });

        await logAuditEvent({
            actorId: user.id,
            action: 'UPDATE',
            entityType: 'User',
            entityId: user.id,
            diff: `User accepted invite and activated account: ${user.email}`,
        });

        return user;
    }

    /**
     * Request password reset token and send email
     */
    static async requestPasswordReset(email: string, actorId?: string) {
        const cleanEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

        if (!user) {
            // For security, don't reveal if user doesn't exist
            return { success: true };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
            },
        });

        const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://ikuants-tekmer.vercel.app';
        const resetUrl = `${origin}/admin/reset-password/${token}`;

        await EmailOutboxService.enqueueEmail({
            recipientEmail: user.email,
            recipientName: user.name,
            subject: 'İKÜANTS TEKMER — Şifre Sıfırlama Talebi',
            templateKey: 'PASSWORD_RESET',
            htmlBody: `
                <h2>Sayın ${user.name},</h2>
                <p>Hesabınız için bir şifre sıfırlama talebi alındı.</p>
                <p>Yeni bir şifre belirlemek için aşağıdaki bağlantıya tıklayınız:</p>
                <p><a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Şifremi Sıfırla</a></p>
                <p>Bu bağlantı 2 saat boyunca geçerlidir. Talebi siz yapmadıysanız bu e-postayı dikkate almayınız.</p>
            `,
            entityType: 'PASSWORD_RESET',
            entityId: user.id,
        });

        await logAuditEvent({
            actorId: actorId || user.id,
            action: 'UPDATE',
            entityType: 'User',
            entityId: user.id,
            diff: `Password reset requested for: ${user.email}`,
        });

        return { success: true };
    }

    /**
     * Complete password reset with token
     */
    static async resetPasswordWithToken(token: string, newPassword: string) {
        if (!newPassword || newPassword.length < 8) {
            throw new Error('Yeni parola en az 8 karakter uzunluğunda olmalıdır.');
        }

        const tokenHash = this.hashToken(token);
        const resetRecord = await prisma.passwordResetToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });

        if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
            throw new Error('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.');
        }

        const passwordHash = await hashPassword(newPassword);

        // Update password and revoke old sessions
        await prisma.user.update({
            where: { id: resetRecord.userId },
            data: {
                passwordHash,
                mustChangePassword: false,
                status: 'ACTIVE',
            },
        });

        await prisma.session.updateMany({
            where: { userId: resetRecord.userId },
            data: { isValid: false },
        });

        await prisma.passwordResetToken.update({
            where: { id: resetRecord.id },
            data: { usedAt: new Date() },
        });

        await logAuditEvent({
            actorId: resetRecord.userId,
            action: 'UPDATE',
            entityType: 'User',
            entityId: resetRecord.userId,
            diff: `Password successfully reset via token: ${resetRecord.user.email}`,
        });

        return { success: true };
    }

    /**
     * Update user details, roles, and status with safety checks
     */
    static async updateUser(input: UpdateUserInput) {
        const user = await prisma.user.findUnique({
            where: { id: input.id },
            include: { userRoles: { include: { role: true } } },
        });

        if (!user) {
            throw new Error('Kullanıcı bulunamadı.');
        }

        // Safety check: Prevent disabling or removing Super Admin if it's the last active Super Admin
        if (user.isSuperAdmin && (input.isActive === false || input.status === 'DISABLED' || input.isSuperAdmin === false)) {
            const activeSuperAdminCount = await prisma.user.count({
                where: { isSuperAdmin: true, isActive: true, status: 'ACTIVE' },
            });

            if (activeSuperAdminCount <= 1) {
                throw new Error('Bu işlem gerçekleştirilemez. Sistemde en az bir aktif Süper Yönetici bulunmalıdır.');
            }
        }

        // If user is disabled, revoke all active sessions
        if (input.isActive === false || input.status === 'DISABLED') {
            await prisma.session.updateMany({
                where: { userId: input.id },
                data: { isValid: false },
            });
        }

        // Update basic fields
        const updated = await prisma.user.update({
            where: { id: input.id },
            data: {
                name: input.name !== undefined ? input.name : undefined,
                title: input.title !== undefined ? input.title : undefined,
                department: input.department !== undefined ? input.department : undefined,
                phone: input.phone !== undefined ? input.phone : undefined,
                avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : undefined,
                isActive: input.isActive !== undefined ? input.isActive : undefined,
                status: input.status !== undefined ? input.status : undefined,
                isSuperAdmin: input.isSuperAdmin !== undefined ? input.isSuperAdmin : undefined,
                mustChangePassword: input.mustChangePassword !== undefined ? input.mustChangePassword : undefined,
                notes: input.notes !== undefined ? input.notes : undefined,
                employmentType: input.employmentType !== undefined ? input.employmentType : undefined,
                sgkStatus: input.sgkStatus !== undefined ? input.sgkStatus : undefined,
                hireDate: input.hireDate !== undefined ? input.hireDate : undefined,
            },
        });

        // Update role if specified
        if (input.roleId) {
            await prisma.userRole.deleteMany({ where: { userId: input.id } });
            await prisma.userRole.create({
                data: { userId: input.id, roleId: input.roleId },
            });
        }

        await logAuditEvent({
            actorId: input.actorId,
            action: 'UPDATE',
            entityType: 'User',
            entityId: input.id,
            diff: `Updated user profile/roles: ${user.email}`,
        });

        return updated;
    }

    /**
     * Delete user with safety check
     */
    static async deleteUser(userId: string, actorId?: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('Kullanıcı bulunamadı.');

        if (user.isSuperAdmin) {
            const activeSuperAdmins = await prisma.user.count({
                where: { isSuperAdmin: true, isActive: true },
            });
            if (activeSuperAdmins <= 1) {
                throw new Error('Son aktif Süper Yönetici hesabı silinemez.');
            }
        }

        // Revoke sessions
        await prisma.session.deleteMany({ where: { userId } });

        // Delete user
        await prisma.user.delete({ where: { id: userId } });

        await logAuditEvent({
            actorId,
            action: 'DELETE',
            entityType: 'User',
            entityId: userId,
            diff: `Deleted user account: ${user.email}`,
        });

        return { success: true };
    }

    /**
     * Get active sessions for a user
     */
    static async getUserSessions(userId: string) {
        return prisma.session.findMany({
            where: {
                userId,
                isValid: true,
                expiresAt: { gte: new Date() },
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
                expiresAt: true,
                updatedAt: true,
            },
        });
    }

    /**
     * Revoke single session
     */
    static async revokeSession(sessionId: string, actorId?: string) {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) return { success: false };

        await prisma.session.update({
            where: { id: sessionId },
            data: { isValid: false },
        });

        await logAuditEvent({
            actorId,
            action: 'DELETE',
            entityType: 'Session',
            entityId: sessionId,
            diff: `Revoked session for user ID ${session.userId}`,
        });

        return { success: true };
    }

    /**
     * Revoke all sessions for a user
     */
    static async revokeAllUserSessions(userId: string, actorId?: string) {
        await prisma.session.updateMany({
            where: { userId },
            data: { isValid: false },
        });

        await logAuditEvent({
            actorId,
            action: 'DELETE',
            entityType: 'Session',
            entityId: userId,
            diff: `Revoked all active sessions for user ID ${userId}`,
        });

        return { success: true };
    }

    /**
     * Get user recent audit activity
     */
    static async getUserActivity(userId: string, limit: number = 50) {
        return prisma.auditLog.findMany({
            where: {
                OR: [{ actorId: userId }, { entityId: userId }],
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
