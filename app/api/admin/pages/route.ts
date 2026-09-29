import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
    const auth = await requireAuth(req);
    if (!auth.authenticated) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        const pageSettings = await prisma.siteSetting.findMany({
            where: { group: 'PAGE_SECTIONS' }
        });
        return NextResponse.json({ success: true, sections: pageSettings });
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
        const { key, value, description } = body;

        if (!key) {
            return NextResponse.json({ error: 'Bölüm anahtarı (key) zorunludur.' }, { status: 400 });
        }

        const setting = await prisma.siteSetting.upsert({
            where: { key },
            update: {
                value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                description: description || null,
            },
            create: {
                key,
                value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                group: 'PAGE_SECTIONS',
                description: description || null,
                isPublic: true,
            }
        });

        await logAudit({
            userId: auth.user.id,
            action: 'UPDATE',
            resource: 'PAGE_SECTION',
            resourceId: setting.id,
            title: `Sayfa Bölümü Güncellendi: ${key}`,
            newData: setting,
        });

        return NextResponse.json({ success: true, setting });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
