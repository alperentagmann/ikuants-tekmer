import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { KvkkService } from '@/lib/services/kvkk-service';

export async function GET(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'view', 'kvkk')) {
        return NextResponse.json({ success: false, error: 'KVKK alanına erişim yetkiniz yok.' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || undefined;
        const subjectType = searchParams.get('subjectType') || undefined;
        const status = searchParams.get('status') || undefined;
        const sourceChannel = searchParams.get('sourceChannel') || undefined;
        const textVersionId = searchParams.get('textVersionId') || undefined;

        const consents = await KvkkService.getConsents({
            search,
            subjectType,
            status,
            sourceChannel,
            textVersionId,
        }, auth.user);

        return NextResponse.json({ success: true, items: consents });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'create', 'kvkk')) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const fullName = body.fullName || body.personName || body.name;
        const subjectType = body.subjectType || body.dataSubjectType || 'OTHER';

        if (!fullName) {
            return NextResponse.json({ success: false, error: 'İsim zorunludur' }, { status: 400 });
        }

        const consent = await KvkkService.recordConsent({
            fullName,
            email: body.email || body.personEmail || null,
            phone: body.phone || body.personPhone || null,
            subjectType,
            sourceChannel: body.sourceChannel || body.sourceForm || 'ADMIN_MANUAL',
            textVersionId: body.textVersionId || body.versionId || undefined,
            explicitConsent: body.explicitConsent !== undefined ? body.explicitConsent : true,
            marketingConsent: body.marketingConsent || false,
            mediaConsent: body.mediaConsent || false,
            documentUrl: body.documentUrl || null,
            notes: body.notes || null,
        }, auth.user.id);
        return NextResponse.json({ success: true, consent });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
