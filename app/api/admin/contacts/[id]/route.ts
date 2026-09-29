import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/services/contact-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'edit', 'contacts')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();

        if (body.status) {
            await ContactService.updateStatus(id, body.status, {
                id: user.id,
                name: user.name,
                email: user.email,
            });
        }

        if (body.assignedToId !== undefined) {
            await ContactService.assignStaff(id, body.assignedToId, {
                id: user.id,
                name: user.name,
                email: user.email,
            });
        }

        if (body.internalNotes !== undefined) {
            await prisma.contactRequest.update({
                where: { id },
                data: { internalNotes: body.internalNotes },
            });
        }

        return NextResponse.json({ success: true, message: 'Talep güncellendi.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Hata' }, { status: 500 });
    }
}
