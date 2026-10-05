"use client";
import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { RevisionViewer } from '@/components/admin/RevisionViewer';
import { Plus, Edit2, Trash2, HelpCircle, History, ArrowLeft, Save, X } from 'lucide-react';

export default function AdminDesteklerPage() {
    const [supports, setSupports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [viewingRevisionsId, setViewingRevisionsId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchSupports = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/supports');
            const data = await res.json();
            if (data.success) {
                setSupports(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSupports();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = isCreating ? '/api/admin/supports' : `/api/admin/supports/${editingItem.id}`;
            const method = isCreating ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingItem),
            });

            const data = await res.json();
            if (data.success) {
                setIsCreating(false);
                setEditingItem(null);
                await fetchSupports();
            } else {
                alert(data.message || 'Hata');
            }
        } catch {
            alert('Hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`/api/admin/supports/${deleteTarget.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setDeleteTarget(null);
                await fetchSupports();
            }
        } catch {
            alert('Silinemedi');
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'title',
            header: 'Teşvik / Destek Başlığı',
            render: (item) => (
                <div>
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-[10px] text-gray-400 font-mono line-clamp-1">{item.description}</div>
                </div>
            ),
        },
        {
            key: 'sortOrder',
            header: 'Sıra',
            render: (item) => <span className="text-gray-400 font-mono">#{item.sortOrder}</span>,
        },
        {
            key: 'isActive',
            header: 'Durum',
            render: (item) => (
                <StatusBadge
                    status={item.isActive ? 'ACTIVE' : 'PASSIVE'}
                    label={item.isActive ? 'Aktif' : 'Pasif'}
                />
            ),
        },
        {
            key: 'actions',
            header: 'İşlemler',
            sortable: false,
            render: (item) => (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => {
                            setEditingItem(item);
                            setIsCreating(false);
                        }}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Düzenle"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewingRevisionsId(item.id)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Sürüm Geçmişi"
                    >
                        <History className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Arşivle / Sil"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Destek & Teşvik Yönetimi</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        /destekler sayfasındaki vergi indirimleri ve yasal teşvik içeriklerinin yönetimi
                    </p>
                </div>

                {!editingItem && !isCreating && (
                    <button
                        onClick={() => {
                            setEditingItem({
                                title: '',
                                description: '',
                                legalBasis: '',
                                exampleScenario: '',
                                sortOrder: supports.length + 1,
                                isActive: true,
                            });
                            setIsCreating(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Destek Ekle
                    </button>
                )}
            </div>

            {/* Form Modal */}
            {(editingItem || isCreating) && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-primary" />
                            <h2 className="font-orbitron font-bold text-lg text-white">
                                {isCreating ? 'Yeni Destek / Teşvik Maddesi Ekle' : `Düzenle: ${editingItem.title}`}
                            </h2>
                        </div>
                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setIsCreating(false);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Teşvik / Destek Başlığı *</label>
                            <input
                                type="text"
                                required
                                value={editingItem.title || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                placeholder="Örn: GELİR VERGİSİ STOPAJI TEŞVİKİ"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Açıklama Metni *</label>
                            <textarea
                                rows={3}
                                required
                                value={editingItem.description || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Yasal Dayanak (Mevzuat Maddesi)</label>
                                <input
                                    type="text"
                                    value={editingItem.legalBasis || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, legalBasis: e.target.value })}
                                    placeholder="4691 Sayılı Kanun Madde 3"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Sıralama Önceliği</label>
                                <input
                                    type="number"
                                    value={editingItem.sortOrder ?? 0}
                                    onChange={(e) => setEditingItem({ ...editingItem, sortOrder: Number(e.target.value) })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Örnek Senaryo</label>
                            <textarea
                                rows={4}
                                value={editingItem.exampleScenario || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, exampleScenario: e.target.value })}
                                placeholder="Örneğin; firmanız yıl içinde ... (kartta 'Örnek Senaryo' kutusunda gösterilir)"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Buton Metni</label>
                                <input type="text" value={editingItem.ctaText || ''} onChange={(e) => setEditingItem({ ...editingItem, ctaText: e.target.value })} placeholder="Detaylı bilgi almak için tıklayın" className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Buton Linki (boşsa iletişim formu bu konuyla açılır)</label>
                                <input type="text" value={editingItem.ctaLink || ''} onChange={(e) => setEditingItem({ ...editingItem, ctaLink: e.target.value })} placeholder="/iletisim" className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Mevzuat / Kaynak Linki</label>
                                <input type="url" value={editingItem.sourceUrl || ''} onChange={(e) => setEditingItem({ ...editingItem, sourceUrl: e.target.value })} placeholder="https://www.mevzuat.gov.tr/..." className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">İkon</label>
                                <select value={editingItem.iconName || 'FileCheck'} onChange={(e) => setEditingItem({ ...editingItem, iconName: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none">
                                    <option value="FileCheck">Belge</option>
                                    <option value="DollarSign">Para</option>
                                    <option value="Shield">Kalkan</option>
                                    <option value="Globe">Dünya</option>
                                    <option value="GraduationCap">Mezuniyet</option>
                                    <option value="Building2">Bina</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Kart Rengi</label>
                                <div className="flex flex-wrap gap-2">
                                    {['from-blue-500 to-cyan-500', 'from-green-500 to-emerald-500', 'from-purple-500 to-pink-500', 'from-red-500 to-orange-500', 'from-indigo-500 to-blue-600', 'from-yellow-400 to-orange-500'].map((g) => (
                                        <button key={g} type="button" onClick={() => setEditingItem({ ...editingItem, colorGradient: g })} aria-label={g} className={`h-8 w-14 rounded-lg bg-gradient-to-r ${g} ${editingItem.colorGradient === g ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingItem(null);
                                    setIsCreating(false);
                                }}
                                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Revision Viewer */}
            {viewingRevisionsId && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                        <h3 className="font-orbitron font-bold text-sm text-white">Sürüm Geçmişi ve Geri Yükleme</h3>
                        <button
                            onClick={() => setViewingRevisionsId(null)}
                            className="text-xs text-gray-400 hover:text-white font-mono flex items-center gap-1"
                        >
                            <ArrowLeft className="w-4 h-4" /> Listeye Dön
                        </button>
                    </div>
                    <RevisionViewer
                        entityType="Support"
                        entityId={viewingRevisionsId}
                        onRollbackSuccess={() => {
                            fetchSupports();
                        }}
                    />
                </div>
            )}

            {/* DataTable */}
            {!viewingRevisionsId && (
                <DataTable
                    data={supports}
                    columns={columns}
                    searchPlaceholder="Teşvik veya destek ara..."
                    exportFileName="ikuants-destekler"
                />
            )}

            {/* Confirm Delete */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Desteği Arşivle"
                description={`"${deleteTarget?.title}" kaydını arşivlemek istediğinize emin misiniz?`}
                confirmText="Arşivle"
                isDestructive={true}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
