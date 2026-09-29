import { NextRequest, NextResponse } from 'next/server';
import { SettingService } from '@/lib/services/setting-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'manage', 'settings')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const settings = await SettingService.getAllSettings();
        return NextResponse.json({ success: true, settings });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'manage', 'settings')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const { key, value } = body;

        const updated = await SettingService.updateSetting(key, value, {
            id: user.id,
            name: user.name,
            email: user.email,
        });

        return NextResponse.json({ success: true, setting: updated });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
