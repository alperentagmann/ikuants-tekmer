import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '@/lib/services/activity-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'activities')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get('categoryId') || undefined;
        const programId = searchParams.get('programId') || undefined;
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const search = searchParams.get('search') || undefined;

        const [activities, categories] = await Promise.all([
            ActivityService.getActivities({ categoryId, programId, startDate, endDate, search }),
            ActivityService.getCategories(),
        ]);

        return NextResponse.json({ success: true, activities, categories });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'create', 'activities')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await req.json();

        // Auto-draft from training
        if (body.trainingId && body.action === 'draft-from-training') {
            const activity = await ActivityService.createFromTraining(body.trainingId, { id: user.id, name: user.name });
            return NextResponse.json({ success: true, activity }, { status: 201 });
        }

        if (!body.title || !body.categoryId || !body.activityDate) {
            return NextResponse.json({ success: false, message: 'Başlık, kategori ve tarih zorunludur' }, { status: 400 });
        }

        const activity = await ActivityService.createActivity(
            {
                ...body,
                createdById: user.id,
            },
            { id: user.id, name: user.name }
        );

        return NextResponse.json({ success: true, activity }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
