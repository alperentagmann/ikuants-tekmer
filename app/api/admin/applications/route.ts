import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/application-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'applications')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || undefined;
        const status = searchParams.get('status') || undefined;
        const programId = searchParams.get('programId') || undefined;
        const assignedToId = searchParams.get('assignedToId') || undefined;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const view = searchParams.get('view') || 'all';
        const applicationType = searchParams.get('applicationType') || (view === 'program' ? 'PROGRAM' : view === 'tekmer' ? 'TEKMER' : undefined);
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        const result = await ApplicationService.getAdminApplications({
            search,
            status,
            programId,
            assignedToId,
            applicationType,
            excludeTypes: view === 'other' ? ['PROGRAM', 'TEKMER'] : undefined,
            campaignId: searchParams.get('campaignId') || undefined,
            applicantType: searchParams.get('applicantType') || undefined,
            from: fromParam ? new Date(fromParam) : undefined,
            to: toParam ? new Date(`${toParam}T23:59:59`) : undefined,
            page,
            limit: Math.min(limit, 200),
        });

        return NextResponse.json({ success: true, ...result });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'edit', 'applications');
    if (auth.error) return auth.error;
    try {
        const body = await request.json();
        const application = await ApplicationService.createManualApplication({
            campaignId: body.campaignId,
            applicantName: body.applicantName,
            email: body.email,
            phone: body.phone,
            companyName: body.companyName,
            applicantType: body.applicantType,
            note: body.note,
            actor: auth.actor,
        });
        return NextResponse.json({ success: true, application, message: `${application.applicationNumber} oluşturuldu.` });
    } catch (error) {
        return errorResponse(error, 'Başvuru oluşturulamadı');
    }
}
