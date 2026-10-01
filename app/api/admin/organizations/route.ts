import { NextRequest, NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/services/organization-service';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || undefined;
        const orgType = searchParams.get('orgType') || undefined;
        const status = searchParams.get('status') || undefined;
        const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100;
        const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

        const result = await OrganizationService.getOrganizations({ search, orgType, status, limit, offset });
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
        const name = body.displayName || body.name;
        if (!name) {
            return NextResponse.json({ success: false, message: 'Kurum adı zorunludur.' }, { status: 400 });
        }

        const org = await OrganizationService.createOrganization({ ...body, name, displayName: name }, {
            id: user.id,
            name: user.name,
        });

        return NextResponse.json({ success: true, item: org, organization: org });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
