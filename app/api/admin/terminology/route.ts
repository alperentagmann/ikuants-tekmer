import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { TerminologyService } from '@/lib/services/terminology-service';

export async function GET() {
    try {
        const labels = await TerminologyService.getAllLabels();
        return NextResponse.json({ success: true, labels });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller || (!hasPermission(caller, 'manage', 'settings') && !caller.isSuperAdmin)) {
            return NextResponse.json({ success: false, message: 'Terminoloji değiştirme yetkiniz bulunmamaktadır.' }, { status: 403 });
        }

        const body = await request.json();

        if (Array.isArray(body.items)) {
            const result = await TerminologyService.bulkUpdateLabels(body.items, caller.id);
            return NextResponse.json({ ...result, message: 'Terimler başarıyla güncellendi.' });
        } else if (body.key) {
            const updated = await TerminologyService.updateLabel(body.key, body.customLabel, caller.id);
            return NextResponse.json({ success: true, label: updated, message: 'Terim başarıyla güncellendi.' });
        } else {
            return NextResponse.json({ success: false, message: 'Geçersiz parametre.' }, { status: 400 });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata oluştu.' }, { status: 400 });
    }
}
