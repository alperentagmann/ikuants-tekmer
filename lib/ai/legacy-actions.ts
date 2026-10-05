import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { canAssignRole } from '@/lib/rbac';
import { RentService } from '@/lib/services/rent-service';
import { TaskService } from '@/lib/services/task-service';
import { InteractionService } from '@/lib/services/interaction-service';
import { ReportingService } from '@/lib/services/reporting-service';
import { UserManagementService } from '@/lib/services/user-management-service';
import { toIstanbulDate } from '@/lib/services/space-reservation-service';
import type { AiActionDefinition } from './types';

/**
 * Actions inherited from the first AI layer, re-implemented on the typed registry so that
 * permission, risk, preview, verification and audit are enforced the same way for all actions.
 */

const istanbulDay = (offsetDays = 0) => {
    const d = new Date(Date.now() + offsetDays * 86400000);
    return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
};

export const bannerCreate: AiActionDefinition<{ title: string; mediaUrl?: string | null; primaryCtaText?: string | null; primaryCtaLink?: string | null }> = {
    id: 'cms.banner.create',
    name: 'Ana sayfa banner taslağı',
    description: 'Ana sayfa hero alanına taslak banner ekler. Taslak public sitede görünmez; Homepage Studio\'dan yayınlanır.',
    domain: 'CMS',
    kind: 'CREATE',
    permission: ['edit', 'cms'],
    risk: 'MEDIUM',
    input: z.object({ title: z.string().min(2).max(200), mediaUrl: z.string().max(500).nullable().optional(), primaryCtaText: z.string().max(60).nullable().optional(), primaryCtaLink: z.string().max(300).nullable().optional() }),
    examples: ['Ana sayfaya "Yeni dönem başvuruları açıldı" başlıklı banner ekle'],
    async preview(input) {
        return {
            title: 'Banner taslağı eklenecek',
            status: 'info',
            fields: [
                { label: 'Başlık', value: input.title },
                { label: 'Görsel', value: input.mediaUrl || 'Görsel seçilmedi (Homepage Studio\'da eklenmeli)' },
                { label: 'Durum', value: 'Taslak — yayına alınmaz' },
            ],
        };
    },
    async execute(input) {
        const count = await prisma.heroSlide.count();
        const slide = await prisma.heroSlide.create({
            data: {
                title: input.title,
                subtitle: '',
                description: '',
                mediaUrl: input.mediaUrl || '',
                mobileMediaUrl: input.mediaUrl || null,
                primaryCtaText: input.primaryCtaText || null,
                primaryCtaLink: input.primaryCtaLink || null,
                sortOrder: count + 1,
                status: 'DRAFT',
                isActive: false,
            },
        });
        const entity = { type: 'HeroSlide', id: slide.id, label: slide.title, href: '/admin/anasayfa' };
        return {
            entity,
            undo: { slideId: slide.id },
            after: { id: slide.id, title: slide.title, status: slide.status },
            card: { title: '✓ Banner taslağı eklendi', status: 'success', fields: [{ label: 'Başlık', value: slide.title }, { label: 'Durum', value: 'Taslak (public sitede görünmez)' }], links: [{ label: 'Homepage Studio', href: entity.href }], entity },
        };
    },
    async verify(result) {
        return Boolean(await prisma.heroSlide.findUnique({ where: { id: result.entity!.id } }));
    },
    async undo(data, ctx) {
        const slide = await prisma.heroSlide.findUnique({ where: { id: String(data.slideId) } });
        if (!slide) return 'Banner zaten kaldırılmış.';
        if (slide.status === 'PUBLISHED' || slide.isActive) throw new DomainError('Banner yayına alındığı için geri alınamıyor. Homepage Studio\'dan yayından kaldırın.');
        await prisma.heroSlide.delete({ where: { id: slide.id } });
        await logAuditEvent({ actorId: ctx.actor.id, actorEmail: ctx.actor.email, actorName: ctx.actor.name, action: 'DELETE', entityType: 'HeroSlide', entityId: slide.id, diff: 'AI banner taslağı geri alındı' });
        return 'Banner taslağı kaldırıldı.';
    },
};

