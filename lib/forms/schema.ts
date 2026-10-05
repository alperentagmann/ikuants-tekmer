/**
 * Form engine shared by the admin Form Builder, the public renderer and the
 * server-side submission validator. Pure TypeScript: no Node or browser APIs.
 *
 * Adding a new question type: add an entry to FIELD_TYPES, handle it in
 * validateFieldValue (server) and in components/forms/DynamicFormRenderer (UI).
 */

export type FieldType =
    | 'TEXT'
    | 'TEXTAREA'
    | 'EMAIL'
    | 'PHONE'
    | 'NUMBER'
    | 'CURRENCY'
    | 'DATE'
    | 'DATETIME'
    | 'TIME'
    | 'URL'
    | 'SELECT'
    | 'MULTISELECT'
    | 'RADIO'
    | 'CHECKBOX_GROUP'
    | 'BOOLEAN'
    | 'FILE'
    | 'FILES'
    | 'CONSENT'
    | 'TC_NO'
    | 'PERSON_LOOKUP'
    | 'ORGANIZATION_LOOKUP'
    | 'HEADING'
    | 'DESCRIPTION'
    | 'DIVIDER';

export interface FieldTypeMeta {
    type: FieldType;
    label: string;
    group: 'Metin' | 'Seçim' | 'Tarih & Sayı' | 'Dosya' | 'Onay' | 'Kayıt' | 'Düzen';
    hasOptions?: boolean;
    isDisplayOnly?: boolean;
    isSensitive?: boolean;
    adminOnly?: boolean;
}

export const FIELD_TYPES: FieldTypeMeta[] = [
    { type: 'TEXT', label: 'Kısa Metin', group: 'Metin' },
    { type: 'TEXTAREA', label: 'Uzun Metin', group: 'Metin' },
    { type: 'EMAIL', label: 'E-posta', group: 'Metin' },
    { type: 'PHONE', label: 'Telefon', group: 'Metin' },
    { type: 'URL', label: 'Web Adresi (URL)', group: 'Metin' },
    { type: 'TC_NO', label: 'T.C. Kimlik No', group: 'Metin', isSensitive: true },
    { type: 'NUMBER', label: 'Sayı', group: 'Tarih & Sayı' },
    { type: 'CURRENCY', label: 'Tutar', group: 'Tarih & Sayı' },
    { type: 'DATE', label: 'Tarih', group: 'Tarih & Sayı' },
    { type: 'DATETIME', label: 'Tarih ve Saat', group: 'Tarih & Sayı' },
    { type: 'TIME', label: 'Saat', group: 'Tarih & Sayı' },
    { type: 'SELECT', label: 'Açılır Liste', group: 'Seçim', hasOptions: true },
    { type: 'RADIO', label: 'Tekli Seçim (Radyo)', group: 'Seçim', hasOptions: true },
    { type: 'MULTISELECT', label: 'Çoklu Seçim', group: 'Seçim', hasOptions: true },
    { type: 'CHECKBOX_GROUP', label: 'Onay Kutusu Grubu', group: 'Seçim', hasOptions: true },
    { type: 'BOOLEAN', label: 'Evet / Hayır', group: 'Seçim' },
    { type: 'FILE', label: 'Dosya', group: 'Dosya' },
    { type: 'FILES', label: 'Çoklu Dosya', group: 'Dosya' },
    { type: 'CONSENT', label: 'Onay / KVKK Metni', group: 'Onay' },
    { type: 'PERSON_LOOKUP', label: 'Kişi Seçimi (yalnız iç formlar)', group: 'Kayıt', adminOnly: true },
    { type: 'ORGANIZATION_LOOKUP', label: 'Kurum Seçimi (yalnız iç formlar)', group: 'Kayıt', adminOnly: true },
    { type: 'HEADING', label: 'Başlık', group: 'Düzen', isDisplayOnly: true },
    { type: 'DESCRIPTION', label: 'Açıklama / Not', group: 'Düzen', isDisplayOnly: true },
    { type: 'DIVIDER', label: 'Ayırıcı', group: 'Düzen', isDisplayOnly: true },
];

