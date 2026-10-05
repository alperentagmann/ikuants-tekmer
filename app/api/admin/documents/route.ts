import { NextRequest, NextResponse } from 'next/server';
import { DocumentService, DOCUMENT_CATEGORIES, DOCUMENT_ENTITIES } from '@/lib/services/document-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req, 'view', 'documents');
    if (auth.error) return auth.error;
    try {
        const sp = req.nextUrl.searchParams;
        const result = await DocumentService.list({
            entityType: sp.get('entityType') || undefined,
            entityId: sp.get('entityId') || undefined,
            category: sp.get('category') || undefined,
            search: sp.get('search') || undefined,
            includeRestricted: hasPermission(auth.user, 'view_restricted', 'documents'),
            includeArchived: sp.get('includeArchived') === 'true',
            page: Number(sp.get('page') || 1),
        });
        return NextResponse.json({
            success: true,
            ...result,
            categories: DOCUMENT_CATEGORIES,
            entityTypes: Object.entries(DOCUMENT_ENTITIES).map(([value, e]) => ({ value, label: e.label })),
        });
    } catch (error) {
        return errorResponse(error, 'Dokümanlar yüklenemedi');
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdmin(req, 'upload', 'documents');
    if (auth.error) return auth.error;
    try {
        const data = await req.formData();
        const file = data.get('file');
        if (!(file instanceof File)) return NextResponse.json({ success: false, message: 'Dosya seçilmedi' }, { status: 400 });
        const visibility = String(data.get('visibility') || 'INTERNAL');
        if (visibility === 'RESTRICTED' && !hasPermission(auth.user, 'view_restricted', 'documents')) {
            return NextResponse.json({ success: false, message: 'Kısıtlı doküman yükleme yetkiniz yok' }, { status: 403 });
        }
        const result = await DocumentService.upload(
            {
                file,
                title: String(data.get('title') || ''),
                description: String(data.get('description') || '') || null,
                category: String(data.get('category') || 'GENERAL'),
                entityType: String(data.get('entityType') || ''),
                entityId: String(data.get('entityId') || ''),
                visibility,
            },
            auth.user
        );
        return NextResponse.json({ success: true, ...result, message: `"${result.document.title}" yüklendi.` });
    } catch (error) {
        return errorResponse(error, 'Doküman yüklenemedi');
    }
}
