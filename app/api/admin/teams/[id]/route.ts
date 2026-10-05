import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { WorkTeamService, type TeamInput } from '@/lib/services/work-team-service';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        await WorkTeamService.update(id, (await request.json()) as TeamInput, auth.user);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Ekip güncellenemedi');
    }
}

export async function DELETE(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        await WorkTeamService.archive(id, auth.user);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Ekip arşivlenemedi');
    }
}
