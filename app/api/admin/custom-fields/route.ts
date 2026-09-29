import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { CustomFieldService } from '@/lib/services/custom-field-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const moduleKey = searchParams.get('module') || 'ENTREPRENEUR';

        const definitions = await CustomFieldService.getDefinitions(moduleKey);
        return NextResponse.json({ success: true, definitions });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Özel alan oluşturma yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const body = await request.json();
        const definition = await CustomFieldService.createDefinition({
            ...body,
            actorId: caller.id,
        });

        return NextResponse.json({ success: true, definition, message: 'Özel alan başarıyla oluşturuldu.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Özel alan oluşturulamadı.' }, { status: 400 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Özel alan düzenleme yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID zorunludur.' }, { status: 400 });
        }

        const updated = await CustomFieldService.updateDefinition(id, data, caller.id);
        return NextResponse.json({ success: true, definition: updated, message: 'Özel alan başarıyla güncellendi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Özel alan silme yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID zorunludur.' }, { status: 400 });
        }

        await CustomFieldService.deleteDefinition(id, caller.id);
        return NextResponse.json({ success: true, message: 'Özel alan başarıyla silindi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}
