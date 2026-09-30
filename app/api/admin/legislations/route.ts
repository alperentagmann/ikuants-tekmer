import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { LegislationService } from '@/lib/services/legislation-service';

export async function GET() {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const legislations = await LegislationService.getAdminLegislations();
        return NextResponse.json({ success: true, legislations });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const body = await request.json();
        if (!body.title) {
            return NextResponse.json({ success: false, error: 'Mevzuat başlığı zorunludur.' }, { status: 400 });
        }

        const legislation = await LegislationService.createLegislation(body, auth);
        return NextResponse.json({ success: true, legislation });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const body = await request.json();
        if (Array.isArray(body.orderedIds)) {
            await LegislationService.reorderLegislations(body.orderedIds, auth);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, error: 'Geçersiz parametre.' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
