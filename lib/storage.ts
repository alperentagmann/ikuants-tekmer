import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';

export interface UploadOptions {
    fileName: string;
    buffer: Buffer;
    mimeType: string;
    folder?: string;
    isPrivate?: boolean;
    altText?: string;
    uploadedById?: string;
}

export async function uploadFile(options: UploadOptions) {
    const { fileName, buffer, mimeType, folder = 'general', isPrivate = false, altText, uploadedById } = options;

    // Security: compute SHA-256 Checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Check duplicate file
    const existingMedia = await prisma.media.findFirst({
        where: { checksum },
    });

    if (existingMedia) {
        return {
            media: existingMedia,
            isDuplicate: true,
            publicUrl: existingMedia.publicUrl,
        };
    }

    // Clean filename and create unique storage name
    const ext = path.extname(fileName) || '';
    const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const uniqueFileName = `${baseName}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    let storagePath = '';
    let publicUrl = '';

    if (STORAGE_PROVIDER === 'local') {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
        await fs.mkdir(uploadDir, { recursive: true });

        const fullPath = path.join(uploadDir, uniqueFileName);
        await fs.writeFile(fullPath, buffer);

        storagePath = `uploads/${folder}/${uniqueFileName}`;
        publicUrl = `/uploads/${folder}/${uniqueFileName}`;
    } else {
        // In production cloud storage (S3 / Supabase / R2)
        storagePath = `${isPrivate ? 'private' : 'public'}/${folder}/${uniqueFileName}`;
        publicUrl = `https://${process.env.STORAGE_BUCKET_PUBLIC}.s3.amazonaws.com/${storagePath}`;
    }

    const media = await prisma.media.create({
        data: {
            fileName: uniqueFileName,
            originalName: fileName,
            mimeType,
            fileSize: buffer.length,
            folder,
            storagePath,
            publicUrl,
            isPrivate,
            checksum,
            altText: altText || fileName,
            uploadedById,
            usageCount: 0,
        },
    });

    return { media, isDuplicate: false, publicUrl };
}

export async function deleteMedia(id: string) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return false;

    if (STORAGE_PROVIDER === 'local') {
        try {
            const fullPath = path.join(process.cwd(), 'public', media.storagePath);
            await fs.unlink(fullPath);
        } catch {
            // Ignore if file doesn't exist locally
        }
    }

    await prisma.media.delete({ where: { id } });
    return true;
}
