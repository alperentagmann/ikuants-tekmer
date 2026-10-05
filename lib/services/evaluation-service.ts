import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { addTimelineEvent } from '@/lib/timeline';
import { DomainError } from '@/lib/errors';

type Actor = { id: string; name: string; email: string; ip?: string; userAgent?: string };

export interface CriterionInput {
    id?: string;
    name: string;
    description?: string | null;
    maxScore?: number;
    weight?: number;
}

/** Weighted score normalized to 0–100. */
export function computeTotalScore(scores: { score: number; criterion: { maxScore: number; weight: number } }[]): number {
    const totalWeight = scores.reduce((s, x) => s + x.criterion.weight, 0);
    if (totalWeight <= 0) return 0;
    const weighted = scores.reduce((s, x) => s + (Math.min(x.score, x.criterion.maxScore) / x.criterion.maxScore) * x.criterion.weight, 0);
    return Math.round((weighted / totalWeight) * 1000) / 10;
}

export const EvaluationService = {
    async listTemplates() {
        return prisma.evaluationTemplate.findMany({
            where: { isActive: true },
            include: {
                criteria: { orderBy: { sortOrder: 'asc' } },
                campaigns: { select: { id: true, name: true, applicationType: true } },
                _count: { select: { evaluations: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    async saveTemplate(params: { id?: string; name: string; description?: string | null; criteria: CriterionInput[] }, actor: Actor) {
        if (!params.name?.trim()) throw new DomainError('Şablon adı zorunludur.');
        const criteria = params.criteria.filter((c) => c.name?.trim());
        if (criteria.length === 0) throw new DomainError('En az bir değerlendirme kriteri ekleyin.');
        for (const c of criteria) {
            if ((c.maxScore ?? 10) < 1 || (c.maxScore ?? 10) > 100) throw new DomainError(`"${c.name}" için en yüksek puan 1–100 arasında olmalı.`);
            if ((c.weight ?? 1) <= 0) throw new DomainError(`"${c.name}" için ağırlık sıfırdan büyük olmalı.`);
        }

        const template = await prisma.$transaction(async (tx) => {
            const t = params.id
                ? await tx.evaluationTemplate.update({ where: { id: params.id }, data: { name: params.name.trim(), description: params.description || null } })
                : await tx.evaluationTemplate.create({ data: { name: params.name.trim(), description: params.description || null } });

            if (params.id) {
                const existing = await tx.evaluationCriterion.findMany({ where: { templateId: t.id }, include: { _count: { select: { scores: true } } } });
                const keepIds = new Set(criteria.map((c) => c.id).filter(Boolean));
                for (const c of existing) {
                    if (!keepIds.has(c.id)) {
                        if (c._count.scores > 0) {
                            throw new DomainError(`"${c.name}" kriteriyle verilmiş puanlar var; geçmiş değerlendirmeler korunduğu için silinemez.`);
                        }
                        await tx.evaluationCriterion.delete({ where: { id: c.id } });
                    }
                }
            }

            for (const [index, c] of criteria.entries()) {
                const data = { name: c.name.trim(), description: c.description || null, maxScore: c.maxScore ?? 10, weight: c.weight ?? 1, sortOrder: index };
                if (c.id) await tx.evaluationCriterion.update({ where: { id: c.id }, data });
                else await tx.evaluationCriterion.create({ data: { ...data, templateId: t.id } });
            }
            return t;
        });

        await logAuditEvent({
            actorId: actor.id,
            actorEmail: actor.email,
            actorName: actor.name,
            action: params.id ? 'UPDATE' : 'CREATE',
            entityType: 'EvaluationTemplate',
            entityId: template.id,
            diff: `Değerlendirme şablonu kaydedildi: ${template.name} (${criteria.length} kriter)`,
            ipAddress: actor.ip,
            userAgent: actor.userAgent,
        });
        return template;
    },

    async getApplicationEvaluations(applicationId: string) {
        const app = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { campaign: { include: { evaluationTemplate: { include: { criteria: { orderBy: { sortOrder: 'asc' } } } } } } },
        });
        if (!app) throw new DomainError('Başvuru bulunamadı.', 404);
        const evaluations = await prisma.evaluation.findMany({
            where: { applicationId },
            include: { evaluator: { select: { id: true, name: true } }, scores: true },
            orderBy: { updatedAt: 'desc' },
        });
        const completed = evaluations.filter((e) => e.isCompleted);
        return {
            template: app.campaign?.evaluationTemplate || null,
            evaluations,
            averageScore: completed.length ? Math.round((completed.reduce((s, e) => s + e.totalScore, 0) / completed.length) * 10) / 10 : null,
        };
    },

    /** Creates or updates the current user's evaluation using the campaign's own template. */
    async submitEvaluation(params: { applicationId: string; scores: { criterionId: string; score: number; comment?: string | null }[]; finalComment?: string | null; isCompleted: boolean; actor: Actor }) {
        const app = await prisma.application.findUnique({
            where: { id: params.applicationId },
            include: { campaign: { include: { evaluationTemplate: { include: { criteria: true } } } } },
        });
        if (!app) throw new DomainError('Başvuru bulunamadı.', 404);
        const template = app.campaign?.evaluationTemplate;
        if (!template) throw new DomainError('Bu başvurunun kampanyasına değerlendirme şablonu bağlanmamış. Kampanya ayarlarından bir şablon seçin.');

        const criteriaById = new Map(template.criteria.map((c) => [c.id, c]));
        for (const s of params.scores) {
            const c = criteriaById.get(s.criterionId);
            if (!c) throw new DomainError('Geçersiz değerlendirme kriteri.');
            if (!Number.isFinite(s.score) || s.score < 0 || s.score > c.maxScore) throw new DomainError(`"${c.name}" puanı 0–${c.maxScore} arasında olmalı.`);
        }
        if (params.isCompleted && params.scores.length < template.criteria.length) {
            throw new DomainError('Tamamlamak için tüm kriterleri puanlayın.');
        }

        const totalScore = computeTotalScore(params.scores.map((s) => ({ score: s.score, criterion: criteriaById.get(s.criterionId)! })));

        const evaluation = await prisma.$transaction(async (tx) => {
            const ev = await tx.evaluation.upsert({
                where: { applicationId_evaluatorId: { applicationId: app.id, evaluatorId: params.actor.id } },
                create: { applicationId: app.id, templateId: template.id, evaluatorId: params.actor.id, totalScore, finalComment: params.finalComment || null, isCompleted: params.isCompleted },
                update: { totalScore, finalComment: params.finalComment || null, isCompleted: params.isCompleted },
            });
            for (const s of params.scores) {
                await tx.evaluationScore.upsert({
                    where: { evaluationId_criterionId: { evaluationId: ev.id, criterionId: s.criterionId } },
                    create: { evaluationId: ev.id, criterionId: s.criterionId, score: s.score, comment: s.comment || null },
                    update: { score: s.score, comment: s.comment || null },
                });
            }
            return ev;
        });

        await addTimelineEvent({
            entityType: 'Application',
            entityId: app.id,
            title: params.isCompleted ? 'Değerlendirme tamamlandı' : 'Değerlendirme taslağı kaydedildi',
            description: `${params.actor.name}: ${totalScore} / 100`,
            eventType: 'EVALUATION_SCORED',
            actorId: params.actor.id,
            actorName: params.actor.name,
        });
        await logAuditEvent({
            actorId: params.actor.id,
            actorEmail: params.actor.email,
            actorName: params.actor.name,
            action: 'UPDATE',
            entityType: 'Evaluation',
            entityId: evaluation.id,
            newValues: { totalScore, isCompleted: params.isCompleted },
        });
        return evaluation;
    },
};
