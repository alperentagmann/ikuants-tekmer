import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { uploadSignedScan } from '@/lib/contract-upload';
import { PlacementService } from '@/lib/services/placement-service';

type P = { params: Promise<{ id: string }> };

const TYPES = ['SIGNED_CONTRACT', 'ADDITIONAL_PROTOCOL', 'AMENDMENT', 'DELIVERY_REPORT', 'DEPOSIT_RECEIPT', 'TERMINATION_NOTICE', 'OTHER'];

/** Islak imzalı sözleşme / ek protokol / tadil taraması yükleme (multipart: file, documentType, title, documentDate). Yeni sürüm eklenir, eski silinmez. */
export async function POST(request: NextRequest, { params }: P) {
    const auth = await requireAdmin(request, 'update', 'rent');
    if (auth.error) return auth.error;
    try {
        const { media, form } = await uploadSignedScan(request, auth.actor.id);
        const type = String(form?.get('documentType') ?? 'SIGNED_CONTRACT');
        const date = String(form?.get('documentDate') ?? '');
        const doc = await PlacementService.attachSignedDocument((await params).id, media.id, auth.actor, {
            documentType: TYPES.includes(type) ? type : 'OTHER',
            title: String(form?.get('title') ?? '').trim() || undefined,
            documentDate: /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : undefined,
        });
        return NextResponse.json({ success: true, document: doc });
    } catch (error) {
        return errorResponse(error, 'Belge yüklenemedi');
    }
}
