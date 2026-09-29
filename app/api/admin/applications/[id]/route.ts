import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/application-service';
import { getCurrentAdminUser, logPiiAccess } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'applications')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const app = await ApplicationService.getApplicationDetails(id);
        if (!app) return NextResponse.json({ success: false, message: 'Bulunamadı' }, { status: 404 });

        const canViewSensitive = hasPermission(user, 'view_sensitive', 'applications');
        const { tcNumberEncrypted, ...safeApp } = app;

        return NextResponse.json({
            success: true,
            application: {
                ...safeApp,
                // Default GET always returns masked value; revealing requires explicit call to /reveal-pii
                tcNumber: app.tcNumberMasked,
                canRevealPii: canViewSensitive,
            },
        });
    } catch {
        return NextResponse.json({ success: false, message: 'Hata' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'edit', 'applications')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const userAgent = request.headers.get('user-agent') || '';

        let updated: any = null;

        // If updating status
        if (body.status) {
            updated = await ApplicationService.updateStatus({
                applicationId: id,
                toStatus: body.status,
                reason: body.reason,
                actor: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    ip,
                    userAgent,
                },
            });
        }

        // If adding internal note
        if (body.noteText) {
            await ApplicationService.addInternalNote({
                applicationId: id,
                noteText: body.noteText,
                mentions: body.mentions,
                fileUrl: body.fileUrl,
                actor: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            });
        }

        // If assigning to user
        if (body.assignedToId !== undefined) {
            updated = await prisma.application.update({
                where: { id },
                data: { assignedToId: body.assignedToId || null },
            });
        }

        return NextResponse.json({ success: true, application: updated });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
