import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FormSubmissionService } from '@/lib/services/form-submission-service';
import { requireAdmin, errorResponse } from '@/lib/api-guard';
import { sanitizeCsvCell } from '@/lib/sanitize';
import { logAuditEvent } from '@/lib/audit';
import { getFieldTypeMeta } from '@/lib/forms/schema';
import { versionToDefinition } from '@/lib/services/form-service';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const auth = await requireAdmin(request, 'view', 'forms');
    if (auth.error) return auth.error;
    try {
        const { id } = await params;
        const sp = request.nextUrl.searchParams;
        const filters = {
            formId: id,
            campaignId: sp.get('campaignId') || undefined,
            search: sp.get('search') || undefined,
            status: sp.get('status') || undefined,
            from: sp.get('from') ? new Date(String(sp.get('from'))) : undefined,
            to: sp.get('to') ? new Date(`${sp.get('to')}T23:59:59`) : undefined,
        };

        if (sp.get('export') === 'csv') {
            return exportCsv(id, filters, auth.actor);
        }

        const result = await FormSubmissionService.listSubmissions({
            ...filters,
            page: Number(sp.get('page') || 1),
            limit: Number(sp.get('limit') || 25),
        });
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return errorResponse(error, 'Gönderimler yüklenemedi');
    }
}

async function exportCsv(
    formId: string,
    filters: { campaignId?: string; search?: string; status?: string; from?: Date; to?: Date },
    actor: { id: string; name: string; email: string; ip?: string; userAgent?: string }
) {
    const form = await prisma.form.findUnique({
        where: { id: formId },
        include: { versions: { orderBy: { versionNumber: 'desc' }, include: { fields: { orderBy: { sortOrder: 'asc' } } } } },
    });
    if (!form) return NextResponse.json({ success: false, message: 'Form bulunamadı' }, { status: 404 });

    // Columns: union of all questions across versions (latest label wins), keyed by fieldKey
    const columns = new Map<string, string>();
    for (const version of [...form.versions].reverse()) {
        for (const f of versionToDefinition(version as never).fields) {
            if (!getFieldTypeMeta(String(f.fieldType)).isDisplayOnly) columns.set(f.fieldKey, f.label);
        }
    }

    const where: Record<string, unknown> = { OR: [{ formId }, { formVersion: { formId } }] };
    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) where.createdAt = { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) };

    const submissions = await prisma.submission.findMany({
        where,
        include: { answers: true, formVersion: { select: { versionNumber: true } }, application: { select: { applicationNumber: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10000,
    });

    const header = ['Gönderim No', 'Tarih', 'Versiyon', 'Durum', 'Başvuru No', 'Ad Soyad', 'E-posta', ...columns.values()];
    const rows = submissions.map((s) => {
        const byKey = new Map(s.answers.map((a) => [a.fieldKey, a.jsonValue ? (JSON.parse(a.jsonValue) as unknown[]).join('; ') : a.textValue ?? (a.numValue !== null ? String(a.numValue) : '')]));
        return [
            s.submissionNumber,
            s.createdAt.toISOString(),
            `v${s.formVersion.versionNumber}`,
            s.status,
            s.application?.applicationNumber || '',
            s.applicantName || '',
            s.applicantEmail || '',
            ...Array.from(columns.keys()).map((k) => byKey.get(k) || ''),
        ];
    });

    const csv = '﻿' + [header, ...rows].map((r) => r.map(sanitizeCsvCell).join(',')).join('\r\n');

    await logAuditEvent({
        actorId: actor.id,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'EXPORT',
        entityType: 'Form',
        entityId: formId,
        diff: `Form gönderimleri dışa aktarıldı: ${form.title} (${submissions.length} kayıt)`,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
    });

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${form.slug}-gonderimler.csv"`,
            'Cache-Control': 'no-store',
        },
    });
}
