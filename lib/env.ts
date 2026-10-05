/**
 * Central access to secrets and integration settings.
 *
 * Secrets are never hardcoded. A missing required secret fails loudly instead of
 * silently falling back to a value that is published in the source code.
 */

export class MissingSecretError extends Error {
    constructor(name: string) {
        super(`${name} ortam değişkeni tanımlı değil. .env.example dosyasına bakın.`);
        this.name = 'MissingSecretError';
    }
}

const MIN_SECRET_LENGTH = 16;

function readSecret(name: string): string | null {
    const value = process.env[name];
    if (!value || value.trim().length < MIN_SECRET_LENGTH) return null;
    return value;
}

/** Secret used to sign admin session tokens. */
export function getAuthSecret(): string {
    const value = readSecret('AUTH_SECRET') ?? readSecret('JWT_SECRET');
    if (!value) throw new MissingSecretError('AUTH_SECRET (veya JWT_SECRET)');
    return value;
}

/**
 * Key material for T.C. Kimlik No encryption and blind index.
 *
 * Production requires a dedicated IDENTITY_ENCRYPTION_KEY. Outside production the
 * session secret is accepted so local data created before the dedicated key existed
 * stays decryptable.
 */
export function getIdentityEncryptionSeed(): string {
    const dedicated = readSecret('IDENTITY_ENCRYPTION_KEY');
    if (dedicated) return dedicated;
    if (process.env.NODE_ENV === 'production') {
        throw new MissingSecretError('IDENTITY_ENCRYPTION_KEY');
    }
    return getAuthSecret();
}

/**
 * Key material for third-party credentials stored in the Integration Hub (API keys, tokens,
 * webhook secrets). Production requires INTEGRATION_ENCRYPTION_KEY; development falls back to
 * the session secret.
 */
export function getIntegrationEncryptionSeed(): string {
    const dedicated = readSecret('INTEGRATION_ENCRYPTION_KEY');
    if (dedicated) return dedicated;
    if (process.env.NODE_ENV === 'production') {
        throw new MissingSecretError('INTEGRATION_ENCRYPTION_KEY');
    }
    return `integration:${getAuthSecret()}`;
}

export type IntegrationStatus = 'CONFIGURED' | 'PENDING_EXTERNAL_CONFIGURATION';

export function isSmtpConfigured(): boolean {
    const host = process.env.SMTP_HOST;
    return Boolean(
        host &&
        host !== 'smtp.example.com' &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.SMTP_PASS !== 'your-smtp-password'
    );
}

export function getStorageProvider(): 'local' | 's3' {
    const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    return provider === 'local' ? 'local' : 's3';
}

export function isObjectStorageConfigured(): boolean {
    return Boolean(
        process.env.S3_ENDPOINT &&
        process.env.S3_ACCESS_KEY_ID &&
        process.env.S3_SECRET_ACCESS_KEY &&
        process.env.STORAGE_BUCKET_PUBLIC
    );
}

export function isAiProviderConfigured(): boolean {
    return Boolean(
        process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY
    );
}

export function isSchedulerConfigured(): boolean {
    return Boolean(readSecret('CRON_SECRET'));
}
