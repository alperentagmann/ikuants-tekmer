import { NextRequest, NextResponse } from 'next/server';
import { ApplicationCampaignService } from '@/lib/services/application-campaign-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'applications');
    if (auth.error) return auth.error;
    try {
        const sp = request.nextUrl.searchParams;
        const campaigns = await ApplicationCampaignService.list({
            applicationType: sp.get('applicationType') || undefined,
            status: sp.get('status') || undefined,
            programId: sp.get('programId') || undefined,
            includeArchived: sp.get('includeArchived') === 'true',
        });
        return NextResponse.json({ success: true, campaigns });
    } catch (error) {
        return errorResponse(error, 'Kampanyalar yüklenemedi');
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'edit', 'applications');
    if (auth.error) return auth.error;
    try {
        const body = await request.json();
        const campaign = await ApplicationCampaignService.create(body, auth.actor);
        return NextResponse.json({ success: true, campaign });
    } catch (error) {
        return errorResponse(error, 'Kampanya oluşturulamadı');
    }
}
