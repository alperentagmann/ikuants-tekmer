import { NextRequest, NextResponse } from 'next/server';
import { AiOperationsService } from '@/lib/services/ai-operations-service';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const actionId = body.actionId || body.actionName;
        const params = body.params || body.parameters || {};

        if (!actionId) {
            return NextResponse.json({ success: false, message: 'Action ID zorunludur.' }, { status: 400 });
        }

        const result = await AiOperationsService.executeConfirmedAction(
            actionId,
            params,
            {
                id: user.id,
                email: user.email,
                name: user.name,
                isSuperAdmin: user.isSuperAdmin,
            }
        );

        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
