import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';

/**
 * Optional 3D (GLB/glTF) or 360° panorama experience per facility. Only real assets
 * uploaded by admins are shown; without an asset the public site keeps its normal view.
 */
export interface HotspotInput {
    id?: string;
    title: string;
    description?: string | null;
    hotspotType?: string;
    position: string;
    normal?: string | null;
    linkUrl?: string | null;
    isActive?: boolean;
}

export interface ExperienceInput {
    isEnabled?: boolean;
    isPublic?: boolean;
    mode?: 'MODEL' | 'PANORAMA';
    modelUrl?: string | null;
    modelMediaId?: string | null;
    panoramaUrl?: string | null;
    panoramaMediaId?: string | null;
    posterUrl?: string | null;
    posterMediaId?: string | null;
    altText?: string | null;
    description?: string | null;
    cameraOrbit?: string | null;
    cameraTarget?: string | null;
    autoRotate?: boolean;
    hotspots?: HotspotInput[];
}

const SAFE_URL = /^(\/[\w\-./%]+|https:\/\/[^\s"'<>]+)$/;
const POSITION = /^-?\d+(\.\d+)?m? -?\d+(\.\d+)?m? -?\d+(\.\d+)?m?$/;

function checkUrl(value: string | null | undefined, label: string) {
    if (value && !SAFE_URL.test(value)) throw new DomainError(`${label} geçerli bir dosya adresi değil.`);
}

export const FacilityExperienceService = {
    async get(facilityId: string) {
        return prisma.facilityExperience.findUnique({ where: { facilityId }, include: { hotspots: { orderBy: { sortOrder: 'asc' } } } });
    },

    /** Public view: only enabled, public experiences that have a real asset. */
    async getPublic(facilityId: string) {
        const exp = await prisma.facilityExperience.findUnique({
            where: { facilityId },
            include: { hotspots: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }, facility: { select: { isActive: true } } },
        });
        if (!exp || !exp.isEnabled || !exp.isPublic || !exp.facility.isActive) return null;
        const asset = exp.mode === 'PANORAMA' ? exp.panoramaUrl : exp.modelUrl;
        if (!asset) return null;
        return {
            mode: exp.mode,
            modelUrl: exp.mode === 'MODEL' ? exp.modelUrl : null,
            panoramaUrl: exp.mode === 'PANORAMA' ? exp.panoramaUrl : null,
            posterUrl: exp.posterUrl,
            altText: exp.altText,
            description: exp.description,
            cameraOrbit: exp.cameraOrbit,
            cameraTarget: exp.cameraTarget,
            autoRotate: exp.autoRotate,
            hotspots: exp.hotspots.map((h) => ({ id: h.id, title: h.title, description: h.description, hotspotType: h.hotspotType, position: h.position, normal: h.normal, linkUrl: h.linkUrl })),
        };
    },

    async publicFacilityIds(): Promise<Set<string>> {
        const rows = await prisma.facilityExperience.findMany({
            where: { isEnabled: true, isPublic: true, OR: [{ mode: 'MODEL', modelUrl: { not: null } }, { mode: 'PANORAMA', panoramaUrl: { not: null } }] },
            select: { facilityId: true },
        });
        return new Set(rows.map((r) => r.facilityId));
    },

    async save(facilityId: string, input: ExperienceInput, actor: { id: string; name: string; email: string }) {
        const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
        if (!facility) throw new DomainError('Alan bulunamadı.', 404);
        checkUrl(input.modelUrl, '3D model');
        checkUrl(input.panoramaUrl, '360° panorama');
        checkUrl(input.posterUrl, 'Kapak görseli');
        if (input.modelUrl && !/\.(glb|gltf)(\?|$)/i.test(input.modelUrl) && !input.modelUrl.startsWith('/api/admin/media/')) {
            throw new DomainError('3D model GLB veya glTF olmalıdır.');
        }
        const mode = input.mode === 'PANORAMA' ? 'PANORAMA' : 'MODEL';
        const hasAsset = mode === 'PANORAMA' ? Boolean(input.panoramaUrl) : Boolean(input.modelUrl);
        if (input.isEnabled && !hasAsset) throw new DomainError('Etkinleştirmek için önce gerçek bir 3D model veya 360° görsel yükleyin.');
        if (input.isPublic && !input.altText?.trim()) throw new DomainError('Public yayın için erişilebilirlik metni (alt metin) girin.');
        for (const h of input.hotspots || []) {
            if (!h.title?.trim()) throw new DomainError('Her işaretin bir başlığı olmalı.');
            if (!POSITION.test(h.position.trim())) throw new DomainError(`"${h.title}" işaretinin konumu "x y z" biçiminde olmalı (örn. 0.5m 1.2m -0.3m).`);
            checkUrl(h.linkUrl, `"${h.title}" bağlantısı`);
        }

        const data = {
            isEnabled: input.isEnabled === true,
            isPublic: input.isPublic === true,
            mode,
            modelUrl: input.modelUrl || null,
            modelMediaId: input.modelMediaId || null,
            panoramaUrl: input.panoramaUrl || null,
            panoramaMediaId: input.panoramaMediaId || null,
            posterUrl: input.posterUrl || null,
            posterMediaId: input.posterMediaId || null,
            altText: input.altText || null,
            description: input.description || null,
            cameraOrbit: input.cameraOrbit || null,
            cameraTarget: input.cameraTarget || null,
            autoRotate: input.autoRotate === true,
        };

        const experience = await prisma.$transaction(async (tx) => {
            const exp = await tx.facilityExperience.upsert({ where: { facilityId }, create: { facilityId, ...data }, update: data });
            if (input.hotspots) {
                const keep = input.hotspots.filter((h) => h.id).map((h) => h.id as string);
                await tx.facilityHotspot.deleteMany({ where: { experienceId: exp.id, id: { notIn: keep } } });
                for (const [i, h] of input.hotspots.entries()) {
                    const row = { title: h.title.trim(), description: h.description || null, hotspotType: h.hotspotType || 'INFO', position: h.position.trim(), normal: h.normal || null, linkUrl: h.linkUrl || null, sortOrder: i, isActive: h.isActive !== false };
                    if (h.id) await tx.facilityHotspot.update({ where: { id: h.id }, data: row });
                    else await tx.facilityHotspot.create({ data: { ...row, experienceId: exp.id } });
                }
            }
            return exp;
        });

        await logAuditEvent({
            actorId: actor.id,
            actorEmail: actor.email,
            actorName: actor.name,
            action: 'UPDATE',
            entityType: 'FacilityExperience',
            entityId: experience.id,
            newValues: { facilityId, isEnabled: data.isEnabled, isPublic: data.isPublic, mode, hasAsset, hotspots: input.hotspots?.length ?? undefined },
        });
        return FacilityExperienceService.get(facilityId);
    },
};
