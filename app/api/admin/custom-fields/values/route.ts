import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { CustomFieldService } from '@/lib/services/custom-field-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const moduleKey = searchParams.get('module') || 'ENTREPRENEUR';
        const entityId = searchParams.get('entityId');

        if (!entityId) {
            return NextResponse.json({ success: false, message: 'entityId parametresi zorunludur.' }, { status: 400 });
        }

        const data = await CustomFieldService.getFieldValues(moduleKey, entityId);
        return NextResponse.json({ success: true, ...data });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
        }

        const body = await request.json();
        const { moduleKey, entityId, values } = body;

        if (!moduleKey || !entityId || !values) {
            return NextResponse.json({ success: false, message: 'moduleKey, entityId ve values zorunludur.' }, { status: 400 });
        }

        await CustomFieldService.saveFieldValues(moduleKey, entityId, values, caller.id);
        return NextResponse.json({ success: true, message: 'Özel alan değerleri başarıyla kaydedildi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}
