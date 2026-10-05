import { NextRequest, NextResponse } from 'next/server';
import { PersonService } from '@/lib/services/person-service';
import { getAuthUser } from '@/lib/auth';
import { canViewSensitiveIdentity } from '@/lib/rbac';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Explicit capability check: normal admins and unauthorized users are blocked!
    const isAuthorized = canViewSensitiveIdentity(user);
    if (!isAuthorized) {
        return NextResponse.json(
            {
                success: false,
                message: '403_FORBIDDEN: Bu hassas kimlik verisini görüntüleme yetkiniz bulunmamaktadır (person:identity:view açık yetkisi gereklidir).',
            },
            { status: 403 }
        );
    }

    try {
        const { id } = await context.params;
        const result = await PersonService.revealIdentity(id, {
            id: user.id,
            name: user.name,
            canViewSensitive: true,
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        const isForbidden = error.message?.includes('403_FORBIDDEN');
        return NextResponse.json(
            { success: false, message: error.message },
            { status: isForbidden ? 403 : 500 }
        );
    }
}
