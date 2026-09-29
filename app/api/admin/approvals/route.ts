import { NextRequest, NextResponse } from 'next/server';
import { ApprovalService } from '@/lib/services/approval-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'approvals')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const approvals = await ApprovalService.getPendingApprovals(user.isSuperAdmin ? undefined : user.id);
        return NextResponse.json({ success: true, approvals });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await req.json();

        // If requesting approval
        if (body.action === 'request') {
            const approval = await ApprovalService.requestApproval({
                entityType: body.entityType,
                entityId: body.entityId,
                entityTitle: body.entityTitle,
                requestedById: user.id,
                reviewerId: body.reviewerId,
                requestNote: body.requestNote,
            });
            return NextResponse.json({ success: true, approval }, { status: 201 });
        }

        // If reviewing (APPROVE / REJECT)
        if (body.action === 'APPROVE' || body.action === 'REJECT') {
            if (!hasPermission(user, 'publish', 'approvals') && !user.isSuperAdmin) {
                return NextResponse.json({ success: false, message: 'Onay yetkiniz bulunmamaktadır' }, { status: 403 });
            }

            const updated = await ApprovalService.processApproval({
                approvalId: body.approvalId,
                action: body.action,
                reviewerId: user.id,
                reviewerName: user.name,
                reviewNote: body.reviewNote,
            });

            return NextResponse.json({ success: true, approval: updated });
        }

        return NextResponse.json({ success: false, message: 'Geçersiz işlem' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
