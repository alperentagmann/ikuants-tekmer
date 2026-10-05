import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/document-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';

/** Documents are archived (never hard-deleted); body: { isArchived: boolean } */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(req, 'delete', 'documents');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await req.json();
        const document = await DocumentService.setArchived(id, body.isArchived !== false, auth.user);
        return NextResponse.json({ success: true, document });
    } catch (error) {
        return errorResponse(error, 'Doküman güncellenemedi');
    }
}