const LEGACY_TYPE_ALIASES: Record<string, FieldType> = {
    CHECKBOX: 'CHECKBOX_GROUP',
    IMAGE: 'FILE',
    KVKK: 'CONSENT',
};

export function normalizeFieldType(type: string): FieldType {
    const upper = (type || 'TEXT').toUpperCase();
    if (LEGACY_TYPE_ALIASES[upper]) return LEGACY_TYPE_ALIASES[upper];
    return (FIELD_TYPES.some((t) => t.type === upper) ? upper : 'TEXT') as FieldType;
}

export function getFieldTypeMeta(type: string): FieldTypeMeta {
    const normalized = normalizeFieldType(type);
    return FIELD_TYPES.find((t) => t.type === normalized) as FieldTypeMeta;
}

export interface FieldOption {
    label: string;
    value: string;
    order?: number;
    active?: boolean;
    isDefault?: boolean;
}

export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_empty' | 'empty';

export interface ConditionRule {
    fieldKey: string;
    operator: ConditionOperator;
    value?: string;
}

export interface ConditionalLogic {
    logic: 'ALL' | 'ANY';
    rules: ConditionRule[];
}

export interface ValidationRules {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
    minDate?: string;
    maxDate?: string;
    minSelections?: number;
    maxSelections?: number;
    allowedFileTypes?: string[];
    maxFileSizeMb?: number;
    maxFiles?: number;
}

export interface FieldUiConfig {
    icon?: string;
    rows?: number;
    appearance?: 'default' | 'cards' | 'checkbox-grid' | 'module-cards';
    highlight?: boolean;
    columns?: number;
    kvkkTextId?: string;
    consentKind?: 'PRIVACY_NOTICE' | 'EXPLICIT_CONSENT' | 'MARKETING' | 'PHOTO_VIDEO' | 'TERMS' | 'OTHER';
    linkLabel?: string;
    linkSuffix?: string;
    consentChannels?: boolean;
    systemKey?: string;
}

export interface FormFieldDefinition {
    id?: string;
    fieldKey: string;
    label: string;
    fieldType: FieldType | string;
    placeholder?: string | null;
    helpText?: string | null;
    isRequired?: boolean;
    defaultValue?: string | null;
    validationRules?: ValidationRules | null;
    conditionalRules?: ConditionalLogic | null;
    options?: FieldOption[] | null;
    stepNumber?: number;
    stepTitle?: string | null;
    sectionDescription?: string | null;
    width?: 'FULL' | 'HALF' | 'THIRD' | string;
    sortOrder?: number;
    uiConfig?: FieldUiConfig | null;
}

export interface FormSectionDefinition {
    stepNumber: number;
    title: string;
    description?: string | null;
}

export type FormValue = string | number | boolean | string[] | null | undefined;
export type FormValues = Record<string, FormValue>;

// ---------------------------------------------------------------------------
// Normalization (legacy formats are still accepted)
// ---------------------------------------------------------------------------

function parseJson<T>(value: unknown): T | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') return value as T;
    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

