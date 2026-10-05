'use client';

import React, { useState } from 'react';
import { DynamicFormFields, KvkkText } from '@/components/forms/DynamicFormFields';
import { getFormTheme } from '@/components/forms/form-themes';
import { FormFieldDefinition, FormSectionDefinition, FormValues, FormValue, validateSubmission } from '@/lib/forms/schema';
import { Button, Alert } from '@/components/admin/ui';

/**
 * Interactive preview with the public theme. Conditional logic and validation
 * behave exactly as on the public page; nothing is submitted.
 */
export function FormPreview({ sections, fields, theme, kvkkTexts, dark }: { sections: FormSectionDefinition[]; fields: FormFieldDefinition[]; theme: string | null; kvkkTexts: KvkkText[]; dark: boolean }) {
    const [values, setValues] = useState<FormValues>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [checked, setChecked] = useState(false);
    const formTheme = getFormTheme(theme);
    const setValue = (k: string, v: FormValue) => setValues((prev) => ({ ...prev, [k]: v }));

    return (
        <div className={dark ? 'dark' : ''}>
            <div className={`rounded-2xl border p-6 md:p-8 ${dark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
                {sections.map((section) => {
                    const sectionFields = fields.filter((f) => (f.stepNumber ?? 1) === section.stepNumber);
                    if (sectionFields.length === 0) return null;
                    return (
                        <div key={section.stepNumber} className="mb-10 last:mb-0">
                            <h3 className={formTheme.sectionTitle}>{section.title}</h3>
                            {section.description && <p className={formTheme.help}>{section.description}</p>}
                            <DynamicFormFields fields={sectionFields} theme={formTheme} values={values} errors={errors} onChange={setValue} kvkkTexts={kvkkTexts} uploadSlug={null} />
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                    onClick={() => {
                        const result = validateSubmission(fields, values);
                        setErrors(result.errors);
                        setChecked(true);
                    }}
                >
                    Doğrulamayı Test Et
                </Button>
                <Button variant="ghost" onClick={() => { setValues({}); setErrors({}); setChecked(false); }}>Önizlemeyi Sıfırla</Button>
                {checked && (Object.keys(errors).length === 0
                    ? <Alert tone="success">Form geçerli. Bu önizleme gönderim yapmaz.</Alert>
                    : <Alert tone="warning">{Object.keys(errors).length} alanda hata var.</Alert>)}
            </div>
        </div>
    );
}