export const userInvite: AiActionDefinition<{ name: string; email: string; roleSlug: string }> = {
    id: 'user.invite',
    name: 'Kullanıcı daveti',
    description: 'Yeni yönetim kullanıcısı oluşturur ve davet bağlantısı hazırlar. Rol atama yetkisi kontrol edilir.',
    domain: 'USER',
    kind: 'CREATE',
    permission: ['create', 'users'],
    risk: 'CRITICAL',
    input: z.object({ name: z.string().min(2).max(120), email: z.string().email(), roleSlug: z.string().min(2) }),
    examples: ['Ayşe Demir için ayse@ornek.com adresiyle editör kullanıcısı oluştur'],
    async preview(input, ctx) {
        const role = await prisma.role.findUnique({ where: { slug: input.roleSlug } });
        if (!role) throw new DomainError(`"${input.roleSlug}" rolü bulunamadı.`);
        if (!canAssignRole(ctx.actor, role.slug)) throw new DomainError(`${role.name} rolünü atama yetkiniz yok.`);
        if (await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })) throw new DomainError(`${input.email} adresli kullanıcı zaten var.`);
        return { title: 'Kullanıcı oluşturulacak', status: 'warning', fields: [{ label: 'Ad soyad', value: input.name }, { label: 'E-posta', value: input.email }, { label: 'Rol', value: role.name }, { label: 'Yöntem', value: 'Davet bağlantısı' }] };
    },
    async execute(input, ctx) {
        const role = await prisma.role.findUnique({ where: { slug: input.roleSlug } });
        if (!role) throw new DomainError('Rol bulunamadı.');
        if (!canAssignRole(ctx.actor, role.slug)) throw new DomainError(`${role.name} rolünü atama yetkiniz yok.`, 403);
        const result = await UserManagementService.createUser({ email: input.email.toLowerCase(), name: input.name, roleId: role.id, passwordMethod: 'INVITE', actorId: ctx.actor.id });
        const entity = { type: 'User', id: result.user.id, label: input.name, href: '/admin/kullanicilar' };
        return {
            entity,
            undo: { userId: result.user.id, email: input.email },
            after: { id: result.user.id, email: input.email, role: role.slug },
            card: { title: '✓ Kullanıcı oluşturuldu', status: 'success', fields: [{ label: 'Kullanıcı', value: `${input.name} · ${input.email}` }, { label: 'Rol', value: role.name }], summary: 'Davet bağlantısı Kullanıcılar ekranında görüntülenebilir.', links: [{ label: 'Kullanıcılar', href: entity.href }], entity },
        };
    },
    async verify(result) {
        return Boolean(await prisma.user.findUnique({ where: { id: result.entity!.id } }));
    },
    async undo(data, ctx) {
        const user = await prisma.user.findUnique({ where: { id: String(data.userId) } });
        if (!user) return 'Kullanıcı zaten kaldırılmış.';
        if (user.lastLoginAt) throw new DomainError('Kullanıcı giriş yaptığı için geri alınamaz; Kullanıcılar ekranından pasife alın.');
        await prisma.user.delete({ where: { id: user.id } });
        await logAuditEvent({ actorId: ctx.actor.id, actorEmail: ctx.actor.email, actorName: ctx.actor.name, action: 'DELETE', entityType: 'User', entityId: user.id, diff: 'AI kullanıcı daveti geri alındı' });
        return 'Kullanıcı daveti geri alındı.';
    },
};