export function normalizeOptions(raw: unknown): FieldOption[] {
    const parsed = parseJson<unknown[]>(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
        .map((item, index): FieldOption | null => {
            if (typeof item === 'string') return { label: item, value: item, order: index, active: true };
            if (item && typeof item === 'object') {
                const o = item as Record<string, unknown>;
                const label = String(o.label ?? o.value ?? '');
                if (!label) return null;
                return {
                    label,
                    value: String(o.value ?? o.label),
                    order: typeof o.order === 'number' ? o.order : index,
                    active: o.active !== false,
                    isDefault: o.isDefault === true,
                };
            }
            return null;
        })
        .filter((o): o is FieldOption => o !== null)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function normalizeConditions(raw: unknown): ConditionalLogic | null {
    const parsed = parseJson<Record<string, unknown>>(raw);
    if (!parsed) return null;
    if (Array.isArray(parsed.rules)) {
        const rules = (parsed.rules as Record<string, unknown>[])
            .filter((r) => r && typeof r.fieldKey === 'string' && r.fieldKey)
            .map((r) => ({
                fieldKey: String(r.fieldKey),
                operator: (String(r.operator || 'equals') as ConditionOperator),
                value: r.value === undefined || r.value === null ? undefined : String(r.value),
            }));
        if (rules.length === 0) return null;
        return { logic: parsed.logic === 'ANY' ? 'ANY' : 'ALL', rules };
    }
    // Legacy: { showIfFieldKey, equalsValue }
    if (typeof parsed.showIfFieldKey === 'string' && parsed.showIfFieldKey) {
        return {
            logic: 'ALL',
            rules: [{ fieldKey: parsed.showIfFieldKey, operator: 'equals', value: String(parsed.equalsValue ?? '') }],
        };
    }
    return null;
}

export function normalizeField(raw: Record<string, unknown>): FormFieldDefinition {
    return {
        id: raw.id ? String(raw.id) : undefined,
        fieldKey: String(raw.fieldKey || ''),
        label: String(raw.label || ''),
        fieldType: normalizeFieldType(String(raw.fieldType || 'TEXT')),
        placeholder: (raw.placeholder as string) ?? null,
        helpText: (raw.helpText as string) ?? null,
        isRequired: raw.isRequired === true,
        defaultValue: (raw.defaultValue as string) ?? null,
        validationRules: parseJson<ValidationRules>(raw.validationRules),
        conditionalRules: normalizeConditions(raw.conditionalRules),
        options: normalizeOptions(raw.options),
        stepNumber: typeof raw.stepNumber === 'number' ? raw.stepNumber : 1,
        stepTitle: (raw.stepTitle as string) ?? null,
        sectionDescription: (raw.sectionDescription as string) ?? null,
        width: (raw.width as string) || 'FULL',
        sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 0,
        uiConfig: parseJson<FieldUiConfig>(raw.uiConfig),
    };
}

export function buildSections(fields: FormFieldDefinition[], declared?: FormSectionDefinition[] | null): FormSectionDefinition[] {
    const map = new Map<number, FormSectionDefinition>();
    (declared || []).forEach((s) => map.set(s.stepNumber, { ...s }));
    fields.forEach((f) => {
        const step = f.stepNumber ?? 1;
        if (!map.has(step)) {
            map.set(step, { stepNumber: step, title: f.stepTitle || `Bölüm ${step}`, description: f.sectionDescription ?? null });
        }
    });
    if (map.size === 0) map.set(1, { stepNumber: 1, title: 'Bölüm 1' });
    return Array.from(map.values()).sort((a, b) => a.stepNumber - b.stepNumber);
}

// ---------------------------------------------------------------------------
// Conditional logic
// ---------------------------------------------------------------------------

function valueAsArray(value: FormValue): string[] {
    if (Array.isArray(value)) return value.map(String);
    if (value === null || value === undefined || value === '') return [];
    return [String(value)];
}

function isEmptyValue(value: FormValue): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'boolean') return value === false;
    return false;
}

export function evaluateRule(rule: ConditionRule, values: FormValues): boolean {
    const current = values[rule.fieldKey];
    const list = valueAsArray(current);
    const expected = rule.value ?? '';
    switch (rule.operator) {
        case 'equals':
            return typeof current === 'boolean' ? String(current) === expected : list.length === 1 && list[0] === expected;
        case 'not_equals':
            return !(list.length === 1 && list[0] === expected);
        case 'contains':
            return list.some((v) => v === expected || v.toLowerCase().includes(expected.toLowerCase()));
        case 'not_contains':
            return !list.some((v) => v === expected);
        case 'in':
            return list.some((v) => expected.split('|').map((x) => x.trim()).includes(v));
        case 'not_empty':
            return !isEmptyValue(current);
        case 'empty':
            return isEmptyValue(current);
        default:
            return true;
    }
}

export function isFieldVisible(field: FormFieldDefinition, values: FormValues): boolean {
    const logic = field.conditionalRules;
    if (!logic || logic.rules.length === 0) return true;
    const results = logic.rules.map((r) => evaluateRule(r, values));
    return logic.logic === 'ANY' ? results.some(Boolean) : results.every(Boolean);
}

