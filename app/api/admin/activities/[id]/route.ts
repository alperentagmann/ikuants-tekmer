import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityService } from '@/lib/services/activity-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'activities')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const activity = await ActivityService.getActivityById(id);
        if (!activity) {
            return NextResponse.json({ success: false, message: 'Faaliyet bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, activity });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'edit', 'activities')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await req.json();

        // Check if adding evidence file
        if (body.action === 'add-evidence' && body.evidence) {
            const ev = await prisma.activityEvidence.create({
                data: {
                    activityId: id,
                    title: body.evidence.title,
                    fileUrl: body.evidence.fileUrl,
                    fileType: body.evidence.fileType || 'IMAGE',
                    description: body.evidence.description,
                },
            });
            return NextResponse.json({ success: true, evidence: ev });
        }

        const updated = await prisma.corporateActivity.update({
            where: { id },
            data: {
                title: body.title,
                categoryId: body.categoryId,
                description: body.description,
                activityDate: body.activityDate ? new Date(body.activityDate) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
                location: body.location,
                targetAudience: body.targetAudience,
                participantCount: body.participantCount !== undefined ? Number(body.participantCount) : undefined,
                status: body.status,
                budgetAmount: body.budgetAmount !== undefined ? Number(body.budgetAmount) : undefined,
                fundingSource: body.fundingSource,
                outcomes: body.outcomes ? JSON.stringify(body.outcomes) : undefined,
            },
        });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'UPDATE',
            entityType: 'CorporateActivity',
            entityId: id,
            diff: `Kurumsal faaliyet güncellendi: ${updated.title}`,
        });

        return NextResponse.json({ success: true, activity: updated });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'delete', 'activities')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const activity = await prisma.corporateActivity.findUnique({ where: { id } });
        if (!activity) {
            return NextResponse.json({ success: false, message: 'Faaliyet bulunamadı' }, { status: 404 });
        }

        await prisma.corporateActivity.delete({ where: { id } });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'DELETE',
            entityType: 'CorporateActivity',
            entityId: id,
            diff: `Kurumsal faaliyet silindi: ${activity.title}`,
        });

        return NextResponse.json({ success: true, message: 'Faaliyet silindi' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
