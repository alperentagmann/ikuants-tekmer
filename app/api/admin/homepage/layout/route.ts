import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, errorResponse, DomainError } from '@/lib/api-guard';
import { hasPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { PageLayoutService } from '@/lib/services/homepage-layout-service';
import { isPageKey, type PageKey } from '@/lib/homepage-layout';

const pageOf = (request: NextRequest): PageKey => {
    const p = request.nextUrl.searchParams.get('page');
    return isPageKey(p) ? p : 'home';
};

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'edit', 'cms');
    if (auth.error) return auth.error;
    try {
        const [state, forms] = await Promise.all([
            PageLayoutService.getEditorState(pageOf(request)),
            prisma.form.findMany({ where: { isPublished: true, isArchived: false }, select: { slug: true, title: true }, orderBy: { title: 'asc' } }),
        ]);
        return NextResponse.json({ success: true, ...state, forms, canPublish: hasPermission(auth.user, 'publish', 'cms') });
    } catch (error) {
        return errorResponse(error, 'Tasarım düzeni alınamadı');
    }
}

/** Saves the draft layout. */
export async function PUT(request: NextRequest) {
    const auth = await requireAdmin(request, 'edit', 'cms');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { layout?: unknown };
        const draft = await PageLayoutService.saveDraft(pageOf(request), body.layout, auth.actor);
        return NextResponse.json({ success: true, draft });
    } catch (error) {
        return errorResponse(error, 'Taslak kaydedilemedi');
    }
}

/** publish | discard | restore (original or history index) */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request, 'edit', 'cms');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { action?: string; source?: string | number };
        if (body.action === 'publish') {
            if (!hasPermission(auth.user, 'publish', 'cms')) throw new DomainError('Ana sayfayı yayınlama yetkiniz yok (cms:publish).', 403);
            return NextResponse.json({ success: true, published: await PageLayoutService.publish(pageOf(request), auth.actor) });
        }
        if (body.action === 'discard') {
            await PageLayoutService.discardDraft(pageOf(request), auth.actor);
            return NextResponse.json({ success: true });
        }
        if (body.action === 'restore') {
            const source = body.source === 'original' ? 'original' : Number(body.source);
            if (source !== 'original' && !Number.isInteger(source)) throw new DomainError('Geçersiz sürüm.');
            return NextResponse.json({ success: true, draft: await PageLayoutService.restoreToDraft(pageOf(request), source, auth.actor) });
        }
        throw new DomainError('Geçersiz işlem.');
    } catch (error) {
        return errorResponse(error, 'İşlem başarısız');
    }
}
