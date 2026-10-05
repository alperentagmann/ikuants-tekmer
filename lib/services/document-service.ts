import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { uploadFile } from '@/lib/storage';

/** Entities a document can be attached to, with the admin page that shows them. */
export const DOCUMENT_ENTITIES: Record<string, { label: string; href: (id: string) => string; resolve: (id: string) => Promise<string | null> }> = {
    Person: { label: 'Kişi', href: (id) => `/admin/rehber?personId=${id}`, resolve: async (id) => (await prisma.person.findUnique({ where: { id }, select: { fullName: true } }))?.fullName ?? null },
    Organization: { label: 'Kurum', href: (id) => `/admin/rehber?organizationId=${id}`, resolve: async (id) => (await prisma.organization.findUnique({ where: { id }, select: { name: true } }))?.name ?? null },
    Entrepreneur: { label: 'Girişim', href: (id) => `/admin/girisimciler/${id}`, resolve: async (id) => (await prisma.entrepreneur.findUnique({ where: { id }, select: { name: true } }))?.name ?? null },
    Program: { label: 'Program', href: () => '/admin/programlar', resolve: async (id) => (await prisma.program.findUnique({ where: { id }, select: { name: true } }))?.name ?? null },
    Application: { label: 'Başvuru', href: (id) => `/admin/basvurular/${id}`, resolve: async (id) => (await prisma.application.findUnique({ where: { id }, select: { applicationNumber: true } }))?.applicationNumber ?? null },
    Project: { label: 'Proje', href: () => '/admin/projeler', resolve: async (id) => (await prisma.project.findUnique({ where: { id }, select: { title: true } }))?.title ?? null },
    RentContract: { label: 'Kira sözleşmesi', href: () => '/admin/finans/kiralar', resolve: async (id) => (await prisma.rentContract.findUnique({ where: { id }, select: { contractNo: true } }))?.contractNo ?? null },
    InvoiceRecord: { label: 'Fatura', href: () => '/admin/finans/faturalar', resolve: async (id) => (await prisma.invoiceRecord.findUnique({ where: { id }, select: { invoiceNumber: true } }))?.invoiceNumber ?? null },
    Facility: { label: 'Alan', href: () => '/admin/alanlar', resolve: async (id) => (await prisma.facility.findUnique({ where: { id }, select: { title: true } }))?.title ?? null },
    Submission: { label: 'Form gönderimi', href: () => '/admin/form-builder', resolve: async (id) => (await prisma.submission.findUnique({ where: { id }, select: { submissionNumber: true } }))?.submissionNumber ?? null },
};

export const DOCUMENT_CATEGORIES = [
    { value: 'GENERAL', label: 'Genel' },
    { value: 'CONTRACT', label: 'Sözleşme' },
    { value: 'INVOICE', label: 'Fatura' },
    { value: 'APPLICATION', label: 'Başvuru belgesi' },
    { value: 'IDENTITY', label: 'Kimlik / resmi belge' },
    { value: 'FINANCIAL', label: 'Finansal' },
    { value: 'LEGAL', label: 'Hukuki' },
    { value: 'PRESENTATION', label: 'Sunum' },
    { value: 'REPORT', label: 'Rapor' },
    { value: 'OTHER', label: 'Diğer' },
];

type Actor = { id: string; name: string; email: string };

export const DocumentService = {
    async list(params: { entityType?: string; entityId?: string; category?: string; search?: string; includeRestricted: boolean; includeArchived?: boolean; page?: number; limit?: number }) {
        const where: Record<string, unknown> = {};
        if (!params.includeArchived) where.isArchived = false;
        if (!params.includeRestricted) where.visibility = 'INTERNAL';
        if (params.entityType) where.entityType = params.entityType;
        if (params.entityId) where.entityId = params.entityId;
        if (params.category) where.category = params.category;
        if (params.search) where.OR = [{ title: { contains: params.search, mode: 'insensitive' } }, { media: { originalName: { contains: params.search, mode: 'insensitive' } } }];
        const limit = Math.min(100, params.limit || 25);
        const page = Math.max(1, params.page || 1);
        const [items, total] = await Promise.all([
            prisma.document.findMany({
                where,
                include: { media: { select: { id: true, originalName: true, mimeType: true, fileSize: true, publicUrl: true, isPrivate: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.document.count({ where }),
        ]);
        const uploaderIds = Array.from(new Set(items.map((d) => d.uploadedById).filter(Boolean))) as string[];
        const uploaders = uploaderIds.length ? await prisma.user.findMany({ where: { id: { in: uploaderIds } }, select: { id: true, name: true } }) : [];
        const enriched = await Promise.all(
            items.map(async (d) => {
                const entity = DOCUMENT_ENTITIES[d.entityType];
                return {
                    ...d,
                    entityLabel: entity ? `${entity.label}: ${(await entity.resolve(d.entityId)) || 'kayıt bulunamadı'}` : d.entityType,
                    entityHref: entity ? entity.href(d.entityId) : null,
                    uploadedBy: uploaders.find((u) => u.id === d.uploadedById)?.name || null,
                };
            })
        );
        return { items: enriched, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
    },

    async upload(params: { file: File; title: string; description?: string | null; category: string; entityType: string; entityId: string; visibility: string }, actor: Actor) {
        const entity = DOCUMENT_ENTITIES[params.entityType];
        if (!entity) throw new DomainError('Geçersiz kayıt türü.');
        const exists = await entity.resolve(params.entityId);
        if (!exists) throw new DomainError('Bağlanacak kayıt bulunamadı.', 404);
        if (!DOCUMENT_CATEGORIES.some((c) => c.value === params.category)) throw new DomainError('Geçersiz kategori.');

        const { media } = await uploadFile({
            fileName: params.file.name,
            buffer: Buffer.from(await params.file.arrayBuffer()),
            mimeType: params.file.type || 'application/octet-stream',
            folder: 'documents',
            isPrivate: true,
            category: 'any',
            uploadedById: actor.id,
        });
        const doc = await prisma.document.create({
            data: {
                title: params.title.trim() || params.file.name,
                description: params.description || null,
                category: params.category,
                mediaId: media.id,
                entityType: params.entityType,
                entityId: params.entityId,
                visibility: params.visibility === 'RESTRICTED' ? 'RESTRICTED' : 'INTERNAL',
                uploadedById: actor.id,
            },
        });
        await prisma.activityTimeline.create({
            data: { entityType: params.entityType, entityId: params.entityId, title: 'Doküman eklendi', description: doc.title, eventType: 'FILE_UPLOADED', actorId: actor.id, actorName: actor.name },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'Document', entityId: doc.id, newValues: { title: doc.title, entityType: doc.entityType, entityId: doc.entityId, visibility: doc.visibility } });
        return { document: doc, entityHref: entity.href(params.entityId) };
    },

    async setArchived(id: string, isArchived: boolean, actor: Actor) {
        const doc = await prisma.document.update({ where: { id }, data: { isArchived } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: isArchived ? 'ARCHIVE' : 'RESTORE', entityType: 'Document', entityId: id, diff: doc.title });
        return doc;
    },
};
