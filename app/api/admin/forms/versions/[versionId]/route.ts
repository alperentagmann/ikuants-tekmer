import { NextRequest, NextResponse } from 'next/server';
import { FormService } from '@/lib/services/form-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

/** Returns the immutable definition of any form version (used for previews and history). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ versionId: string }> }) {
    const auth = await requireAdmin(request, 'view', 'forms');
    if (auth.error) return auth.error;
    try {
        const { versionId } = await params;
        const result = await FormService.getVersionDefinition(versionId);
        if (!result) return NextResponse.json({ success: false, message: 'Versiyon bulunamadı' }, { status: 404 });
        return NextResponse.json({
            success: true,
            version: {
                id: result.version.id,
                versionNumber: result.version.versionNumber,
                status: result.version.status,
                publishedAt: result.version.publishedAt,
                form: { id: result.version.form.id, title: result.version.form.title, theme: result.version.form.theme },
            },
            sections: result.sections,
            fields: result.fields,
        });
    } catch (error) {
        return errorResponse(error, 'Versiyon yüklenemedi');
    }
}