// ---------------------------------------------------------------------------
// Validation (client and server)
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()\-]{7,20}$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;
const DEFAULT_MAX_TEXT = 2000;
const DEFAULT_MAX_TEXTAREA = 20000;

/** Rejects user-supplied regular expressions that are long or prone to catastrophic backtracking. */
export function isSafePattern(pattern: string): boolean {
    if (!pattern || pattern.length > 200) return false;
    if (/\([^)]*[+*][^)]*\)[+*{]/.test(pattern)) return false; // nested quantifiers like (a+)+
    try {
        new RegExp(pattern);
        return true;
    } catch {
        return false;
    }
}

export function isValidTcChecksum(tc: string): boolean {
    if (!/^[1-9][0-9]{10}$/.test(tc)) return false;
    const d = tc.split('').map(Number);
    const odd = d[0] + d[2] + d[4] + d[6] + d[8];
    const even = d[1] + d[3] + d[5] + d[7];
    const c10 = (((odd * 7 - even) % 10) + 10) % 10;
    const c11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
    return c10 === d[9] && c11 === d[10];
}

export function validateFieldValue(field: FormFieldDefinition, value: FormValue): string | null {
    const type = normalizeFieldType(String(field.fieldType));
    const rules = field.validationRules || {};
    const meta = getFieldTypeMeta(type);
    if (meta.isDisplayOnly) return null;

    if (isEmptyValue(value)) {
        if (field.isRequired) {
            return type === 'CONSENT' ? 'Devam etmek için bu onayı vermeniz gerekiyor.' : 'Bu alan zorunludur.';
        }
        return null;
    }

    const text = typeof value === 'string' ? value.trim() : '';

    switch (type) {
        case 'TEXT':
        case 'TEXTAREA':
        case 'PERSON_LOOKUP':
        case 'ORGANIZATION_LOOKUP': {
            const max = rules.maxLength ?? (type === 'TEXTAREA' ? DEFAULT_MAX_TEXTAREA : DEFAULT_MAX_TEXT);
            if (typeof value !== 'string') return 'Geçersiz değer.';
            if (text.length > max) return `En fazla ${max} karakter girebilirsiniz.`;
            if (rules.minLength && text.length < rules.minLength) return `En az ${rules.minLength} karakter girmelisiniz.`;
            if (rules.pattern && isSafePattern(rules.pattern) && !new RegExp(rules.pattern).test(text)) {
                return rules.patternMessage || 'Girilen değer beklenen biçimde değil.';
            }
            return null;
        }
        case 'EMAIL':
            return typeof value === 'string' && text.length <= 254 && EMAIL_RE.test(text) ? null : 'Geçerli bir e-posta adresi girin.';
        case 'PHONE':
            return typeof value === 'string' && PHONE_RE.test(text) ? null : 'Geçerli bir telefon numarası girin.';
        case 'URL':
            return typeof value === 'string' && text.length <= 2000 && URL_RE.test(text) ? null : 'Geçerli bir web adresi girin (https:// ile başlamalı).';
        case 'TC_NO':
            return typeof value === 'string' && isValidTcChecksum(text) ? null : 'Geçerli bir T.C. Kimlik No girin.';
        case 'NUMBER':
        case 'CURRENCY': {
            const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
            if (!Number.isFinite(n)) return 'Geçerli bir sayı girin.';
            if (rules.min !== undefined && n < rules.min) return `En az ${rules.min} olmalıdır.`;
            if (rules.max !== undefined && n > rules.max) return `En fazla ${rules.max} olmalıdır.`;
            return null;
        }
        case 'DATE':
        case 'DATETIME': {
            const d = new Date(String(value));
            if (Number.isNaN(d.getTime())) return 'Geçerli bir tarih girin.';
            if (rules.minDate && d < new Date(rules.minDate)) return 'Tarih izin verilen aralığın dışında.';
            if (rules.maxDate && d > new Date(rules.maxDate)) return 'Tarih izin verilen aralığın dışında.';
            return null;
        }
        case 'TIME':
            return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? null : 'Geçerli bir saat girin (SS:DD).';
        case 'SELECT':
        case 'RADIO': {
            const allowed = (field.options || []).filter((o) => o.active !== false).map((o) => o.value);
            return allowed.includes(String(value)) ? null : 'Listeden geçerli bir seçenek seçin.';
        }
        case 'MULTISELECT':
        case 'CHECKBOX_GROUP': {
            if (!Array.isArray(value)) return 'Geçersiz seçim.';
            const allowed = (field.options || []).filter((o) => o.active !== false).map((o) => o.value);
            if (value.some((v) => !allowed.includes(String(v)))) return 'Listeden geçerli seçenekler seçin.';
            if (rules.minSelections && value.length < rules.minSelections) return `En az ${rules.minSelections} seçim yapın.`;
            if (rules.maxSelections && value.length > rules.maxSelections) return `En fazla ${rules.maxSelections} seçim yapabilirsiniz.`;
            return null;
        }
        case 'BOOLEAN':
            return typeof value === 'boolean' || value === 'true' || value === 'false' ? null : 'Geçersiz değer.';
        case 'CONSENT':
            return value === true || value === 'true' ? null : 'Devam etmek için bu onayı vermeniz gerekiyor.';
        case 'FILE':
        case 'FILES': {
            const files = valueAsArray(value);
            const maxFiles = type === 'FILE' ? 1 : rules.maxFiles ?? 5;
            if (files.length > maxFiles) return `En fazla ${maxFiles} dosya yükleyebilirsiniz.`;
            return null;
        }
        default:
            return null;
    }
}

