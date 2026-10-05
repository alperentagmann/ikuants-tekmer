import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { IntegrationService } from '@/lib/services/integration-service';
import { API_SCOPES, AUTH_LABELS, CATEGORY_LABELS, WEBHOOK_EVENTS } from '@/lib/integration-catalog';

/** Catalog, saved connections, webhooks, API keys and recent call logs (secrets are never returned). */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'integrations');
    if (auth.error) return auth.error;
    try {
        const [connections, webhooks, apiKeys, logs] = await Promise.all([IntegrationService.listConnections(), IntegrationService.listWebhooks(), IntegrationService.listApiKeys(), IntegrationService.logs({ limit: 60 })]);
        return NextResponse.json({ success: true, catalog: IntegrationService.catalog(), categories: CATEGORY_LABELS, authTypes: AUTH_LABELS, webhookEvents: WEBHOOK_EVENTS, apiScopes: API_SCOPES, connections, webhooks, apiKeys, logs });
    } catch (error) {
        return errorResponse(error, 'Entegrasyonlar alınamadı');
    }
}

/**
 * Body.action:
 *  save_connection | delete_connection | test_connection
 *  save_webhook | delete_webhook
 *  create_api_key | revoke_api_key
 */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'integrations');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as Record<string, unknown> & { action?: string; id?: string };
        const id = typeof body.id === 'string' ? body.id : '';
        switch (body.action) {
            case 'save_connection':
                return NextResponse.json({ success: true, connection: { id: (await IntegrationService.saveConnection(body as Parameters<typeof IntegrationService.saveConnection>[0], auth.user)).id } });
            case 'delete_connection':
                await IntegrationService.deleteConnection(id, auth.user);
                return NextResponse.json({ success: true });
            case 'test_connection':
                return NextResponse.json({ success: true, result: await IntegrationService.testConnection(id, auth.user) });
            case 'save_webhook':
                return NextResponse.json({ success: true, ...(await IntegrationService.saveWebhook(body as Parameters<typeof IntegrationService.saveWebhook>[0], auth.user)) });
            case 'delete_webhook':
                await IntegrationService.deleteWebhook(id, auth.user);
                return NextResponse.json({ success: true });
            case 'create_api_key':
                return NextResponse.json({ success: true, ...(await IntegrationService.createApiKey(body as Parameters<typeof IntegrationService.createApiKey>[0], auth.user)) });
            case 'revoke_api_key':
                await IntegrationService.revokeApiKey(id, auth.user);
                return NextResponse.json({ success: true });
            default:
                return NextResponse.json({ success: false, message: 'Geçersiz işlem' }, { status: 400 });
        }
    } catch (error) {
        return errorResponse(error, 'Entegrasyon işlemi başarısız');
    }
}
