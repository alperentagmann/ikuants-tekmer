import { NextRequest, NextResponse } from 'next/server';
import { TrainingService } from '@/lib/services/training-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'trainings')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const programId = searchParams.get('programId') || undefined;
        const status = searchParams.get('status') || undefined;
        const search = searchParams.get('search') || undefined;

        const trainings = await TrainingService.getTrainings({
            programId,
            status,
            search,
        });

        return NextResponse.json({ success: true, trainings });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'create', 'trainings')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await req.json();
        if (!body.title || !body.programId || !body.startDate) {
            return NextResponse.json({ success: false, message: 'Başlık, Program ve Başlangıç Tarihi zorunludur' }, { status: 400 });
        }

        const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

        const training = await TrainingService.createTraining(
            {
                ...body,
                slug,
            },
            { id: user.id, name: user.name }
        );

        return NextResponse.json({ success: true, training }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
