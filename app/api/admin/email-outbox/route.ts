import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse, DomainError } from '@/lib/api-guard';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';
import { EmailCenterService, EMAIL_TABS, TEMPLATE_VARIABLES, type ComposeInput, type EmailTab } from '@/lib/services/email-center-service';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'manage', 'email_outbox');
    if (auth.error) return auth.error;
    try {
        const sp = new URL(request.url).searchParams;
        const id = sp.get('id');
        if (id) return NextResponse.json({ success: true, item: await EmailCenterService.get(id) });
        const tabParam = sp.get('tab') || 'outbox';
        const tab = (tabParam in EMAIL_TABS || tabParam === 'all' ? tabParam : 'outbox') as EmailTab | 'all';
        const data = await EmailCenterService.list({ tab, search: sp.get('search') || undefined, page: Number(sp.get('page') || 1) });
        return NextResponse.json({ success: true, ...data, provider: EmailCenterService.providerStatus(), variables: TEMPLATE_VARIABLES });
    } catch (error) {
        return errorResponse(error, 'E-postalar alınamadı');
    }
}

type Body = Partial<ComposeInput> & { action?: string; id?: string };

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'manage', 'email_outbox');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as Body;
        const compose: Omit<ComposeInput, 'mode'> = {
            to: String(body.to || ''),
            cc: body.cc || null,
            subject: String(body.subject || ''),
            body: String(body.body || ''),
            templateKey: body.templateKey || null,
            entityType: body.entityType || null,
            entityId: body.entityId || null,
            scheduledAt: body.scheduledAt || null,
        };
        switch (body.action) {
            case 'compose': {
                const mode = body.mode === 'draft' || body.mode === 'schedule' ? body.mode : 'send';
                return NextResponse.json({ success: true, ...(await EmailCenterService.compose({ ...compose, mode }, auth.actor)) });
            }
            case 'preview':
                return NextResponse.json({ success: true, ...(await EmailCenterService.preview(compose)) });
            case 'updateDraft':
                return NextResponse.json({ success: true, item: await EmailCenterService.updateDraft(String(body.id), compose, auth.actor) });
            case 'sendDraft':
                return NextResponse.json({ success: true, ...(await EmailCenterService.sendDraft(String(body.id), auth.actor, body.scheduledAt || null)) });
            case 'cancel':
                await EmailCenterService.cancel(String(body.id), auth.actor);
                return NextResponse.json({ success: true });
            case 'retry':
                return NextResponse.json({ success: true, item: await EmailCenterService.retry(String(body.id), auth.actor) });
            case 'processQueue':
                return NextResponse.json({ success: true, result: await EmailOutboxService.processPendingEmails(50) });
            default:
                throw new DomainError('Geçersiz işlem.');
        }
    } catch (error) {
        return errorResponse(error, 'E-posta işlemi başarısız');
    }
}
