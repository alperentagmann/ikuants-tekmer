import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { FacilityService } from '@/lib/services/facility-service';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const { id } = await props.params;
        const facility = await FacilityService.getFacilityById(id);
        if (!facility) return NextResponse.json({ success: false, error: 'Kayıt bulunamadı.' }, { status: 404 });
        return NextResponse.json({ success: true, facility });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const { id } = await props.params;
        const body = await request.json();
        const facility = await FacilityService.updateFacility(id, body, auth.user);
        return NextResponse.json({ success: true, facility });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const { id } = await props.params;
        await FacilityService.deleteFacility(id, auth.user);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
