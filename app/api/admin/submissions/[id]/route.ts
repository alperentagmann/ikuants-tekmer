import { NextRequest, NextResponse } from 'next/server';
import { FormSubmissionService } from '@/lib/services/form-submission-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'forms');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const submission = await FormSubmissionService.getSubmissionDetail(id);
        if (!submission) return NextResponse.json({ success: false, message: 'Gönderim bulunamadı' }, { status: 404 });
        return NextResponse.json({ success: true, submission });
    } catch (error) {
        return errorResponse(error, 'Gönderim yüklenemedi');
    }
}

/** Updates status or links the submission to existing CRM records. */
export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'edit', 'forms');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await request.json();
        if (body.status) {
            await FormSubmissionService.updateSubmissionStatus(id, body.status, auth.actor);
        }
        if (body.personId !== undefined || body.organizationId !== undefined) {
            await FormSubmissionService.linkSubmission(id, { personId: body.personId, organizationId: body.organizationId }, auth.actor);
        }
        const submission = await FormSubmissionService.getSubmissionDetail(id);
        return NextResponse.json({ success: true, submission });
    } catch (error) {
        return errorResponse(error, 'Gönderim güncellenemedi');
    }
}
