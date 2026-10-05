import { NextResponse } from 'next/server';
import { SettingService } from '@/lib/services/setting-service';
import { resolvePublicSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const raw = await SettingService.getPublicSettings();
        const { cookiePolicy: _policy, ...settings } = resolvePublicSettings(raw);
        return NextResponse.json({ success: true, settings });
    } catch {
        return NextResponse.json({ success: false, message: 'Ayarlar alınamadı' }, { status: 500 });
    }
}
