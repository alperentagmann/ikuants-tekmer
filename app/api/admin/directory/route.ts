import { NextRequest, NextResponse } from 'next/server';
import { DirectoryService } from '@/lib/services/directory-service';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const tab = (searchParams.get('tab') || 'people') as any;
        const search = searchParams.get('search') || undefined;
        const type = searchParams.get('type') || undefined;
        const status = searchParams.get('status') || undefined;
        const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100;
        const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

        const result = await DirectoryService.getUnifiedDirectory({
            tab,
            search,
            type,
            status,
            limit,
            offset,
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
