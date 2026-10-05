import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getStorageProvider, isObjectStorageConfigured } from '@/lib/env';
import { sanitizeSvg } from '@/lib/sanitize';

/**
 * Storage abstraction.
 *
 * - local: public files go to /public/uploads, private files to /storage/private
 *   (outside the web root, served only through an authorized route).
 * - s3: any S3-compatible object storage (AWS S3, Cloudflare R2, MinIO, Supabase S3)
 *   using AWS Signature V4. Configured entirely through environment variables.
 *
 * A provider that is selected but not configured fails loudly. A file is never
 * recorded as uploaded unless the bytes were actually stored.
 */

export class StorageNotConfiguredError extends Error {
    constructor() {
        super('Dosya depolama sağlayıcısı yapılandırılmadı (PENDING_EXTERNAL_CONFIGURATION). S3_* ortam değişkenlerini tanımlayın.');
        this.name = 'StorageNotConfiguredError';
    }
}

export class UploadValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UploadValidationError';
    }
}

export type UploadCategory = 'image' | 'document' | 'model3d' | 'panorama' | 'video' | 'any';

const MB = 1024 * 1024;

interface FileRule {
    mimeTypes: string[];
    maxBytes: number;
}

const EXTENSION_RULES: Record<string, FileRule & { categories: UploadCategory[] }> = {
    '.jpg': { mimeTypes: ['image/jpeg'], maxBytes: 15 * MB, categories: ['image', 'panorama'] },
    '.jpeg': { mimeTypes: ['image/jpeg'], maxBytes: 15 * MB, categories: ['image', 'panorama'] },
    '.png': { mimeTypes: ['image/png'], maxBytes: 15 * MB, categories: ['image', 'panorama'] },
    '.webp': { mimeTypes: ['image/webp'], maxBytes: 15 * MB, categories: ['image', 'panorama'] },
    '.gif': { mimeTypes: ['image/gif'], maxBytes: 10 * MB, categories: ['image'] },
    '.avif': { mimeTypes: ['image/avif'], maxBytes: 15 * MB, categories: ['image'] },
    '.svg': { mimeTypes: ['image/svg+xml'], maxBytes: 2 * MB, categories: ['image'] },
    '.pdf': { mimeTypes: ['application/pdf'], maxBytes: 25 * MB, categories: ['document'] },
    '.doc': { mimeTypes: ['application/msword'], maxBytes: 25 * MB, categories: ['document'] },
    '.docx': { mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], maxBytes: 25 * MB, categories: ['document'] },
    '.xls': { mimeTypes: ['application/vnd.ms-excel'], maxBytes: 25 * MB, categories: ['document'] },
    '.xlsx': { mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], maxBytes: 25 * MB, categories: ['document'] },
    '.ppt': { mimeTypes: ['application/vnd.ms-powerpoint'], maxBytes: 50 * MB, categories: ['document'] },
    '.pptx': { mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'], maxBytes: 50 * MB, categories: ['document'] },
    '.txt': { mimeTypes: ['text/plain'], maxBytes: 5 * MB, categories: ['document'] },
    '.csv': { mimeTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'], maxBytes: 10 * MB, categories: ['document'] },
    '.zip': { mimeTypes: ['application/zip', 'application/x-zip-compressed'], maxBytes: 50 * MB, categories: ['document'] },
    '.glb': { mimeTypes: ['model/gltf-binary', 'application/octet-stream'], maxBytes: 60 * MB, categories: ['model3d'] },
    '.gltf': { mimeTypes: ['model/gltf+json', 'application/json', 'application/octet-stream'], maxBytes: 20 * MB, categories: ['model3d'] },
    '.mp4': { mimeTypes: ['video/mp4'], maxBytes: 150 * MB, categories: ['video'] },
    '.webm': { mimeTypes: ['video/webm'], maxBytes: 150 * MB, categories: ['video'] },
};

export function getAllowedExtensions(category: UploadCategory = 'any'): string[] {
    return Object.entries(EXTENSION_RULES)
        .filter(([, rule]) => category === 'any' || rule.categories.includes(category))
        .map(([ext]) => ext);
}

/** Removes path segments, control characters and anything outside a safe character set. */
export function sanitizeFileName(fileName: string): { baseName: string; ext: string } {
    const lastSegment = fileName.split(/[\\/]/).pop() || 'dosya';
    const ext = path.extname(lastSegment).toLowerCase();
    const baseName = path
        .basename(lastSegment, path.extname(lastSegment))
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
        .slice(0, 80);
    return { baseName: baseName || 'dosya', ext };
}

function hasMagicBytes(ext: string, buffer: Buffer): boolean {
    const startsWith = (bytes: number[]) => bytes.every((b, i) => buffer[i] === b);
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return startsWith([0xff, 0xd8, 0xff]);
        case '.png':
            return startsWith([0x89, 0x50, 0x4e, 0x47]);
        case '.gif':
            return startsWith([0x47, 0x49, 0x46, 0x38]);
        case '.webp':
            return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
        case '.pdf':
            return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
        case '.glb':
            return buffer.subarray(0, 4).toString('ascii') === 'glTF';
        case '.docx':
        case '.xlsx':
        case '.pptx':
        case '.zip':
            return startsWith([0x50, 0x4b]);
        default:
            return true;
    }
}

