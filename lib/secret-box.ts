import crypto from 'crypto';
import { getIntegrationEncryptionSeed } from '@/lib/env';

/**
 * AES-256-GCM encryption for credentials stored in the database. The ciphertext format is
 * `v1:<iv>:<tag>:<data>` (base64url). Secrets are never returned to the browser.
 */
function key(): Buffer {
    return crypto.createHash('sha256').update(getIntegrationEncryptionSeed()).digest();
}

export function sealSecret(value: Record<string, string>): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join(':');
}

export function openSecret(sealed: string | null | undefined): Record<string, string> {
    if (!sealed) return {};
    const [v, iv, tag, data] = sealed.split(':');
    if (v !== 'v1' || !iv || !tag || !data) throw new Error('Şifreli veri biçimi tanınmadı.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    const json = Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
}

/** "abcd…wxyz" style hint so admins can recognise a stored value without seeing it. */
export function hintOf(value: string): string {
    if (!value) return '';
    if (value.length <= 8) return '•'.repeat(value.length);
    return `${value.slice(0, 3)}…${value.slice(-3)}`;
}
