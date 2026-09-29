import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'calendar')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = endDateParam ? new Date(endDateParam) : new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);

        const [tasks, trainings, events, activities] = await Promise.all([
            // Tasks with due date
            prisma.task.findMany({
                where: {
                    dueDate: { gte: startDate, lte: endDate },
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    dueDate: true,
                    priority: true,
                    status: true,
                },
            }),
            // Trainings
            prisma.training.findMany({
                where: {
                    startDate: { gte: startDate, lte: endDate },
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    startDate: true,
                    endDate: true,
                    location: true,
                    format: true,
                },
            }),
            // Events
            prisma.event.findMany({
                where: {
                    startDate: { gte: startDate, lte: endDate },
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    startDate: true,
                    endDate: true,
                    location: true,
                },
            }),
            // Corporate Activities
            prisma.corporateActivity.findMany({
                where: {
                    activityDate: { gte: startDate, lte: endDate },
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    activityDate: true,
                    endDate: true,
                    location: true,
                },
            }),
        ]);

        const calendarItems = [
            ...tasks.map((t: any) => ({
                id: t.id,
                title: `[Görev] ${t.title}`,
                startDate: t.dueDate?.toISOString() || '',
                type: 'TASK' as const,
                priority: t.priority,
                status: t.status,
                description: t.description || undefined,
            })),
            ...trainings.map((tr: any) => ({
                id: tr.id,
                title: `[Eğitim] ${tr.title}`,
                startDate: tr.startDate.toISOString(),
                endDate: tr.endDate?.toISOString(),
                location: tr.location || tr.format,
                type: 'TRAINING' as const,
                description: tr.description || undefined,
            })),
            ...events.map((ev: any) => ({
                id: ev.id,
                title: `[Etkinlik] ${ev.title}`,
                startDate: ev.startDate.toISOString(),
                endDate: ev.endDate?.toISOString(),
                location: ev.location || undefined,
                type: 'EVENT' as const,
                description: ev.description || undefined,
            })),
            ...activities.map((act: any) => ({
                id: act.id,
                title: `[Faaliyet] ${act.title}`,
                startDate: act.activityDate.toISOString(),
                endDate: act.endDate?.toISOString(),
                location: act.location || undefined,
                type: 'ACTIVITY' as const,
                description: act.description || undefined,
            })),
        ];

        return NextResponse.json({ success: true, items: calendarItems });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
