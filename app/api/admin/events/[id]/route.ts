import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventService } from '@/lib/services/event-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'events')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const event = await EventService.getEventById(id);
        if (!event) {
            return NextResponse.json({ success: false, message: 'Etkinlik bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, event });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'edit', 'events')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await req.json();

        // Check QR check-in action
        if (body.action === 'checkin' && body.registrationId) {
            const res = await EventService.checkInAttendee(body.registrationId);
            return NextResponse.json({ success: true, registration: res });
        }

        // Check manual registration action
        if (body.action === 'register' && body.attendee) {
            const res = await EventService.registerAttendee(id, body.attendee);
            return NextResponse.json({ success: true, registration: res });
        }

        // Standard update
        const updated = await prisma.event.update({
            where: { id },
            data: {
                title: body.title,
                slug: body.slug,
                description: body.description,
                agenda: body.agenda,
                startDate: body.startDate ? new Date(body.startDate) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
                location: body.location,
                eventType: body.eventType,
                mapUrl: body.mapUrl,
                onlineMeetingUrl: body.onlineMeetingUrl,
                quota: body.quota !== undefined ? Number(body.quota) : undefined,
                registrationLink: body.registrationLink,
                coverImage: body.coverImage,
                isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
                status: body.status,
            },
        });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'UPDATE',
            entityType: 'Event',
            entityId: id,
            diff: `Etkinlik güncellendi: ${updated.title}`,
        });

        return NextResponse.json({ success: true, event: updated });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'delete', 'events')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await context.params;
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) {
            return NextResponse.json({ success: false, message: 'Etkinlik bulunamadı' }, { status: 404 });
        }

        await prisma.event.delete({ where: { id } });

        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'DELETE',
            entityType: 'Event',
            entityId: id,
            diff: `Etkinlik silindi: ${event.title}`,
        });

        return NextResponse.json({ success: true, message: 'Etkinlik silindi' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
