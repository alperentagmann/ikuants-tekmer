import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { AdminAlertService } from '@/lib/services/admin-alert-service';
import { ALERT_EVENTS, ALERT_EVENT_KEYS, envAdminEmails, listAlertPeople } from '@/lib/services/alert-recipients';
import { EmailOutboxService } from '@/lib/services/email-outbox-service';

/** Alert rules with the resolved recipient list of every event (who will actually be e-mailed). */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'manage', 'settings');
    if (auth.error) return auth.error;
    try {
        const { rules, global } = await AdminAlertService.getSettings();
        const events = await Promise.all(
            ALERT_EVENT_KEYS.map(async (key) => ({
                key,
                ...ALERT_EVENTS[key],
                rule: rules[key],
                recipients: (await AdminAlertService.preview(key)).map((r) => ({ email: r.email, name: r.name, reason: r.reason })),
            }))
        );
        const people = await listAlertPeople();
        return NextResponse.json({ success: true, events, global, people, envRecipients: envAdminEmails(), smtpConfigured: EmailOutboxService.isProviderConfigured() });
    } catch (error) {
        return errorResponse(error, 'Bildirim kuralları alınamadı');
    }
}

export async function PUT(request: NextRequest) {
    const auth = await requireAdmin(request, 'manage', 'settings');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { rules?: unknown; global?: unknown };
        const saved = await AdminAlertService.saveRules(body.rules, auth.actor, body.global);
        return NextResponse.json({ success: true, ...saved });
    } catch (error) {
        return errorResponse(error, 'Bildirim kuralları kaydedilemedi');
    }
}

/** Test e-mail to every address that receives all alerts. */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'manage', 'settings');
    if (auth.error) return auth.error;
    try {
        const result = await AdminAlertService.sendTest(auth.actor);
        return NextResponse.json({ success: true, ...result, smtpConfigured: EmailOutboxService.isProviderConfigured() });
    } catch (error) {
        return errorResponse(error, 'Test e-postası oluşturulamadı');
    }
}
