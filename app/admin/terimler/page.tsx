"use client";
import React, { useState, useEffect } from 'react';
import { Type, Save, RotateCcw, CheckCircle2, AlertCircle, Search, RefreshCw } from 'lucide-react';

export default function AdminTerimlerPage() {
    const [labels, setLabels] = useState<any[]>([]);
    const [editedLabels, setEditedLabels] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('ALL');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchLabels = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/terminology');
            const data = await res.json();
            if (data.success) {
                setLabels(data.labels || []);
                const initialMap: Record<string, string> = {};
                (data.labels || []).forEach((l: any) => {
                    initialMap[l.key] = l.customLabel || l.defaultLabel;
                });
                setEditedLabels(initialMap);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabels();
    }, []);

    const handleSaveAll = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const items = Object.entries(editedLabels).map(([key, customLabel]) => ({
                key,
                customLabel,
            }));

            const res = await fetch('/api/admin/terminology', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Tüm terimler ve etiketler başarıyla kaydedildi!' });
                await fetchLabels();
            } else {
                setMessage({ type: 'error', text: data.message || 'Kaydedilemedi.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Kaydetme sırasında bir hata oluştu.' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = (key: string, defaultLabel: string) => {
        setEditedLabels({
            ...editedLabels,
            [key]: defaultLabel,
        });
    };

    const filteredLabels = labels.filter((l) => {
        const matchesSearch =
            l.key.toLowerCase().includes(search.toLowerCase()) ||
            l.defaultLabel.toLowerCase().includes(search.toLowerCase()) ||
            (l.description && l.description.toLowerCase().includes(search.toLowerCase()));

        const matchesGroup = groupFilter === 'ALL' || l.group === groupFilter;
        return matchesSearch && matchesGroup;
    });

    const groups = Array.from(new Set(labels.map((l) => l.group).filter(Boolean)));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white flex items-center gap-2.5">
                        <Type className="w-6 h-6 text-primary" />
                        Terminoloji & Etiket Yönetimi
                    </h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        Sistemdeki modül isimleri, durum metinleri ve buton başlıklarını kod değiştirmeden özelleştirin
                    </p>
                </div>

                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Değişiklikleri Kaydet
                </button>
            </div>

            {message && (
                <div
                    className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
                        message.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {message.text}
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0e0e18] border border-white/10 p-3.5 rounded-xl">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Anahtar veya etiket ara..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-white outline-none"
                    />
                </div>

                <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none [&>option]:bg-[#0e0e18] w-full sm:w-auto"
                >
                    <option value="ALL">Tüm Kategoriler</option>
                    {groups.map((g) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
            </div>

            {/* Terminology Grid / Table */}
            <div className="bg-[#0e0e18] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 text-xs font-mono">Yükleniyor...</div>
                ) : filteredLabels.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-xs font-mono">Eşleşen terim bulunamadı.</div>
                ) : (
                    <table className="w-full text-left text-xs">
                        <thead className="bg-black/40 border-b border-white/10 text-gray-400 font-mono text-[11px]">
                            <tr>
                                <th className="p-4">Anahtar (Sistem Kodu)</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4">Varsayılan Metin</th>
                                <th className="p-4">Görünen Özelleştirilmiş Metin</th>
                                <th className="p-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredLabels.map((item) => (
                                <tr key={item.key} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 font-mono text-cyan-400 text-[11px] font-semibold">
                                        {item.key}
                                        {item.description && (
                                            <div className="text-[10px] text-gray-400 font-sans mt-0.5">{item.description}</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 font-mono text-[10px]">
                                            {item.group}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 font-medium">
                                        {item.defaultLabel}
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            value={editedLabels[item.key] || ''}
                                            onChange={(e) => setEditedLabels({ ...editedLabels, [item.key]: e.target.value })}
                                            className="w-full bg-black/50 border border-white/15 focus:border-primary rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                                        />
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleReset(item.key, item.defaultLabel)}
                                            title="Varsayılana Sıfırla"
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
