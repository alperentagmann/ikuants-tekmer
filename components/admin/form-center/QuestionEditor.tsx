'use client';

import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Field, TextInput, TextArea, Select, Toggle, Button, Badge, inputClass } from '@/components/admin/ui';
import {
    FIELD_TYPES,
    FormFieldDefinition,
    FieldOption,
    ConditionRule,
    getFieldTypeMeta,
    normalizeFieldType,
    slugifyFieldKey,
    isSafePattern,
} from '@/lib/forms/schema';
import { FORM_ICON_NAMES } from '@/components/forms/form-icons';

export interface KvkkTextOption {
    id: string;
    title: string;
    version: string;
}

const SYSTEM_KEYS = [
    { value: '', label: 'Yok' },
    { value: 'applicant_name', label: 'Başvuran / gönderen adı' },
    { value: 'first_name', label: 'Ad' },
    { value: 'last_name', label: 'Soyad' },
    { value: 'applicant_email', label: 'Başvuran e-postası' },
    { value: 'applicant_phone', label: 'Başvuran telefonu' },
    { value: 'company_name', label: 'Şirket / girişim / takım adı' },
    { value: 'tc_number', label: 'T.C. Kimlik No' },
    { value: 'message', label: 'Mesaj / not' },
    { value: 'purpose', label: 'Kullanım amacı (rezervasyon)' },
    { value: 'meeting_topic', label: 'Toplantı konusu' },
    { value: 'meet_with', label: 'Görüşülecek kişi' },
    { value: 'meeting_date', label: 'Toplantı tarihi' },
    { value: 'meeting_time', label: 'Toplantı saati' },
    { value: 'visit_topic', label: 'Ziyaret konusu' },
    { value: 'visit_who', label: 'Ziyaret edilecek kişi' },
    { value: 'visit_date', label: 'Ziyaret tarihi' },
    { value: 'visit_time', label: 'Ziyaret saati' },
    { value: 'group_size', label: 'Kişi sayısı' },
];

const OPERATORS: { value: ConditionRule['operator']; label: string }[] = [
    { value: 'equals', label: 'eşittir' },
    { value: 'not_equals', label: 'eşit değildir' },
    { value: 'contains', label: 'içerir' },
    { value: 'not_contains', label: 'içermez' },
    { value: 'in', label: 'şunlardan biri (| ile ayırın)' },
    { value: 'not_empty', label: 'dolu' },
    { value: 'empty', label: 'boş' },
];

function OptionsEditor({ options, onChange, codeLabel }: { options: FieldOption[]; onChange: (o: FieldOption[]) => void; codeLabel?: boolean }) {
    const update = (index: number, patch: Partial<FieldOption>) => onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)));
    const move = (index: number, dir: -1 | 1) => {
        const next = [...options];
        const target = index + dir;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next.map((o, i) => ({ ...o, order: i })));
    };
    return (
        <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_1fr_auto] gap-2 text-[11px] text-gray-500 sm:grid">
                <span>Görünen metin</span>
                <span>{codeLabel ? 'Kod (kayıtlı değer)' : 'Kayıtlı değer'}</span>
                <span className="w-40 text-right">İşlemler</span>
            </div>
            {options.map((o, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-white/5 p-2 sm:grid-cols-[1fr_1fr_auto] sm:border-0 sm:p-0">
                    <TextInput aria-label={`Seçenek ${i + 1} metni`} value={o.label} onChange={(e) => update(i, { label: e.target.value })} />
                    <TextInput aria-label={`Seçenek ${i + 1} değeri`} value={o.value} onChange={(e) => update(i, { value: e.target.value })} />
                    <div className="flex items-center justify-end gap-1">
                        <label className="flex items-center gap-1 text-[11px] text-gray-400" title="Aktif">
                            <input type="checkbox" checked={o.active !== false} onChange={(e) => update(i, { active: e.target.checked })} /> Aktif
                        </label>
                        <label className="ml-1 flex items-center gap-1 text-[11px] text-gray-400" title="Varsayılan">
                            <input type="checkbox" checked={o.isDefault === true} onChange={(e) => update(i, { isDefault: e.target.checked })} /> Varsayılan
                        </label>
                        <button type="button" onClick={() => move(i, -1)} className="rounded p-1 text-gray-400 hover:bg-white/5" aria-label="Yukarı taşı"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => move(i, 1)} className="rounded p-1 text-gray-400 hover:bg-white/5" aria-label="Aşağı taşı"><ArrowDown className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => onChange(options.filter((_, j) => j !== i))} className="rounded p-1 text-rose-400 hover:bg-rose-500/10" aria-label="Seçeneği sil"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                </div>
            ))}
            <Button size="sm" icon={Plus} onClick={() => onChange([...options, { label: `Seçenek ${options.length + 1}`, value: `Seçenek ${options.length + 1}`, order: options.length, active: true }])}>
                Seçenek Ekle
            </Button>
        </div>
    );
}

