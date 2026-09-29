import { NextRequest, NextResponse } from 'next/server';
import { rollbackRevision } from '@/lib/revision';
import { getCurrentAdminUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user) return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });

        const body = await request.json();
        const { entityType, entityId, targetVersion } = body;

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        const record = await rollbackRevision({
            entityType,
            entityId,
            targetVersion: Number(targetVersion),
            authorId: user.id,
            authorName: user.name,
            ipAddress: ip,
            userAgent,
        });

        return NextResponse.json({ success: true, record });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Geri yükleme başarısız' }, { status: 500 });
    }
}
