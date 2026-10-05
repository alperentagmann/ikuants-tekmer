'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FormFieldDefinition,
    FormSectionDefinition,
    FormValues,
    FormValue,
    isFieldVisible,
    normalizeFieldType,
    validateStep,
    validateSubmission,
} from '@/lib/forms/schema';
import type { KvkkText } from './DynamicFormFields';
import { celebrate } from '@/lib/celebrate';

export interface PublicFormDefinition {
    formId: string;
    title: string;
    slug: string;
    description: string | null;
    formType: string;
    theme: string | null;
    submitLabel: string | null;
    successMessage: string | null;
    versionId: string;
    versionNumber: number;
    sections: FormSectionDefinition[];
    fields: FormFieldDefinition[];
    kvkkTexts: KvkkText[];
    campaign: {
        id: string;
        name: string;
        slug: string;
        applicationType: string;
        isOpen: boolean;
        closesAt: string | null;
        program: { id: string; name: string; slug: string } | null;
    } | null;
}

export interface SubmitResult {
    submissionNumber: string;
    applicationNumber: string | null;
    successMessage: string | null;
}

function initialValues(fields: FormFieldDefinition[], overrides?: FormValues): FormValues {
    const values: FormValues = {};
    for (const f of fields) {
        const type = normalizeFieldType(String(f.fieldType));
        if (['MULTISELECT', 'CHECKBOX_GROUP'].includes(type)) {
            values[f.fieldKey] = (f.options || []).filter((o) => o.isDefault).map((o) => o.value);
        } else if (type === 'CONSENT') {
            values[f.fieldKey] = false;
        } else if (f.defaultValue) {
            values[f.fieldKey] = f.defaultValue;
        } else {
            const def = (f.options || []).find((o) => o.isDefault);
            if (def) values[f.fieldKey] = def.value;
        }
    }
    return { ...values, ...(overrides || {}) };
}

function newIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Loads a published form from the Form Center and manages values, steps,
 * validation and submission. Pass `preview` to render a definition without
 * loading it (admin preview); preview forms cannot be submitted.
 */
