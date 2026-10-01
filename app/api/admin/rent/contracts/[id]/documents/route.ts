import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RentService } from '@/lib/services/rent-service';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await context.params;

        const documents = await RentService.getContractDocuments(id);
        return NextResponse.json({ success: true, items: documents });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Belgeler yüklenemedi' },
            { status: error.message?.includes('Unauthorized') ? 401 : 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await context.params;
        const body = await request.json();

        if (!body.title || !body.fileUrl) {
            return NextResponse.json(
                { success: false, error: 'Belge başlığı ve dosya URL zorunludur' },
                { status: 400 }
            );
        }

        const doc = await RentService.addContractDocument(id, body, auth.user.id);
        return NextResponse.json({ success: true, document: doc }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Belge kaydedilemedi' },
            { status: error.message?.includes('Unauthorized') ? 401 : 500 }
        );
    }
}
