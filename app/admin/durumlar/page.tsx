"use client";

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw, MoveRight } from 'lucide-react';

interface PipelineStatus {
    id: string;
    pipeline: string;
    key: string;
    label: string;
    color: string;
    order: number;
    isInitial: boolean;
    isFinal: boolean;
    allowedTransitions: string[];
    isActive: boolean;
}

const PIPELINES = [
    { key: 'APPLICATION', label: 'Başvuru Pipeline' },
    { key: 'TASK', label: 'Görev Durumları' },
    { key: 'PROJECT', label: 'Proje Aşamaları' },
];

export default function PipelineStatusPage() {
    const [statuses, setStatuses] = useState<PipelineStatus[]>([]);
    const [selectedPipeline, setSelectedPipeline] = useState('APPLICATION');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStatus, setEditingStatus] = useState<PipelineStatus | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [formKey, setFormKey] = useState('');
    const [formLabel, setFormLabel] = useState('');
    const [formColor, setFormColor] = useState('#8b5cf6');
    const [formOrder, setFormOrder] = useState(0);
    const [formIsInitial, setFormIsInitial] = useState(false);
    const [formIsFinal, setFormIsFinal] = useState(false);
    const [formAllowedTransitions, setFormAllowedTransitions] = useState<string[]>([]);
    const [transitionsInput, setTransitionsInput] = useState('');

    const fetchStatuses = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/pipelines?pipeline=${selectedPipeline}`);
            const data = await res.json();
            if (data.statuses) setStatuses(data.statuses);
        } catch {
            setMessage({ type: 'error', text: 'Durumlar yüklenemedi' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, [selectedPipeline]);

    const handleOpenCreate = () => {
        setEditingStatus(null);
        setFormKey('');
        setFormLabel('');
        setFormColor('#8b5cf6');
        setFormOrder(statuses.length);
        setFormIsInitial(false);
        setFormIsFinal(false);
        setFormAllowedTransitions([]);
        setTransitionsInput('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (st: PipelineStatus) => {
        setEditingStatus(st);
        setFormKey(st.key);
        setFormLabel(st.label);
        setFormColor(st.color);
        setFormOrder(st.order);
        setFormIsInitial(st.isInitial);
        setFormIsFinal(st.isFinal);
        setFormAllowedTransitions(st.allowedTransitions || []);
        setTransitionsInput((st.allowedTransitions || []).join(', '));
        setIsModalOpen(true);
    };

    const handleSaveStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        try {
            const parsedTransitions = transitionsInput
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            const payload = {
                pipeline: selectedPipeline,
                key: formKey,
                label: formLabel,
                color: formColor,
                order: Number(formOrder),
                isInitial: formIsInitial,
                isFinal: formIsFinal,
                allowedTransitions: parsedTransitions,
                isActive: true,
            };

            const url = editingStatus
                ? `/api/admin/pipelines?id=${editingStatus.id}`
                : '/api/admin/pipelines';
            const method = editingStatus ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Pipeline durumu kaydedildi' });
                setIsModalOpen(false);
                fetchStatuses();
            } else {
                setMessage({ type: 'error', text: data.error || 'İşlem başarısız' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Sunucu hatası oluştu' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu durumu silmek istediğinizden emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/pipelines?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Durum silindi' });
                fetchStatuses();
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
                        <Layers className="w-7 h-7 text-primary" />
                        Pipeline & Durum Yönetimi
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Başvuru, görev ve projeler için aşamaları, durum geçiş kurallarını ve görsel renkleri özelleştirin.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStatuses}
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
                        Yeni Durum Ekle
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

            {/* Pipeline Tabs */}
            <div className="flex gap-2 p-1.5 bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl">
                {PIPELINES.map((p) => (
                    <button
                        key={p.key}
                        onClick={() => setSelectedPipeline(p.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                            selectedPipeline === p.key
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Status Flow Visualization */}
            <div className="p-6 bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl space-y-3">
                <div className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                    Pipeline Akışı (Sıralı)
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    {statuses.map((st, idx) => (
                        <React.Fragment key={st.id}>
                            <div
                                className="px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-semibold"
                                style={{
                                    borderColor: `${st.color}50`,
                                    backgroundColor: `${st.color}15`,
                                    color: st.color,
                                }}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: st.color }}
                                />
                                {st.label}
                                {st.isInitial && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                                        Başlangıç
                                    </span>
                                )}
                                {st.isFinal && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                        Sonuç
                                    </span>
                                )}
                            </div>
                            {idx < statuses.length - 1 && (
                                <MoveRight className="w-4 h-4 text-gray-600" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-gray-400 border-b border-white/10 font-mono uppercase text-[10px]">
                            <tr>
                                <th className="p-4">Sıra</th>
                                <th className="p-4">Görünür İsim (Label)</th>
                                <th className="p-4">Teknik Anahtar (Key)</th>
                                <th className="p-4">Renk</th>
                                <th className="p-4">İzin Verilen Geçişler</th>
                                <th className="p-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : statuses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Bu pipeline için durum tanımlanmadı.
                                    </td>
                                </tr>
                            ) : (
                                statuses.map((st) => (
                                    <tr key={st.id} className="hover:bg-white/[0.02] transition">
                                        <td className="p-4 font-mono text-gray-400">{st.order}</td>
                                        <td className="p-4 font-semibold text-white flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: st.color }}
                                            />
                                            {st.label}
                                        </td>
                                        <td className="p-4 font-mono text-primary text-[11px]">
                                            {st.key}
                                        </td>
                                        <td className="p-4 font-mono text-gray-400">{st.color}</td>
                                        <td className="p-4 text-gray-400 font-mono text-[11px]">
                                            {st.allowedTransitions?.length
                                                ? st.allowedTransitions.join(', ')
                                                : 'Serbest'}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenEdit(st)}
                                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(st.id)}
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
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h2 className="text-base font-bold text-white">
                                {editingStatus ? 'Durumu Düzenle' : 'Yeni Durum Ekle'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white text-sm"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveStatus} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    Durum Adı (Label) *
                                </label>
                                <input
                                    type="text"
                                    value={formLabel}
                                    onChange={(e) => setFormLabel(e.target.value)}
                                    placeholder="Ön İnceleme"
                                    required
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Anahtar (Key) *
                                    </label>
                                    <input
                                        type="text"
                                        value={formKey}
                                        onChange={(e) => setFormKey(e.target.value)}
                                        disabled={!!editingStatus}
                                        placeholder="UNDER_REVIEW"
                                        required
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-primary focus:outline-none disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        Renk Kodu
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={formColor}
                                            onChange={(e) => setFormColor(e.target.value)}
                                            className="w-9 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                                        />
                                        <input
                                            type="text"
                                            value={formColor}
                                            onChange={(e) => setFormColor(e.target.value)}
                                            className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                </div>
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

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                    İzin Verilen Geçişler (Virgülle ayırın, boş bırakılırsa serbest)
                                </label>
                                <input
                                    type="text"
                                    value={transitionsInput}
                                    onChange={(e) => setTransitionsInput(e.target.value)}
                                    placeholder="JURY_EVALUATION, REJECTED, ACCEPTED"
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formIsInitial}
                                        onChange={(e) => setFormIsInitial(e.target.checked)}
                                        className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                                    />
                                    Başlangıç Durumu
                                </label>
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formIsFinal}
                                        onChange={(e) => setFormIsFinal(e.target.checked)}
                                        className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                                    />
                                    Sonuç (Final) Durumu
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
