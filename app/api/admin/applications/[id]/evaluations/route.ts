import { NextRequest, NextResponse } from 'next/server';
import { EvaluationService } from '@/lib/services/evaluation-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'applications');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const data = await EvaluationService.getApplicationEvaluations(id);
        return NextResponse.json({ success: true, ...data, currentUserId: auth.user.id });
    } catch (error) {
        return errorResponse(error, 'Değerlendirmeler yüklenemedi');
    }
}

export async function POST(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'evaluate', 'applications');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await request.json();
        const evaluation = await EvaluationService.submitEvaluation({
            applicationId: id,
            scores: Array.isArray(body.scores) ? body.scores.map((s: { criterionId: string; score: unknown; comment?: string }) => ({ criterionId: String(s.criterionId), score: Number(s.score), comment: s.comment })) : [],
            finalComment: body.finalComment,
            isCompleted: body.isCompleted === true,
            actor: auth.actor,
        });
        return NextResponse.json({ success: true, evaluation, message: body.isCompleted ? 'Değerlendirme tamamlandı.' : 'Değerlendirme taslağı kaydedildi.' });
    } catch (error) {
        return errorResponse(error, 'Değerlendirme kaydedilemedi');
    }
}
