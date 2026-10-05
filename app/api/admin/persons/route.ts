import { NextRequest, NextResponse } from 'next/server';
import { PersonService } from '@/lib/services/person-service';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || undefined;
        const businessRole = searchParams.get('businessRole') || undefined;
        const organizationId = searchParams.get('organizationId') || undefined;
        const status = searchParams.get('status') || undefined;
        const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100;
        const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

        const result = await PersonService.getPersons({
            search,
            businessRole,
            organizationId,
            status,
            limit,
            offset,
        });
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const body = await req.json();
        if (!body.firstName || !body.lastName) {
            return NextResponse.json({ success: false, message: 'Ad ve soyad zorunludur.' }, { status: 400 });
        }

        const person = await PersonService.createPerson(body, {
            id: user.id,
            name: user.name,
        });

        return NextResponse.json({ success: true, item: person, person });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}
