'use client';

import React from 'react';
import { Send, ArrowLeft, ArrowRight } from 'lucide-react';
import { useDynamicForm } from './useDynamicForm';
import { DynamicFormFields } from './DynamicFormFields';
import { FormLoadState, HoneypotField, FormSubmitError } from './FormStatus';
import { getFormTheme } from './form-themes';

/**
 * Compact single-section form rendered from the Form Center (contact, event
 * registration...). The surrounding page keeps its own heading and success view.
 */
export function InlineFormCenterForm({
    slug,
    themeKey,
    onSubmitted,
    submitLabel,
    buttonClassName,
    context,
    dark,
    initial,
}: {
    slug: string;
    themeKey: string;
    onSubmitted: (reference: string) => void;
    submitLabel?: string;
    buttonClassName?: string;
    context?: { entityType: string; entityId?: string | null; label: string } | null;
    dark?: boolean;
    initial?: Record<string, string>;
}) {
    const form = useDynamicForm(slug, { context: context || null, initial });
    const theme = getFormTheme(themeKey);

    if (form.loading || form.loadError || !form.definition) {
        return <FormLoadState loading={form.loading} error={form.loadError || (!form.loading ? 'Form şu anda yayında değil.' : null)} onRetry={form.reload} dark={dark} />;
    }

    // Multi-step forms are shown step by step; single-section forms render as one page
    const multiStep = form.sections.length > 1;
    const fields = multiStep ? form.stepFields : form.definition.fields;

    return (
        <form
            className="space-y-6 relative"
            noValidate
            onSubmit={async (e) => {
                e.preventDefault();
                if (multiStep && !form.isLastStep) {
                    form.next();
                    return;
                }
                const result = await form.submit();
                if (result) {
                    onSubmitted(result.applicationNumber || result.submissionNumber);
                    form.reset();
                }
            }}
        >
            <HoneypotField value={form.honeypot} onChange={form.setHoneypot} />
            {multiStep && (
                <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{form.currentSection?.title || `Adım ${form.stepIndex + 1}`}</span>
                        <span>{form.stepIndex + 1} / {form.sections.length}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((form.stepIndex + 1) / form.sections.length) * 100}%` }} />
                    </div>
                </div>
            )}
            <DynamicFormFields
                fields={fields}
                theme={theme}
                values={form.values}
                errors={form.errors}
                onChange={form.setValue}
                kvkkTexts={form.definition.kvkkTexts}
                uploadSlug={slug}
            />
            <FormSubmitError message={form.submitError} />
            {multiStep && !form.isLastStep ? (
                <div className="flex gap-3">
                    {!form.isFirstStep && (
                        <button type="button" onClick={form.prev} className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-4 font-semibold text-gray-700 dark:border-white/15 dark:text-gray-200">
                            <ArrowLeft className="h-4 w-4" /> Geri
                        </button>
                    )}
                    <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-4 font-orbitron font-bold tracking-widest text-white hover:bg-primary/80">
                        Devam <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            ) : (
            <div className="flex gap-3">
            {multiStep && (
                <button type="button" onClick={form.prev} className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-4 font-semibold text-gray-700 dark:border-white/15 dark:text-gray-200">
                    <ArrowLeft className="h-4 w-4" /> Geri
                </button>
            )}
            <button
                type="submit"
                disabled={form.submitting}
                className={buttonClassName || 'w-full py-4 bg-primary hover:bg-primary/80 text-white font-orbitron font-bold tracking-widest rounded-lg flex items-center justify-center gap-2 group transition-all disabled:opacity-50 disabled:cursor-not-allowed'}
            >
                {form.submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        {submitLabel || form.definition.submitLabel || 'GÖNDER'}
                    </>
                )}
            </button>
            </div>
            )}
        </form>
    );
}
