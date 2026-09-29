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
        const redirects = await prisma.redirect.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ success: true, redirects });
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
        const { fromUrl, toUrl, statusCode, isActive } = body;

        if (!fromUrl || !toUrl) {
            return NextResponse.json({ error: 'Eski URL (from) ve Yeni URL (to) zorunludur.' }, { status: 400 });
        }

        const existing = await prisma.redirect.findUnique({ where: { fromUrl } });
        if (existing) {
            return NextResponse.json({ error: 'Bu kaynak URL için zaten bir yönlendirme tanımlı.' }, { status: 409 });
        }

        const redirect = await prisma.redirect.create({
            data: {
                fromUrl,
                toUrl,
                statusCode: statusCode ? parseInt(statusCode) : 301,
                isActive: isActive !== undefined ? Boolean(isActive) : true,
            }
        });

        await logAudit({
            userId: auth.user.id,
            action: 'CREATE',
            resource: 'REDIRECT',
            resourceId: redirect.id,
            title: `SEO Yönlendirmesi Eklendi: ${redirect.fromUrl} -> ${redirect.toUrl}`,
            newData: redirect,
        });

        return NextResponse.json({ success: true, redirect }, { status: 201 });
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
        const { id, fromUrl, toUrl, statusCode, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'Yönlendirme ID zorunludur.' }, { status: 400 });
        }

        const oldRedirect = await prisma.redirect.findUnique({ where: { id } });
        if (!oldRedirect) {
            return NextResponse.json({ error: 'Yönlendirme bulunamadı.' }, { status: 404 });
        }

        const redirect = await prisma.redirect.update({
            where: { id },
            data: {
                fromUrl: fromUrl !== undefined ? fromUrl : oldRedirect.fromUrl,
                toUrl: toUrl !== undefined ? toUrl : oldRedirect.toUrl,
                statusCode: statusCode !== undefined ? parseInt(statusCode) : oldRedirect.statusCode,
                isActive: isActive !== undefined ? Boolean(isActive) : oldRedirect.isActive,
            }
        });

        await logAudit({
            userId: auth.user.id,
            action: 'UPDATE',
            resource: 'REDIRECT',
            resourceId: redirect.id,
            title: `SEO Yönlendirmesi Güncellendi: ${redirect.fromUrl}`,
            oldData: oldRedirect,
            newData: redirect,
        });

        return NextResponse.json({ success: true, redirect });
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
            return NextResponse.json({ error: 'Yönlendirme ID belirtilmedi.' }, { status: 400 });
        }

        const redirect = await prisma.redirect.findUnique({ where: { id } });
        if (!redirect) {
            return NextResponse.json({ error: 'Yönlendirme bulunamadı.' }, { status: 404 });
        }

        await prisma.redirect.delete({ where: { id } });

        await logAudit({
            userId: auth.user.id,
            action: 'DELETE',
            resource: 'REDIRECT',
            resourceId: id,
            title: `SEO Yönlendirmesi Silindi: ${redirect.fromUrl}`,
            oldData: redirect,
        });

        return NextResponse.json({ success: true, message: 'Yönlendirme silindi.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
