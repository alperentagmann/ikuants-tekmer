import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PersonalWorkspaceService } from '@/lib/services/personal-workspace-service';
import { z } from 'zod';

const noteSchema = z.object({
    title: z.string().min(1, 'Not başlığı zorunludur'),
    content: z.string().min(1, 'Not içeriği zorunludur'),
    isShared: z.boolean().optional(),
    relatedEntityType: z.string().optional(),
    relatedEntityId: z.string().optional(),
    isPinned: z.boolean().optional(),
    color: z.string().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const notes = await PersonalWorkspaceService.getNotes(auth.user.id);
        return NextResponse.json({ success: true, notes });
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
        const parsed = noteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const note = await PersonalWorkspaceService.createNote(auth.user.id, parsed.data);
        return NextResponse.json({ success: true, note });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Not ID zorunludur' }, { status: 400 });

        await PersonalWorkspaceService.deleteNote(id, auth.user.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
    }
}
