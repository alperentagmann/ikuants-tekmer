import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';
import { TrainingService } from '@/lib/services/training-service';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'trainings')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const training = await TrainingService.getTrainingById(id);
        if (!training) {
            return NextResponse.json({ success: false, message: 'Eğitim bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, training });
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
        if (!user || !hasPermission(user, 'edit', 'trainings')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await req.json();

        // Check if attendance recording
        if (body.action === 'attendance') {
            const { sessionId, enrollmentId, isPresent } = body;
            const res = await TrainingService.recordAttendance({
                sessionId,
                enrollmentId,
                isPresent: Boolean(isPresent),
            });
            return NextResponse.json({ success: true, record: res });
        }

        // Check if new participant enrollment
        if (body.action === 'enroll') {
            const res = await TrainingService.enrollParticipant(id, body.participant);
            return NextResponse.json({ success: true, enrollment: res });
        }

        // General update
        const updated = await prisma.training.update({
            where: { id },
            data: {
                title: body.title,
                slug: body.slug,
                description: body.description,
                objective: body.objective,
                moduleName: body.moduleName,
                weekNumber: body.weekNumber !== undefined ? Number(body.weekNumber) : undefined,
                format: body.format,
                location: body.location,
                onlineMeetingUrl: body.onlineMeetingUrl,
                startDate: body.startDate ? new Date(body.startDate) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
                status: body.status,
            },
        });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'UPDATE',
            entityType: 'Training',
            entityId: id,
            diff: `Eğitim güncellendi: ${updated.title}`,
        });

        return NextResponse.json({ success: true, training: updated });
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
        if (!user || !hasPermission(user, 'delete', 'trainings')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const training = await prisma.training.findUnique({ where: { id } });
        if (!training) {
            return NextResponse.json({ success: false, message: 'Eğitim bulunamadı' }, { status: 404 });
        }

        await prisma.training.delete({ where: { id } });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'DELETE',
            entityType: 'Training',
            entityId: id,
            diff: `Eğitim silindi: ${training.title}`,
        });

        return NextResponse.json({ success: true, message: 'Eğitim silindi' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
