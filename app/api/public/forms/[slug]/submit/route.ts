import { NextRequest, NextResponse } from 'next/server';
import { FormSubmissionService, sanitizeContext } from '@/lib/services/form-submission-service';
import { checkEndpointRateLimit, getClientIp } from '@/lib/rate-limit';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';
import { errorResponse } from '@/lib/api-guard';

const MAX_BODY_BYTES = 256 * 1024;

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const ip = getClientIp(request);

    const limit = checkEndpointRateLimit(`${ip}:${slug}`, { limit: 5, windowSeconds: 60, keyPrefix: 'public-form-submit' });
    if (!limit.isAllowed) {
        return NextResponse.json(
            { success: false, message: `Çok fazla gönderim yapıldı. Lütfen ${limit.resetSeconds} saniye sonra tekrar deneyin.` },
            { status: 429, headers: { 'Retry-After': String(limit.resetSeconds) } }
        );
    }

    const length = Number(request.headers.get('content-length') || 0);
    if (length > MAX_BODY_BYTES) {
        return NextResponse.json({ success: false, message: 'Gönderim çok büyük.' }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, message: 'Geçersiz istek.' }, { status: 400 });
    }

    try {
        const values = (body.values && typeof body.values === 'object' ? body.values : {}) as Record<string, unknown>;
        const result = await FormSubmissionService.submitPublicForm(
            slug,
            { ...values, _hp: body._hp, _ts: body._ts },
            {
                ipAddress: ip,
                userAgent: request.headers.get('user-agent') || undefined,
                idempotencyKey: typeof body.idempotencyKey === 'string' && body.idempotencyKey.length <= 100 ? body.idempotencyKey : undefined,
                context: sanitizeContext(body.context),
            }
        );

        // Deliver queued e-mails right away when a provider is configured (no-op otherwise)
        EmailOutboxService.processPendingEmails(5).catch((err) => console.error('Outbox processing failed:', err));

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return errorResponse(error, 'Gönderim kaydedilemedi. Lütfen tekrar deneyin.');
    }
}
