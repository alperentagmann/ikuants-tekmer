import { NextRequest, NextResponse } from 'next/server';
import { PersonService } from '@/lib/services/person-service';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const matches = await PersonService.findPotentialDuplicates({
            name: body.name,
            email: body.email,
            phone: body.phone,
            tcNumber: body.tcNumber,
            excludeId: body.excludeId,
        });

        return NextResponse.json({
            success: true,
            hasMatches: matches.length > 0,
            matches,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
