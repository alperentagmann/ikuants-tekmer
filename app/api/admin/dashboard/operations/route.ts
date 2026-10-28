import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { getOperationsDashboard, parseWindow } from '@/lib/services/operations-dashboard-service';

/** Yönetim paneli operasyon göstergeleri. ?window=7|14|30|60|90 (gün) — aksiyon masası uyarı penceresi. */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'dashboard');
    if (auth.error) return auth.error;
    try {
        const dashboard = await getOperationsDashboard(auth.user, parseWindow(request.nextUrl.searchParams.get('window')));
        return NextResponse.json({ success: true, dashboard });
    } catch (error) {
        return errorResponse(error, 'Göstergeler alınamadı');
    }
}
