/**
 * Staff profile vocabulary shared by internal users and company (startup) personnel.
 * SGK status is recorded as a plain-language definition, not as a document code.
 */

export const EMPLOYMENT_TYPES: { value: string; label: string }[] = [
    { value: 'FULL_TIME', label: 'Tam zamanlı' },
    { value: 'PART_TIME', label: 'Yarı / kısmi zamanlı' },
    { value: 'INTERN', label: 'Stajyer' },
    { value: 'CONSULTANT', label: 'Danışman' },
    { value: 'CONTRACT', label: 'Proje / sözleşmeli' },
    { value: 'VOLUNTEER', label: 'Gönüllü' },
];

export function employmentLabel(value: string | null | undefined): string | null {
    if (!value) return null;
    return EMPLOYMENT_TYPES.find((t) => t.value === value)?.label || value;
}

export const SGK_STATUSES_KEY = 'hr_sgk_statuses';

/** Default definitions; admins can edit the list in Ayarlar › İK Tanımları. */
export const DEFAULT_SGK_STATUSES: string[] = [
    'Tam zamanlı — tüm sigorta kolları (4/a)',
    'Kısmi zamanlı — tüm sigorta kolları (4/a)',
    'Stajyer — iş kazası ve meslek hastalığı sigortası (zorunlu staj)',
    'Stajyer — mesleki eğitim kapsamında (3308)',
    'Emekli çalışan — sosyal güvenlik destek primi (SGDP)',
    'Şirket ortağı / yönetim kurulu üyesi (4/b)',
    'Serbest meslek / danışman — fatura ile çalışır (4/b)',
    'Yabancı uyruklu çalışan',
    'Sigortasız (gönüllü / ücretsiz)',
];

export function sanitizeSgkStatuses(input: unknown): string[] {
    const list = Array.isArray(input) ? input : typeof input === 'string' ? input.split('\n') : [];
    return Array.from(new Set(list.map((s) => String(s).trim()).filter((s) => s.length > 0 && s.length <= 160))).slice(0, 40);
}

export function parseSgkStatuses(raw: string | null | undefined): string[] {
    if (!raw) return DEFAULT_SGK_STATUSES;
    try {
        const list = sanitizeSgkStatuses(JSON.parse(raw));
        return list.length ? list : DEFAULT_SGK_STATUSES;
    } catch {
        return DEFAULT_SGK_STATUSES;
    }
}

/** Normalises staff profile fields coming from admin forms. */
export function sanitizeStaffProfile(input: { employmentType?: unknown; sgkStatus?: unknown; hireDate?: unknown }) {
    const out: { employmentType?: string | null; sgkStatus?: string | null; hireDate?: Date | null } = {};
    if ('employmentType' in input) out.employmentType = EMPLOYMENT_TYPES.some((t) => t.value === input.employmentType) ? String(input.employmentType) : null;
    if ('sgkStatus' in input) out.sgkStatus = typeof input.sgkStatus === 'string' && input.sgkStatus.trim() ? input.sgkStatus.trim().slice(0, 160) : null;
    if ('hireDate' in input) {
        const d = typeof input.hireDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.hireDate) ? new Date(`${input.hireDate}T00:00:00+03:00`) : null;
        out.hireDate = d && !Number.isNaN(d.getTime()) ? d : null;
    }
    return out;
}