export function useDynamicForm(
    slug: string | null,
    options?: { preview?: PublicFormDefinition; initial?: FormValues; context?: { entityType: string; entityId?: string | null; label: string } | null }
) {
    const [definition, setDefinition] = useState<PublicFormDefinition | null>(options?.preview || null);
    const [loading, setLoading] = useState(!options?.preview);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [values, setValues] = useState<FormValues>(() => (options?.preview ? initialValues(options.preview.fields, options.initial) : {}));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [stepIndex, setStepIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [result, setResult] = useState<SubmitResult | null>(null);
    const startedAt = useRef<number>(Date.now());
    const idempotencyKey = useRef<string>(newIdempotencyKey());
    const [honeypot, setHoneypot] = useState('');

    const load = useCallback(async () => {
        if (!slug || options?.preview) return;
        setLoading(true);
        setLoadError(null);
        try {
            const res = await fetch(`/api/public/forms/${slug}`, { cache: 'no-store' });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || 'Form yüklenemedi');
            setDefinition(json.form);
            setValues(initialValues(json.form.fields, options?.initial));
            startedAt.current = Date.now();
        } catch (e) {
            setLoadError(e instanceof Error ? e.message : 'Form yüklenemedi');
        } finally {
            setLoading(false);
        }
        // options.initial is intentionally read once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, options?.preview]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (options?.preview) {
            setDefinition(options.preview);
            setValues((prev) => ({ ...initialValues(options.preview!.fields), ...prev }));
        }
    }, [options?.preview]);

    const sections = useMemo(() => {
        if (!definition) return [] as FormSectionDefinition[];
        const used = new Set(definition.fields.map((f) => f.stepNumber ?? 1));
        return definition.sections.filter((s) => used.has(s.stepNumber));
    }, [definition]);

    const currentSection = sections[stepIndex] || null;
    const stepFields = useMemo(
        () => (definition && currentSection ? definition.fields.filter((f) => (f.stepNumber ?? 1) === currentSection.stepNumber) : []),
        [definition, currentSection]
    );

    const setValue = useCallback((key: string, value: FormValue) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    const isStepComplete = useMemo(() => {
        if (!definition || !currentSection) return false;
        return Object.keys(validateStep(definition.fields, values, currentSection.stepNumber)).length === 0;
    }, [definition, currentSection, values]);

    const next = useCallback(() => {
        if (!definition || !currentSection) return false;
        const stepErrors = validateStep(definition.fields, values, currentSection.stepNumber);
        setErrors(stepErrors);
        if (Object.keys(stepErrors).length > 0) return false;
        setStepIndex((i) => Math.min(i + 1, sections.length - 1));
        return true;
    }, [definition, currentSection, values, sections.length]);

    const prev = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

    const submit = useCallback(async () => {
        if (!definition || options?.preview) return null;
        const validation = validateSubmission(definition.fields, values);
        if (!validation.isValid) {
            setErrors(validation.errors);
            const firstInvalid = definition.fields.find((f) => validation.errors[f.fieldKey] && isFieldVisible(f, values));
            if (firstInvalid) {
                const idx = sections.findIndex((s) => s.stepNumber === (firstInvalid.stepNumber ?? 1));
                if (idx >= 0) setStepIndex(idx);
                if (typeof window !== 'undefined') {
                    window.setTimeout(() => {
                        const el = document.getElementById(`f_${firstInvalid.fieldKey}`) || document.querySelector(`[name="${firstInvalid.fieldKey}"]`);
                        if (el instanceof HTMLElement) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.focus({ preventScroll: true });
                        }
                    }, 50);
                }
            }
            return null;
        }
        setSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch(`/api/public/forms/${definition.slug}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ values, idempotencyKey: idempotencyKey.current, _ts: startedAt.current, _hp: honeypot, context: options?.context || null }),
            });
            const json = await res.json();
            if (!json.success) {
                if (json.fieldErrors) setErrors(json.fieldErrors);
                throw new Error(json.message || 'Gönderim tamamlanamadı');
            }
            const submitted: SubmitResult = {
                submissionNumber: json.submissionNumber,
                applicationNumber: json.applicationNumber,
                successMessage: json.successMessage,
            };
            setResult(submitted);
            celebrate({ reference: submitted.applicationNumber || submitted.submissionNumber, message: submitted.successMessage });
            return submitted;
        } catch (e) {
            setSubmitError(e instanceof Error ? e.message : 'Gönderim tamamlanamadı');
            return null;
        } finally {
            setSubmitting(false);
        }
    }, [definition, values, honeypot, sections, options?.preview, options?.context]);

    const reset = useCallback(() => {
        if (!definition) return;
        setValues(initialValues(definition.fields));
        setErrors({});
        setStepIndex(0);
        setResult(null);
        setSubmitError(null);
        idempotencyKey.current = newIdempotencyKey();
        startedAt.current = Date.now();
    }, [definition]);

    /** Validates every visible field and shows errors; returns true when the form is valid. */
    const validateAll = useCallback(() => {
        if (!definition) return false;
        const validation = validateSubmission(definition.fields, values);
        setErrors(validation.errors);
        return validation.isValid;
    }, [definition, values]);

    /** Bot-protection and idempotency data for callers that submit through their own endpoint. */
    const getSubmissionMeta = useCallback(() => ({ _ts: startedAt.current, _hp: honeypot, idempotencyKey: idempotencyKey.current }), [honeypot]);

    const isFormComplete = useMemo(
        () => (definition ? validateSubmission(definition.fields, values).isValid : false),
        [definition, values]
    );

    return {
        definition,
        loading,
        loadError,
        reload: load,
        values,
        setValue,
        errors,
        sections,
        stepIndex,
        setStepIndex,
        currentSection,
        stepFields,
        isFirstStep: stepIndex === 0,
        isLastStep: stepIndex >= sections.length - 1,
        isStepComplete,
        isFormComplete,
        next,
        prev,
        submit,
        submitting,
        submitError,
        result,
        reset,
        honeypot,
        setHoneypot,
        validateAll,
        getSubmissionMeta,
        setErrors,
    };
}

export type DynamicFormState = ReturnType<typeof useDynamicForm>;
