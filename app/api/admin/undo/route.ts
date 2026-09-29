import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { UndoService } from '@/lib/services/undo-service';

export async function POST(request: NextRequest) {
    try {
        const caller = await getCurrentAdminUser();
        if (!caller) {
            return NextResponse.json({ success: false, error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }

        const body = await request.json();
        const { entityType, entityId } = body;

        if (!entityType || !entityId) {
            return NextResponse.json({ success: false, error: 'entityType ve entityId gereklidir.' }, { status: 400 });
        }

        const result = await UndoService.undoAction(entityType, entityId, caller.id);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'Geri alma başarısız.' }, { status: 500 });
    }
}
