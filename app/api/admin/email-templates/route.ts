import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';
import { requireAdmin, errorResponse, DomainError } from '@/lib/api-guard';
import { sanitizeHtml } from '@/lib/sanitize';
import { EmailOutboxService, escapeHtml } from '@/lib/services/email-outbox-service';

const KEY_RE = /^[A-Z][A-Z0-9_]{2,63}$/;
const plainToHtml = (s: string) => escapeHtml(s).replace(/\r?\n/g, '<br/>');

/** Template list: needed by the email center, campaign and form settings screens. */
export async function GET() {
    const user = await getCurrentAdminUser();
    if (!user) return NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 });
    const allowed = [['manage', 'email_outbox'], ['manage', 'templates'], ['edit', 'applications'], ['edit', 'forms']].some(([a, r]) => hasPermission(user, a, r));
    if (!allowed) return NextResponse.json({ success: false, message: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    const templates = await prisma.emailTemplate.findMany({ orderBy: [{ isSystem: 'asc' }, { name: 'asc' }] });
    return NextResponse.json({ success: true, templates });
}

/** Creates a communication template, or sends a clearly marked test message. */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'manage', 'templates');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { action?: string; templateKey?: string; name?: string; subject?: string; body?: string; recipientEmail?: string };
        if (body.action === 'test') {
            const template = await prisma.emailTemplate.findUnique({ where: { templateKey: String(body.templateKey || '') } });
            if (!template) throw new DomainError('Şablon bulunamadı.', 404);
            const to = String(body.recipientEmail || '').trim().toLowerCase();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new DomainError('Geçerli bir test alıcısı girin.');
            const record = await EmailOutboxService.enqueueEmail({
                recipientEmail: to,
                subject: `[TEST] ${template.subject}`,
                templateKey: template.templateKey,
                htmlBody: `<p><em>Bu bir şablon testidir; değişkenler doldurulmadan gönderilmiştir.</em></p>${template.htmlBody}`,
                textBody: template.textBody || undefined,
                entityType: 'TEST_EMAIL',
            });
            const result = await EmailOutboxService.sendEmailImmediately(record.id);
            await logAuditEvent({ actorId: auth.actor.id, actorEmail: auth.actor.email, actorName: auth.actor.name, action: 'EMAIL_TEST', entityType: 'EmailTemplate', entityId: template.id, diff: template.templateKey });
            const message =
                result.status === 'SENT'
                    ? `Test e-postası ${to} adresine gönderildi.`
                    : result.status === 'PENDING'
                      ? 'E-posta sağlayıcısı yapılandırılmadığı için test e-postası outbox içinde bekliyor.'
                      : `Test e-postası gönderilemedi: ${result.errorMessage || 'bilinmeyen hata'}`;
            return NextResponse.json({ success: true, status: result.status, message });
        }

        const templateKey = String(body.templateKey || '').trim().toUpperCase();
        if (!KEY_RE.test(templateKey)) throw new DomainError('Şablon anahtarı büyük harf, rakam ve alt çizgiden oluşmalı (ör. ETKINLIK_DAVETI).');
        if (!body.name?.trim() || !body.subject?.trim() || !body.body?.trim()) throw new DomainError('Ad, konu ve içerik zorunludur.');
        if (await prisma.emailTemplate.findUnique({ where: { templateKey } })) throw new DomainError('Bu anahtarla bir şablon zaten var.', 409);
        const variables = Array.from(new Set(Array.from(`${body.subject} ${body.body}`.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)).map((m) => m[1])));
        const template = await prisma.emailTemplate.create({
            data: { templateKey, name: body.name.trim(), subject: body.subject.trim(), textBody: body.body, htmlBody: plainToHtml(body.body), variables: JSON.stringify(variables), isSystem: false },
        });
        await logAuditEvent({ actorId: auth.actor.id, actorEmail: auth.actor.email, actorName: auth.actor.name, action: 'CREATE', entityType: 'EmailTemplate', entityId: template.id, diff: templateKey });
        return NextResponse.json({ success: true, template });
    } catch (error) {
        return errorResponse(error, 'Şablon işlemi başarısız');
    }
}

export async function PUT(request: NextRequest) {
    const auth = await requireAdmin(request, 'manage', 'templates');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { id?: string; name?: string; subject?: string; body?: string; htmlBody?: string };
        const existing = await prisma.emailTemplate.findUnique({ where: { id: String(body.id || '') } });
        if (!existing) throw new DomainError('Şablon bulunamadı.', 404);
        if (!body.name?.trim() || !body.subject?.trim()) throw new DomainError('Ad ve konu zorunludur.');
        // System templates are HTML (used by automated emails); communication templates are plain text
        const data = existing.isSystem
            ? { name: body.name.trim(), subject: body.subject.trim(), htmlBody: sanitizeHtml(String(body.htmlBody ?? existing.htmlBody)) }
            : { name: body.name.trim(), subject: body.subject.trim(), textBody: String(body.body || ''), htmlBody: plainToHtml(String(body.body || '')) };
        const updated = await prisma.emailTemplate.update({ where: { id: existing.id }, data });
        await logAuditEvent({ actorId: auth.actor.id, actorEmail: auth.actor.email, actorName: auth.actor.name, action: 'UPDATE', entityType: 'EmailTemplate', entityId: existing.id, oldValues: { subject: existing.subject }, newValues: { subject: updated.subject } });
        return NextResponse.json({ success: true, template: updated });
    } catch (error) {
        return errorResponse(error, 'Şablon güncellenemedi');
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin(request, 'manage', 'templates');
    if (auth.error) return auth.error;
    try {
        const id = new URL(request.url).searchParams.get('id') || '';
        const existing = await prisma.emailTemplate.findUnique({ where: { id } });
        if (!existing) throw new DomainError('Şablon bulunamadı.', 404);
        if (existing.isSystem) throw new DomainError('Sistem şablonları silinemez; yalnızca düzenlenebilir.', 409);
        const usedBy = await prisma.applicationCampaign.count({ where: { statusTemplateMap: { contains: existing.templateKey } } });
        if (usedBy) throw new DomainError(`Bu şablon ${usedBy} başvuru kampanyasında kullanılıyor; önce kampanya ayarlarından kaldırın.`, 409);
        await prisma.emailTemplate.delete({ where: { id } });
        await logAuditEvent({ actorId: auth.actor.id, actorEmail: auth.actor.email, actorName: auth.actor.name, action: 'DELETE', entityType: 'EmailTemplate', entityId: id, diff: existing.templateKey });
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Şablon silinemedi');
    }
}
