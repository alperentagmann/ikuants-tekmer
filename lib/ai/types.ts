import type { ZodType } from 'zod';
import type { UserWithPermissions } from '@/lib/rbac';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActionKind = 'READ' | 'SEARCH' | 'ANALYZE' | 'PREPARE' | 'CREATE' | 'UPDATE' | 'ASSIGN' | 'GENERATE' | 'EXPORT' | 'EMAIL_PREPARE' | 'REPORT' | 'NAVIGATE';

export type AiActor = UserWithPermissions & { id: string; name: string; email: string; isSuperAdmin: boolean };

/** Page / conversation context used to resolve "bu", "buna", "bunun" references. */
export interface AiContext {
    route?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    lastEntity?: { type: string; id: string; label: string } | null;
}

export interface EntityRef {
    type: string;
    id: string;
    label: string;
    href: string;
}

/** Structured result rendered by the result-first UI. */
export interface ResultCard {
    title: string;
    status: 'success' | 'info' | 'warning' | 'empty';
    summary?: string;
    fields?: { label: string; value: string }[];
    table?: { columns: string[]; rows: { cells: string[]; href?: string }[] };
    links?: { label: string; href: string }[];
    entity?: EntityRef | null;
}

export interface ActionContext {
    actor: AiActor;
    context: AiContext;
}

export interface ExecutionResult {
    card: ResultCard;
    entity?: EntityRef | null;
    /** Data needed to undo the change (stored on the AiChangeSet). */
    undo?: Record<string, unknown> | null;
    before?: unknown;
    after?: unknown;
}

export interface AiActionDefinition<I = Record<string, unknown>> {
    id: string;
    name: string;
    description: string;
    domain: 'CRM' | 'PROGRAM' | 'APPLICATION' | 'FORM' | 'TASK' | 'EMAIL' | 'REPORT' | 'FINANCE' | 'RESERVATION' | 'CMS' | 'FACILITY' | 'USER' | 'NAVIGATION';
    kind: ActionKind;
    /** [action, resource] checked with hasPermission on every call, server-side. */
    permission: [string, string];
    risk: RiskLevel;
    input: ZodType<I>;
    /** Example phrases shown in the command center and given to the language model. */
    examples: string[];
    /** Builds a human readable preview (mutations) without changing data. */
    preview?: (input: I, ctx: ActionContext) => Promise<ResultCard>;
    execute: (input: I, ctx: ActionContext) => Promise<ExecutionResult>;
    /** Reads the database after execution to confirm the change really happened. */
    verify?: (result: ExecutionResult, ctx: ActionContext) => Promise<boolean>;
    /** Compensating action; absent for irreversible or financial operations. */
    undo?: (undo: Record<string, unknown>, ctx: ActionContext) => Promise<string>;
}

export function isMutation(def: Pick<AiActionDefinition, 'kind'>): boolean {
    return !['READ', 'SEARCH', 'ANALYZE', 'NAVIGATE'].includes(def.kind);
}
