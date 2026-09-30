import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { FacilityService } from '@/lib/services/facility-service';

export async function GET() {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const facilities = await FacilityService.getAdminFacilities();
        return NextResponse.json({ success: true, facilities });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const body = await request.json();
        if (!body.title || !body.description) {
            return NextResponse.json({ success: false, error: 'Başlık ve Açıklama zorunludur.' }, { status: 400 });
        }

        const facility = await FacilityService.createFacility(body, auth);
        return NextResponse.json({ success: true, facility });
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
            await FacilityService.reorderFacilities(body.orderedIds, auth);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, error: 'Geçersiz parametre.' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
