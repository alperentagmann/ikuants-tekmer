import crypto from 'crypto';
import { getIdentityEncryptionSeed } from '@/lib/env';

// Keys are derived lazily from the environment so a missing key fails at use, not at import.
function getAesKey(): Buffer {
    return crypto.createHash('sha256').update(getIdentityEncryptionSeed()).digest();
}

function getHmacKey(): Buffer {
    return crypto.createHash('sha256').update('hmac:' + getIdentityEncryptionSeed()).digest();
}

export interface TcValidationResult {
    isValid: boolean;
    message: string;
}

/**
 * Validates the algorithmic format and checksum of an 11-digit Turkish Republic National ID (T.C. Kimlik No).
 * Note: This only validates algorithm/format. It does NOT claim official governmental identity confirmation.
 */
export function validateTcChecksum(tc: string | null | undefined): TcValidationResult {
    if (!tc || typeof tc !== 'string') {
        return { isValid: false, message: 'Kimlik numarası boş olamaz.' };
    }

    const clean = tc.trim();
    if (!/^[1-9][0-9]{10}$/.test(clean)) {
        return {
            isValid: false,
            message: 'T.C. Kimlik No 11 haneli ve yalnızca rakamlardan oluşmalıdır (0 ile başlayamaz).',
        };
    }

    const digits = clean.split('').map(Number);
    
    // Checksum rule 1: 10th digit check
    // ((sum of 1st, 3rd, 5th, 7th, 9th digits * 7) - sum of 2nd, 4th, 6th, 8th digits) % 10 === 10th digit
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const check10 = ((oddSum * 7) - evenSum) % 10;
    const mod10Check = (check10 < 0 ? check10 + 10 : check10);

    if (mod10Check !== digits[9]) {
        return {
            isValid: false,
            message: 'T.C. Kimlik algoritma kuralı (10. hane kontrolü) doğrulanamadı.',
        };
    }

    // Checksum rule 2: 11th digit check
    // Sum of first 10 digits % 10 === 11th digit
    let sumFirst10 = 0;
    for (let i = 0; i < 10; i++) {
        sumFirst10 += digits[i];
    }

    if (sumFirst10 % 10 !== digits[10]) {
        return {
            isValid: false,
            message: 'T.C. Kimlik algoritma kuralı (11. hane kontrolü) doğrulanamadı.',
        };
    }

    return {
        isValid: true,
        message: 'T.C. Kimlik No biçim ve algoritma checksum kontrolü geçerli.',
    };
}

/**
 * Returns a masked representation of T.C. Kimlik No for display (e.g. 12*******90).
 */
export function maskTcNumber(tc: string | null | undefined): string {
    if (!tc) return '';
    const clean = tc.trim();
    if (clean.length < 4) return '***********';
    return clean.slice(0, 2) + '*******' + clean.slice(-2);
}

/**
 * Generates a deterministic HMAC blind index for duplicate detection without exposing plaintext or requiring full-table decryption.
 */
export function hashTcNumber(tc: string | null | undefined): string | null {
    if (!tc) return null;
    const clean = tc.trim();
    if (clean.length !== 11) return null;
    return crypto.createHmac('sha256', getHmacKey()).update(clean).digest('hex');
}

/**
 * Application-level AES-256-GCM encryption with randomized IV and integrity authentication tag.
 */
export function encryptTcNumber(tc: string | null | undefined): string | null {
    if (!tc) return null;
    const clean = tc.trim();
    if (clean.length === 0) return null;

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getAesKey(), iv);
    let ciphertext = cipher.update(clean, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + ciphertext;
}

/**
 * Decrypts an AES-256-GCM encrypted payload. Returns null if invalid or corrupted.
 */
export function decryptTcNumber(payload: string | null | undefined): string | null {
    if (!payload || !payload.includes(':')) return null;

    try {
        const parts = payload.split(':');
        if (parts.length !== 3) return null;

        const [ivHex, tagHex, dataHex] = parts;
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            getAesKey(),
            Buffer.from(ivHex, 'hex')
        );
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        let decrypted = decipher.update(dataHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        return null;
    }
}

/**
 * Returns the plaintext T.C. number from a stored value. Values written before
 * application-level encryption existed were stored as plain 11-digit strings;
 * those are still readable so they can be revealed and re-encrypted.
 */
export function revealStoredTcNumber(stored: string | null | undefined): string | null {
    if (!stored) return null;
    if (/^[0-9]{11}$/.test(stored.trim())) return stored.trim();
    return decryptTcNumber(stored);
}

/** True when a stored value is an unencrypted legacy T.C. number. */
export function isLegacyPlaintextTc(stored: string | null | undefined): boolean {
    return Boolean(stored && /^[0-9]{11}$/.test(stored.trim()));
}
