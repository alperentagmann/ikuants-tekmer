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
        const { changeSetId } = body;

        if (!changeSetId) {
            return NextResponse.json({ success: false, message: 'ChangeSet ID zorunludur.' }, { status: 400 });
        }

        const result = await AiOperationsService.rollbackChangeSet(
            changeSetId,
            {
                id: user.id,
                email: user.email,
                name: user.name,
            }
        );

        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
