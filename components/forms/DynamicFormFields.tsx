'use client';

import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import {
    FormFieldDefinition,
    FormValues,
    FormValue,
    getFieldTypeMeta,
    isFieldVisible,
    normalizeFieldType,
} from '@/lib/forms/schema';
import type { FormTheme } from './form-themes';
import { FORM_ICONS } from './form-icons';

export interface KvkkText {
    id: string;
    title: string;
    version: string;
    content: string;
}

interface Props {
    fields: FormFieldDefinition[];
    theme: FormTheme;
    values: FormValues;
    errors: Record<string, string>;
    onChange: (key: string, value: FormValue) => void;
    kvkkTexts?: KvkkText[];
    uploadSlug?: string | null;
    readOnly?: boolean;
}

function Icon({ name, className }: { name?: string; className?: string }) {
    if (!name) return null;
    const Cmp = FORM_ICONS[name];
    return Cmp ? <Cmp className={className || 'w-4 h-4'} aria-hidden="true" /> : null;
}

function widthClass(field: FormFieldDefinition): string {
    const type = normalizeFieldType(String(field.fieldType));
    const meta = getFieldTypeMeta(type);
    if (meta.isDisplayOnly || type === 'CONSENT' || field.uiConfig?.highlight) return 'md:col-span-2';
    if (field.width === 'HALF' || field.width === 'THIRD') return '';
    return 'md:col-span-2';
}

function KvkkModal({ text, onClose }: { text: KvkkText; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={text.title}>
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-bold text-black dark:text-white pr-4">{text.title}</h3>
                    <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500" aria-label="Kapat">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">{text.content}</div>
                <div className="p-4 border-t border-gray-200 dark:border-white/10 text-right text-xs text-gray-500">Versiyon: {text.version}</div>
            </div>
        </div>
    );
}

