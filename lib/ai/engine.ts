import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';
import { DomainError } from '@/lib/errors';
import { AI_ACTIONS } from './registry';
import { interpret } from './interpreter';
import { interpretWithModel, getAiProviderStatus } from './provider';
import { isMutation, type AiActionDefinition, type AiActor, type AiContext, type ResultCard, type EntityRef, type RiskLevel } from './types';

/**
 * AI execution engine: interpret → permission check → (read: run now) / (mutation: preview,
 * store a pending change set, wait for explicit confirmation) → execute → verify → audit → undo.
 * Every step re-checks permissions server-side; nothing the client sends is trusted as a plan.
 */

const CONFIRMATION_TTL_MS = 30 * 60 * 1000;

export type EngineResponse =
    | { type: 'result'; actionId: string; card: ResultCard; entity?: EntityRef | null }
    | { type: 'confirm'; actionId: string; actionName: string; changeSetId: string; risk: RiskLevel; undoable: boolean; preview: ResultCard }
    | { type: 'executed'; actionId: string; changeSetId: string; card: ResultCard; entity?: EntityRef | null; undoable: boolean; verified: boolean }
    | { type: 'clarify'; message: string; suggestions?: string[] }
    | { type: 'denied'; message: string }
    | { type: 'help'; message: string; suggestions: string[] };

const INJECTION_PATTERNS = [
    /ignore (all |the )?(previous|above) (instructions|rules)/i,
    /önceki (tüm )?(talimat|kural)lar[ıi]? (yok say|unut)/i,
    /\b(drop|truncate|alter)\s+table\b/i,
    /\$executeRaw|\$queryRaw|rm\s+-rf|;\s*--/i,
    /sistem (prompt|talimat)[ıi]n[ıi] (göster|yaz)/i,
    /(tüm|bütün) (verileri|kayıtları|kullanıcıları) sil/i,
];

export const SUGGESTIONS = [
    'Bugünkü işlerim',
    'Bekleyen program başvuruları',
    'Bekleyen TEKMER yer edinme başvuruları',
    'Geciken kiraları göster',
    '30 gün içinde bitecek sözleşmeler',
    '3D modeli olmayan alanlar',
    'Yarın 14:00–16:00 arasında 8 kişi için hangi alanlar müsait?',
    'ANTSPARK formundaki soruları göster',
    'Program ve TEKMER formlarının farklarını göster',
    'Programı olmayan girişimler',
];

export function listActionsFor(actor: AiActor) {
    return Object.values(AI_ACTIONS)
        .filter((a) => hasPermission(actor, a.permission[0], a.permission[1]))
        .map((a) => ({ id: a.id, name: a.name, description: a.description, domain: a.domain, kind: a.kind, risk: a.risk, examples: a.examples, undoable: Boolean(a.undo) }));
}

function requireAiAccess(actor: AiActor) {
    if (!hasPermission(actor, 'use', 'ai')) throw new DomainError('AI Komuta Merkezi\'ni kullanma yetkiniz yok.', 403);
}

function permissionMessage(def: AiActionDefinition<never>): string | null {
    return `"${def.name}" işlemi için yetkiniz yok (${def.permission[1]}:${def.permission[0]}).`;
}

function canRun(def: AiActionDefinition<never>, actor: AiActor): string | null {
    if (!hasPermission(actor, def.permission[0], def.permission[1])) return permissionMessage(def);
    if ((def.risk === 'HIGH' || def.risk === 'CRITICAL') && isMutation(def) && !hasPermission(actor, 'high_risk_action', 'ai')) {
        return `"${def.name}" yüksek riskli bir işlemdir; AI ile çalıştırmak için "ai:high_risk_action" yetkisi gerekir. İşlemi ilgili ekrandan yapabilirsiniz.`;
    }
    return null;
}

function parseInput(def: AiActionDefinition<never>, input: unknown): never {
    const parsed = def.input.safeParse(input);
    if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `${i.path.join('.') || 'girdi'}: ${i.message}`).join('; ');
        throw new DomainError(`Komut anlaşıldı ancak bilgiler eksik veya geçersiz (${issues}).`);
    }
    return parsed.data as never;
}

async function audit(actor: AiActor, action: string, def: AiActionDefinition<never>, changeSetId: string, details: Record<string, unknown>) {
    await logAuditEvent({
        actorId: actor.id,
        actorEmail: actor.email,
        actorName: actor.name,
        action,
        entityType: 'AiChangeSet',
        entityId: changeSetId,
        newValues: { source: 'AI', aiActionId: def.id, risk: def.risk, ...details },
        diff: `AI: ${def.name}`,
    });
}

