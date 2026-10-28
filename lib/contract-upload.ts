import { NextRequest } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { DomainError } from '@/lib/errors';

const ALLOWED = /\.(pdf|jpe?g|png|webp|tiff?)$/i;

/** Islak imzalı taranmış sözleşme (PDF / görsel) yükler; dosya özel (giriş gerektiren) olarak saklanır. */
export async function uploadSignedScan(request: NextRequest, actorId: string) {
    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File) || file.size === 0) throw new DomainError('Dosya seçin.', 400);
    if (!ALLOWED.test(file.name)) throw new DomainError('Yalnız PDF, JPG, PNG, WEBP veya TIFF yüklenebilir.', 400);
    const result = await uploadFile({
        fileName: file.name, buffer: Buffer.from(await file.arrayBuffer()), mimeType: file.type || 'application/octet-stream',
        folder: 'sozlesmeler', isPrivate: true, uploadedById: actorId, category: 'any',
    });
    return { media: result.media, form };
}
