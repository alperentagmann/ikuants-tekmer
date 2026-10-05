import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { WorkTeamService, type TeamInput } from '@/lib/services/work-team-service';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, teams: await WorkTeamService.list() });
    } catch (error) {
        return errorResponse(error, 'Ekipler alınamadı');
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as TeamInput;
        const team = await WorkTeamService.create(body, auth.user);
        return NextResponse.json({ success: true, team }, { status: 201 });
    } catch (error) {
        return errorResponse(error, 'Ekip oluşturulamadı');
    }
}
