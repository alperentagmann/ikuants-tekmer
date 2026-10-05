import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { errorResponse } from '@/lib/api-guard';
import { getRecord360 } from '@/lib/services/record-360-service';

export async function GET(request: NextRequest) {
    const user = await getCurrentAdminUser();
    if (!user) return NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 });
    try {
        const sp = request.nextUrl.searchParams;
        const record = await getRecord360(user, String(sp.get('type') || ''), String(sp.get('id') || ''));
        return NextResponse.json({ success: true, record });
    } catch (error) {
        return errorResponse(error, '360° görünüm alınamadı');
    }
}
