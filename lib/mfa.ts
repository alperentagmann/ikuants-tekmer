import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Base32 alphabet according to RFC 4648
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(length: number = 20): string {
    const randomBytes = crypto.randomBytes(length);
    let secret = '';
    for (let i = 0; i < randomBytes.length; i++) {
        secret += BASE32_CHARS[randomBytes[i] % 32];
    }
    return secret;
}

function base32Decode(base32: string): Buffer {
    const clean = base32.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (let i = 0; i < clean.length; i++) {
        const index = BASE32_CHARS.indexOf(clean[i]);
        if (index === -1) continue;

        value = (value << 5) | index;
        bits += 5;

        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }

    return Buffer.from(output);
}

/**
 * Generate 6-digit TOTP code for a secret at a given counter/time
 */
export function generateTotpCode(secret: string, timeStepWindow: number = 0): string {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30) + timeStepWindow;

    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0x0f;
    const binary =
        ((digest[offset] & 0x7f) << 24) |
        ((digest[offset + 1] & 0xff) << 16) |
        ((digest[offset + 2] & 0xff) << 8) |
        (digest[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
}

/**
 * Verify a 6-digit TOTP code with +/- 1 time step drift (30 seconds window)
 */
export function verifyTotpCode(secret: string, token: string): boolean {
    if (!token || token.trim().length !== 6) return false;
    const cleanToken = token.trim();

    // Check current step, previous step (-1), and next step (+1)
    for (let step = -1; step <= 1; step++) {
        const expected = generateTotpCode(secret, step);
        if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
            return true;
        }
    }
    return false;
}

/**
 * Generate otpauth:// URI for Authenticator apps (Google / Microsoft Authenticator)
 */
export function generateOtpAuthUri(accountName: string, issuer: string, secret: string): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate 8 secure random backup recovery codes
 */
export function generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
        const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
        codes.push(`${part1}-${part2}`);
    }
    return codes;
}

/**
 * Hash backup codes for secure DB storage (never store in plaintext)
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
    const hashed: string[] = [];
    for (const code of codes) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(code.replace(/[^A-Z0-9]/gi, '').toUpperCase(), salt);
        hashed.push(hash);
    }
    return hashed;
}

/**
 * Verify and consume a backup code
 */
export async function verifyAndConsumeBackupCode(
    providedCode: string,
    hashedCodesJson: string | null | undefined
): Promise<{ isValid: boolean; remainingHashedCodesJson?: string }> {
    if (!hashedCodesJson) return { isValid: false };

    let hashedCodes: string[];
    try {
        hashedCodes = JSON.parse(hashedCodesJson);
        if (!Array.isArray(hashedCodes)) return { isValid: false };
    } catch {
        return { isValid: false };
    }

    const cleanInput = providedCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    for (let i = 0; i < hashedCodes.length; i++) {
        const isMatch = await bcrypt.compare(cleanInput, hashedCodes[i]);
        if (isMatch) {
            // Remove consumed code
            hashedCodes.splice(i, 1);
            return {
                isValid: true,
                remainingHashedCodesJson: JSON.stringify(hashedCodes),
            };
        }
    }

    return { isValid: false };
}
