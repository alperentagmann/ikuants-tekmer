import { NextRequest, NextResponse } from 'next/server';
import { SpaceAssignmentService } from '@/lib/services/space-assignment-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

/** Status (PLANNED → ACTIVE → ENDED, or CANCELLED), dates, unit and explicit contract link. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(req, 'update', 'facilities');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await req.json();
        const assignment = await SpaceAssignmentService.update(id, body, auth.user);
        return NextResponse.json({ success: true, assignment, message: 'Tahsis güncellendi.' });
    } catch (error) {
        return errorResponse(error, 'Tahsis güncellenemedi');
    }
}
