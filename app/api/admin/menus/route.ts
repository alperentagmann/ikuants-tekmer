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
        const menuItems = await prisma.menuItem.findMany({
            include: { children: { orderBy: { sortOrder: 'asc' } } },
            where: { parentId: null },
            orderBy: [{ menuLocation: 'asc' }, { sortOrder: 'asc' }]
        });
        return NextResponse.json({ success: true, menuItems });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { label, url, menuLocation, parentId, isExternal, openInNewTab, sortOrder, isActive } = body;

        if (!label || !url) {
            return NextResponse.json({ error: 'Menü başlığı ve bağlantı adresi zorunludur.' }, { status: 400 });
        }

        const item = await prisma.menuItem.create({
            data: {
                label,
                url,
                menuLocation: menuLocation || 'HEADER',
                parentId: parentId || null,
                isExternal: Boolean(isExternal),
                openInNewTab: Boolean(openInNewTab),
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
                isActive: isActive !== undefined ? Boolean(isActive) : true,
            }
        });

        await logAudit({
            userId: auth.user.id,
            action: 'CREATE',
            resource: 'MENU_ITEM',
            resourceId: item.id,
            title: `Menü Öğesi Eklendi: ${item.label}`,
            newData: item,
        });

        return NextResponse.json({ success: true, item }, { status: 201 });
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
        const { id, label, url, menuLocation, parentId, isExternal, openInNewTab, sortOrder, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'Menü ID zorunludur.' }, { status: 400 });
        }

        const oldItem = await prisma.menuItem.findUnique({ where: { id } });
        if (!oldItem) {
            return NextResponse.json({ error: 'Menü öğesi bulunamadı.' }, { status: 404 });
        }

        const item = await prisma.menuItem.update({
            where: { id },
            data: {
                label: label !== undefined ? label : oldItem.label,
                url: url !== undefined ? url : oldItem.url,
                menuLocation: menuLocation !== undefined ? menuLocation : oldItem.menuLocation,
                parentId: parentId !== undefined ? parentId : oldItem.parentId,
                isExternal: isExternal !== undefined ? Boolean(isExternal) : oldItem.isExternal,
                openInNewTab: openInNewTab !== undefined ? Boolean(openInNewTab) : oldItem.openInNewTab,
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : oldItem.sortOrder,
                isActive: isActive !== undefined ? Boolean(isActive) : oldItem.isActive,
            }
        });

        await logAudit({
            userId: auth.user.id,
            action: 'UPDATE',
            resource: 'MENU_ITEM',
            resourceId: item.id,
            title: `Menü Öğesi Güncellendi: ${item.label}`,
            oldData: oldItem,
            newData: item,
        });

        return NextResponse.json({ success: true, item });
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
            return NextResponse.json({ error: 'Menü ID belirtilmedi.' }, { status: 400 });
        }

        const item = await prisma.menuItem.findUnique({ where: { id } });
        if (!item) {
            return NextResponse.json({ error: 'Menü öğesi bulunamadı.' }, { status: 404 });
        }

        await prisma.menuItem.delete({ where: { id } });

        await logAudit({
            userId: auth.user.id,
            action: 'DELETE',
            resource: 'MENU_ITEM',
            resourceId: id,
            title: `Menü Öğesi Silindi: ${item.label}`,
            oldData: item,
        });

        return NextResponse.json({ success: true, message: 'Menü öğesi silindi.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
