import { NextResponse } from 'next/server';
import { SettingService } from '@/lib/services/setting-service';
import { resolvePublicSettings } from '@/lib/site-settings';
import { HomepageLayoutService } from '@/lib/services/homepage-layout-service';
import { themeVariables } from '@/lib/homepage-layout';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const raw = await SettingService.getPublicSettings();
        const { cookiePolicy: _policy, ...settings } = resolvePublicSettings(raw);
        // Site geneli tema (Tasarım Stüdyosu › Ana sayfa › yayınlanmış tasarım dili): menü ve alt bilgi de aynı renkte
        const themeVars = await HomepageLayoutService.getPublished().then((l) => themeVariables(l.theme)).catch(() => ({}));
        return NextResponse.json({ success: true, settings: { ...settings, themeVars } });
    } catch {
        return NextResponse.json({ success: false, message: 'Ayarlar alınamadı' }, { status: 500 });
    }
}
