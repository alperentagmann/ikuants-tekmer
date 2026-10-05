import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, errorResponse, DomainError } from '@/lib/api-guard';
import { FormPlacementService, PLACEMENT_TARGETS } from '@/lib/services/form-placement-service';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'forms');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const [placements, programs] = await Promise.all([
            FormPlacementService.listForForm(id),
            prisma.program.findMany({ where: { isArchived: false }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        ]);
        const targets = Object.entries(PLACEMENT_TARGETS).filter(([k]) => k !== 'HOMEPAGE').map(([value, t]) => ({ value, label: t.label, needsTarget: t.needsTarget }));
        return NextResponse.json({ success: true, placements, programs, targets });
    } catch (error) {
        return errorResponse(error, 'Yerleşimler alınamadı');
    }
}

export async function POST(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'edit', 'forms');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = (await request.json()) as { targetType?: string; targetId?: string; title?: string; description?: string };
        const placement = await FormPlacementService.create(id, { targetType: String(body.targetType || ''), targetId: body.targetId || null, title: body.title, description: body.description }, auth.actor);
        return NextResponse.json({ success: true, placement });
    } catch (error) {
        return errorResponse(error, 'Yerleşim eklenemedi');
    }
}

export async function PATCH(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'edit', 'forms');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const body = (await request.json()) as { id?: string; isActive?: boolean; title?: string; description?: string };
        const existing = await prisma.formPlacement.findUnique({ where: { id: String(body.id || '') } });
        if (!existing || existing.formId !== id) throw new DomainError('Yerleşim bulunamadı.', 404);
        const placement = await FormPlacementService.update(existing.id, { isActive: body.isActive, title: body.title, description: body.description }, auth.actor);
        return NextResponse.json({ success: true, placement });
    } catch (error) {
        return errorResponse(error, 'Yerleşim güncellenemedi');
    }
}

export async function DELETE(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'edit', 'forms');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const placementId = request.nextUrl.searchParams.get('id') || '';
        const existing = await prisma.formPlacement.findUnique({ where: { id: placementId } });
        if (!existing || existing.formId !== id) throw new DomainError('Yerleşim bulunamadı.', 404);
        await FormPlacementService.remove(existing.id, auth.actor);
        return NextResponse.json({ success: true });
    } catch (error) {
        return errorResponse(error, 'Yerleşim kaldırılamadı');
    }
}
