import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { FacilityUnitService, parseKind, type WritableKind } from '@/lib/services/facility-unit-service';

type P = { params: Promise<{ kind: string }> };

/** Liste: ?q=&sort=&dir=&page=&pageSize=&archived=1&<filtreler> — `export=xlsx|pdf` ile dosya döner. */
export async function GET(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'view', 'facilities');
    if (auth.error) return auth.error;
    try {
        const kind = parseKind((await params).kind);
        const result = await FacilityUnitService.list(kind, request.nextUrl.searchParams, auth.user, auth.actor);
        return result instanceof Response ? result : NextResponse.json({ success: true, ...result });
    } catch (error) {
        return errorResponse(error, 'Liste alınamadı');
    }
}

export async function POST(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'create', 'facilities');
    if (auth.error) return auth.error;
    try {
        const kind = parseKind((await params).kind, true) as WritableKind;
        return NextResponse.json({ success: true, item: await FacilityUnitService.create(kind, await request.json().catch(() => ({})), auth.user, auth.actor) });
    } catch (error) {
        return errorResponse(error, 'Kayıt oluşturulamadı');
    }
}
