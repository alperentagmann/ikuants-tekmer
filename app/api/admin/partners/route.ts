import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { PartnerService } from '@/lib/services/partner-service';

export async function GET() {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const partners = await PartnerService.getAdminPartners();
        return NextResponse.json({ success: true, partners });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await getCurrentAdminUser();
    if (!auth) return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });

    try {
        const body = await request.json();
        if (!body.name || !body.logoUrl) {
            return NextResponse.json({ success: false, error: 'Partner adı ve Logo URL zorunludur.' }, { status: 400 });
        }

        const partner = await PartnerService.createPartner(body, auth);
        return NextResponse.json({ success: true, partner });
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
            await PartnerService.reorderPartners(body.orderedIds, auth);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, error: 'Geçersiz parametre.' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
