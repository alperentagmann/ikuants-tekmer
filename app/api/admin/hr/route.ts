import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { logAuditEvent } from '@/lib/audit';
import { EMPLOYMENT_TYPES, SGK_STATUSES_KEY, parseSgkStatuses, sanitizeSgkStatuses } from '@/lib/hr';

/** Staff vocabulary: employment types and SGK status definitions. */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request, 'view', 'dashboard');
    if (auth.error) return auth.error;
    try {
        const row = await prisma.siteSetting.findUnique({ where: { key: SGK_STATUSES_KEY } });
        return NextResponse.json({ success: true, employmentTypes: EMPLOYMENT_TYPES, sgkStatuses: parseSgkStatuses(row?.value) });
    } catch (error) {
        return errorResponse(error, 'İK tanımları alınamadı');
    }
}

/** Body: { sgkStatuses: string[] } */
export async function PUT(request: NextRequest) {
    const auth = await requireAdmin(request, 'manage', 'settings');
    if (auth.error) return auth.error;
    try {
        const body = (await request.json()) as { sgkStatuses?: unknown };
        const list = sanitizeSgkStatuses(body.sgkStatuses);
        const before = await prisma.siteSetting.findUnique({ where: { key: SGK_STATUSES_KEY } });
        await prisma.siteSetting.upsert({
            where: { key: SGK_STATUSES_KEY },
            update: { value: JSON.stringify(list) },
            create: { key: SGK_STATUSES_KEY, value: JSON.stringify(list), group: 'HR', isPublic: false, description: 'SGK durum tanımları' },
        });
        await logAuditEvent({ actorId: auth.actor.id, actorEmail: auth.actor.email, actorName: auth.actor.name, action: 'SETTINGS_CHANGE', entityType: 'SiteSetting', entityId: SGK_STATUSES_KEY, oldValues: { value: before?.value }, newValues: { value: list } });
        return NextResponse.json({ success: true, sgkStatuses: list });
    } catch (error) {
        return errorResponse(error, 'İK tanımları kaydedilemedi');
    }
}
