import { NextRequest, NextResponse } from 'next/server';
import { FormService } from '@/lib/services/form-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'forms');
    if (auth.error) return auth.error;
    try {
        const sp = request.nextUrl.searchParams;
        const forms = await FormService.listForms({
            includeArchived: sp.get('includeArchived') === 'true',
            search: sp.get('search') || undefined,
            formType: sp.get('formType') || undefined,
        });
        return NextResponse.json({ success: true, forms });
    } catch (error) {
        return errorResponse(error, 'Formlar yüklenemedi');
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'create', 'forms');
    if (auth.error) return auth.error;
    try {
        const body = await request.json();
        if (body.sourceFormId) {
            const result = await FormService.duplicateForm(body.sourceFormId, { title: body.title, slug: body.slug, asTemplate: body.isTemplate }, auth.actor);
            return NextResponse.json({ success: true, form: result.form, version: result.version });
        }
        const result = await FormService.createForm(
            {
                title: body.title,
                slug: body.slug,
                formType: body.formType,
                description: body.description,
                theme: body.theme,
                publicPath: body.publicPath,
                sections: body.sections,
                fields: body.fields || [],
                isTemplate: body.isTemplate,
            },
            auth.actor
        );
        return NextResponse.json({ success: true, form: result.form, version: result.version });
    } catch (error) {
        return errorResponse(error, 'Form oluşturulamadı');
    }
}
