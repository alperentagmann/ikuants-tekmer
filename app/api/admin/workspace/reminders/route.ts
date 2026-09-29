import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PersonalWorkspaceService } from '@/lib/services/personal-workspace-service';
import { z } from 'zod';

const reminderSchema = z.object({
    title: z.string().min(1, 'Hatırlatma başlığı zorunludur'),
    description: z.string().optional(),
    remindAt: z.string().min(1, 'Tarih zorunludur'),
    channel: z.enum(['IN_APP', 'EMAIL', 'TEAMS']).optional(),
    relatedEntityType: z.string().optional(),
    relatedEntityId: z.string().optional(),
    actionUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const reminders = await PersonalWorkspaceService.getReminders(auth.user.id);
        return NextResponse.json({ success: true, reminders });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const parsed = reminderSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const reminder = await PersonalWorkspaceService.createReminder(auth.user.id, parsed.data);
        return NextResponse.json({ success: true, reminder });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const { id } = body;
        if (!id) return NextResponse.json({ error: 'Hatırlatma ID zorunludur' }, { status: 400 });

        await PersonalWorkspaceService.dismissReminder(id, auth.user.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
