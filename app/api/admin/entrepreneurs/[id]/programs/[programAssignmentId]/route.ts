import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { EntrepreneurProgramService } from '@/lib/services/entrepreneur-program-service';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; programAssignmentId: string }> }
) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'edit', 'entrepreneurs')) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const { programAssignmentId } = await params;
    try {
        const body = await req.json();
        const updated = await EntrepreneurProgramService.updateAssignmentStatus(programAssignmentId, body, auth.user.id);
        return NextResponse.json({ success: true, assignment: updated });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; programAssignmentId: string }> }
) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'edit', 'entrepreneurs')) {
        return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const { programAssignmentId } = await params;
    try {
        await EntrepreneurProgramService.removeProgramAssignment(programAssignmentId, auth.user.id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
