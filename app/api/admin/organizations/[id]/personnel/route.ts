import { NextRequest, NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/services/organization-service';
import { PersonService } from '@/lib/services/person-service';
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

        let targetPersonId = body.personId;

        // If user is creating a brand new person in this step
        if (!targetPersonId && body.newPerson) {
            const { firstName, lastName, email, phone, title, tcNumber, privacy } = body.newPerson;
            if (!firstName || !lastName) {
                return NextResponse.json({ success: false, message: 'Personel ad ve soyadı zorunludur.' }, { status: 400 });
            }

            const createdPerson = await PersonService.createPerson({
                firstName,
                lastName,
                email: email || null,
                phone: phone || null,
                title: title || body.position || null,
                tcNumber: tcNumber || null,
                privacy: privacy || null,
                businessRoles: ['SIRKET_PERSONELI'],
                status: 'ACTIVE',
            }, {
                id: user.id,
                name: user.name,
            });

            targetPersonId = createdPerson.id;
        }

        if (!targetPersonId) {
            return NextResponse.json({ success: false, message: 'Personel (Kişi) seçimi veya yeni kişi bilgileri zorunludur.' }, { status: 400 });
        }

        const membership = await OrganizationService.addPersonnel({
            organizationId,
            personId: targetPersonId,
            role: body.role || 'EMPLOYEE',
            department: body.department,
            position: body.position,
            isPrimaryContact: Boolean(body.isPrimaryContact),
            isFinanceContact: Boolean(body.isFinanceContact),
            isLegalContact: Boolean(body.isLegalContact),
            isAuthorizedSignatory: Boolean(body.isAuthorizedSignatory),
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
