import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, deleteMedia, UploadValidationError, StorageNotConfiguredError, type UploadCategory } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'media')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const folder = searchParams.get('folder') || undefined;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const where: any = {};
        if (folder && folder !== 'all') where.folder = folder;

        const [items, total] = await Promise.all([
            prisma.media.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.media.count({ where }),
        ]);

        return NextResponse.json({ success: true, items, total, page, totalPages: Math.ceil(total / limit) });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'upload', 'media')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'general';
        const altText = (formData.get('altText') as string) || '';

        if (!file) {
            return NextResponse.json({ success: false, message: 'Dosya seçilmedi' }, { status: 400 });
        }

        const isPrivate = formData.get('isPrivate') === 'true';
        const requestedCategory = (formData.get('category') as string) || 'any';
        const category: UploadCategory = ['image', 'document', 'model3d', 'panorama', 'video'].includes(requestedCategory)
            ? (requestedCategory as UploadCategory)
            : 'any';

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await uploadFile({
            fileName: file.name,
            buffer,
            mimeType: file.type || 'application/octet-stream',
            folder,
            altText,
            isPrivate,
            category,
            uploadedById: user.id,
        });

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        await logAuditEvent({
            actorId: user.id,
            actorEmail: user.email,
            actorName: user.name,
            action: 'CREATE',
            entityType: 'Media',
            entityId: result.media.id,
            diff: `Uploaded file: ${file.name} (${(buffer.length / 1024).toFixed(1)} KB)`,
            ipAddress: ip,
            userAgent,
        });

        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        if (e instanceof UploadValidationError) {
            return NextResponse.json({ success: false, message: e.message }, { status: 400 });
        }
        if (e instanceof StorageNotConfiguredError) {
            return NextResponse.json({ success: false, message: e.message, status: 'PENDING_EXTERNAL_CONFIGURATION' }, { status: 503 });
        }
        console.error('Media upload failed:', e);
        return NextResponse.json({ success: false, message: 'Yükleme başarısız' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'delete', 'media')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, message: 'ID eksik' }, { status: 400 });

        await deleteMedia(id);

        await logAuditEvent({
            actorId: user.id,
            actorEmail: user.email,
            actorName: user.name,
            action: 'DELETE',
            entityType: 'Media',
            entityId: id,
            diff: 'Deleted media file',
        });

        return NextResponse.json({ success: true, message: 'Medya silindi.' });
    } catch (e: any) {
        console.error('Media delete failed:', e);
        return NextResponse.json({ success: false, message: 'Silinemedi' }, { status: 500 });
    }
}
