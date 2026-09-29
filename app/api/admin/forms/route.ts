import { NextRequest, NextResponse } from 'next/server';
import { FormService } from '@/lib/services/form-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'forms')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const forms = await FormService.getAdminForms();
        return NextResponse.json({ success: true, forms });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'create', 'forms')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        const result = await FormService.createFormWithVersion({
            title: body.title,
            slug: body.slug,
            description: body.description,
            formType: body.formType,
            fields: body.fields || [],
            publishImmediately: body.publishImmediately,
            actor: {
                id: user.id,
                name: user.name,
                email: user.email,
                ip,
                userAgent,
            },
        });

        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