export const AiEngine = {
    providerStatus: getAiProviderStatus,

    /** Interprets a prompt and runs reads immediately or prepares a mutation for confirmation. */
    async handlePrompt(prompt: string, actor: AiActor, context: AiContext = {}): Promise<EngineResponse> {
        requireAiAccess(actor);
        const text = prompt.trim().slice(0, 4000);
        if (!text) return { type: 'help', message: 'Ne yapmak istediğinizi yazın.', suggestions: SUGGESTIONS };
        if (INJECTION_PATTERNS.some((p) => p.test(text))) {
            await logAuditEvent({ actorId: actor.id, actorEmail: actor.email, actorName: actor.name, action: 'AI_BLOCKED', entityType: 'AiCommand', diff: 'Güvenlik kuralına takılan AI komutu engellendi' });
            return { type: 'denied', message: 'Bu komut güvenlik kuralları nedeniyle çalıştırılamaz. AI yalnızca tanımlı kurum işlemlerini yapabilir.' };
        }

        let plan = await interpret(text, context);
        if (plan.kind === 'none') {
            const allowed = Object.values(AI_ACTIONS).filter((a) => hasPermission(actor, a.permission[0], a.permission[1]));
            plan = (await interpretWithModel(text, context, allowed)) || plan;
        }
        if (plan.kind === 'clarify') return { type: 'clarify', message: plan.message, suggestions: plan.suggestions };
        if (plan.kind === 'none') {
            const provider = getAiProviderStatus();
            return {
                type: 'help',
                message: provider.configured
                    ? 'Bu isteği tanımlı bir işleme eşleyemedim. Aşağıdaki örneklerden birini deneyin veya isteği daha açık yazın.'
                    : 'Bu isteği tanımlı bir işleme eşleyemedim. (Dil modeli sağlayıcısı yapılandırılmadığı için yalnızca tanımlı Türkçe komutlar anlaşılır.)',
                suggestions: SUGGESTIONS,
            };
        }

        const def = AI_ACTIONS[plan.actionId];
        if (!def) return { type: 'help', message: 'Tanımlı olmayan işlem.', suggestions: SUGGESTIONS };
        const denied = canRun(def, actor);
        if (denied) return { type: 'denied', message: denied };
        const input = parseInput(def, plan.input);
        const ctx = { actor, context };

        if (!isMutation(def)) {
            const result = await def.execute(input, ctx);
            return { type: 'result', actionId: def.id, card: result.card, entity: result.entity };
        }

        const preview = def.preview ? await def.preview(input, ctx) : { title: def.name, status: 'info' as const };
        const changeSet = await prisma.aiChangeSet.create({
            data: {
                userId: actor.id,
                userEmail: actor.email,
                userName: actor.name,
                requestPrompt: text,
                intent: def.id,
                riskLevel: def.risk,
                actionsJson: JSON.stringify({ actionId: def.id, input, context }),
                summary: preview.title,
                status: 'PENDING_CONFIRMATION',
            },
        });
        return { type: 'confirm', actionId: def.id, actionName: def.name, changeSetId: changeSet.id, risk: def.risk, undoable: Boolean(def.undo), preview };
    },

    /** Executes a previously prepared plan after explicit user confirmation. */
    async confirm(changeSetId: string, actor: AiActor): Promise<EngineResponse> {
        requireAiAccess(actor);
        const cs = await prisma.aiChangeSet.findUnique({ where: { id: changeSetId } });
        if (!cs || cs.userId !== actor.id) throw new DomainError('Onay bekleyen işlem bulunamadı.', 404);
        if (cs.status !== 'PENDING_CONFIRMATION') throw new DomainError('Bu işlem zaten işlendi veya iptal edildi.', 409);
        if (Date.now() - cs.createdAt.getTime() > CONFIRMATION_TTL_MS) {
            await prisma.aiChangeSet.update({ where: { id: cs.id }, data: { status: 'EXPIRED' } });
            throw new DomainError('Onay süresi doldu. Komutu yeniden verin.', 409);
        }
        const stored = JSON.parse(cs.actionsJson) as { actionId: string; input: unknown; context: AiContext };
        const def = AI_ACTIONS[stored.actionId];
        if (!def) throw new DomainError('İşlem tanımı bulunamadı.');
        const denied = canRun(def, actor);
        if (denied) throw new DomainError(denied, 403);
        const input = parseInput(def, stored.input);

        // Claim the change set atomically so a double click cannot execute twice
        const claimed = await prisma.aiChangeSet.updateMany({ where: { id: cs.id, status: 'PENDING_CONFIRMATION' }, data: { status: 'EXECUTING' } });
        if (claimed.count !== 1) throw new DomainError('Bu işlem zaten çalıştırılıyor.', 409);

        const ctx = { actor, context: stored.context || {} };
        try {
            const result = await def.execute(input, ctx);
            const verified = def.verify ? await def.verify(result, ctx) : true;
            await prisma.aiChangeSet.update({
                where: { id: cs.id },
                data: {
                    status: verified ? 'COMPLETED' : 'FAILED',
                    actionsJson: JSON.stringify({ actionId: def.id, input, context: stored.context, undo: result.undo || null, entity: result.entity || null }),
                    beforeState: result.before !== undefined ? JSON.stringify(result.before) : null,
                    afterState: result.after !== undefined ? JSON.stringify(result.after) : null,
                    summary: result.card.title,
                    executedAt: new Date(),
                    rollbackStatus: def.undo && result.undo ? 'NOT_ROLLED_BACK' : null,
                },
            });
            await audit(actor, 'AI_EXECUTE', def, cs.id, { verified, entity: result.entity || null });
            if (!verified) {
                return { type: 'executed', actionId: def.id, changeSetId: cs.id, verified: false, undoable: false, card: { ...result.card, title: 'İşlem doğrulanamadı', status: 'warning', summary: 'İşlem çalıştı ancak veritabanında doğrulanamadı. Lütfen ilgili kaydı kontrol edin.' } };
            }
            return { type: 'executed', actionId: def.id, changeSetId: cs.id, card: result.card, entity: result.entity, undoable: Boolean(def.undo && result.undo), verified: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
            await prisma.aiChangeSet.update({ where: { id: cs.id }, data: { status: 'FAILED', rollbackError: message.slice(0, 1000) } });
            await audit(actor, 'AI_EXECUTE_FAILED', def, cs.id, { error: message.slice(0, 300) });
            throw error instanceof DomainError ? error : new DomainError(`İşlem tamamlanamadı: ${message}`);
        }
    },

    async cancel(changeSetId: string, actor: AiActor) {
        const res = await prisma.aiChangeSet.updateMany({ where: { id: changeSetId, userId: actor.id, status: 'PENDING_CONFIRMATION' }, data: { status: 'CANCELLED' } });
        if (res.count !== 1) throw new DomainError('İptal edilecek işlem bulunamadı.', 404);
        return { success: true };
    },

    /** Runs the compensating action for a completed change set. */
    async undo(changeSetId: string, actor: AiActor): Promise<{ success: boolean; message: string }> {
        requireAiAccess(actor);
        const cs = await prisma.aiChangeSet.findUnique({ where: { id: changeSetId } });
        if (!cs || (cs.userId !== actor.id && !actor.isSuperAdmin)) throw new DomainError('İşlem kaydı bulunamadı.', 404);
        if (cs.status === 'ROLLED_BACK') throw new DomainError('Bu işlem zaten geri alınmış.', 409);
        if (cs.status !== 'COMPLETED') throw new DomainError('Yalnızca tamamlanmış işlemler geri alınabilir.', 409);
        const stored = JSON.parse(cs.actionsJson) as { actionId?: string; undo?: Record<string, unknown> | null; context?: AiContext };
        const def = AI_ACTIONS[stored.actionId || cs.intent];
        if (!def?.undo || !stored.undo) throw new DomainError('Bu işlem geri alınamaz (finansal veya geri dönüşsüz işlem). İlgili ekrandan düzeltme yapın.', 409);
        const denied = canRun(def, actor);
        if (denied) throw new DomainError(denied, 403);
        try {
            const message = await def.undo(stored.undo, { actor, context: stored.context || {} });
            await prisma.aiChangeSet.update({ where: { id: cs.id }, data: { status: 'ROLLED_BACK', rollbackStatus: 'ROLLED_BACK', rolledBackAt: new Date() } });
            await audit(actor, 'AI_UNDO', def, cs.id, {});
            return { success: true, message };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
            await prisma.aiChangeSet.update({ where: { id: cs.id }, data: { rollbackStatus: 'ROLLBACK_FAILED', rollbackError: message.slice(0, 1000) } });
            throw error instanceof DomainError ? error : new DomainError(`Geri alma başarısız: ${message}`);
        }
    },

    async history(actor: AiActor, limit = 50) {
        const items = await prisma.aiChangeSet.findMany({
            where: actor.isSuperAdmin && hasPermission(actor, 'view', 'audit_logs') ? {} : { userId: actor.id },
            orderBy: { createdAt: 'desc' },
            take: Math.min(200, limit),
        });
        return items.map((i) => {
            let undoable = false;
            try {
                const stored = JSON.parse(i.actionsJson) as { undo?: unknown };
                undoable = i.status === 'COMPLETED' && Boolean(stored.undo) && Boolean(AI_ACTIONS[i.intent]?.undo);
            } catch {
                undoable = false;
            }
            return { id: i.id, prompt: i.requestPrompt, intent: i.intent, actionName: AI_ACTIONS[i.intent]?.name || i.intent, risk: i.riskLevel, status: i.status, summary: i.summary, userName: i.userName, createdAt: i.createdAt, executedAt: i.executedAt, rolledBackAt: i.rolledBackAt, undoable };
        });
    },
};
