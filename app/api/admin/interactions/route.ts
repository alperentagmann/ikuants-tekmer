import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { InteractionService } from '@/lib/services/interaction-service';

export async function GET(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'view', 'interactions')) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || undefined;
        const interactionType = searchParams.get('type') || undefined;
        const status = searchParams.get('status') || undefined;
        const hostUserId = searchParams.get('hostUserId') || undefined;
        const entrepreneurId = searchParams.get('entrepreneurId') || undefined;
        const programId = searchParams.get('programId') || undefined;
        const followUpPending = searchParams.get('followUpPending') === 'true';

        const interactions = await InteractionService.getInteractions({
            search,
            interactionType,
            status,
            hostUserId,
            entrepreneurId,
            programId,
            followUpPending,
        });

        return NextResponse.json({ success: true, items: interactions });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'create', 'interactions')) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 403 });
    }

    try {
        const body = await req.json();
        if (!(body.contactName || body.personName) || !body.subject) {
            return NextResponse.json({ success: false, error: 'Kişi adı ve konu zorunludur' }, { status: 400 });
        }

        const interaction = await InteractionService.createInteraction(body, auth.user.id);
        return NextResponse.json({ success: true, interaction });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
