import { NextRequest, NextResponse } from 'next/server';
import { getRevisions } from '@/lib/revision';
import { getCurrentAdminUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user) return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });

        const searchParams = request.nextUrl.searchParams;
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');

        if (!entityType || !entityId) {
            return NextResponse.json({ success: false, message: 'Parametreler eksik' }, { status: 400 });
        }

        const revisions = await getRevisions(entityType, entityId);
        return NextResponse.json({ success: true, revisions });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}
