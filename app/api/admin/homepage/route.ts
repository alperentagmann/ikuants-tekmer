import { NextRequest, NextResponse } from 'next/server';
import { HomepageService } from '@/lib/services/homepage-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'homepage')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const [slides, sections] = await Promise.all([
            HomepageService.getHeroSlides(true),
            HomepageService.getSections(),
        ]);

        return NextResponse.json({ success: true, slides, sections });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'create', 'homepage')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await req.json();

        // Check if section toggle
        if (body.action === 'toggle-section' && body.sectionKey !== undefined) {
            const sec = await HomepageService.updateSectionVisibility(body.sectionKey, Boolean(body.isVisible));
            return NextResponse.json({ success: true, section: sec });
        }

        // Check if section reorder
        if (body.action === 'reorder-sections' && Array.isArray(body.orderedKeys)) {
            const sections = await HomepageService.reorderSections(body.orderedKeys, { id: user.id, name: user.name });
            return NextResponse.json({ success: true, sections });
        }

        // Check if section update
        if (body.action === 'update-section' && body.sectionKey) {
            const sec = await HomepageService.updateSection(body.sectionKey, body, { id: user.id, name: user.name });
            return NextResponse.json({ success: true, section: sec });
        }

        // Check if slide reorder
        if (body.action === 'reorder-slides' && Array.isArray(body.orderedIds)) {
            const updates = body.orderedIds.map((id: string, index: number) =>
                prisma.heroSlide.update({
                    where: { id },
                    data: { sortOrder: index + 1 },
                })
            );
            await prisma.$transaction(updates);
            return NextResponse.json({ success: true });
        }

        if (!body.title || !body.mediaUrl) {
            return NextResponse.json({ success: false, message: 'Başlık ve medya görseli zorunludur' }, { status: 400 });
        }

        const slide = await HomepageService.createHeroSlide(body, { id: user.id, name: user.name });
        return NextResponse.json({ success: true, slide }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'edit', 'homepage')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await req.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'Slide ID zorunludur' }, { status: 400 });
        }

        const slide = await HomepageService.updateHeroSlide(id, data, { id: user.id, name: user.name });
        return NextResponse.json({ success: true, slide });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'delete', 'homepage')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID zorunludur' }, { status: 400 });
        }

        await prisma.heroSlide.delete({ where: { id } });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'DELETE',
            entityType: 'HeroSlide',
            entityId: id,
            diff: 'Hero slide silindi',
        });

        return NextResponse.json({ success: true, message: 'Hero slide silindi' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