export const rentPayment: AiActionDefinition<{ entrepreneur: string; amount: number; paymentMethod?: 'BANK_TRANSFER' | 'CASH' | 'CREDIT_CARD' | 'OTHER'; receiptNo?: string | null }> = {
    id: 'rent.recordPayment',
    name: 'Kira ödemesi kaydet',
    description: 'Girişimin en eski açık kira tahakkukuna ödeme işler. Finansal işlem: AI ile geri alınamaz, Finans ekranından düzeltilir.',
    domain: 'FINANCE',
    kind: 'CREATE',
    permission: ['payment', 'rent'],
    risk: 'CRITICAL',
    input: z.object({ entrepreneur: z.string().min(2), amount: z.number().positive(), paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'CREDIT_CARD', 'OTHER']).optional(), receiptNo: z.string().max(80).nullable().optional() }),
    examples: ['ABC Teknoloji\'nin 24.000 TL kira ödemesini kaydet'],
    async preview(input) {
        const accrual = await findOpenAccrual(input.entrepreneur);
        return {
            title: 'Kira ödemesi kaydedilecek',
            status: 'warning',
            fields: [
                { label: 'Girişim', value: accrual.entrepreneur.name },
                { label: 'Dönem', value: accrual.periodLabel },
                { label: 'Kalan borç', value: `${accrual.remainingAmount.toLocaleString('tr-TR')} ${accrual.currency}` },
                { label: 'Ödeme', value: `${input.amount.toLocaleString('tr-TR')} ${accrual.currency}` },
                { label: 'Geri alma', value: 'Finansal işlem — AI ile geri alınamaz' },
            ],
        };
    },
    async execute(input, ctx) {
        const accrual = await findOpenAccrual(input.entrepreneur);
        if (input.amount > accrual.remainingAmount + 0.001) throw new DomainError(`Ödeme tutarı kalan borçtan (${accrual.remainingAmount.toLocaleString('tr-TR')} ${accrual.currency}) büyük olamaz.`);
        const before = { status: accrual.status, paidAmount: accrual.paidAmount, remainingAmount: accrual.remainingAmount };
        const result = await RentService.recordRentPayment(accrual.id, { amount: input.amount, paymentMethod: input.paymentMethod || 'BANK_TRANSFER', bankReceiptNo: input.receiptNo || undefined, description: 'AI Komuta Merkezi üzerinden kaydedildi.' }, ctx.actor.id);
        const entity = { type: 'Entrepreneur', id: accrual.entrepreneur.id, label: accrual.entrepreneur.name, href: `/admin/girisimciler/${accrual.entrepreneur.id}/finans-kira` };
        return {
            entity,
            before,
            after: { status: result.status, paymentId: result.payment.id },
            card: { title: '✓ Kira ödemesi kaydedildi', status: 'success', fields: [{ label: 'Girişim', value: accrual.entrepreneur.name }, { label: 'Dönem', value: accrual.periodLabel }, { label: 'Tutar', value: `${input.amount.toLocaleString('tr-TR')} ${accrual.currency}` }, { label: 'Yeni durum', value: result.status }], links: [{ label: 'Kira kartını aç', href: entity.href }], entity },
        };
    },
    async verify(result) {
        return Boolean(await prisma.rentPayment.findUnique({ where: { id: String((result.after as { paymentId: string }).paymentId) } }));
    },
};

async function findOpenAccrual(entrepreneurName: string) {
    const ents = await prisma.entrepreneur.findMany({ where: { name: { contains: entrepreneurName, mode: 'insensitive' } }, take: 3 });
    if (ents.length === 0) throw new DomainError(`"${entrepreneurName}" girişimi bulunamadı.`);
    if (ents.length > 1) throw new DomainError(`Birden fazla girişim eşleşti: ${ents.map((e) => e.name).join(', ')}.`);
    const accrual = await prisma.rentAccrual.findFirst({
        where: { entrepreneurId: ents[0].id, remainingAmount: { gt: 0 }, status: { in: ['DUE', 'OVERDUE', 'PARTIALLY_PAID', 'UPCOMING'] } },
        include: { entrepreneur: { select: { id: true, name: true } } },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });
    if (!accrual) throw new DomainError(`${ents[0].name} için açık kira tahakkuku yok.`);
    return accrual;
}

