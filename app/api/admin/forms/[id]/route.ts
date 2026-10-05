import { NextRequest, NextResponse } from 'next/server';
import { FormService } from '@/lib/services/form-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { hasPermission } from '@/lib/rbac';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'forms');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const detail = await FormService.getFormDetail(id);
        if (!detail) return NextResponse.json({ success: false, message: 'Form bulunamadı' }, { status: 404 });
        return NextResponse.json({ success: true, ...detail });
    } catch (error) {
        return errorResponse(error, 'Form yüklenemedi');
    }
}

/** Updates form settings (title, type, owner, notifications, public page...). */
export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'edit', 'forms');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await request.json();
        const form = await FormService.updateSettings(id, body, auth.actor);
        return NextResponse.json({ success: true, form });
    } catch (error) {
        return errorResponse(error, 'Form ayarları kaydedilemedi');
    }
}

/**
 * Lifecycle actions:
 *   saveDraft | publish | discardDraft | unpublish | republish | archive | restore
 */
export async function POST(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'edit', 'forms');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = await request.json();
        const action = String(body.action || 'saveDraft');
        const needsPublish = ['publish', 'unpublish', 'republish'].includes(action);
        if (needsPublish && !hasPermission(auth.user, 'publish', 'forms')) {
            return NextResponse.json({ success: false, message: 'Form yayınlama yetkiniz yok' }, { status: 403 });
        }
        if (['archive', 'restore'].includes(action) && !hasPermission(auth.user, 'delete', 'forms')) {
            return NextResponse.json({ success: false, message: 'Form arşivleme yetkiniz yok' }, { status: 403 });
        }

        switch (action) {
            case 'saveDraft': {
                const version = await FormService.saveDraft(id, { sections: body.sections || [], fields: body.fields || [], changeNote: body.changeNote }, auth.actor);
                return NextResponse.json({ success: true, version, message: `Taslak v${version.versionNumber} kaydedildi.` });
            }
            case 'publish': {
                if (Array.isArray(body.fields)) {
                    await FormService.saveDraft(id, { sections: body.sections || [], fields: body.fields, changeNote: body.changeNote }, auth.actor);
                }
                const version = await FormService.publishDraft(id, auth.actor);
                return NextResponse.json({ success: true, version, message: `v${version.versionNumber} yayınlandı.` });
            }
            case 'discardDraft':
                await FormService.discardDraft(id, auth.actor);
                return NextResponse.json({ success: true, message: 'Taslak silindi.' });
            case 'unpublish':
                await FormService.setPublished(id, false, auth.actor);
                return NextResponse.json({ success: true, message: 'Form yayından kaldırıldı.' });
            case 'republish':
                await FormService.setPublished(id, true, auth.actor);
                return NextResponse.json({ success: true, message: 'Form yeniden yayında.' });
            case 'archive':
                await FormService.setArchived(id, true, auth.actor);
                return NextResponse.json({ success: true, message: 'Form arşivlendi.' });
            case 'restore':
                await FormService.setArchived(id, false, auth.actor);
                return NextResponse.json({ success: true, message: 'Form geri yüklendi.' });
            default:
                return NextResponse.json({ success: false, message: 'Bilinmeyen işlem' }, { status: 400 });
        }
    } catch (error) {
        return errorResponse(error, 'Form işlemi tamamlanamadı');
    }
}
