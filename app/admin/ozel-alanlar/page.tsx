"use client";

import React, { useState, useEffect } from 'react';
import { Folder, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface CustomField {
    id: string;
    module: string;
    key: string;
    label: string;
    type: string;
    description?: string | null;
    placeholder?: string | null;
    isRequired: boolean;
    isPublic: boolean;
    defaultValue?: string | null;
    options: string[];
    validationRule?: string | null;
    viewRoles: string[];
    editRoles: string[];
    order: number;
    isActive: boolean;
}

/** API / DB row (CustomFieldDefinition) */
type FieldDefinition = {
    id: string;
    moduleKey: string;
    fieldKey: string;
    label: string;
    fieldType: string;
    description?: string | null;
    placeholder?: string | null;
    isRequired: boolean;
    isPublic: boolean;
    defaultValue?: string | null;
    optionsJson?: string | null;
    sortOrder: number;
    isActive: boolean;
};

function parseOptions(json?: string | null): string[] {
    try {
        const v = json ? JSON.parse(json) : [];
        return Array.isArray(v) ? v.map(String) : [];
    } catch {
        return [];
    }
}

const toField = (d: FieldDefinition): CustomField => ({
    id: d.id,
    module: d.moduleKey,
    key: d.fieldKey,
    label: d.label,
    type: d.fieldType,
    description: d.description,
    placeholder: d.placeholder,
    isRequired: d.isRequired,
    isPublic: d.isPublic,
    defaultValue: d.defaultValue,
    options: parseOptions(d.optionsJson),
    viewRoles: [],
    editRoles: [],
    order: d.sortOrder,
    isActive: d.isActive,
});

const MODULES = [
    { key: 'ENTREPRENEUR', label: 'Girişimciler' },
    { key: 'MENTOR', label: 'Mentörler' },
    { key: 'TASK', label: 'Görevler' },
    { key: 'APPLICATION', label: 'Başvurular' },
    { key: 'ACTIVITY', label: 'Kurumsal Faaliyetler' },
    { key: 'PROJECT', label: 'Projeler' },
];

const FIELD_TYPES = [
    { key: 'TEXT', label: 'Tek Satır Metin (Text)' },
    { key: 'TEXTAREA', label: 'Çok Satırlı Metin (Textarea)' },
    { key: 'NUMBER', label: 'Sayı (Number)' },
    { key: 'CURRENCY', label: 'Para Birimi (Currency)' },
    { key: 'BOOLEAN', label: 'Evet / Hayır (Boolean)' },
    { key: 'DATE', label: 'Tarih (Date)' },
    { key: 'SELECT', label: 'Tekli Seçim (Select)' },
    { key: 'MULTI_SELECT', label: 'Çoklu Seçim (Multi-Select)' },
    { key: 'URL', label: 'Web Adresi (URL)' },
    { key: 'EMAIL', label: 'E-Posta (Email)' },
    { key: 'PHONE', label: 'Telefon (Phone)' },
];

export default function CustomFieldsPage() {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [selectedModule, setSelectedModule] = useState('ENTREPRENEUR');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<CustomField | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [formKey, setFormKey] = useState('');
    const [formLabel, setFormLabel] = useState('');
    const [formType, setFormType] = useState('TEXT');
    const [formDesc, setFormDesc] = useState('');
    const [formPlaceholder, setFormPlaceholder] = useState('');
    const [formIsRequired, setFormIsRequired] = useState(false);
    const [formIsPublic, setFormIsPublic] = useState(false);
    const [formDefaultValue, setFormDefaultValue] = useState('');
    const [formOptions, setFormOptions] = useState<string[]>([]);
    const [optionsInput, setOptionsInput] = useState('');
    const [formOrder, setFormOrder] = useState(0);

    const fetchFields = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/custom-fields?module=${selectedModule}`);
            const data = await res.json();
            // The API returns the list as `definitions`
            if (Array.isArray(data.definitions)) setFields((data.definitions as FieldDefinition[]).map(toField));
        } catch {
            setMessage({ type: 'error', text: 'Özel alanlar yüklenemedi' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFields();
    }, [selectedModule]);

    const handleOpenCreate = () => {
        setEditingField(null);
        setFormKey('');
        setFormLabel('');
        setFormType('TEXT');
        setFormDesc('');
        setFormPlaceholder('');
        setFormIsRequired(false);
        setFormIsPublic(false);
        setFormDefaultValue('');
        setFormOptions([]);
        setOptionsInput('');
        setFormOrder(fields.length);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (f: CustomField) => {
        setEditingField(f);
        setFormKey(f.key);
        setFormLabel(f.label);
        setFormType(f.type);
        setFormDesc(f.description || '');
        setFormPlaceholder(f.placeholder || '');
        setFormIsRequired(f.isRequired);
        setFormIsPublic(f.isPublic);
        setFormDefaultValue(f.defaultValue || '');
        setFormOptions(f.options || []);
        setOptionsInput((f.options || []).join(', '));
        setFormOrder(f.order);
        setIsModalOpen(true);
    };

    const handleSaveField = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        try {
            const parsedOptions = optionsInput
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            // Field names the API / CustomFieldService expect
            const payload = {
                ...(editingField ? { id: editingField.id } : { moduleKey: selectedModule, fieldKey: formKey }),
                label: formLabel,
                fieldType: formType,
                description: formDesc || undefined,
                placeholder: formPlaceholder || undefined,
                isRequired: formIsRequired,
                isPublic: formIsPublic,
                defaultValue: formDefaultValue || undefined,
                optionsJson: parsedOptions.length ? JSON.stringify(parsedOptions) : undefined,
                sortOrder: Number(formOrder) || 0,
            };

            const url = '/api/admin/custom-fields';
            const method = editingField ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Özel alan başarıyla kaydedildi' });
                setIsModalOpen(false);
                fetchFields();
            } else {
                setMessage({ type: 'error', text: data.message || data.error || 'İşlem başarısız' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Sunucu hatası oluştu' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu özel alanı silmek istediğinizden emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/custom-fields?id=${id}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setMessage({ type: 'success', text: 'Özel alan silindi' });
                fetchFields();
            } else {
                setMessage({ type: 'error', text: data.message || 'Silme işlemi başarısız' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Silme işlemi başarısız' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-orbitron text-white tracking-wide flex items-center gap-3">
                        <Folder className="w-7 h-7 text-primary" />
                        Modül Bazlı Özel Alan Yönetimi
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Sistemdeki varlıklara (Girişimci, Mentör, Görev, Faaliyet vb.) kod yazmadan özel alanlar ekleyin.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchFields}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 text-xs font-semibold flex items-center gap-2 transition"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Yenile
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Alan Ekle
                    </button>
                </div>
            </div>

            {/* Alert Message */}
            {message && (
                <div
                    className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
                        message.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Module Selector Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl">
                {MODULES.map((m) => (
                    <button
                        key={m.key}
                        onClick={() => setSelectedModule(m.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                            selectedModule === m.key
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Fields Table */}
            <div className="bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-gray-400 border-b border-white/10 font-mono uppercase text-[10px]">
                            <tr>
                                <th className="p-4">Sıra</th>
                                <th className="p-4">Etiket (Label)</th>
                                <th className="p-4">Anahtar (Key)</th>
                                <th className="p-4">Tip</th>
                                <th className="p-4">Zorunlu</th>
                                <th className="p-4">Public</th>
                                <th className="p-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : fields.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Bu modül için henüz tanımlanmış özel alan bulunmuyor.
                                    </td>
                                </tr>
                            ) : (
                                fields.map((f) => (
                                    <tr key={f.id} className="hover:bg-white/[0.02] transition">
                                        <td className="p-4 font-mono text-gray-400">{f.order}</td>
                                        <td className="p-4 font-semibold text-white">
                                            {f.label}
                                            {f.description && (
                                                <div className="text-[11px] text-gray-400 font-normal">
                                                    {f.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono text-primary text-[11px]">
                                            {f.key}
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-mono text-[11px]">
                                                {f.type}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {f.isRequired ? (
                                                <span className="text-amber-400 font-semibold font-mono">
                                                    Evet
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 font-mono">Hayır</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {f.isPublic ? (
                                                <span className="text-emerald-400 font-semibold font-mono">
                                                    Evet
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 font-mono">Gizli</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenEdit(f)}
                                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(f.id)}
                                                className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h2 className="text-base font-bold text-white">
                                {editingField ? 'Özel Alanı Düzenle' : 'Yeni Özel Alan Ekle'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white text-sm"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveField} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Alan Adı (Label) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formLabel}
                                        onChange={(e) => setFormLabel(e.target.value)}
                                        placeholder="TRL Seviyesi"
                                        required
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Alan Anahtarı (Key) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formKey}
                                        onChange={(e) => setFormKey(e.target.value)}
                                        disabled={!!editingField}
                                        placeholder="trlLevel"
                                        required
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-primary focus:outline-none disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Alan Tipi *
                                    </label>
                                    <select
                                        value={formType}
                                        onChange={(e) => setFormType(e.target.value)}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                    >
                                        {FIELD_TYPES.map((t) => (
                                            <option key={t.key} value={t.key}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Görünüm Sırası
                                    </label>
                                    <input
                                        type="number"
                                        value={formOrder}
                                        onChange={(e) => setFormOrder(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            {(formType === 'SELECT' || formType === 'MULTISELECT') && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Seçenekler (Virgülle ayırın) *
                                    </label>
                                    <input
                                        type="text"
                                        value={optionsInput}
                                        onChange={(e) => setOptionsInput(e.target.value)}
                                        placeholder="TRL 1-3, TRL 4-6, TRL 7-9"
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    Açıklama / Yardım Metni
                                </label>
                                <input
                                    type="text"
                                    value={formDesc}
                                    onChange={(e) => setFormDesc(e.target.value)}
                                    placeholder="Teknoloji hazırlık seviyesi"
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formIsRequired}
                                        onChange={(e) => setFormIsRequired(e.target.checked)}
                                        className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                                    />
                                    Zorunlu Alan
                                </label>
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formIsPublic}
                                        onChange={(e) => setFormIsPublic(e.target.checked)}
                                        className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                                    />
                                    Public Profilde Göster
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
