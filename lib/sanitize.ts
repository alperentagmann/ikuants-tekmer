/**
 * Common weak/default passwords blacklist
 */
const COMMON_PASSWORDS = new Set([
    'admin',
    'password',
    'admin123',
    'admin2026',
    'AdminTekmer2026!',
    '12345678',
    '123456789',
    'qwertyuiop',
    'password123',
    'root',
    'superuser',
]);

/**
 * Validate password strength for Enterprise / Production policies (Item 76)
 */
export function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
    if (!password || password.length < 12) {
        return { isValid: false, error: 'Parola en az 12 karakter uzunluğunda olmalıdır.' };
    }

    if (COMMON_PASSWORDS.has(password.trim())) {
        return { isValid: false, error: 'Bu parola çok yaygın ve güvensizdir. Lütfen benzersiz bir parola seçin.' };
    }

    // Check character complexity: uppercase, lowercase, number, special char
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        return {
            isValid: false,
            error: 'Parola en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir.',
        };
    }

    return { isValid: true };
}

/**
 * Check if running with dangerous default credentials in production (Item 93)
 */
export function isDefaultCredentialBlocked(password: string): boolean {
    if (process.env.NODE_ENV === 'production') {
        const lower = password.toLowerCase().trim();
        return COMMON_PASSWORDS.has(lower) || lower.includes('admintekmer');
    }
    return false;
}

/**
 * HTML Sanitizer to prevent XSS (Item 81)
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';
    return html
        // Remove script tags and contents
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove iframe tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        // Remove dangerous event handlers (onerror, onload, onclick, onmouseover, etc.)
        .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
        // Remove javascript: pseudo-protocol in href or src
        .replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"')
        .replace(/src\s*=\s*["']\s*javascript:[^"']*["']/gi, 'src="#"');
}

/**
 * Sanitize SVG content against embedded XSS / script tags (Item 85)
 */
export function sanitizeSvg(svgContent: string): { isValid: boolean; sanitizedSvg?: string; error?: string } {
    if (!svgContent || typeof svgContent !== 'string') {
        return { isValid: false, error: 'Geçersiz SVG verisi.' };
    }

    const lower = svgContent.toLowerCase();
    if (
        lower.includes('<script') ||
        lower.includes('javascript:') ||
        lower.includes('onload=') ||
        lower.includes('onerror=') ||
        lower.includes('<foreignobject')
    ) {
        return { isValid: false, error: 'SVG dosyasında güvenli olmayan betik veya etiketler tespit edildi.' };
    }

    return { isValid: true, sanitizedSvg: svgContent };
}

/**
 * Escape values for CSV / Excel export to prevent CSV Formula Injection (Item 90)
 * Characters: '=', '+', '-', '@', '\t', '\r'
 */
export function sanitizeCsvCell(value: any): string {
    if (value === null || value === undefined) return '';
    let stringVal = String(value);

    // If cell starts with a formula character, prefix with single quote
    if (/^[=+\-@\t\r]/.test(stringVal)) {
        stringVal = `'${stringVal}`;
    }

    // Escape double quotes by doubling them
    if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
    }

    return stringVal;
}