export interface SubmissionValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
    cleaned: FormValues;
}

/**
 * Validates submitted values against a form version. Fields hidden by conditional
 * logic and display-only fields are removed from the cleaned output, unknown keys
 * are dropped.
 */
export function validateSubmission(fields: FormFieldDefinition[], values: FormValues): SubmissionValidationResult {
    const errors: Record<string, string> = {};
    const cleaned: FormValues = {};

    for (const field of fields) {
        const meta = getFieldTypeMeta(String(field.fieldType));
        if (meta.isDisplayOnly) continue;
        if (!isFieldVisible(field, values)) continue;

        let value = values[field.fieldKey];
        if (typeof value === 'string') value = value.trim();
        if (normalizeFieldType(String(field.fieldType)) === 'CONSENT' || normalizeFieldType(String(field.fieldType)) === 'BOOLEAN') {
            if (value === 'true') value = true;
            if (value === 'false') value = false;
        }

        const error = validateFieldValue(field, value);
        if (error) {
            errors[field.fieldKey] = error;
            continue;
        }
        if (!isEmptyValue(value) || typeof value === 'boolean') cleaned[field.fieldKey] = value;
    }

    return { isValid: Object.keys(errors).length === 0, errors, cleaned };
}

export function validateStep(fields: FormFieldDefinition[], values: FormValues, stepNumber: number): Record<string, string> {
    return validateSubmission(
        fields.filter((f) => (f.stepNumber ?? 1) === stepNumber),
        values
    ).errors;
}

/** Field keys are stable identifiers used in stored answers. */
export function slugifyFieldKey(label: string): string {
    const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
    const key = label
        .split('')
        .map((c) => map[c] ?? c)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48);
    return key || 'alan';
}

