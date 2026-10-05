import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { AUTOMATION_ACTIONS, AUTOMATION_TRIGGERS, AutomationService } from '@/lib/services/automation-service';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        return NextResponse.json({ success: true, rules: await AutomationService.list(), triggers: AUTOMATION_TRIGGERS, actions: AUTOMATION_ACTIONS });
    } catch (error) {
        return errorResponse(error, 'Otomasyonlar alınamadı');
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        const rule = await AutomationService.save((await request.json()) as Parameters<typeof AutomationService.save>[0], auth.user);
        return NextResponse.json({ success: true, rule });
    } catch (error) {
        return errorResponse(error, 'Kural kaydedilemedi');
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'tasks');
    if (auth.error) return auth.error;
    try {
        await AutomationService.remove(request.nextUrl.searchParams.get('id') || '', auth.user);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Kural silinemedi');
    }
}
