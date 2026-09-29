"use client";
import React, { useState, useEffect } from 'react';
import { Globe, Plus, Edit2, Trash2, ExternalLink, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface RedirectItem {
    id: string;
    fromUrl: string;
    toUrl: string;
    statusCode: number;
    isActive: boolean;
    hitCount: number;
    lastHitAt: string | null;
    createdAt: string;
}

export default function SeoRedirectsPage() {
    const [redirects, setRedirects] = useState<RedirectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RedirectItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        fromUrl: '',
        toUrl: '',
        statusCode: 301,
        isActive: true,
    });

    const fetchRedirects = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/redirects');
            const data = await res.json();
            if (data.success) {
                setRedirects(data.redirects);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRedirects();
    }, []);

    const handleOpenCreate = () => {
        setEditingItem(null);
        setForm({
            fromUrl: '',
            toUrl: '',
            statusCode: 301,
            isActive: true,
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: RedirectItem) => {
        setEditingItem(item);
        setForm({
            fromUrl: item.fromUrl,
            toUrl: item.toUrl,
            statusCode: item.statusCode,
            isActive: item.isActive,
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const method = editingItem ? 'PUT' : 'POST';
            const body = editingItem ? { id: editingItem.id, ...form } : form;

            const res = await fetch('/api/admin/redirects', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setIsModalOpen(false);
                fetchRedirects();
            } else {
                alert(data.error || 'İşlem başarısız.');
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/admin/redirects?id=${deleteId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchRedirects();
            } else {
                alert(data.error || 'Silinemedi.');
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                        <Globe className="w-7 h-7 text-primary" />
                        SEO & 301/302 Yönlendirmeleri
                    </h1>
                    <p className="text-gray-400 text-xs mt-1">
                        Eski URL yapılarını, değişen sayfaları ve kırık linkleri hedef sayfalara yönlendirin.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchRedirects}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 transition-colors"
                        title="Yenile"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Yönlendirme Ekle
                    </button>
                </div>
            </div>

            {/* Redirects Table */}
            {loading ? (
                <div className="p-12 text-center text-gray-400">Yükleniyor...</div>
            ) : redirects.length === 0 ? (
                <div className="p-12 text-center bg-[#0d0e1a] border border-white/10 rounded-2xl text-gray-400">
                    Henüz kayıtlı bir SEO yönlendirmesi bulunmuyor.
                </div>
            ) : (
                <div className="bg-[#0d0e1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-white/5 text-gray-400 font-mono uppercase text-[10px] border-b border-white/10">
                                <tr>
                                    <th className="p-4">Kaynak URL (From)</th>
                                    <th className="p-4"></th>
                                    <th className="p-4">Hedef URL (To)</th>
                                    <th className="p-4">Durum Kodu</th>
                                    <th className="p-4">Hit (Tıklanma)</th>
                                    <th className="p-4">Durum</th>
                                    <th className="p-4 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300">
                                {redirects.map((r) => (
                                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 font-mono text-rose-300">
                                            {r.fromUrl}
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            <ArrowRight className="w-4 h-4" />
                                        </td>
                                        <td className="p-4 font-mono text-emerald-300">
                                            {r.toUrl}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                                r.statusCode === 301
                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                                {r.statusCode} ({r.statusCode === 301 ? 'Kalıcı' : 'Geçici'})
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-gray-400">
                                            {r.hitCount} kez
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge
                                                status={r.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                label={r.isActive ? 'Aktif' : 'Pasif'}
                                                variant="dot"
                                            />
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleOpenEdit(r)}
                                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(r.id)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0d0e1a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-orbitron font-bold text-white">
                                {editingItem ? 'Yönlendirme Düzenle' : 'Yeni SEO Yönlendirmesi'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Kaynak URL (From) *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.fromUrl}
                                    onChange={(e) => setForm({ ...form, fromUrl: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary font-mono"
                                    placeholder="/eski-girisimciler veya /old-page"
                                />
                                <span className="text-[10px] text-gray-500">Ziyaretçinin yönlendirileceği eski path.</span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Hedef URL (To) *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.toUrl}
                                    onChange={(e) => setForm({ ...form, toUrl: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary font-mono"
                                    placeholder="/girisimciler veya https://..."
                                />
                                <span className="text-[10px] text-gray-500">Ziyaretçinin gitmesi gereken yeni adres.</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Yönlendirme Türü</label>
                                    <select
                                        value={form.statusCode}
                                        onChange={(e) => setForm({ ...form, statusCode: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-[#121324] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                    >
                                        <option value="301">301 - Kalıcı Yönlendirme (SEO önerilen)</option>
                                        <option value="302">302 - Geçici Yönlendirme</option>
                                        <option value="307">307 - Geçici Yönlendirme (Strict)</option>
                                        <option value="308">308 - Kalıcı Yönlendirme (Strict)</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-5">
                                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.isActive}
                                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded text-primary bg-white/5 border-white/10 focus:ring-0"
                                        />
                                        Yönlendirme Aktif
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs transition-colors"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/20 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Yönlendirmeyi Sil"
                message="Bu SEO yönlendirmesini silmek istediğinize emin misiniz?"
                confirmText="Evet, Sil"
                type="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
