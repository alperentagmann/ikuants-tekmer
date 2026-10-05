import { NextRequest, NextResponse } from 'next/server';
import { FormService } from '@/lib/services/form-service';
import { signUploadToken } from '@/lib/services/form-submission-service';
import { uploadFile, UploadValidationError } from '@/lib/storage';
import { checkEndpointRateLimit, getClientIp } from '@/lib/rate-limit';
import { normalizeFieldType } from '@/lib/forms/schema';
import { errorResponse } from '@/lib/api-guard';

/**
 * Uploads a file for a FILE/FILES question of a published form. The file is
 * stored privately and a signed token is returned; the submission references
 * the token, never an arbitrary media id.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const ip = getClientIp(request);
    const limit = checkEndpointRateLimit(`${ip}:${slug}`, { limit: 10, windowSeconds: 300, keyPrefix: 'public-form-upload' });
    if (!limit.isAllowed) {
        return NextResponse.json({ success: false, message: 'Çok fazla dosya yüklendi. Lütfen biraz bekleyin.' }, { status: 429 });
    }

    try {
        const form = await FormService.getPublishedFormBySlug(slug);
        if (!form) return NextResponse.json({ success: false, message: 'Form bulunamadı.' }, { status: 404 });

        const data = await request.formData();
        const fieldKey = String(data.get('fieldKey') || '');
        const file = data.get('file');
        const field = form.fields.find((f) => f.fieldKey === fieldKey);
        if (!field || !['FILE', 'FILES'].includes(normalizeFieldType(String(field.fieldType)))) {
            return NextResponse.json({ success: false, message: 'Bu soru dosya kabul etmiyor.' }, { status: 400 });
        }
        if (!(file instanceof File)) {
            return NextResponse.json({ success: false, message: 'Dosya seçilmedi.' }, { status: 400 });
        }

        const rules = field.validationRules || {};
        const name = file.name.toLowerCase();
        if (rules.allowedFileTypes && rules.allowedFileTypes.length > 0 && !rules.allowedFileTypes.some((ext) => name.endsWith(ext.toLowerCase()))) {
            throw new UploadValidationError(`İzin verilen dosya türleri: ${rules.allowedFileTypes.join(', ')}`);
        }
        if (rules.maxFileSizeMb && file.size > rules.maxFileSizeMb * 1024 * 1024) {
            throw new UploadValidationError(`Dosya en fazla ${rules.maxFileSizeMb} MB olabilir.`);
        }

        const result = await uploadFile({
            fileName: file.name,
            buffer: Buffer.from(await file.arrayBuffer()),
            mimeType: file.type || 'application/octet-stream',
            folder: `form-${slug}`.slice(0, 40),
            isPrivate: true,
            category: 'any',
        });

        return NextResponse.json({
            success: true,
            token: signUploadToken(result.media.id, slug),
            fileName: result.media.originalName,
            fileSize: result.media.fileSize,
        });
    } catch (error) {
        return errorResponse(error, 'Dosya yüklenemedi.');
    }
}
