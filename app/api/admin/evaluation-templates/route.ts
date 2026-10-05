import { NextRequest, NextResponse } from 'next/server';
import { EvaluationService } from '@/lib/services/evaluation-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'applications');
    if (auth.error) return auth.error;
    try {
        const templates = await EvaluationService.listTemplates();
        return NextResponse.json({ success: true, templates });
    } catch (error) {
        return errorResponse(error, 'Değerlendirme şablonları yüklenemedi');
    }
}

/** Creates (no id) or updates (id) an evaluation template with its criteria. */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'edit', 'applications');
    if (auth.error) return auth.error;
    try {
        const body = await request.json();
        const template = await EvaluationService.saveTemplate({ id: body.id, name: body.name, description: body.description, criteria: body.criteria || [] }, auth.actor);
        return NextResponse.json({ success: true, template, message: 'Değerlendirme şablonu kaydedildi.' });
    } catch (error) {
        return errorResponse(error, 'Değerlendirme şablonu kaydedilemedi');
    }
}
