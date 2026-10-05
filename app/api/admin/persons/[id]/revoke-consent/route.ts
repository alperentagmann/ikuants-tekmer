import { NextRequest, NextResponse } from 'next/server';
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
        const { id } = await context.params;
        const body = await req.json().catch(() => ({}));
        const updated = await PersonService.revokeConsent(id, body.reason, {
            id: user.id,
            name: user.name,
        });

        return NextResponse.json({
            success: true,
            message: 'Kişi iletişim izni başarıyla geri çekildi (REVOKED).',
            item: updated,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
