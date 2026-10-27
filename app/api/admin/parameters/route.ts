import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { ParameterService, PARAMETER_CATEGORIES } from '@/lib/services/parameter-service';

/** ?category=POLICY_TYPE&inactive=1 */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'parameters');
    if (auth.error) return auth.error;
    try {
        const sp = request.nextUrl.searchParams;
        return NextResponse.json({ success: true, parameters: await ParameterService.list(sp.get('category') || undefined, sp.get('inactive') === '1'), categories: PARAMETER_CATEGORIES });
    } catch (error) {
        return errorResponse(error, 'Parametreler alınamadı');
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'manage', 'parameters');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, parameter: await ParameterService.create(await request.json().catch(() => ({})), auth.actor) });
    } catch (error) {
        return errorResponse(error, 'Parametre eklenemedi');
    }
}
