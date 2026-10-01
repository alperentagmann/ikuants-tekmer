import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { PersonService } from './person-service';
import { OrganizationService } from './organization-service';
import { EntrepreneurProgramService } from './entrepreneur-program-service';
import { RentService } from './rent-service';
import { TaskService } from './task-service';
import { InteractionService } from './interaction-service';
import { ReportingService } from './reporting-service';
import { UserManagementService } from './user-management-service';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AiActionDefinition {
    id: string;
    name: string;
    description: string;
    requiredPermission: string;
    riskLevel: RiskLevel;
    requiresConfirmation: boolean;
    isReversible: boolean;
    execute: (params: any, actor: { id: string; email?: string; name?: string; isSuperAdmin?: boolean }) => Promise<{
        success: boolean;
        message: string;
        data?: any;
        beforeState?: any;
        afterState?: any;
        undoPayload?: any;
    }>;
    rollback: (undoPayload: any, actor: { id: string; email?: string; name?: string }) => Promise<{
        success: boolean;
        message: string;
    }>;
}

export const AI_ACTION_REGISTRY: Record<string, AiActionDefinition> = {
    // ------------------------------------------------------------------------
    // 1. CMS & HOMEPAGE ACTIONS
    // ------------------------------------------------------------------------
    'cms.banner.create': {
        id: 'cms.banner.create',
        name: 'Ana Sayfa Banner Ekle',
        description: 'Ana sayfaya yeni bir hero banner görseli ve başlığı ekler.',
        requiredPermission: 'homepage:edit',
        riskLevel: 'MEDIUM',
        requiresConfirmation: true,
        isReversible: true,
        execute: async (params, actor) => {
            const count = await prisma.heroSlide.count();
            const slide = await prisma.heroSlide.create({
                data: {
                    title: params.title || 'Yeni Duyuru & Program',
                    subtitle: params.subtitle || '',
                    description: params.description || '',
                    mediaUrl: params.mediaUrl || params.imageUrl || '/images/hero/hero-slide-1.webp',
                    mobileMediaUrl: params.mobileMediaUrl || params.mediaUrl || params.imageUrl,
                    primaryCtaText: params.primaryCtaText || 'HEMEN BAŞVUR',
                    primaryCtaLink: params.primaryCtaLink || '/basvuru',
                    sortOrder: count + 1,
                    status: 'PUBLISHED',
                    isActive: true,
                },
            });

            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'CREATE',
                entityType: 'HeroSlide',
                entityId: slide.id,
                diff: `AI Asistanı tarafından ana sayfa banner eklendi: ${slide.title}`,
            });

            return {
                success: true,
                message: `Ana sayfaya "${slide.title}" başlıklı yeni banner başarıyla eklendi.`,
                data: slide,
                afterState: slide,
                undoPayload: { slideId: slide.id },
            };
        },
        rollback: async (undoPayload, actor) => {
            if (!undoPayload?.slideId) return { success: false, message: 'Geri alınacak banner ID bulunamadı.' };
            await prisma.heroSlide.delete({ where: { id: undoPayload.slideId } });
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'DELETE',
                entityType: 'HeroSlide',
                entityId: undoPayload.slideId,
                diff: `AI Asistanı banner ekleme işlemini geri aldı (silindi).`,
            });
            return { success: true, message: 'Eklenen banner başarıyla geri alındı ve kaldırıldı.' };
        },
    },

    // ------------------------------------------------------------------------
    // 2. USER & RBAC ACTIONS
    // ------------------------------------------------------------------------
    'user.invite': {
        id: 'user.invite',
        name: 'Yeni Kullanıcı Davet Et',
        description: 'Sisteme yeni bir yönetici veya çalışan davet eder.',
        requiredPermission: 'users:create',
        riskLevel: 'HIGH',
        requiresConfirmation: true,
        isReversible: true,
        execute: async (params, actor) => {
            const existing = await prisma.user.findUnique({ where: { email: params.email } });
            if (existing) {
                return {
                    success: false,
                    message: `"${params.email}" adresine sahip bir kullanıcı zaten mevcut.`,
                };
            }

            // Find role
            let role = null;
            if (params.roleSlug) {
                role = await prisma.role.findUnique({ where: { slug: params.roleSlug } });
            } else if (params.roleId) {
                role = await prisma.role.findUnique({ where: { id: params.roleId } });
            }

            if (!role) {
                role = await prisma.role.findFirst({ where: { slug: 'admin' } }) ||
                       await prisma.role.findFirst();
            }

            if (!role) {
                return { success: false, message: 'Atanacak rol bulunamadı.' };
            }

            // Prevent non-superadmin from granting super admin
            if (role.slug === 'super-admin' && !actor.isSuperAdmin) {
                return { success: false, message: 'Sadece Super Admin başka bir kullanıcıya Super Admin rolü atayabilir.' };
            }

            const userResult = await UserManagementService.createUser({
                email: params.email,
                name: params.name || params.email.split('@')[0],
                title: params.title,
                department: params.department,
                roleId: role.id,
                passwordMethod: 'INVITE',
                actorId: actor.id,
            });

            return {
                success: true,
                message: `"${params.name || params.email}" için ${role.name} rolüyle kullanıcı hesabı ve davet oluşturuldu.`,
                data: userResult,
                afterState: userResult,
                undoPayload: { userId: userResult.user.id, email: params.email },
            };
        },
        rollback: async (undoPayload, actor) => {
            if (!undoPayload?.userId) return { success: false, message: 'Kullanıcı ID bulunamadı.' };
            await prisma.user.delete({ where: { id: undoPayload.userId } });
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'DELETE',
                entityType: 'User',
                entityId: undoPayload.userId,
                diff: `AI Asistanı kullanıcı oluşturma işlemini geri aldı.`,
            });
            return { success: true, message: `"${undoPayload.email}" kullanıcısı ve daveti geri alındı.` };
        },
    },

    // ------------------------------------------------------------------------
    // 3. ENTREPRENEUR & PROGRAM ACTIONS
    // ------------------------------------------------------------------------
    'entrepreneur.assignProgram': {
        id: 'entrepreneur.assignProgram',
        name: 'Girişimciye Program Ata',
        description: 'Bir girişimciyi hızlandırma veya kuluçka programına atar.',
        requiredPermission: 'entrepreneurs:edit',
        riskLevel: 'MEDIUM',
        requiresConfirmation: true,
        isReversible: true,
        execute: async (params, actor) => {
            // Find entrepreneur
            let ent = null;
            if (params.entrepreneurId) {
                ent = await prisma.entrepreneur.findUnique({ where: { id: params.entrepreneurId } });
            } else if (params.entrepreneurName) {
                ent = await prisma.entrepreneur.findFirst({
                    where: { name: { contains: params.entrepreneurName, mode: 'insensitive' } },
                });
            }

            if (!ent) return { success: false, message: 'Girişimci kaydı bulunamadı.' };

            // Find program
            let prog = null;
            if (params.programId) {
                prog = await prisma.program.findUnique({ where: { id: params.programId } });
            } else if (params.programName) {
                prog = await prisma.program.findFirst({
                    where: { name: { contains: params.programName, mode: 'insensitive' } },
                });
            }

            if (!prog) return { success: false, message: 'Program kaydı bulunamadı.' };

            const assignment = await EntrepreneurProgramService.assignProgram({
                entrepreneurId: ent.id,
                programId: prog.id,
                cohort: params.cohort || '2026-Q4',
                status: params.status || 'ACTIVE',
                notes: params.notes || 'AI Asistanı tarafından atandı.',
            }, actor.id);

            return {
                success: true,
                message: `"${ent.name}" girişimi "${prog.name}" programına başarıyla atandı.`,
                data: assignment,
                afterState: assignment,
                undoPayload: { assignmentId: assignment.id, entrepreneurId: ent.id },
            };
        },
        rollback: async (undoPayload, actor) => {
            if (!undoPayload?.assignmentId) return { success: false, message: 'Atama ID bulunamadı.' };
            await EntrepreneurProgramService.removeProgramAssignment(undoPayload.assignmentId, actor.id);
            return { success: true, message: 'Program ataması başarıyla geri alındı.' };
        },
    },

    // ------------------------------------------------------------------------
    // 4. RENT & PAYMENT ACTIONS
    // ------------------------------------------------------------------------
    'rent.recordPayment': {
        id: 'rent.recordPayment',
        name: 'Kira Ödemesi Kaydet',
        description: 'Aylık kira tahakkukuna ait tam veya kısmi ödeme kaydeder.',
        requiredPermission: 'finance:edit',
        riskLevel: 'HIGH',
        requiresConfirmation: true,
        isReversible: true,
        execute: async (params, actor) => {
            let accrual = null;
            if (params.accrualId) {
                accrual = await prisma.rentAccrual.findUnique({
                    where: { id: params.accrualId },
                    include: { entrepreneur: true },
                });
            } else if (params.entrepreneurId || params.entrepreneurName) {
                const entWhere: any = {};
                if (params.entrepreneurId) entWhere.id = params.entrepreneurId;
                if (params.entrepreneurName) entWhere.name = { contains: params.entrepreneurName, mode: 'insensitive' };
                
                const ent = await prisma.entrepreneur.findFirst({ where: entWhere });
                if (ent) {
                    accrual = await prisma.rentAccrual.findFirst({
                        where: {
                            entrepreneurId: ent.id,
                            status: { in: ['DUE', 'OVERDUE', 'PARTIALLY_PAID', 'UPCOMING'] },
                        },
                        include: { entrepreneur: true },
                        orderBy: [{ year: 'desc' }, { month: 'desc' }],
                    });
                }
            }

            if (!accrual) return { success: false, message: 'Ödeme yapılacak açık kira tahakkuku bulunamadı.' };

            const amount = Number(params.amount) || accrual.remainingAmount;
            const paymentResult = await RentService.recordRentPayment(accrual.id, {
                amount,
                paymentMethod: params.paymentMethod || 'BANK_TRANSFER',
                bankReceiptNo: params.bankReceiptNo || `AI-REC-${Date.now().toString().slice(-6)}`,
                receiptDocUrl: params.receiptDocUrl || params.receiptUrl,
                description: params.description || 'AI Asistanı tarafından işlenen kira ödemesi.',
            }, actor.id);

            return {
                success: true,
                message: `"${accrual.entrepreneur.name}" için ${amount.toLocaleString('tr-TR')} TL kira ödemesi kaydedildi. (Durum: ${paymentResult.status === 'PAID' ? 'ÖDENDİ' : 'KISMİ ÖDENDİ'})`,
                data: paymentResult,
                beforeState: { accrualStatus: accrual.status, paidAmount: accrual.paidAmount, remainingAmount: accrual.remainingAmount },
                afterState: paymentResult,
                undoPayload: { paymentId: paymentResult.payment.id, accrualId: accrual.id },
            };
        },
        rollback: async (undoPayload, actor) => {
            if (!undoPayload?.paymentId) return { success: false, message: 'Ödeme ID bulunamadı.' };
            await prisma.rentPayment.delete({ where: { id: undoPayload.paymentId } });
            
            // Recalculate accrual
            const payments = await prisma.rentPayment.findMany({ where: { accrualId: undoPayload.accrualId } });
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            const accrual = await prisma.rentAccrual.findUnique({ where: { id: undoPayload.accrualId } });
            if (accrual) {
                const remaining = Math.max(0, accrual.totalDue - totalPaid);
                const status = remaining === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'DUE';
                await prisma.rentAccrual.update({
                    where: { id: accrual.id },
                    data: { paidAmount: totalPaid, remainingAmount: remaining, status },
                });
            }
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'DELETE',
                entityType: 'RentPayment',
                entityId: undoPayload.paymentId,
                diff: `AI Asistanı kira ödeme kaydını geri aldı.`,
            });
            return { success: true, message: 'Kira ödemesi geri alındı ve tahakkuk bakiyesi düzeltildi.' };
        },
    },

    // ------------------------------------------------------------------------
    // 5. TASK & INTERACTION ACTIONS
    // ------------------------------------------------------------------------
    'task.create': {
        id: 'task.create',
        name: 'Yeni Görev Oluştur',
        description: 'Yönetici veya ekip için takip edilecek yeni bir görev oluşturur.',
        requiredPermission: 'tasks:create',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        isReversible: true,
        execute: async (params, actor) => {
            const task = await TaskService.createTask({
                title: params.title || 'Yeni Takip Görevi',
                description: params.description,
                priority: params.priority || 'MEDIUM',
                dueDate: params.dueDate ? new Date(params.dueDate) : new Date(Date.now() + 24 * 3600 * 1000),
                createdById: actor.id,
                actorName: actor.name,
                entrepreneurId: params.entrepreneurId,
                mentorId: params.mentorId,
                programId: params.programId,
            });

            return {
                success: true,
                message: `"${task.title}" görevi başarıyla oluşturuldu.`,
                data: task,
                afterState: task,
                undoPayload: { taskId: task.id },
            };
        },
        rollback: async (undoPayload, actor) => {
            if (!undoPayload?.taskId) return { success: false, message: 'Görev ID bulunamadı.' };
            await TaskService.deleteTask(undoPayload.taskId, { id: actor.id, name: actor.name });
            return { success: true, message: 'Görev başarıyla geri alındı ve silindi.' };
        },
    },

    'interaction.create': {
        id: 'interaction.create',
        name: 'Görüşme & Faaliyet Kaydı',
        description: 'Girişimci, mentör veya paydaş ile gerçekleştirilen görüşmeyi kaydeder.',
        requiredPermission: 'activities:create',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        isReversible: true,
        execute: async (params, actor) => {
            const interaction = await InteractionService.createInteraction({
                contactName: params.contactName || 'Görüşmeci',
                organizationName: params.organizationName,
                subject: params.subject || 'Genel Değerlendirme',
                notes: params.notes,
                decisions: params.decisions,
                nextSteps: params.nextSteps,
                followUpDate: params.followUpDate ? new Date(params.followUpDate) : undefined,
                interactionType: params.interactionType || 'MEETING',
                entrepreneurId: params.entrepreneurId,
                mentorId: params.mentorId,
                hostUserId: actor.id,
            }, actor.id);

            return {
                success: true,
                message: `"${interaction.contactName}" ile görüşme kaydı oluşturuldu.`,
                data: interaction,
                afterState: interaction,
                undoPayload: { interactionId: interaction.id },
            };
        },
        rollback: async (undoPayload, actor) => {
            if (!undoPayload?.interactionId) return { success: false, message: 'Görüşme ID bulunamadı.' };
            await prisma.dailyInteraction.delete({ where: { id: undoPayload.interactionId } });
            await logAuditEvent({
                actorId: actor.id,
                actorName: actor.name,
                action: 'DELETE',
                entityType: 'DailyInteraction',
                entityId: undoPayload.interactionId,
                diff: `AI Asistanı görüşme kaydını sildi.`,
            });
            return { success: true, message: 'Görüşme kaydı geri alındı.' };
        },
    },

    // ------------------------------------------------------------------------
    // 6. REPORTING ACTIONS
    // ------------------------------------------------------------------------
    'report.generateDaily': {
        id: 'report.generateDaily',
        name: 'Günlük Rapor Oluştur',
        description: 'Günün tamamlanan işleri ve görüşmelerinden resmi günlük rapor derler.',
        requiredPermission: 'reports:create',
        riskLevel: 'LOW',
        requiresConfirmation: true,
        isReversible: true,
        execute: async (params, actor) => {
            const date = params.date ? new Date(params.date) : new Date();
            const reportData = await ReportingService.generateDailyReportData(actor.id, date);

            return {
                success: true,
                message: `${reportData.date} tarihli günlük faaliyet raporu başarıyla hazırlandı.`,
                data: reportData,
                afterState: reportData,
                undoPayload: { date: reportData.date },
            };
        },
        rollback: async (undoPayload, actor) => {
            return { success: true, message: 'Günlük rapor taslağı geri alındı.' };
        },
    },
};
