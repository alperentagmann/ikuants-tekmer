import { NextRequest, NextResponse } from 'next/server';
import { SpaceAssignmentService } from '@/lib/services/space-assignment-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req, 'view', 'facilities');
    if (auth.error) return auth.error;
    try {
        const sp = req.nextUrl.searchParams;
        const assignments = await SpaceAssignmentService.list({
            status: sp.get('status') || undefined,
            facilityId: sp.get('facilityId') || undefined,
            organizationId: sp.get('organizationId') || undefined,
            entrepreneurId: sp.get('entrepreneurId') || undefined,
        });
        return NextResponse.json({ success: true, assignments });
    } catch (error) {
        return errorResponse(error, 'Tahsisler yüklenemedi');
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdmin(req, 'update', 'facilities');
    if (auth.error) return auth.error;
    try {
        const body = await req.json();
        const assignment = await SpaceAssignmentService.create(body, auth.user);
        return NextResponse.json({ success: true, assignment, message: 'Alan tahsisi planlandı.' });
    } catch (error) {
        return errorResponse(error, 'Tahsis oluşturulamadı');
    }
}
