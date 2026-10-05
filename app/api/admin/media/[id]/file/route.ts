import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { readStoredFile } from '@/lib/storage';

/**
 * Serves a stored file to an authorized admin. Private files (application documents,
 * contracts, etc.) are only reachable through this route.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentAdminUser();
    if (!user) return NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 });

    const { id } = await params;
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
        return NextResponse.json({ success: false, message: 'Dosya bulunamadı' }, { status: 404 });
    }

    // Access follows the record the file belongs to
    const documents = await prisma.document.findMany({ where: { mediaId: id }, select: { entityType: true, visibility: true } });
    // Restricted documents (identity, financial...) always require the dedicated permission
    if (documents.some((d) => d.visibility === 'RESTRICTED') && !hasPermission(user, 'view_restricted', 'documents') && !hasPermission(user, 'view_sensitive', 'applications')) {
        return NextResponse.json({ success: false, message: 'Bu dosyayı görüntüleme yetkiniz yok' }, { status: 403 });
    }
    const allowed =
        hasPermission(user, 'view', 'media') ||
        documents.some((d) => {
            if (d.visibility === 'RESTRICTED' && !hasPermission(user, 'view_restricted', 'documents')) return false;
            if (d.entityType === 'Application' || d.entityType === 'Submission') return hasPermission(user, 'view', 'applications') || hasPermission(user, 'view', 'forms');
            return hasPermission(user, 'view', 'documents');
        });
    if (!allowed) return NextResponse.json({ success: false, message: 'Bu dosyayı görüntüleme yetkiniz yok' }, { status: 403 });

    try {
        const bytes = await readStoredFile(media);
        const safeName = media.originalName.replace(/[^\w.\-]/g, '_');
        return new NextResponse(new Uint8Array(bytes), {
            headers: {
                'Content-Type': media.mimeType,
                'Content-Length': String(bytes.length),
                'Content-Disposition': `inline; filename="${safeName}"`,
                'Cache-Control': 'private, no-store',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('Stored file read failed:', error);
        return NextResponse.json({ success: false, message: 'Dosya okunamadı' }, { status: 500 });
    }
}
