'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Copy, Trash2, ArrowUp, ArrowDown, GripVertical, ChevronDown, Layers, Eye, EyeOff, Asterisk } from 'lucide-react';
import { Button, Card, TextInput, TextArea, Badge, EmptyState, cx } from '@/components/admin/ui';
import { FIELD_TYPES, FormFieldDefinition, FormSectionDefinition, getFieldTypeMeta, normalizeFieldType, slugifyFieldKey } from '@/lib/forms/schema';
import { QuestionEditor, KvkkTextOption } from './QuestionEditor';

interface Props {
    sections: FormSectionDefinition[];
    fields: FormFieldDefinition[];
    onChange: (sections: FormSectionDefinition[], fields: FormFieldDefinition[]) => void;
    kvkkTexts: KvkkTextOption[];
    publishedKeys: Set<string>;
}

function uniqueKey(base: string, fields: FormFieldDefinition[]): string {
    let key = base || 'alan';
    if (!/^[a-zA-Z]/.test(key)) key = `alan_${key}`;
    let i = 2;
    while (fields.some((f) => f.fieldKey === key)) key = `${base}_${i++}`;
    return key;
}

export function FormBuilder({ sections, fields, onChange, kvkkTexts, publishedKeys }: Props) {
    const [selectedKey, setSelectedKey] = useState<string | null>(fields[0]?.fieldKey || null);
    const [addMenuFor, setAddMenuFor] = useState<number | null>(null);
    const [dragKey, setDragKey] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);

    const ordered = useMemo(() => [...sections].sort((a, b) => a.stepNumber - b.stepNumber), [sections]);
    const fieldsOf = (step: number) => fields.filter((f) => (f.stepNumber ?? 1) === step);
    const selected = fields.find((f) => f.fieldKey === selectedKey) || null;

    const commit = (nextSections: FormSectionDefinition[], nextFields: FormFieldDefinition[]) => {
        // Keep sortOrder sequential in section order
        const sectionOrder = new Map([...nextSections].sort((a, b) => a.stepNumber - b.stepNumber).map((s, i) => [s.stepNumber, i]));
        const sorted = [...nextFields].sort((a, b) => {
            const sa = sectionOrder.get(a.stepNumber ?? 1) ?? 0;
            const sb = sectionOrder.get(b.stepNumber ?? 1) ?? 0;
            return sa !== sb ? sa - sb : (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        });
        onChange(nextSections, sorted.map((f, i) => ({ ...f, sortOrder: i })));
    };

    const updateField = (key: string, patch: Partial<FormFieldDefinition>) => {
        const next = fields.map((f) => (f.fieldKey === key ? { ...f, ...patch } : f));
        if (patch.fieldKey && patch.fieldKey !== key) {
            // Keep conditions pointing to the renamed question
            next.forEach((f) => {
                if (f.conditionalRules?.rules.some((r) => r.fieldKey === key)) {
                    f.conditionalRules = { ...f.conditionalRules, rules: f.conditionalRules.rules.map((r) => (r.fieldKey === key ? { ...r, fieldKey: String(patch.fieldKey) } : r)) };
                }
            });
            setSelectedKey(String(patch.fieldKey));
        }
        commit(sections, next);
    };

    const addQuestion = (step: number, type: string) => {
        const meta = getFieldTypeMeta(type);
        const label = meta.isDisplayOnly ? (type === 'HEADING' ? 'Yeni başlık' : type === 'DESCRIPTION' ? 'Not' : '') : 'Yeni soru';
        const key = uniqueKey(slugifyFieldKey(type === 'DIVIDER' ? 'ayirici' : label), fields);
        const inSection = fieldsOf(step);
        const newField: FormFieldDefinition = {
            fieldKey: key,
            label,
            fieldType: type,
            isRequired: false,
            width: 'FULL',
            stepNumber: step,
            sortOrder: (inSection[inSection.length - 1]?.sortOrder ?? fields.length) + 0.5,
            options: meta.hasOptions ? [{ label: 'Seçenek 1', value: 'Seçenek 1', order: 0, active: true }, { label: 'Seçenek 2', value: 'Seçenek 2', order: 1, active: true }] : null,
            uiConfig: type === 'CONSENT' ? { consentKind: 'PRIVACY_NOTICE' } : null,
        };
        commit(sections, [...fields, newField]);
        setSelectedKey(key);
        setAddMenuFor(null);
    };

    const duplicate = (field: FormFieldDefinition) => {
        const key = uniqueKey(`${field.fieldKey}_kopya`, fields);
        commit(sections, [...fields, { ...field, fieldKey: key, label: `${field.label} (kopya)`, sortOrder: (field.sortOrder ?? 0) + 0.5 }]);
        setSelectedKey(key);
    };

    const remove = (field: FormFieldDefinition) => {
        const dependents = fields.filter((f) => f.conditionalRules?.rules.some((r) => r.fieldKey === field.fieldKey));
        const next = fields
            .filter((f) => f.fieldKey !== field.fieldKey)
            .map((f) =>
                dependents.includes(f) && f.conditionalRules
                    ? { ...f, conditionalRules: { ...f.conditionalRules, rules: f.conditionalRules.rules.filter((r) => r.fieldKey !== field.fieldKey) } }
                    : f
            );
        commit(sections, next);
        setSelectedKey(next[0]?.fieldKey || null);
    };

    const moveWithin = (field: FormFieldDefinition, dir: -1 | 1) => {
        const list = fieldsOf(field.stepNumber ?? 1);
        const idx = list.findIndex((f) => f.fieldKey === field.fieldKey);
        const target = list[idx + dir];
        if (!target) return;
        commit(sections, fields.map((f) => (f.fieldKey === field.fieldKey ? { ...f, sortOrder: target.sortOrder } : f.fieldKey === target.fieldKey ? { ...f, sortOrder: field.sortOrder } : f)));
    };

    const dropOn = (targetKey: string | null, step: number) => {
        if (!dragKey) return;
        const dragged = fields.find((f) => f.fieldKey === dragKey);
        if (!dragged) return;
        const target = targetKey ? fields.find((f) => f.fieldKey === targetKey) : null;
        const sortOrder = target ? (target.sortOrder ?? 0) - 0.5 : (fieldsOf(step).slice(-1)[0]?.sortOrder ?? fields.length) + 0.5;
        commit(sections, fields.map((f) => (f.fieldKey === dragKey ? { ...f, stepNumber: step, sortOrder } : f)));
        setDragKey(null);
        setDropTarget(null);
    };

    const addSection = () => {
        const next = Math.max(0, ...sections.map((s) => s.stepNumber)) + 1;
        commit([...sections, { stepNumber: next, title: `Bölüm ${ordered.length + 1}` }], fields);
    };

    const updateSection = (step: number, patch: Partial<FormSectionDefinition>) => commit(sections.map((s) => (s.stepNumber === step ? { ...s, ...patch } : s)), fields);

    const moveSection = (step: number, dir: -1 | 1) => {
        const idx = ordered.findIndex((s) => s.stepNumber === step);
        const target = ordered[idx + dir];
        if (!target) return;
        // Swap step numbers (sections and their questions)
        const a = step;
        const b = target.stepNumber;
        commit(
            sections.map((s) => (s.stepNumber === a ? { ...s, stepNumber: b } : s.stepNumber === b ? { ...s, stepNumber: a } : s)),
            fields.map((f) => ((f.stepNumber ?? 1) === a ? { ...f, stepNumber: b } : (f.stepNumber ?? 1) === b ? { ...f, stepNumber: a } : f))
        );
    };

    const removeSection = (step: number) => {
        if (ordered.length <= 1) return;
        const idx = ordered.findIndex((s) => s.stepNumber === step);
        const fallback = ordered[idx - 1] || ordered[idx + 1];
        commit(
            sections.filter((s) => s.stepNumber !== step),
            fields.map((f) => ((f.stepNumber ?? 1) === step ? { ...f, stepNumber: fallback.stepNumber } : f))
        );
    };

    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="space-y-4">
                {ordered.map((section, sIdx) => {
                    const list = fieldsOf(section.stepNumber);
                    return (
                        <Card key={section.stepNumber} padded={false}>
                            <div className="space-y-2 border-b border-white/10 p-3">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                    <span className="text-[11px] text-gray-500">Bölüm {sIdx + 1}</span>
                                    <div className="ml-auto flex items-center gap-1">
                                        <button type="button" onClick={() => moveSection(section.stepNumber, -1)} disabled={sIdx === 0} className="rounded p-1 text-gray-400 hover:bg-white/5 disabled:opacity-30" aria-label="Bölümü yukarı taşı"><ArrowUp className="h-3.5 w-3.5" /></button>
                                        <button type="button" onClick={() => moveSection(section.stepNumber, 1)} disabled={sIdx === ordered.length - 1} className="rounded p-1 text-gray-400 hover:bg-white/5 disabled:opacity-30" aria-label="Bölümü aşağı taşı"><ArrowDown className="h-3.5 w-3.5" /></button>
                                        <button type="button" onClick={() => removeSection(section.stepNumber)} disabled={ordered.length <= 1} className="rounded p-1 text-rose-400 hover:bg-rose-500/10 disabled:opacity-30" aria-label="Bölümü sil (sorular önceki bölüme taşınır)"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>
                                <TextInput aria-label="Bölüm başlığı" value={section.title} onChange={(e) => updateSection(section.stepNumber, { title: e.target.value })} className="font-medium" />
                                <TextArea aria-label="Bölüm açıklaması" rows={1} placeholder="Bölüm açıklaması (isteğe bağlı)" value={section.description || ''} onChange={(e) => updateSection(section.stepNumber, { description: e.target.value || null })} className="min-h-0 text-xs" />
                            </div>

                            <ul
                                className="divide-y divide-white/5"
                                onDragOver={(e) => { if (dragKey) { e.preventDefault(); } }}
                                onDrop={(e) => { e.preventDefault(); if (!dropTarget) dropOn(null, section.stepNumber); }}
                            >
                                {list.length === 0 && <li className="p-4 text-center text-xs text-gray-500">Bu bölümde soru yok. Soruyu buraya sürükleyin veya ekleyin.</li>}
                                {list.map((f, i) => {
                                    const meta = getFieldTypeMeta(String(f.fieldType));
                                    const hasCondition = (f.conditionalRules?.rules.length || 0) > 0;
                                    return (
                                        <li
                                            key={f.fieldKey}
                                            draggable
                                            onDragStart={() => setDragKey(f.fieldKey)}
                                            onDragEnd={() => { setDragKey(null); setDropTarget(null); }}
                                            onDragOver={(e) => { e.preventDefault(); setDropTarget(f.fieldKey); }}
                                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); dropOn(f.fieldKey, section.stepNumber); }}
                                            className={cx(
                                                'flex items-center gap-2 px-3 py-2',
                                                selectedKey === f.fieldKey ? 'bg-primary/10' : 'hover:bg-white/[0.03]',
                                                dropTarget === f.fieldKey && dragKey !== f.fieldKey && 'border-t-2 border-primary'
                                            )}
                                        >
                                            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-gray-600" aria-hidden="true" />
                                            <button type="button" onClick={() => setSelectedKey(f.fieldKey)} className="min-w-0 flex-1 text-left">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cx('truncate text-sm', meta.isDisplayOnly ? 'italic text-gray-400' : 'text-gray-100')}>{f.label || meta.label}</span>
                                                    {f.isRequired && <Asterisk className="h-3 w-3 shrink-0 text-rose-400" aria-label="Zorunlu" />}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                    <span>{meta.label}</span>
                                                    <span className="font-mono">· {f.fieldKey}</span>
                                                    {hasCondition && <span className="inline-flex items-center gap-0.5 text-amber-400"><EyeOff className="h-3 w-3" />koşullu</span>}
                                                </div>
                                            </button>
                                            <div className="flex shrink-0 items-center">
                                                <button type="button" onClick={() => moveWithin(f, -1)} disabled={i === 0} className="rounded p-1 text-gray-400 hover:bg-white/5 disabled:opacity-30" aria-label="Yukarı taşı"><ArrowUp className="h-3.5 w-3.5" /></button>
                                                <button type="button" onClick={() => moveWithin(f, 1)} disabled={i === list.length - 1} className="rounded p-1 text-gray-400 hover:bg-white/5 disabled:opacity-30" aria-label="Aşağı taşı"><ArrowDown className="h-3.5 w-3.5" /></button>
                                                <button type="button" onClick={() => duplicate(f)} className="rounded p-1 text-gray-400 hover:bg-white/5" aria-label="Soruyu çoğalt"><Copy className="h-3.5 w-3.5" /></button>
                                                <button type="button" onClick={() => remove(f)} className="rounded p-1 text-rose-400 hover:bg-rose-500/10" aria-label="Soruyu sil"><Trash2 className="h-3.5 w-3.5" /></button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="relative border-t border-white/10 p-2">
                                <Button size="sm" icon={Plus} onClick={() => setAddMenuFor(addMenuFor === section.stepNumber ? null : section.stepNumber)} aria-expanded={addMenuFor === section.stepNumber}>
                                    Soru Ekle <ChevronDown className="h-3 w-3" />
                                </Button>
                                {addMenuFor === section.stepNumber && (
                                    <div className="absolute left-2 top-full z-20 mt-1 grid w-[min(560px,90vw)] grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#11111c] p-2 shadow-2xl sm:grid-cols-3">
                                        {FIELD_TYPES.map((t) => (
                                            <button key={t.type} type="button" onClick={() => addQuestion(section.stepNumber, t.type)} className="rounded-lg px-2 py-1.5 text-left text-xs text-gray-300 hover:bg-white/5">
                                                <span className="block text-[10px] text-gray-500">{t.group}</span>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
                <Button icon={Plus} onClick={addSection}>Bölüm Ekle</Button>
            </div>

            <div className="xl:sticky xl:top-20 xl:self-start">
                <Card>
                    {selected ? (
                        <>
                            <div className="mb-4 flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold text-white">Soru ayarları</h2>
                                <Badge>{normalizeFieldType(String(selected.fieldType))}</Badge>
                            </div>
                            <QuestionEditor field={selected} allFields={fields} onChange={(patch) => updateField(selected.fieldKey, patch)} kvkkTexts={kvkkTexts} publishedKeys={publishedKeys} />
                        </>
                    ) : (
                        <EmptyState icon={Eye} title="Düzenlemek için bir soru seçin" description="Soldaki listeden bir soru seçin veya yeni soru ekleyin." />
                    )}
                </Card>
            </div>
        </div>
    );
}
