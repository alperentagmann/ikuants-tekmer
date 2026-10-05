import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';

/**
 * Form placements: show a published Form Center form on another page in addition to its own.
 * Targets: a program detail page, the homepage, the supports page, the spaces page,
 * or a standalone shareable page (/formlar/[slug]).
 */
export const PLACEMENT_TARGETS = {
    PROGRAM_PAGE: { label: 'Program detay sayfası', needsTarget: true },
    HOMEPAGE: { label: 'Ana sayfa (form bloğu)', needsTarget: false },
    SUPPORTS_PAGE: { label: 'Destekler sayfası', needsTarget: false },
    SPACES_PAGE: { label: 'Kullanım alanları sayfası', needsTarget: false },
    STANDALONE: { label: 'Bağımsız form sayfası (/formlar/...)', needsTarget: false },
} as const;
export type PlacementTarget = keyof typeof PLACEMENT_TARGETS;

type Actor = { id: string; name: string; email: string };

export type PublicPlacement = { id: string; slug: string; title: string; description: string | null; themeKey: string };

export const FormPlacementService = {
    /** Active placements of published forms for a public target. */
    async forTarget(targetType: PlacementTarget, targetId?: string | null): Promise<PublicPlacement[]> {
        try {
            const rows = await prisma.formPlacement.findMany({
                where: { targetType, isActive: true, ...(targetId ? { targetId } : {}), form: { isPublished: true, isArchived: false } },
                include: { form: { select: { slug: true, title: true, description: true, theme: true } } },
                orderBy: { sortOrder: 'asc' },
            });
            return rows.map((r) => ({ id: r.id, slug: r.form.slug, title: r.title || r.form.title, description: r.description ?? r.form.description ?? null, themeKey: r.form.theme || 'site' }));
        } catch {
            return [];
        }
    },

    async listForForm(formId: string) {
        const rows = await prisma.formPlacement.findMany({ where: { formId }, orderBy: [{ targetType: 'asc' }, { sortOrder: 'asc' }] });
        const programIds = rows.filter((r) => r.targetType === 'PROGRAM_PAGE' && r.targetId).map((r) => r.targetId as string);
        const programs = programIds.length ? await prisma.program.findMany({ where: { id: { in: programIds } }, select: { id: true, name: true, slug: true } }) : [];
        const form = await prisma.form.findUnique({ where: { id: formId }, select: { slug: true } });
        return rows.map((r) => {
            const program = programs.find((p) => p.id === r.targetId);
            const href =
                r.targetType === 'PROGRAM_PAGE' ? (program ? `/programlar/${program.slug}` : null)
                : r.targetType === 'HOMEPAGE' ? '/'
                : r.targetType === 'SUPPORTS_PAGE' ? '/destekler'
                : r.targetType === 'SPACES_PAGE' ? '/kullanim-alanlari'
                : form ? `/formlar/${form.slug}` : null;
            return { ...r, targetLabel: PLACEMENT_TARGETS[r.targetType as PlacementTarget]?.label || r.targetType, targetName: program?.name || null, href };
        });
    },

    async create(formId: string, input: { targetType: string; targetId?: string | null; title?: string | null; description?: string | null }, actor: Actor) {
        const target = PLACEMENT_TARGETS[input.targetType as PlacementTarget];
        if (!target) throw new DomainError('Geçersiz yerleşim hedefi.');
        const form = await prisma.form.findUnique({ where: { id: formId } });
        if (!form) throw new DomainError('Form bulunamadı.', 404);
        if (target.needsTarget) {
            if (!input.targetId) throw new DomainError('Hedef program seçin.');
            if (!(await prisma.program.findUnique({ where: { id: input.targetId } }))) throw new DomainError('Program bulunamadı.', 404);
        }
        const exists = await prisma.formPlacement.findFirst({ where: { formId, targetType: input.targetType, targetId: target.needsTarget ? input.targetId : null } });
        if (exists) throw new DomainError('Form bu konuma zaten eklenmiş.', 409);
        const placement = await prisma.formPlacement.create({
            data: { formId, targetType: input.targetType, targetId: target.needsTarget ? input.targetId : null, title: input.title?.trim() || null, description: input.description?.trim() || null, createdById: actor.id },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'CREATE', entityType: 'FormPlacement', entityId: placement.id, newValues: { formId, targetType: placement.targetType, targetId: placement.targetId } });
        return placement;
    },

    async update(id: string, input: { isActive?: boolean; title?: string | null; description?: string | null; sortOrder?: number }, actor: Actor) {
        const placement = await prisma.formPlacement.update({
            where: { id },
            data: {
                ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
                ...(input.title !== undefined ? { title: input.title?.trim() || null } : {}),
                ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
                ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
            },
        });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'UPDATE', entityType: 'FormPlacement', entityId: id, newValues: input });
        return placement;
    },

    async remove(id: string, actor: Actor) {
        const placement = await prisma.formPlacement.delete({ where: { id } });
        await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'DELETE', entityType: 'FormPlacement', entityId: id, oldValues: { formId: placement.formId, targetType: placement.targetType, targetId: placement.targetId } });
    },
};