const dailyWorkSchema = z.object({
    interactions: z.array(z.object({ contactName: z.string().min(1), organizationName: z.string().nullable().optional(), subject: z.string().min(1), notes: z.string().optional(), followUpDate: z.string().nullable().optional() })),
    tasks: z.array(z.object({ title: z.string().min(1), description: z.string().optional(), dueDate: z.string().nullable().optional(), priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']) })),
});

export const dailyWork: AiActionDefinition<z.infer<typeof dailyWorkSchema>> = {
    id: 'multi.dailyWork',
    name: 'Günlük çalışmaları kaydet',
    description: 'Serbest metinle anlatılan görüşmeleri görüşme kaydı, takipleri görev olarak işler.',
    domain: 'CRM',
    kind: 'CREATE',
    permission: ['create', 'interactions'],
    risk: 'MEDIUM',
    input: dailyWorkSchema,
    examples: ['Bugün Ayşe Hanım ile görüştüm, yarın teklif için arayacağım'],
    async preview(input) {
        return {
            title: 'Günlük çalışma kayıtları oluşturulacak',
            status: 'info',
            table: {
                columns: ['Tür', 'Kayıt', 'Tarih'],
                rows: [
                    ...input.interactions.map((i) => ({ cells: ['Görüşme', `${i.contactName} — ${i.subject}`, i.followUpDate ? `Takip: ${i.followUpDate}` : ''] })),
                    ...input.tasks.map((t) => ({ cells: ['Görev', t.title, t.dueDate || ''] })),
                ],
            },
        };
    },
    async execute(input, ctx) {
        const created: { interactionIds: string[]; taskIds: string[] } = { interactionIds: [], taskIds: [] };
        try {
            for (const i of input.interactions) {
                const rec = await InteractionService.createInteraction({ contactName: i.contactName, organizationName: i.organizationName || undefined, subject: i.subject, notes: i.notes, followUpDate: i.followUpDate ? toIstanbulDate(i.followUpDate, '10:00') : undefined, interactionType: 'MEETING', hostUserId: ctx.actor.id }, ctx.actor.id);
                created.interactionIds.push(rec.id);
            }
            for (const t of input.tasks) {
                const task = await TaskService.createTask({ title: t.title, description: t.description, priority: t.priority, dueDate: t.dueDate ? toIstanbulDate(t.dueDate, '18:00') : undefined, assigneeIds: [ctx.actor.id], createdById: ctx.actor.id, actorName: `${ctx.actor.name} (AI)` });
                created.taskIds.push(task.id);
            }
        } catch (error) {
            await rollbackDailyWork(created, ctx.actor);
            throw error;
        }
        return {
            undo: created,
            after: created,
            card: { title: '✓ Günlük çalışmalar kaydedildi', status: 'success', summary: `${created.interactionIds.length} görüşme, ${created.taskIds.length} görev oluşturuldu.`, links: [{ label: 'Görüşmeler', href: '/admin/gorusmeler' }, { label: 'Görevler', href: '/admin/gorevler?scope=assigned' }] },
        };
    },
    async verify(result) {
        const data = result.undo as { interactionIds: string[]; taskIds: string[] };
        const [i, t] = await Promise.all([prisma.dailyInteraction.count({ where: { id: { in: data.interactionIds } } }), prisma.task.count({ where: { id: { in: data.taskIds } } })]);
        return i === data.interactionIds.length && t === data.taskIds.length;
    },
    async undo(data, ctx) {
        await rollbackDailyWork(data as { interactionIds: string[]; taskIds: string[] }, ctx.actor);
        return 'Görüşme kayıtları silindi, görevler arşivlendi.';
    },
};

async function rollbackDailyWork(data: { interactionIds: string[]; taskIds: string[] }, actor: { id: string; name: string; email: string }) {
    if (data.interactionIds.length) await prisma.dailyInteraction.deleteMany({ where: { id: { in: data.interactionIds } } });
    if (data.taskIds.length) await prisma.task.updateMany({ where: { id: { in: data.taskIds } }, data: { isArchived: true } });
    await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'DELETE', entityType: 'AiDailyWork', diff: `AI günlük kayıt geri alındı: ${data.interactionIds.length} görüşme, ${data.taskIds.length} görev` });
}

export const dailyReport: AiActionDefinition<{ date?: string | null }> = {
    id: 'report.daily',
    name: 'Günlük faaliyet özeti',
    description: 'Bugün tamamlanan görevler, etkinlikler ve işlemlerden günlük özet çıkarır (kayıt değiştirmez).',
    domain: 'REPORT',
    kind: 'ANALYZE',
    permission: ['view', 'reports'],
    risk: 'LOW',
    input: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional() }),
    examples: ['Bugünkü faaliyet raporumu hazırla'],
    async execute(input, ctx) {
        const day = input.date || istanbulDay();
        const data = await ReportingService.generateDailyReportData(ctx.actor.id, toIstanbulDate(day, '12:00'));
        return {
            card: {
                title: `${day} günlük faaliyet özeti`,
                status: 'info',
                summary: data.autoSummaryText || 'Bu gün için kayıtlı faaliyet yok.',
                fields: [
                    { label: 'Tamamlanan görev', value: String(data.completedTasks.length) },
                    { label: 'Oluşturulan görev', value: String(data.createdTasks.length) },
                    { label: 'Etkinlik / toplantı', value: String(data.todayEvents.length) },
                    { label: 'Kurumsal faaliyet', value: String(data.activities.length) },
                ],
                links: [{ label: 'Rapor Merkezi', href: '/admin/raporlar' }],
            },
        };
    },
};

export const LEGACY_ACTIONS = [bannerCreate, userInvite, rentPayment, dailyWork, dailyReport];
export { istanbulDay };
