import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        const partners = await prisma.partner.findMany({
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
        });
        return NextResponse.json({ success: true, partners });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const hasAccess = await checkPermission(auth.user.id, 'settings', 'create');
    if (!hasAccess && !auth.user.isSuperAdmin) {
        return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, logoUrl, websiteUrl, altText, partnerGroup, sortOrder, isActive } = body;

        if (!name || !logoUrl) {
            return NextResponse.json({ error: 'Kurum adı ve logo URL zorunludur.' }, { status: 400 });
        }

        const partner = await prisma.partner.create({
            data: {
                name,
                logoUrl,
                websiteUrl: websiteUrl || null,
                altText: altText || name,
                partnerGroup: partnerGroup || 'STAKEHOLDER',
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
                isActive: isActive !== undefined ? Boolean(isActive) : true,
            }
        });

        await logAudit({
            userId: auth.user.id,
            action: 'CREATE',
            resource: 'PARTNER',
            resourceId: partner.id,
            title: `Yeni Partner Eklendi: ${partner.name}`,
            newData: partner,
        });

        return NextResponse.json({ success: true, partner }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, logoUrl, websiteUrl, altText, partnerGroup, sortOrder, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'Partner ID zorunludur.' }, { status: 400 });
        }

        const oldPartner = await prisma.partner.findUnique({ where: { id } });
        if (!oldPartner) {
            return NextResponse.json({ error: 'Partner bulunamadı.' }, { status: 404 });
        }

        const partner = await prisma.partner.update({
            where: { id },
            data: {
                name: name !== undefined ? name : oldPartner.name,
                logoUrl: logoUrl !== undefined ? logoUrl : oldPartner.logoUrl,
                websiteUrl: websiteUrl !== undefined ? websiteUrl : oldPartner.websiteUrl,
                altText: altText !== undefined ? altText : oldPartner.altText,
                partnerGroup: partnerGroup !== undefined ? partnerGroup : oldPartner.partnerGroup,
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : oldPartner.sortOrder,
                isActive: isActive !== undefined ? Boolean(isActive) : oldPartner.isActive,
            }
        });

        await logAudit({
            userId: auth.user.id,
            action: 'UPDATE',
            resource: 'PARTNER',
            resourceId: partner.id,
            title: `Partner Güncellendi: ${partner.name}`,
            oldData: oldPartner,
            newData: partner,
        });

        return NextResponse.json({ success: true, partner });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Partner ID belirtilmedi.' }, { status: 400 });
        }

        const partner = await prisma.partner.findUnique({ where: { id } });
        if (!partner) {
            return NextResponse.json({ error: 'Partner bulunamadı.' }, { status: 404 });
        }

        await prisma.partner.delete({ where: { id } });

        await logAudit({
            userId: auth.user.id,
            action: 'DELETE',
            resource: 'PARTNER',
            resourceId: id,
            title: `Partner Silindi: ${partner.name}`,
            oldData: partner,
        });

        return NextResponse.json({ success: true, message: 'Partner başarıyla silindi.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
