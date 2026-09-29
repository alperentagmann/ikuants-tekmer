import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { ImpactAnalysisService } from '@/lib/services/impact-analysis-service';

export async function GET(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller) {
            return NextResponse.json({ success: false, error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get('entityType') || '';
        const entityId = searchParams.get('entityId') || '';

        if (!entityType || !entityId) {
            return NextResponse.json({ success: false, error: 'entityType ve entityId parametreleri zorunludur.' }, { status: 400 });
        }

        const analysis = await ImpactAnalysisService.analyzeImpact(entityType, entityId);
        return NextResponse.json({ success: true, analysis });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'Etki analizi yapılamadı.' }, { status: 500 });
    }
}
