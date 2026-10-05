import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export type AdminUser = NonNullable<Awaited<ReturnType<typeof getCurrentAdminUser>>>;

export interface ActorContext {
    id: string;
    name: string;
    email: string;
    ip?: string;
    userAgent?: string;
}

/**
 * Resolves the current admin and checks a permission. Returns either the user
 * and an actor context, or a ready-to-return error response.
 */
export async function requireAdmin(
    request: NextRequest | null,
    action: string,
    resource: string
): Promise<{ user: AdminUser; actor: ActorContext; error?: undefined } | { error: NextResponse; user?: undefined; actor?: undefined }> {
    const user = await getCurrentAdminUser();
    if (!user) {
        return { error: NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 }) };
    }
    if (!hasPermission(user, action, resource)) {
        return { error: NextResponse.json({ success: false, message: 'Bu işlem için yetkiniz yok' }, { status: 403 }) };
    }
    return {
        user,
        actor: {
            id: user.id,
            name: user.name,
            email: user.email,
            ip: request?.headers.get('x-forwarded-for')?.split(',')[0].trim(),
            userAgent: request?.headers.get('user-agent') || undefined,
        },
    };
}

/** Converts known domain errors into user-facing responses without leaking internals. */
export function errorResponse(error: unknown, fallback = 'İşlem sırasında bir hata oluştu') {
    const e = error as { name?: string; message?: string; status?: number; problems?: string[]; fieldErrors?: Record<string, string> };
    const knownNames = ['FormDefinitionError', 'SubmissionError', 'DomainError', 'UploadValidationError', 'StorageNotConfiguredError'];
    if (e && e.name && knownNames.includes(e.name)) {
        return NextResponse.json(
            { success: false, message: e.message, problems: e.problems, fieldErrors: e.fieldErrors },
            { status: e.status || (e.name === 'StorageNotConfiguredError' ? 503 : 400) }
        );
    }
    console.error(fallback, error);
    return NextResponse.json({ success: false, message: fallback }, { status: 500 });
}

export { DomainError } from '@/lib/errors';
