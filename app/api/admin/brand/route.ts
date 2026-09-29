import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { BrandService } from '@/lib/services/brand-service';

export async function GET() {
    try {
        const brand = await BrandService.getBrandSettings();
        return NextResponse.json({ success: true, brand });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'Marka ayarları yüklenemedi.' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!caller.isSuperAdmin && !hasPermission(caller, 'manage', 'settings'))) {
            return NextResponse.json({ success: false, error: 'Marka ayarlarını değiştirme yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const body = await request.json();
        const updated = await BrandService.updateBrandSettings(body, caller.id);

        return NextResponse.json({
            success: true,
            message: 'Kurum marka ve arayüz ayarları başarıyla kaydedildi.',
            brand: updated,
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'Kaydetme başarısız.' }, { status: 500 });
    }
}