/** Validates the structure of a form definition before it is saved or published. */
export function validateFormDefinition(fields: FormFieldDefinition[]): string[] {
    const problems: string[] = [];
    const keys = new Set<string>();
    for (const field of fields) {
        const meta = getFieldTypeMeta(String(field.fieldType));
        if (!field.fieldKey || !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(field.fieldKey)) {
            problems.push(`"${field.label || 'İsimsiz alan'}" için geçerli bir alan anahtarı gerekli (harf ile başlamalı, yalnız harf/rakam/_).`);
        }
        if (keys.has(field.fieldKey)) problems.push(`"${field.fieldKey}" alan anahtarı birden fazla kez kullanılmış.`);
        keys.add(field.fieldKey);
        if (!meta.isDisplayOnly && !field.label?.trim()) problems.push(`"${field.fieldKey}" alanının soru metni boş.`);
        if (meta.hasOptions && (field.options || []).filter((o) => o.active !== false).length === 0) {
            problems.push(`"${field.label}" sorusu için en az bir aktif seçenek gerekli.`);
        }
        if (field.validationRules?.pattern && !isSafePattern(field.validationRules.pattern)) {
            problems.push(`"${field.label}" sorusundaki doğrulama ifadesi güvenli değil veya geçersiz.`);
        }
        for (const rule of field.conditionalRules?.rules || []) {
            if (rule.fieldKey === field.fieldKey) problems.push(`"${field.label}" kendisine bağlı bir koşul içeremez.`);
            else if (!fields.some((f) => f.fieldKey === rule.fieldKey)) {
                problems.push(`"${field.label}" koşulu bulunmayan bir soruya ("${rule.fieldKey}") bağlı.`);
            }
        }
    }
    return problems;
}

export const FORM_TYPES: { value: string; label: string }[] = [
    { value: 'PROGRAM_APPLICATION', label: 'Program Başvurusu' },
    { value: 'TEKMER_APPLICATION', label: 'TEKMER Yer Edinme Başvurusu' },
    { value: 'ENTREPRENEUR_APPLICATION', label: 'Girişimci Başvurusu' },
    { value: 'MENTOR_APPLICATION', label: 'Mentör Başvurusu' },
    { value: 'EVENT_REGISTRATION', label: 'Etkinlik Kaydı' },
    { value: 'TRAINING_REGISTRATION', label: 'Eğitim Kaydı' },
    { value: 'RESERVATION_REQUEST', label: 'Rezervasyon Talebi' },
    { value: 'QUOTE_REQUEST', label: 'Fiyat Teklifi Talebi' },
    { value: 'CONTACT', label: 'İletişim — Mesaj' },
    { value: 'CONTACT_MEETING', label: 'İletişim — Toplantı Talebi' },
    { value: 'CONTACT_VISIT', label: 'İletişim — Ziyaret Talebi' },
    { value: 'FEEDBACK', label: 'Geri Bildirim' },
    { value: 'SURVEY', label: 'Anket' },
    { value: 'INTERNSHIP_APPLICATION', label: 'Staj Başvurusu' },
    { value: 'NEWSLETTER', label: 'Bülten Aboneliği' },
    { value: 'CUSTOM', label: 'Özel Form' },
];

export function formTypeLabel(value: string): string {
    return FORM_TYPES.find((t) => t.value === value)?.label || value;
}

export const APPLICATION_TYPES: { value: string; label: string }[] = [
    { value: 'PROGRAM', label: 'Program Başvurusu' },
    { value: 'TEKMER', label: 'TEKMER Yer Edinme' },
    { value: 'IDEATHON', label: 'Ideathon' },
    { value: 'HACKATHON', label: 'Hackathon' },
    { value: 'EVENT', label: 'Etkinlik' },
    { value: 'TRAINING', label: 'Eğitim' },
    { value: 'MENTOR', label: 'Mentörlük' },
    { value: 'ENTREPRENEUR', label: 'Girişimci' },
    { value: 'OTHER', label: 'Diğer' },
];

export function applicationTypeLabel(value: string | null | undefined): string {
    return APPLICATION_TYPES.find((t) => t.value === value)?.label || value || '—';
}

export const APPLICANT_TYPES: { value: string; label: string }[] = [
    { value: 'PERSON', label: 'Kişi' },
    { value: 'ENTREPRENEUR', label: 'Girişim' },
    { value: 'ORGANIZATION', label: 'Kurum / Şirket' },
    { value: 'TEAM', label: 'Takım' },
];

export function applicantTypeLabel(value: string | null | undefined): string {
    return APPLICANT_TYPES.find((t) => t.value === value)?.label || value || '—';
}
