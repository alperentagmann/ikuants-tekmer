import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';

export async function GET() {
    try {
        const templates = await prisma.emailTemplate.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json({ success: true, templates });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Şablon düzenleme yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const body = await request.json();
        const { id, templateKey, name, subject, htmlBody, textBody } = body;

        if (!id && !templateKey) {
            return NextResponse.json({ success: false, message: 'ID veya templateKey zorunludur.' }, { status: 400 });
        }

        const updated = await prisma.emailTemplate.update({
            where: id ? { id } : { templateKey },
            data: {
                name,
                subject,
                htmlBody,
                textBody,
            },
        });

        await logAuditEvent({
            actorId: caller.id,
            action: 'UPDATE',
            entityType: 'EmailTemplate',
            entityId: updated.id,
            diff: `Updated email template ${updated.templateKey}: "${updated.name}"`,
        });

        return NextResponse.json({ success: true, template: updated, message: 'Şablon başarıyla güncellendi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Test e-postası gönderme yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const body = await request.json();
        const { templateKey, testRecipientEmail, customVariables } = body;

        if (!templateKey || !testRecipientEmail) {
            return NextResponse.json({ success: false, message: 'templateKey ve testRecipientEmail zorunludur.' }, { status: 400 });
        }

        const template = await prisma.emailTemplate.findUnique({ where: { templateKey } });
        if (!template) {
            return NextResponse.json({ success: false, message: 'Şablon bulunamadı.' }, { status: 404 });
        }

        const variables = {
            recipientName: 'Test Kullanıcısı',
            applicantName: 'Test Girişimci',
            applicationNumber: 'ANTS-2026-TEST01',
            programName: 'ANTSPARK Ön Kuluçka Programı',
            taskTitle: 'Test Görevi',
            assignerName: caller.name,
            roleName: 'Yönetici (Admin)',
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ikuants-tekmer.vercel.app'}/admin`,
            ...(customVariables || {}),
        };

        const renderedSubject = EmailOutboxService.renderTemplate(template.subject, variables);
        const renderedHtml = EmailOutboxService.renderTemplate(template.htmlBody, variables);

        const outboxRecord = await EmailOutboxService.enqueueEmail({
            recipientEmail: testRecipientEmail,
            recipientName: 'Test Alıcısı',
            subject: `[TEST] ${renderedSubject}`,
            templateKey: template.templateKey,
            htmlBody: renderedHtml,
            entityType: 'TEST_EMAIL',
        });

        // Send immediately
        await EmailOutboxService.sendEmailImmediately(outboxRecord.id);

        return NextResponse.json({
            success: true,
            message: `Test e-postası başarıyla ${testRecipientEmail} adresine gönderildi.`,
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}
