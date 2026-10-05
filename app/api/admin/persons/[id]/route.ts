import { NextRequest, NextResponse } from 'next/server';
import { PersonService } from '@/lib/services/person-service';
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
        const person = await PersonService.getPersonById(id);
        if (!person) {
            return NextResponse.json({ success: false, message: 'Kişi bulunamadı' }, { status: 404 });
        }
        return NextResponse.json({ success: true, item: person });
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
        const updated = await PersonService.updatePerson({ ...body, id }, {
            id: user.id,
            name: user.name,
        });
        return NextResponse.json({ success: true, item: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { id } = await context.params;
        await PersonService.deletePerson(id, {
            id: user.id,
            name: user.name,
        });
        return NextResponse.json({ success: true, message: 'Kişi arşivlendi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