export function QuestionEditor({
    field,
    allFields,
    onChange,
    kvkkTexts,
    publishedKeys,
}: {
    field: FormFieldDefinition;
    allFields: FormFieldDefinition[];
    onChange: (patch: Partial<FormFieldDefinition>) => void;
    kvkkTexts: KvkkTextOption[];
    publishedKeys: Set<string>;
}) {
    const type = normalizeFieldType(String(field.fieldType));
    const meta = getFieldTypeMeta(type);
    const ui = field.uiConfig || {};
    const rules = field.validationRules || {};
    const conditions = field.conditionalRules || { logic: 'ALL' as const, rules: [] };
    const otherFields = allFields.filter((f) => f.fieldKey !== field.fieldKey && !getFieldTypeMeta(String(f.fieldType)).isDisplayOnly);
    const setUi = (patch: Record<string, unknown>) => onChange({ uiConfig: { ...ui, ...patch } });
    const setRules = (patch: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...rules, ...patch };
        Object.keys(next).forEach((k) => (next[k] === '' || next[k] === undefined || next[k] === null) && delete next[k]);
        onChange({ validationRules: next });
    };
    const num = (v: string) => (v === '' ? undefined : Number(v));
    const keyLocked = publishedKeys.has(field.fieldKey);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">{meta.label}</Badge>
                {meta.isSensitive && <Badge tone="warning">Hassas veri: maskelenir ve şifrelenir</Badge>}
                {meta.adminOnly && <Badge tone="warning">Public formlarda gösterilmez</Badge>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label={type === 'CONSENT' ? 'Onay metni' : type === 'DESCRIPTION' ? 'Başlık (isteğe bağlı)' : 'Soru metni'} htmlFor="q-label" className="md:col-span-2" required={!meta.isDisplayOnly}>
                    {type === 'CONSENT' ? (
                        <TextArea id="q-label" rows={3} value={field.label} onChange={(e) => onChange({ label: e.target.value })} />
                    ) : (
                        <TextInput id="q-label" value={field.label} onChange={(e) => onChange({ label: e.target.value })} />
                    )}
                </Field>
                <Field label="Soru türü" htmlFor="q-type">
                    <Select id="q-type" value={type} onChange={(e) => onChange({ fieldType: e.target.value })} options={FIELD_TYPES.map((t) => ({ value: t.type, label: `${t.group} · ${t.label}` }))} />
                </Field>
                <Field
                    label="Alan anahtarı"
                    htmlFor="q-key"
                    hint={keyLocked ? 'Yayındaki versiyonda kullanılıyor. Değiştirirseniz yeni versiyonda yeni bir soru olarak kaydedilir.' : 'Kayıtlı cevaplar bu anahtarla saklanır.'}
                >
                    <div className="flex gap-2">
                        <TextInput id="q-key" value={field.fieldKey} onChange={(e) => onChange({ fieldKey: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} className="font-mono" />
                        <Button size="sm" onClick={() => onChange({ fieldKey: slugifyFieldKey(field.label) })}>Metinden</Button>
                    </div>
                </Field>
            </div>

            {!meta.isDisplayOnly && (
                <div className="flex flex-wrap gap-5">
                    <Toggle id="q-required" checked={field.isRequired === true} onChange={(v) => onChange({ isRequired: v })} label="Zorunlu" />
                    {type !== 'CONSENT' && (
                        <Toggle id="q-half" checked={field.width === 'HALF'} onChange={(v) => onChange({ width: v ? 'HALF' : 'FULL' })} label="Yarım genişlik" />
                    )}
                    {type !== 'CONSENT' && <Toggle id="q-highlight" checked={ui.highlight === true} onChange={(v) => setUi({ highlight: v || undefined })} label="Vurgulu kutu" />}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {!meta.isDisplayOnly && type !== 'CONSENT' && (
                    <Field label="Yer tutucu (placeholder)" htmlFor="q-ph">
                        <TextInput id="q-ph" value={field.placeholder || ''} onChange={(e) => onChange({ placeholder: e.target.value || null })} />
                    </Field>
                )}
                {!meta.isDisplayOnly && !['CONSENT', 'FILE', 'FILES'].includes(type) && (
                    <Field label="Varsayılan değer" htmlFor="q-def">
                        <TextInput id="q-def" value={field.defaultValue || ''} onChange={(e) => onChange({ defaultValue: e.target.value || null })} />
                    </Field>
                )}
                <Field label={type === 'DESCRIPTION' ? 'Açıklama metni' : 'Yardım metni'} htmlFor="q-help" className="md:col-span-2">
                    <TextArea id="q-help" rows={2} value={field.helpText || ''} onChange={(e) => onChange({ helpText: e.target.value || null })} />
                </Field>
                {type !== 'DIVIDER' && (
                    <Field label="İkon" htmlFor="q-icon">
                        <Select id="q-icon" value={ui.icon || ''} onChange={(e) => setUi({ icon: e.target.value || undefined })} placeholder="İkon yok" options={FORM_ICON_NAMES.map((n) => ({ value: n, label: n }))} />
                    </Field>
                )}
                {!meta.isDisplayOnly && (
                    <Field label="Sistem rolü" htmlFor="q-role" hint="Başvuru/iletişim kaydında hangi bilgiye karşılık geldiğini belirtir.">
                        <Select id="q-role" value={ui.systemKey || ''} onChange={(e) => setUi({ systemKey: e.target.value || undefined })} options={SYSTEM_KEYS} />
                    </Field>
                )}
            </div>

            {meta.hasOptions && (
                <div>
                    <h3 className="mb-2 text-xs font-semibold text-gray-300">Seçenekler</h3>
                    <OptionsEditor options={field.options || []} onChange={(options) => onChange({ options })} codeLabel={ui.appearance === 'module-cards'} />
                    {['CHECKBOX_GROUP', 'MULTISELECT'].includes(type) && (
                        <div className="mt-3 flex flex-wrap gap-5">
                            <Toggle id="q-modules" checked={ui.appearance === 'module-cards'} onChange={(v) => setUi({ appearance: v ? 'module-cards' : undefined })} label="Kod + başlık kartları" />
                            <Toggle id="q-channels" checked={ui.consentChannels === true} onChange={(v) => setUi({ consentChannels: v || undefined })} label="İletişim izni kanalları (KVKK kaydına yazılır)" />
                        </div>
                    )}
                </div>
            )}

            {type === 'CONSENT' && (
                <div className="space-y-4 rounded-lg border border-white/10 p-4">
                    <h3 className="text-xs font-semibold text-gray-300">Onay / KVKK ayarları</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Onay türü" htmlFor="c-kind">
                            <Select
                                id="c-kind"
                                value={ui.consentKind || 'OTHER'}
                                onChange={(e) => setUi({ consentKind: e.target.value })}
                                options={[
                                    { value: 'PRIVACY_NOTICE', label: 'Aydınlatma metni' },
                                    { value: 'EXPLICIT_CONSENT', label: 'Açık rıza' },
                                    { value: 'MARKETING', label: 'Ticari ileti izni' },
                                    { value: 'PHOTO_VIDEO', label: 'Fotoğraf / video izni' },
                                    { value: 'TERMS', label: 'Beyan / şartlar' },
                                    { value: 'OTHER', label: 'Diğer' },
                                ]}
                            />
                        </Field>
                        <Field label="Bağlı KVKK metni" htmlFor="c-text" hint="Seçilirse metin başlığı tıklanabilir olur ve gönderimde metin versiyonu saklanır.">
                            <Select id="c-text" value={ui.kvkkTextId || ''} onChange={(e) => setUi({ kvkkTextId: e.target.value || undefined })} placeholder="Metin bağlı değil" options={kvkkTexts.map((t) => ({ value: t.id, label: `${t.title} (${t.version})` }))} />
                        </Field>
                        {ui.kvkkTextId && (
                            <>
                                <Field label="Bağlantı metni" htmlFor="c-link" hint="Boş bırakılırsa KVKK metninin başlığı kullanılır.">
                                    <TextInput id="c-link" value={ui.linkLabel || ''} onChange={(e) => setUi({ linkLabel: e.target.value || undefined })} />
                                </Field>
                                <Field label="Bağlantıdan sonraki metin" htmlFor="c-suffix">
                                    <TextInput id="c-suffix" value={ui.linkSuffix || ''} onChange={(e) => setUi({ linkSuffix: e.target.value || undefined })} placeholder="'ni okudum ve kabul ediyorum." />
                                </Field>
                            </>
                        )}
                    </div>
                </div>
            )}

            {!meta.isDisplayOnly && type !== 'CONSENT' && (
                <div className="space-y-3 rounded-lg border border-white/10 p-4">
                    <h3 className="text-xs font-semibold text-gray-300">Doğrulama</h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {['TEXT', 'TEXTAREA'].includes(type) && (
                            <>
                                <Field label="En az karakter" htmlFor="v-minl"><TextInput id="v-minl" type="number" min={0} value={rules.minLength ?? ''} onChange={(e) => setRules({ minLength: num(e.target.value) })} /></Field>
                                <Field label="En fazla karakter" htmlFor="v-maxl"><TextInput id="v-maxl" type="number" min={1} value={rules.maxLength ?? ''} onChange={(e) => setRules({ maxLength: num(e.target.value) })} /></Field>
                            </>
                        )}
                        {['NUMBER', 'CURRENCY'].includes(type) && (
                            <>
                                <Field label="En küçük değer" htmlFor="v-min"><TextInput id="v-min" type="number" value={rules.min ?? ''} onChange={(e) => setRules({ min: num(e.target.value) })} /></Field>
                                <Field label="En büyük değer" htmlFor="v-max"><TextInput id="v-max" type="number" value={rules.max ?? ''} onChange={(e) => setRules({ max: num(e.target.value) })} /></Field>
                            </>
                        )}
                        {['DATE', 'DATETIME'].includes(type) && (
                            <>
                                <Field label="En erken tarih" htmlFor="v-mind"><TextInput id="v-mind" type="date" value={rules.minDate ?? ''} onChange={(e) => setRules({ minDate: e.target.value || undefined })} /></Field>
                                <Field label="En geç tarih" htmlFor="v-maxd"><TextInput id="v-maxd" type="date" value={rules.maxDate ?? ''} onChange={(e) => setRules({ maxDate: e.target.value || undefined })} /></Field>
                            </>
                        )}
                        {['MULTISELECT', 'CHECKBOX_GROUP'].includes(type) && (
                            <>
                                <Field label="En az seçim" htmlFor="v-mins"><TextInput id="v-mins" type="number" min={0} value={rules.minSelections ?? ''} onChange={(e) => setRules({ minSelections: num(e.target.value) })} /></Field>
                                <Field label="En fazla seçim" htmlFor="v-maxs"><TextInput id="v-maxs" type="number" min={1} value={rules.maxSelections ?? ''} onChange={(e) => setRules({ maxSelections: num(e.target.value) })} /></Field>
                            </>
                        )}
                        {['FILE', 'FILES'].includes(type) && (
                            <>
                                <Field label="Maks. boyut (MB)" htmlFor="v-size"><TextInput id="v-size" type="number" min={1} value={rules.maxFileSizeMb ?? ''} onChange={(e) => setRules({ maxFileSizeMb: num(e.target.value) })} /></Field>
                                {type === 'FILES' && <Field label="Maks. dosya sayısı" htmlFor="v-count"><TextInput id="v-count" type="number" min={1} value={rules.maxFiles ?? ''} onChange={(e) => setRules({ maxFiles: num(e.target.value) })} /></Field>}
                                <Field label="İzin verilen uzantılar" htmlFor="v-ext" className="col-span-2" hint="Örn: .pdf, .docx, .png">
                                    <TextInput id="v-ext" value={(rules.allowedFileTypes || []).join(', ')} onChange={(e) => setRules({ allowedFileTypes: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
                                </Field>
                            </>
                        )}
                    </div>
                    {['TEXT', 'TEXTAREA'].includes(type) && (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Field label="Biçim (düzenli ifade)" htmlFor="v-pat" hint="İleri düzey. Güvensiz ifadeler kaydedilmez." error={rules.pattern && !isSafePattern(rules.pattern) ? 'Bu ifade güvenli değil veya geçersiz.' : null}>
                                <TextInput id="v-pat" className="font-mono" value={rules.pattern ?? ''} onChange={(e) => setRules({ pattern: e.target.value || undefined })} />
                            </Field>
                            <Field label="Biçim hatası mesajı" htmlFor="v-patmsg">
                                <TextInput id="v-patmsg" value={rules.patternMessage ?? ''} onChange={(e) => setRules({ patternMessage: e.target.value || undefined })} />
                            </Field>
                        </div>
                    )}
                    {['EMAIL', 'PHONE', 'URL', 'TC_NO'].includes(type) && <p className="text-xs text-gray-500">Bu soru türü için biçim kontrolü otomatik yapılır (sunucuda da doğrulanır).</p>}
                </div>
            )}

            <div className="space-y-3 rounded-lg border border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold text-gray-300">Koşullu gösterim</h3>
                    {conditions.rules.length > 1 && (
                        <select aria-label="Koşul mantığı" value={conditions.logic} onChange={(e) => onChange({ conditionalRules: { ...conditions, logic: e.target.value as 'ALL' | 'ANY' } })} className={`${inputClass} w-auto py-1 text-xs`}>
                            <option value="ALL" className="bg-[#0f0f1a]">Tüm koşullar sağlanırsa (VE)</option>
                            <option value="ANY" className="bg-[#0f0f1a]">Herhangi biri sağlanırsa (VEYA)</option>
                        </select>
                    )}
                </div>
                {conditions.rules.length === 0 && <p className="text-xs text-gray-500">Bu soru her zaman gösterilir.</p>}
                {conditions.rules.map((rule, i) => {
                    const source = otherFields.find((f) => f.fieldKey === rule.fieldKey);
                    const sourceOptions = source?.options || [];
                    const needsValue = !['empty', 'not_empty'].includes(rule.operator);
                    const updateRule = (patch: Partial<ConditionRule>) =>
                        onChange({ conditionalRules: { ...conditions, rules: conditions.rules.map((r, j) => (j === i ? { ...r, ...patch } : r)) } });
                    return (
                        <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr_auto]">
                            <Select aria-label="Koşul sorusu" value={rule.fieldKey} onChange={(e) => updateRule({ fieldKey: e.target.value })} placeholder="Soru seçin" options={otherFields.map((f) => ({ value: f.fieldKey, label: f.label || f.fieldKey }))} />
                            <Select aria-label="Karşılaştırma" value={rule.operator} onChange={(e) => updateRule({ operator: e.target.value as ConditionRule['operator'] })} options={OPERATORS} className="sm:w-48" />
                            {needsValue ? (
                                sourceOptions.length > 0 && ['equals', 'not_equals', 'contains', 'not_contains'].includes(rule.operator) ? (
                                    <Select aria-label="Değer" value={rule.value || ''} onChange={(e) => updateRule({ value: e.target.value })} placeholder="Değer seçin" options={sourceOptions.map((o) => ({ value: o.value, label: o.label }))} />
                                ) : normalizeFieldType(String(source?.fieldType || '')) === 'BOOLEAN' || normalizeFieldType(String(source?.fieldType || '')) === 'CONSENT' ? (
                                    <Select aria-label="Değer" value={rule.value || ''} onChange={(e) => updateRule({ value: e.target.value })} placeholder="Değer seçin" options={[{ value: 'true', label: 'Evet / işaretli' }, { value: 'false', label: 'Hayır / işaretsiz' }]} />
                                ) : (
                                    <TextInput aria-label="Değer" value={rule.value || ''} onChange={(e) => updateRule({ value: e.target.value })} />
                                )
                            ) : (
                                <span />
                            )}
                            <button type="button" onClick={() => onChange({ conditionalRules: { ...conditions, rules: conditions.rules.filter((_, j) => j !== i) } })} className="rounded p-2 text-rose-400 hover:bg-rose-500/10" aria-label="Koşulu sil">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
                <Button size="sm" icon={Plus} disabled={otherFields.length === 0} onClick={() => onChange({ conditionalRules: { ...conditions, rules: [...conditions.rules, { fieldKey: otherFields[0]?.fieldKey || '', operator: 'equals', value: '' }] } })}>
                    Koşul Ekle
                </Button>
            </div>
        </div>
    );
}
