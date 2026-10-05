import { NextRequest, NextResponse } from 'next/server';
import { ApplicationCampaignService } from '@/lib/services/application-campaign-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'applications');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const campaign = await ApplicationCampaignService.get(id);
        if (!campaign) return NextResponse.json({ success: false, message: 'Kampanya bulunamadı' }, { status: 404 });
        return NextResponse.json({ success: true, campaign });
    } catch (error) {
        return errorResponse(error, 'Kampanya yüklenemedi');
    }
}

export async function PUT(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'edit', 'applications');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await request.json();
        const campaign = await ApplicationCampaignService.update(id, body, auth.actor);
        return NextResponse.json({ success: true, campaign });
    } catch (error) {
        return errorResponse(error, 'Kampanya güncellenemedi');
    }
}

/** Status changes: DRAFT | OPEN | CLOSED | ARCHIVED */
export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'edit', 'applications');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await request.json();
        const campaign = await ApplicationCampaignService.setStatus(id, String(body.status), auth.actor);
        return NextResponse.json({ success: true, campaign });
    } catch (error) {
        return errorResponse(error, 'Kampanya durumu değiştirilemedi');
    }
}
