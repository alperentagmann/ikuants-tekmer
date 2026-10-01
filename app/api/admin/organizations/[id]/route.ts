import { NextRequest, NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/services/organization-service';
import { getAuthUser } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const org = await OrganizationService.getOrganizationById(id);
        if (!org) {
            return NextResponse.json({ success: false, message: 'Kurum bulunamadı' }, { status: 404 });
        }
        return NextResponse.json({ success: true, item: org });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        const body = await req.json();
        const updated = await OrganizationService.updateOrganization(id, body, {
            id: user.id,
            name: user.name,
        });
        return NextResponse.json({ success: true, item: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