/**
 * Validates a file against the allowlist: extension, declared MIME type, size and
 * file signature. Throws UploadValidationError with a user-facing message.
 */
export function validateUpload(
    fileName: string,
    mimeType: string,
    buffer: Buffer,
    category: UploadCategory = 'any'
): { ext: string; mimeType: string } {
    const { ext } = sanitizeFileName(fileName);
    const rule = EXTENSION_RULES[ext];
    if (!rule || (category !== 'any' && !rule.categories.includes(category))) {
        throw new UploadValidationError(
            `Bu dosya türü yüklenemez. İzin verilen türler: ${getAllowedExtensions(category).join(', ')}`
        );
    }
    const declared = (mimeType || 'application/octet-stream').toLowerCase().split(';')[0].trim();
    if (declared !== 'application/octet-stream' && !rule.mimeTypes.includes(declared)) {
        throw new UploadValidationError('Dosya uzantısı ile dosya türü uyuşmuyor.');
    }
    if (buffer.length === 0) {
        throw new UploadValidationError('Dosya boş.');
    }
    if (buffer.length > rule.maxBytes) {
        throw new UploadValidationError(`Dosya boyutu sınırı aşıldı (en fazla ${Math.round(rule.maxBytes / MB)} MB).`);
    }
    if (!hasMagicBytes(ext, buffer)) {
        throw new UploadValidationError('Dosya içeriği uzantısıyla uyuşmuyor.');
    }
    return { ext, mimeType: rule.mimeTypes[0] };
}

// ---------------------------------------------------------------------------
// S3-compatible object storage (AWS Signature V4)
// ---------------------------------------------------------------------------

