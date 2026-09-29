import { NextRequest, NextResponse } from 'next/server';
import { DirectoryService } from '@/lib/services/directory-service';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'view', 'directory')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const contactType = searchParams.get('contactType') || undefined;
        const organizationId = searchParams.get('organizationId') || undefined;
        const search = searchParams.get('search') || undefined;

        const [contacts, organizations] = await Promise.all([
            DirectoryService.getContacts({ contactType, organizationId, search }),
            DirectoryService.getOrganizations(),
        ]);

        return NextResponse.json({ success: true, contacts, organizations });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'create', 'directory')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await req.json();
        if (!body.fullName) {
            return NextResponse.json({ success: false, message: 'Ad Soyad zorunludur' }, { status: 400 });
        }

        const contact = await DirectoryService.createContact(body, { id: user.id, name: user.name });
        return NextResponse.json({ success: true, contact }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentAdminUser();
        if (!user || !hasPermission(user, 'delete', 'directory')) {
            return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, message: 'ID zorunludur' }, { status: 400 });

        const contact = await prisma.stakeholderContact.findUnique({ where: { id } });
        if (!contact) return NextResponse.json({ success: false, message: 'Kişi bulunamadı' }, { status: 404 });

        await prisma.stakeholderContact.delete({ where: { id } });
        await logAuditEvent({
            actorId: user.id,
            actorName: user.name,
            action: 'DELETE',
            entityType: 'StakeholderContact',
            entityId: id,
            diff: `Kişi silindi: ${contact.fullName}`,
        });

        return NextResponse.json({ success: true, message: 'Kayıt silindi' });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Sunucu hatası' }, { status: 500 });
    }
}