function FileInput({ field, theme, value, onChange, uploadSlug, readOnly }: {
    field: FormFieldDefinition;
    theme: FormTheme;
    value: FormValue;
    onChange: (v: FormValue) => void;
    uploadSlug?: string | null;
    readOnly?: boolean;
}) {
    const multiple = normalizeFieldType(String(field.fieldType)) === 'FILES';
    const [uploading, setUploading] = useState(false);
    const [names, setNames] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const tokens = Array.isArray(value) ? value : value ? [String(value)] : [];

    const handle = async (files: FileList | null) => {
        if (!files || !uploadSlug) return;
        setError(null);
        setUploading(true);
        try {
            const next = multiple ? [...tokens] : [];
            const nextNames = multiple ? [...names] : [];
            for (const file of Array.from(files)) {
                const data = new FormData();
                data.append('fieldKey', field.fieldKey);
                data.append('file', file);
                const res = await fetch(`/api/public/forms/${uploadSlug}/upload`, { method: 'POST', body: data });
                const json = await res.json();
                if (!json.success) throw new Error(json.message || 'Dosya yüklenemedi');
                next.push(json.token);
                nextNames.push(json.fileName);
            }
            setNames(nextNames);
            onChange(multiple ? next : next[0] || null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Dosya yüklenemedi');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <label className={`${theme.input} flex items-center gap-3 cursor-pointer`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="truncate">{names.length ? names.join(', ') : field.placeholder || 'Dosya seçin'}</span>
                <input
                    type="file"
                    className="sr-only"
                    multiple={multiple}
                    disabled={readOnly || uploading || !uploadSlug}
                    accept={field.validationRules?.allowedFileTypes?.join(',') || undefined}
                    onChange={(e) => handle(e.target.files)}
                />
            </label>
            {error && <p className={theme.error}>{error}</p>}
        </div>
    );
}

export function DynamicFormFields({ fields, theme, values, errors, onChange, kvkkTexts = [], uploadSlug, readOnly }: Props) {
    const [openText, setOpenText] = useState<KvkkText | null>(null);

    const visible = fields.filter((f) => isFieldVisible(f, values));

    return (
        <>
            <div className={theme.grid}>
                {visible.map((field) => {
                    const type = normalizeFieldType(String(field.fieldType));
                    const id = `f_${field.fieldKey}`;
                    const errorId = `${id}_error`;
                    const error = errors[field.fieldKey];
                    const value = values[field.fieldKey];
                    const ui = field.uiConfig || {};
                    const options = (field.options || []).filter((o) => o.active !== false);
                    const describedBy = [field.helpText ? `${id}_help` : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
                    const common = {
                        id,
                        name: field.fieldKey,
                        disabled: readOnly,
                        'aria-invalid': error ? true : undefined,
                        'aria-describedby': describedBy,
                    };
                    const inputClass = ui.highlight ? theme.highlightInput : theme.input;

                    if (type === 'HEADING') {
                        return (
                            <div key={field.fieldKey} className="md:col-span-2">
                                <h4 className={theme.subHeading}>
                                    <Icon name={ui.icon} className={theme.sectionIcon} />
                                    {field.label}
                                </h4>
                                {field.helpText && <p className={theme.help}>{field.helpText}</p>}
                            </div>
                        );
                    }
                    if (type === 'DESCRIPTION') {
                        return (
                            <div key={field.fieldKey} className={`md:col-span-2 ${theme.note}`}>
                                <p className={theme.noteText}>
                                    {field.label && <strong>{field.label} </strong>}
                                    {field.helpText}
                                </p>
                            </div>
                        );
                    }
                    if (type === 'DIVIDER') {
                        return <hr key={field.fieldKey} className="md:col-span-2 border-gray-200 dark:border-white/10" />;
                    }

                    if (type === 'CONSENT') {
                        const text = kvkkTexts.find((t) => t.id === ui.kvkkTextId);
                        return (
                            <div key={field.fieldKey} className="md:col-span-2">
                                <label className={theme.consentCard} htmlFor={id}>
                                    <input
                                        {...common}
                                        type="checkbox"
                                        checked={value === true}
                                        onChange={(e) => onChange(field.fieldKey, e.target.checked)}
                                        className={theme.checkbox}
                                    />
                                    <span className={theme.consentText}>
                                        {text ? (
                                            <>
                                                <button type="button" onClick={() => setOpenText(text)} className={theme.consentLink}>
                                                    {ui.linkLabel || text.title}
                                                </button>
                                                {ui.linkSuffix ?? ' '}
                                                {field.label && !ui.linkSuffix ? field.label : null}
                                            </>
                                        ) : (
                                            field.label
                                        )}
                                        {field.isRequired && <span className={theme.required}> *</span>}
                                    </span>
                                </label>
                                {error && <p id={errorId} className={theme.error}>{error}</p>}
                            </div>
                        );
                    }

                    const label = (
                        <label className={theme.label} htmlFor={['RADIO', 'CHECKBOX_GROUP', 'MULTISELECT', 'BOOLEAN'].includes(type) ? undefined : id}>
                            <Icon name={ui.icon} className="w-4 h-4 text-current opacity-80" />
                            {field.label}
                            {field.isRequired && <span className={theme.required}>*</span>}
                        </label>
                    );
                    const help = field.helpText ? <p id={`${id}_help`} className={theme.help}>{field.helpText}</p> : null;

                    let control: React.ReactNode = null;
                    switch (type) {
                        case 'TEXTAREA':
                            control = (
                                <textarea
                                    {...common}
                                    rows={ui.rows || 3}
                                    value={typeof value === 'string' ? value : ''}
                                    placeholder={field.placeholder || undefined}
                                    maxLength={field.validationRules?.maxLength}
                                    onChange={(e) => onChange(field.fieldKey, e.target.value)}
                                    className={inputClass}
                                />
                            );
                            break;
                        case 'SELECT':
                            control = (
                                <select {...common} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(field.fieldKey, e.target.value)} className={inputClass}>
                                    <option value="" className={theme.option}>{field.placeholder || 'Seçiniz...'}</option>
                                    {options.map((o) => (
                                        <option key={o.value} value={o.value} className={theme.option}>{o.label}</option>
                                    ))}
                                </select>
                            );
                            break;
                        case 'RADIO':
                        case 'BOOLEAN': {
                            const opts = type === 'BOOLEAN' ? [{ label: 'Evet', value: 'true' }, { label: 'Hayır', value: 'false' }] : options;
                            const current = typeof value === 'boolean' ? String(value) : (value as string) || '';
                            control = (
                                <div className={theme.radioCardWrap} role="radiogroup" aria-label={field.label}>
                                    {opts.map((o) => (
                                        <label key={o.value} className="flex-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={field.fieldKey}
                                                value={o.value}
                                                disabled={readOnly}
                                                checked={current === o.value}
                                                onChange={() => onChange(field.fieldKey, type === 'BOOLEAN' ? o.value === 'true' : o.value)}
                                                className="sr-only peer"
                                            />
                                            <div className={theme.radioCard}>{o.label}</div>
                                        </label>
                                    ))}
                                </div>
                            );
                            break;
                        }
                        case 'MULTISELECT':
                        case 'CHECKBOX_GROUP': {
                            const selected = Array.isArray(value) ? value : [];
                            const toggle = (v: string) => onChange(field.fieldKey, selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
                            if (ui.appearance === 'module-cards') {
                                control = (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2" role="group" aria-label={field.label}>
                                        {options.map((o) => (
                                            <label key={o.value} className={theme.moduleCard}>
                                                <input type="checkbox" disabled={readOnly} checked={selected.includes(o.value)} onChange={() => toggle(o.value)} className={theme.checkbox} />
                                                <div>
                                                    <span className={theme.moduleCode}>{o.value}</span>
                                                    <span className={theme.moduleTitle}>{o.label}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                );
                            } else {
                                control = (
                                    <div className={theme.checkGroup} role="group" aria-label={field.label}>
                                        {options.map((o) => (
                                            <label key={o.value} className={theme.checkGroupItem}>
                                                <input type="checkbox" disabled={readOnly} checked={selected.includes(o.value)} onChange={() => toggle(o.value)} className={theme.checkbox} />
                                                <span>{o.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                );
                            }
                            break;
                        }
                        case 'FILE':
                        case 'FILES':
                            control = <FileInput field={field} theme={theme} value={value} onChange={(v) => onChange(field.fieldKey, v)} uploadSlug={uploadSlug} readOnly={readOnly} />;
                            break;
                        default: {
                            const htmlType: Record<string, string> = {
                                EMAIL: 'email',
                                PHONE: 'tel',
                                URL: 'url',
                                NUMBER: 'number',
                                CURRENCY: 'number',
                                DATE: 'date',
                                DATETIME: 'datetime-local',
                                TIME: 'time',
                            };
                            control = (
                                <input
                                    {...common}
                                    type={htmlType[type] || 'text'}
                                    inputMode={type === 'TC_NO' ? 'numeric' : undefined}
                                    maxLength={type === 'TC_NO' ? 11 : field.validationRules?.maxLength}
                                    min={field.validationRules?.min}
                                    max={field.validationRules?.max}
                                    step={type === 'CURRENCY' ? '0.01' : undefined}
                                    autoComplete={type === 'TC_NO' ? 'off' : undefined}
                                    value={value === null || value === undefined ? '' : String(value)}
                                    placeholder={field.placeholder || undefined}
                                    onChange={(e) => onChange(field.fieldKey, e.target.value)}
                                    className={inputClass}
                                />
                            );
                        }
                    }

                    return (
                        <div key={field.fieldKey} className={`${widthClass(field)} ${ui.highlight ? theme.highlight : ''}`}>
                            {label}
                            {help}
                            {control}
                            {error && <p id={errorId} className={theme.error} role="alert">{error}</p>}
                        </div>
                    );
                })}
            </div>
            {openText && <KvkkModal text={openText} onClose={() => setOpenText(null)} />}
        </>
    );
}

