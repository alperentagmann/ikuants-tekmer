import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { PipelineService } from '@/lib/services/pipeline-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const moduleKey = searchParams.get('module') || 'APPLICATION';

        const statuses = await PipelineService.getStatuses(moduleKey);
        return NextResponse.json({ success: true, statuses });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Durum oluşturma yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const body = await request.json();
        const status = await PipelineService.createStatus({
            ...body,
            actorId: caller.id,
        });

        return NextResponse.json({ success: true, status, message: 'Durum başarıyla oluşturuldu.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Durum güncelleme yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID zorunludur.' }, { status: 400 });
        }

        const updated = await PipelineService.updateStatus(id, data, caller.id);
        return NextResponse.json({ success: true, status: updated, message: 'Durum başarıyla güncellendi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Durum silme yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID zorunludur.' }, { status: 400 });
        }

        await PipelineService.deleteStatus(id, caller.id);
        return NextResponse.json({ success: true, message: 'Durum başarıyla silindi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}
