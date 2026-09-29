"use client";
import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, Edit2, CheckSquare, Save, Eye, Layers,
    MoveUp, MoveDown, ArrowRight, Check, X, Shield, Smartphone, Monitor
} from 'lucide-react';
import type { FormFieldInput } from '@/lib/types/form';

export default function AdminFormBuilderPage() {
    const [forms, setForms] = useState<any[]>([]);
    const [selectedForm, setSelectedForm] = useState<any | null>(null);
    const [fields, setFields] = useState<FormFieldInput[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [showPreview, setShowPreview] = useState(false);

    // New field draft
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldType, setNewFieldType] = useState('TEXT');
    const [newFieldRequired, setNewFieldRequired] = useState(false);
    const [newFieldStep, setNewFieldStep] = useState(1);

    const fetchForms = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/forms');
            const data = await res.json();
            if (data.success) {
                setForms(data.forms || []);
                if (data.forms?.length > 0 && !selectedForm) {
                    loadForm(data.forms[0]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, []);

    const loadForm = (form: any) => {
        setSelectedForm(form);
        const latestVersion = form.versions?.[0];
        if (latestVersion && latestVersion.fields) {
            setFields(latestVersion.fields);
        } else {
            setFields([]);
        }
    };

    const handleAddField = () => {
        if (!newFieldLabel.trim()) return;

        const fieldKey = newFieldKey.trim() || newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');

        const field: FormFieldInput = {
            fieldKey,
            label: newFieldLabel.trim(),
            fieldType: newFieldType,
            isRequired: newFieldRequired,
            stepNumber: Number(newFieldStep) || 1,
            sortOrder: fields.length,
        };

        setFields([...fields, field]);
        setNewFieldLabel('');
        setNewFieldKey('');
        setNewFieldRequired(false);
    };

    const handleRemoveField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handlePublishVersion = async () => {
        if (!selectedForm) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/forms/${selectedForm.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fields,
                    publishImmediately: true,
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`Yeni Form Sürümü (v${data.version.versionNumber}) başarıyla yayınlandı!`);
                await fetchForms();
            } else {
                alert(data.message || 'Yayınlanamadı');
            }
        } catch {
            alert('Hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Dinamik Form Builder & Sürümleme</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        Sitedeki başvuru, staj ve mentör formlarının alanlarını kodsuz düzenleyin
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-colors"
                    >
                        <Eye className="w-4 h-4 text-primary" />
                        {showPreview ? 'Editöre Dön' : 'Canlı Önizleme'}
                    </button>

                    <button
                        onClick={handlePublishVersion}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 transition-all"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Yayınlanıyor...' : 'Yeni Sürümü Yayınla'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Selector (3 cols) */}
                <div className="lg:col-span-3 space-y-3">
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-4 shadow-xl">
                        <div className="text-xs font-mono font-bold text-gray-400 uppercase mb-3">
                            Mevcut Formlar
                        </div>
                        <div className="space-y-2">
                            {forms.map((f) => {
                                const isSelected = selectedForm?.id === f.id;
                                const latestV = f.versions?.[0];
                                return (
                                    <div
                                        key={f.id}
                                        onClick={() => loadForm(f)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all border ${
                                            isSelected
                                                ? 'bg-primary/20 border-primary/40 text-white'
                                                : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        <div className="font-semibold text-xs mb-1">{f.title}</div>
                                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                                            <span>Sürüm: v{latestV?.versionNumber || 1}</span>
                                            <span className="text-primary">{f.formType}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Form Editor or Live Preview (9 cols) */}
                <div className="lg:col-span-9 space-y-6">
                    {showPreview ? (
                        /* Live Form Preview */
                        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                                <div className="text-sm font-orbitron font-bold text-white">
                                    Canlı Form Görünümü ({fields.length} Alan)
                                </div>
                                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                                    <button
                                        onClick={() => setPreviewMode('desktop')}
                                        className={`p-1.5 rounded-md ${previewMode === 'desktop' ? 'bg-primary text-white' : 'text-gray-400'}`}
                                    >
                                        <Monitor className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode('mobile')}
                                        className={`p-1.5 rounded-md ${previewMode === 'mobile' ? 'bg-primary text-white' : 'text-gray-400'}`}
                                    >
                                        <Smartphone className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className={`mx-auto transition-all ${previewMode === 'mobile' ? 'max-w-sm border-x border-white/10 px-4' : 'w-full'}`}>
                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    {fields.map((f, idx) => (
                                        <div key={f.id || idx}>
                                            <label className="block text-xs font-mono text-gray-300 mb-1">
                                                {f.label} {f.isRequired && <span className="text-rose-400">*</span>}
                                            </label>
                                            {f.fieldType === 'TEXTAREA' ? (
                                                <textarea
                                                    rows={2}
                                                    placeholder={f.placeholder || ''}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 outline-none"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder={f.placeholder || ''}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none"
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-primary/25 mt-4"
                                    >
                                        BAŞVURUYU GÖNDER (ÖNİZLEME)
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        /* Field Editor */
                        <div className="space-y-6">
                            {/* Add Field Bar */}
                            <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                                <div className="text-xs font-orbitron font-bold text-white mb-3">
                                    Forma Yeni Alan Ekle
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                    <div className="sm:col-span-4">
                                        <label className="block text-[11px] font-mono text-gray-400 mb-1">Alan Başlığı (Label) *</label>
                                        <input
                                            type="text"
                                            value={newFieldLabel}
                                            onChange={(e) => setNewFieldLabel(e.target.value)}
                                            placeholder="Örn: Proje Özeti"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className="block text-[11px] font-mono text-gray-400 mb-1">Alan Tipi</label>
                                        <select
                                            value={newFieldType}
                                            onChange={(e) => setNewFieldType(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary [&>option]:bg-[#0e0e18]"
                                        >
                                            <option value="TEXT">Kısa Metin</option>
                                            <option value="TEXTAREA">Uzun Metin (Açıklama)</option>
                                            <option value="EMAIL">E-Posta</option>
                                            <option value="PHONE">Telefon</option>
                                            <option value="NUMBER">Sayısal Değer</option>
                                            <option value="DATE">Tarih</option>
                                            <option value="TC_NO">T.C. Kimlik No</option>
                                            <option value="FILE">Dosya Yükleme (Pitch Deck vb.)</option>
                                            <option value="KVKK">KVKK Onay Kutusu</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-[11px] font-mono text-gray-400 mb-1">Adım (Step)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={newFieldStep}
                                            onChange={(e) => setNewFieldStep(Number(e.target.value))}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="sm:col-span-3 flex items-center gap-3">
                                        <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newFieldRequired}
                                                onChange={(e) => setNewFieldRequired(e.target.checked)}
                                                className="rounded bg-black/40 border-white/20 text-primary"
                                            />
                                            Zorunlu
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleAddField}
                                            className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl transition-colors"
                                        >
                                            Ekle
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Existing Fields List */}
                            <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                                <div className="text-xs font-orbitron font-bold text-white pb-3 mb-4 border-b border-white/10 flex items-center justify-between">
                                    <span>Mevcut Form Alanları ({fields.length})</span>
                                    <span className="text-[10px] font-mono text-gray-500">Immutable UUID Protected</span>
                                </div>

                                <div className="space-y-2.5">
                                    {fields.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 font-mono text-xs">
                                            Bu formda henüz alan bulunmuyor.
                                        </div>
                                    ) : (
                                        fields.map((field, idx) => (
                                            <div
                                                key={field.id || idx}
                                                className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-500 font-mono text-[10px]">#{idx + 1}</span>
                                                    <div>
                                                        <div className="font-semibold text-white">
                                                            {field.label} {field.isRequired && <span className="text-rose-400">*</span>}
                                                        </div>
                                                        <div className="text-[10px] font-mono text-gray-500">
                                                            Key: <span className="text-cyan-400">{field.fieldKey}</span> • Tip: <span className="text-purple-400">{field.fieldType}</span> • Adım: {field.stepNumber}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveField(idx)}
                                                    className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
