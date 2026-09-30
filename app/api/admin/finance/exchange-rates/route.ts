import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { z } from 'zod';

const rateSchema = z.object({
    sourceCurrency: z.string().min(1),
    targetCurrency: z.string().default('TRY'),
    rate: z.number().positive(),
    rateDate: z.string().optional(),
    source: z.string().default('MANUAL'),
});

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const rates = await prisma.exchangeRate.findMany({
            orderBy: { rateDate: 'desc' },
            take: 50,
        });

        return NextResponse.json({ success: true, rates });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Kurlar yüklenemedi' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (!auth.authenticated || !auth.user) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (!auth.user.isSuperAdmin && !hasPermission(auth.user, 'manage', 'finance')) {
            return NextResponse.json({ success: false, error: 'Döviz kuru ekleme yetkiniz bulunmuyor' }, { status: 403 });
        }

        const body = await req.json();
        const parsed = rateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Geçersiz veri' }, { status: 400 });
        }

        const rateDate = parsed.data.rateDate ? new Date(parsed.data.rateDate) : new Date();

        const created = await prisma.exchangeRate.create({
            data: {
                sourceCurrency: parsed.data.sourceCurrency.toUpperCase(),
                targetCurrency: parsed.data.targetCurrency.toUpperCase(),
                rate: Number(parsed.data.rate),
                rateDate,
                source: parsed.data.source,
                createdById: auth.user.id,
            },
        });

        await logAuditEvent({
            actorId: auth.user.id,
            action: 'CREATE',
            entityType: 'ExchangeRate',
            entityId: created.id,
            newValues: {
                pair: `${created.sourceCurrency}/${created.targetCurrency}`,
                rate: created.rate,
            },
        });

        return NextResponse.json({ success: true, rate: created });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Kur kaydedilemedi' }, { status: 500 });
    }
}
