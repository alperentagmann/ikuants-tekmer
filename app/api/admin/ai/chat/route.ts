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
        const prompt = body.prompt || body.message;
        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ success: false, message: 'İstek metni zorunludur.' }, { status: 400 });
        }

        const response = await AiOperationsService.processUserPrompt(
            prompt,
            {
                id: user.id,
                email: user.email,
                name: user.name,
                isSuperAdmin: user.isSuperAdmin,
            },
            body.context
        );

        return NextResponse.json({
            success: true,
            ...response,
            message: response.content,
            response
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
