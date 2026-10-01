import { NextRequest, NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/services/organization-service';
import { getAuthUser } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { id: organizationId } = await context.params;
        const body = await req.json();

        if (!body.personId) {
            return NextResponse.json({ success: false, message: 'Personel (Kişi) seçimi zorunludur.' }, { status: 400 });
        }

        const membership = await OrganizationService.addPersonnel({
            organizationId,
            personId: body.personId,
            role: body.role,
            department: body.department,
            position: body.position,
            isPrimaryContact: body.isPrimaryContact,
            isFinanceContact: body.isFinanceContact,
            isLegalContact: body.isLegalContact,
            isAuthorizedSignatory: body.isAuthorizedSignatory,
        }, {
            id: user.id,
            name: user.name,
        });

        return NextResponse.json({ success: true, item: membership });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const membershipId = searchParams.get('membershipId');
        if (!membershipId) {
            return NextResponse.json({ success: false, message: 'Üyelik ID zorunludur.' }, { status: 400 });
        }

        await OrganizationService.removePersonnel(membershipId, {
            id: user.id,
            name: user.name,
        });

        return NextResponse.json({ success: true, message: 'Personel çıkarıldı.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
