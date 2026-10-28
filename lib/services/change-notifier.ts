import { prisma } from '@/lib/prisma';

/**
 * Önemli değişiklikler için uygulama içi bildirim (Bildirimler ekranı ve üst çubuktaki zil).
 * E-posta gitmez; e-postalı uyarılar AdminAlertService üzerinden (alıcı kuralları Ayarlar › Uyarılar).
 * Bildirim hatası asıl işlemi bozmaz.
 */
export async function notifyChange(input: { title: string; message: string; url: string; type?: string; actorName?: string | null }) {
    try {
        await prisma.notification.create({
            data: {
                userId: null,
                title: input.title.slice(0, 200),
                message: `${input.message}${input.actorName ? ` · ${input.actorName}` : ''}`.slice(0, 1000),
                notificationType: input.type ?? 'SYSTEM_ALERT',
                targetUrl: input.url,
            },
        });
    } catch (e) {
        console.error('notifyChange failed', e);
    }
}
