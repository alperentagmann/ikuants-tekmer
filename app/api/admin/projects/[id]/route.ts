import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProjectService } from '@/lib/services/project-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'projects')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const project = await ProjectService.getProjectById(id);
        if (!project) {
            return NextResponse.json({ success: false, message: 'Proje bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, project });
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
        if (!user || !hasPermission(user, 'edit', 'projects')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await req.json();

        // Add milestone
        if (body.action === 'add-milestone' && body.milestone) {
            const m = await prisma.projectMilestone.create({
                data: {
                    projectId: id,
                    title: body.milestone.title,
                    description: body.milestone.description,
                    targetDate: new Date(body.milestone.targetDate),
                    deliverable: body.milestone.deliverable,
                },
            });
            return NextResponse.json({ success: true, milestone: m });
        }

        // Add risk
        if (body.action === 'add-risk' && body.risk) {
            const r = await prisma.projectRisk.create({
                data: {
                    projectId: id,
                    riskTitle: body.risk.riskTitle,
                    riskLevel: body.risk.riskLevel || 'MEDIUM',
                    probability: body.risk.probability || 'MEDIUM',
                    mitigationPlan: body.risk.mitigationPlan,
                },
            });
            return NextResponse.json({ success: true, risk: r });
        }

        // Update main project details
        const updated = await prisma.project.update({
            where: { id },
            data: {
                title: body.title,
                code: body.code,
                description: body.description,
                projectType: body.projectType,
                budgetAmount: body.budgetAmount !== undefined ? Number(body.budgetAmount) : undefined,
                fundingAgency: body.fundingAgency,
                startDate: body.startDate ? new Date(body.startDate) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
                status: body.status,
                completionRate: body.completionRate !== undefined ? Number(body.completionRate) : undefined,
            },
        });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'UPDATE',
            entityType: 'Project',
            entityId: id,
            diff: `Proje güncellendi: ${updated.title}`,
        });

        return NextResponse.json({ success: true, project: updated });
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
        if (!user || !hasPermission(user, 'delete', 'projects')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) {
            return NextResponse.json({ success: false, message: 'Proje bulunamadı' }, { status: 404 });
        }

        // Financial history (funding, receipts, expenses) is never hard-deleted.
        // Projects that carry financial records are cancelled instead.
        const [fundingCount, expenseCount] = await Promise.all([
            prisma.fundingSource.count({ where: { projectId: id } }),
            prisma.projectExpense.count({ where: { projectId: id } }),
        ]);

        if (fundingCount > 0 || expenseCount > 0) {
            await prisma.project.update({ where: { id }, data: { status: 'CANCELLED' } });
            await logAuditEvent({
                actorId: user.id,
                actorName: user.name,
                action: 'UPDATE',
                entityType: 'Project',
                entityId: id,
                oldValues: { status: project.status },
                newValues: { status: 'CANCELLED' },
                diff: `Proje finansal kayıtlar içerdiği için silinmedi, iptal edildi: ${project.title}`,
            });
            return NextResponse.json({
                success: true,
                archived: true,
                message: 'Proje finansal kayıtlar içerdiği için silinmedi; durumu "İptal" olarak güncellendi.',
            });
        }

        await prisma.project.delete({ where: { id } });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'DELETE',
            entityType: 'Project',
            entityId: id,
            diff: `Proje silindi: ${project.title}`,
        });

        return NextResponse.json({ success: true, message: 'Proje silindi' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
