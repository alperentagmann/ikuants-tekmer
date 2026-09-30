import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { EntrepreneurProgramService } from '@/lib/services/entrepreneur-program-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: entrepreneurId } = await params;
    try {
        const programs = await EntrepreneurProgramService.getEntrepreneurPrograms(entrepreneurId);
        return NextResponse.json({ success: true, items: programs });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'edit', 'entrepreneurs')) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const { id: entrepreneurId } = await params;
    try {
        const body = await req.json();
        if (!body.programId) {
            return NextResponse.json({ success: false, error: 'Program seçimi zorunludur' }, { status: 400 });
        }

        const assignment = await EntrepreneurProgramService.assignProgram({
            entrepreneurId,
            programId: body.programId,
            cohort: body.cohort,
            status: body.status || 'ACTIVE',
            joinedAt: body.joinedAt,
            notes: body.notes,
            isPublic: body.isPublic,
        }, auth.user.id);

        return NextResponse.json({ success: true, assignment });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
