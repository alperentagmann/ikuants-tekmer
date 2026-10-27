import type { z } from 'zod';
import { DomainError } from '@/lib/errors';

/** Alan bazlı doğrulama hatası: errorResponse bunu DomainError olarak yanıtlar ve `fieldErrors` döner. */
export class FieldValidationError extends DomainError {
    fieldErrors: Record<string, string>;
    constructor(message: string, fieldErrors: Record<string, string>, status = 400) {
        super(message, status);
        this.fieldErrors = fieldErrors;
    }
}

export const fieldError = (message: string, status: number, field?: string, detail?: string) =>
    field ? new FieldValidationError(message, { [field]: detail ?? message }, status) : new DomainError(message, status);

/** Zod şemasıyla doğrular; alan izin listesi dışındaki anahtarlar atılır (mass assignment yok). */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
    const r = schema.safeParse(input);
    if (!r.success) {
        const details: Record<string, string> = {};
        for (const issue of r.error.issues) details[issue.path.join('.') || '_'] = issue.message;
        throw new FieldValidationError('Form alanlarını kontrol edin.', details);
    }
    return r.data;
}

export type Actor = { id: string; name?: string | null; email?: string | null };
