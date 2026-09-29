"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Plus, Edit2, Trash2, Send, CheckCircle2, AlertCircle, Eye, RefreshCw, Variable } from 'lucide-react';

interface EmailTemplate {
    id: string;
    key: string;
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string | null;
    variables: string[];
    category: string;
    description?: string | null;
    isActive: boolean;
    updatedAt: string;
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [testEmailRecipient, setTestEmailRecipient] = useState('');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [formKey, setFormKey] = useState('');
    const [formName, setFormName] = useState('');
    const [formSubject, setFormSubject] = useState('');
    const [formBodyHtml, setFormBodyHtml] = useState('');
    const [formCategory, setFormCategory] = useState('SYSTEM');
    const [formDescription, setFormDescription] = useState('');
    const [formIsActive, setFormIsActive] = useState(true);
    const [formVariables, setFormVariables] = useState<string[]>([]);
    const [varInput, setVarInput] = useState('');

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/email-templates');
            const data = await res.json();
            if (data.templates) {
                setTemplates(data.templates);
                if (!selectedTemplate && data.templates.length > 0) {
                    setSelectedTemplate(data.templates[0]);
                }
            }
        } catch {
            setMessage({ type: 'error', text: 'Şablonlar yüklenirken hata oluştu' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSelectTemplate = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setIsEditing(false);
    };

    const handleOpenCreate = () => {
        setSelectedTemplate(null);
        setFormKey('');
        setFormName('');
        setFormSubject('');
        setFormBodyHtml('');
        setFormCategory('SYSTEM');
        setFormDescription('');
        setFormIsActive(true);
        setFormVariables([]);
        setIsEditing(true);
    };

    const handleOpenEdit = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setFormKey(template.key);
        setFormName(template.name);
        setFormSubject(template.subject);
        setFormBodyHtml(template.bodyHtml);
        setFormCategory(template.category);
        setFormDescription(template.description || '');
        setFormIsActive(template.isActive);
        setFormVariables(template.variables || []);
        setIsEditing(true);
    };

    const handleAddVariable = () => {
        if (!varInput.trim()) return;
        const cleanVar = varInput.trim().replace(/[{}]/g, '');
        if (!formVariables.includes(cleanVar)) {
            setFormVariables([...formVariables, cleanVar]);
        }
        setVarInput('');
    };

    const handleRemoveVariable = (v: string) => {
        setFormVariables(formVariables.filter((item) => item !== v));
    };

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        try {
            const payload = {
                key: formKey,
                name: formName,
                subject: formSubject,
                bodyHtml: formBodyHtml,
                category: formCategory,
                description: formDescription,
                isActive: formIsActive,
                variables: formVariables,
            };

            const url = selectedTemplate && selectedTemplate.id
                ? `/api/admin/email-templates?id=${selectedTemplate.id}`
                : '/api/admin/email-templates';

            const method = selectedTemplate && selectedTemplate.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'E-posta şablonu başarıyla kaydedildi' });
                setIsEditing(false);
                fetchTemplates();
            } else {
                setMessage({ type: 'error', text: data.error || 'Kaydetme başarısız' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Sunucu hatası oluştu' });
        }
    };

    const handleSendTestEmail = async () => {
        if (!selectedTemplate || !testEmailRecipient) {
            setMessage({ type: 'error', text: 'Lütfen test e-posta adresi girin' });
            return;
        }

        setIsSendingTest(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/email-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_test',
                    templateKey: selectedTemplate.key,
                    recipientEmail: testEmailRecipient,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: `Test e-postası kuyruğa eklendi: ${testEmailRecipient}` });
                setTestEmailRecipient('');
            } else {
                setMessage({ type: 'error', text: data.error || 'Test e-postası gönderilemedi' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Test gönderiminde hata' });
        } finally {
            setIsSendingTest(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-orbitron text-white tracking-wide flex items-center gap-3">
                        <Mail className="w-7 h-7 text-primary" />
                        E-Posta Şablon Motoru
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Sistem ve CRM e-posta şablonlarını yönetin, dinamik parametreleri düzenleyin ve test edin.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchTemplates}
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
                        Yeni Şablon
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

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Templates List Sidebar */}
                <div className="lg:col-span-4 bg-[#090912]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3">
                    <div className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider px-2">
                        Şablon Listesi ({templates.length})
                    </div>
                    {isLoading ? (
                        <div className="py-12 text-center text-gray-500 text-xs">Yükleniyor...</div>
                    ) : templates.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 text-xs">Henüz şablon bulunmuyor</div>
                    ) : (
                        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-1">
                            {templates.map((tpl) => {
                                const isSelected = selectedTemplate?.id === tpl.id;
                                return (
                                    <div
                                        key={tpl.id}
                                        onClick={() => handleSelectTemplate(tpl)}
                                        className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                                            isSelected
                                                ? 'bg-primary/20 border-primary/40 text-white shadow-md shadow-primary/10'
                                                : 'bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-semibold text-xs truncate">{tpl.name}</div>
                                            <span
                                                className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                                    tpl.isActive
                                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                }`}
                                            >
                                                {tpl.isActive ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </div>
                                        <div className="text-[11px] font-mono text-gray-400 truncate mt-1">
                                            {tpl.key}
                                        </div>
                                        <div className="text-[11px] text-gray-400/80 truncate mt-1">
                                            Konu: {tpl.subject}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Template Detail / Editor */}
                <div className="lg:col-span-8 space-y-6">
                    {isEditing ? (
                        <form onSubmit={handleSaveTemplate} className="bg-[#090912]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-5">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <Edit2 className="w-4 h-4 text-primary" />
                                    {selectedTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs"
                                >
                                    İptal
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Şablon Anahtarı (Key) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formKey}
                                        onChange={(e) => setFormKey(e.target.value)}
                                        disabled={!!selectedTemplate}
                                        placeholder="ornek: APPLICATION_CONFIRMATION"
                                        required
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-primary focus:outline-none disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Şablon Adı *
                                    </label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="Başvuru Alındı Bildirimi"
                                        required
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Kategori
                                    </label>
                                    <select
                                        value={formCategory}
                                        onChange={(e) => setFormCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                    >
                                        <option value="APPLICATION">Başvuru Bildirimleri</option>
                                        <option value="TASK">Görev Bildirimleri</option>
                                        <option value="AUTH">Kimlik & Güvenlik</option>
                                        <option value="CRM">CRM & Paydaş</option>
                                        <option value="SYSTEM">Sistem Bildirimleri</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Açıklama
                                    </label>
                                    <input
                                        type="text"
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="Başvuru başarıyla oluşturulduğunda gönderilir"
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    E-Posta Konusu (Subject) *
                                </label>
                                <input
                                    type="text"
                                    value={formSubject}
                                    onChange={(e) => setFormSubject(e.target.value)}
                                    placeholder="Başvurunuz Alındı — {{applicationNumber}}"
                                    required
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                />
                            </div>

                            {/* Variables tags */}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-gray-400">
                                    Dinamik Değişkenler (Variables)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={varInput}
                                        onChange={(e) => setVarInput(e.target.value)}
                                        placeholder="applicantName"
                                        className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-primary focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddVariable}
                                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold"
                                    >
                                        Değişken Ekle
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {formVariables.map((v) => (
                                        <span
                                            key={v}
                                            className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-md text-[11px] font-mono flex items-center gap-1.5"
                                        >
                                            <Variable className="w-3 h-3" />
                                            {`{{${v}}}`}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVariable(v)}
                                                className="hover:text-rose-400 text-xs"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    HTML Şablon İçeriği *
                                </label>
                                <textarea
                                    rows={10}
                                    value={formBodyHtml}
                                    onChange={(e) => setFormBodyHtml(e.target.value)}
                                    placeholder="<div style='font-family: sans-serif;'>...</div>"
                                    required
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="formIsActive"
                                    checked={formIsActive}
                                    onChange={(e) => setFormIsActive(e.target.checked)}
                                    className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                                />
                                <label htmlFor="formIsActive" className="text-xs text-gray-300">
                                    Şablon Aktif (E-posta bildirimlerinde kullanılsın)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20"
                                >
                                    Şablonu Kaydet
                                </button>
                            </div>
                        </form>
                    ) : selectedTemplate ? (
                        <div className="bg-[#090912]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                            {/* Template Header Details */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold text-white">{selectedTemplate.name}</h2>
                                        <span
                                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                                                selectedTemplate.isActive
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                            }`}
                                        >
                                            {selectedTemplate.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono text-primary mt-1">
                                        Anahtar: {selectedTemplate.key}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(selectedTemplate)}
                                        className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        Düzenle
                                    </button>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                    <span className="text-gray-400">Konu (Subject):</span>
                                    <div className="font-semibold text-white mt-1">{selectedTemplate.subject}</div>
                                </div>
                                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                    <span className="text-gray-400">Kategori:</span>
                                    <div className="font-semibold text-white mt-1">{selectedTemplate.category}</div>
                                </div>
                            </div>

                            {/* Variables list */}
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-gray-400">Desteklenen Değişkenler:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedTemplate.variables?.map((v) => (
                                        <span
                                            key={v}
                                            className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-mono"
                                        >
                                            {`{{${v}}}`}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Live HTML Preview */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                                        <Eye className="w-3.5 h-3.5" />
                                        Şablon Önizlemesi (HTML)
                                    </span>
                                </div>
                                <div className="p-4 bg-white rounded-xl text-black overflow-x-auto min-h-[220px]">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: selectedTemplate.bodyHtml,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Send Test Email Box */}
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-3">
                                <span className="text-xs font-bold text-white flex items-center gap-2">
                                    <Send className="w-3.5 h-3.5 text-primary" />
                                    Test E-Postası Gönder
                                </span>
                                <p className="text-[11px] text-gray-400">
                                    Bu şablonun görünümünü test etmek için e-posta adresinizi girin.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={testEmailRecipient}
                                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                                        placeholder="admin@ikuanstekmer.com"
                                        className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                    />
                                    <button
                                        onClick={handleSendTestEmail}
                                        disabled={isSendingTest}
                                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSendingTest ? 'Gönderiliyor...' : 'Test Gönder'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#090912]/80 border border-white/10 rounded-2xl p-12 text-center text-gray-500 text-xs">
                            Görüntülemek için soldaki listeden bir şablon seçin veya yeni oluşturun.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