function sha256Hex(data: Buffer | string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function hmac(key: Buffer | string, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest();
}

function encodeKey(key: string): string {
    return key
        .split('/')
        .map((segment) =>
            encodeURIComponent(segment).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
        )
        .join('/');
}

async function s3Request(method: 'PUT' | 'GET' | 'DELETE', bucket: string, key: string, body?: Buffer, contentType?: string) {
    if (!isObjectStorageConfigured()) throw new StorageNotConfiguredError();

    const endpoint = (process.env.S3_ENDPOINT as string).replace(/\/+$/, '');
    const region = process.env.S3_REGION || 'auto';
    const accessKey = process.env.S3_ACCESS_KEY_ID as string;
    const secretKey = process.env.S3_SECRET_ACCESS_KEY as string;

    const canonicalUri = `/${bucket}/${encodeKey(key)}`;
    const url = new URL(endpoint + canonicalUri);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256Hex(body ?? '');

    const canonicalHeaders = `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
    const scope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
    const signingKey = hmac(hmac(hmac(hmac('AWS4' + secretKey, dateStamp), region), 's3'), 'aws4_request');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const headers: Record<string, string> = {
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    };
    if (contentType) headers['Content-Type'] = contentType;

    const response = await fetch(url, { method, headers, body: body ? new Uint8Array(body) : undefined });
    if (!response.ok && !(method === 'DELETE' && response.status === 404)) {
        throw new Error(`Depolama sağlayıcısı isteği reddetti (HTTP ${response.status}).`);
    }
    return response;
}

function getBucket(isPrivate: boolean): string {
    const bucket = isPrivate
        ? process.env.STORAGE_BUCKET_PRIVATE || process.env.STORAGE_BUCKET_PUBLIC
        : process.env.STORAGE_BUCKET_PUBLIC;
    if (!bucket) throw new StorageNotConfiguredError();
    return bucket;
}

function buildPublicObjectUrl(key: string): string {
    const base = process.env.STORAGE_PUBLIC_BASE_URL;
    if (base) return `${base.replace(/\/+$/, '')}/${encodeKey(key)}`;
    const endpoint = (process.env.S3_ENDPOINT as string).replace(/\/+$/, '');
    return `${endpoint}/${getBucket(false)}/${encodeKey(key)}`;
}

// ---------------------------------------------------------------------------
// Local filesystem
// ---------------------------------------------------------------------------

const LOCAL_PRIVATE_ROOT = path.join(process.cwd(), 'storage');
const LOCAL_PUBLIC_ROOT = path.join(process.cwd(), 'public');

function resolveLocalPath(storagePath: string, isPrivate: boolean): string {
    const root = isPrivate ? LOCAL_PRIVATE_ROOT : LOCAL_PUBLIC_ROOT;
    const resolved = path.resolve(root, storagePath);
    if (!resolved.startsWith(root + path.sep)) {
        throw new Error('Geçersiz dosya yolu.');
    }
    return resolved;
}

export function privateFileUrl(mediaId: string): string {
    return `/api/admin/media/${mediaId}/file`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UploadOptions {
    fileName: string;
    buffer: Buffer;
    mimeType: string;
    folder?: string;
    isPrivate?: boolean;
    altText?: string;
    uploadedById?: string;
    category?: UploadCategory;
}

export async function uploadFile(options: UploadOptions) {
    const { fileName, folder = 'general', isPrivate = false, altText, uploadedById, category = 'any' } = options;
    let buffer = options.buffer;

    const validated = validateUpload(fileName, options.mimeType, buffer, category);
    if (validated.ext === '.svg') {
        const svg = sanitizeSvg(buffer.toString('utf8'));
        if (!svg.isValid || !svg.sanitizedSvg) {
            throw new UploadValidationError(svg.error || 'SVG dosyası güvenli değil.');
        }
        buffer = Buffer.from(svg.sanitizedSvg, 'utf8');
    }

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    const existingMedia = await prisma.media.findFirst({ where: { checksum, isPrivate } });
    if (existingMedia) {
        return { media: existingMedia, isDuplicate: true, publicUrl: existingMedia.publicUrl };
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40) || 'general';
    const { baseName } = sanitizeFileName(fileName);
    const uniqueFileName = `${baseName}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${validated.ext}`;
    const mediaId = crypto.randomUUID();

    let storagePath: string;
    let publicUrl: string;

    if (getStorageProvider() === 'local') {
        storagePath = isPrivate ? `private/${safeFolder}/${uniqueFileName}` : `uploads/${safeFolder}/${uniqueFileName}`;
        const fullPath = resolveLocalPath(storagePath, isPrivate);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, buffer);
        publicUrl = isPrivate ? privateFileUrl(mediaId) : `/${storagePath}`;
    } else {
        storagePath = `${isPrivate ? 'private' : 'public'}/${safeFolder}/${uniqueFileName}`;
        await s3Request('PUT', getBucket(isPrivate), storagePath, buffer, validated.mimeType);
        publicUrl = isPrivate ? privateFileUrl(mediaId) : buildPublicObjectUrl(storagePath);
    }

    const media = await prisma.media.create({
        data: {
            id: mediaId,
            fileName: uniqueFileName,
            originalName: fileName.split(/[\\/]/).pop() || uniqueFileName,
            mimeType: validated.mimeType,
            fileSize: buffer.length,
            folder: safeFolder,
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

/** Reads the bytes of a stored file (used to serve private files to authorized users). */
export async function readStoredFile(media: { storagePath: string; isPrivate: boolean }): Promise<Buffer> {
    if (getStorageProvider() === 'local') {
        // Files uploaded before private storage existed live under /public/uploads.
        const isLegacyPublicPath = media.storagePath.startsWith('uploads/');
        return fs.readFile(resolveLocalPath(media.storagePath, media.isPrivate && !isLegacyPublicPath));
    }
    const response = await s3Request('GET', getBucket(media.isPrivate), media.storagePath);
    return Buffer.from(await response.arrayBuffer());
}

export async function deleteMedia(id: string) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return false;

    if (getStorageProvider() === 'local') {
        try {
            const isLegacyPublicPath = media.storagePath.startsWith('uploads/');
            await fs.unlink(resolveLocalPath(media.storagePath, media.isPrivate && !isLegacyPublicPath));
        } catch {
            // File already missing on disk
        }
    } else {
        await s3Request('DELETE', getBucket(media.isPrivate), media.storagePath);
    }

    await prisma.media.delete({ where: { id } });
    return true;
}

export function getStorageStatus(): { provider: 'local' | 's3'; status: string; detail: string } {
    const provider = getStorageProvider();
    if (provider === 's3') {
        return isObjectStorageConfigured()
            ? { provider, status: 'CONFIGURED', detail: 'S3 uyumlu nesne depolama yapılandırıldı.' }
            : { provider, status: 'PENDING_EXTERNAL_CONFIGURATION', detail: 'STORAGE_PROVIDER=s3 seçili ancak S3_* değişkenleri eksik.' };
    }
    if (process.env.NODE_ENV === 'production') {
        return {
            provider,
            status: 'PENDING_EXTERNAL_CONFIGURATION',
            detail: 'Production ortamında yerel dosya sistemi kalıcı olmayabilir. Nesne depolama yapılandırılmalı.',
        };
    }
    return { provider, status: 'CONFIGURED', detail: 'Yerel dosya sistemi (geliştirme ortamı).' };
}
