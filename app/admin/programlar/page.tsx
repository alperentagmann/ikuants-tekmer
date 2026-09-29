"use client";
import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { RevisionViewer } from '@/components/admin/RevisionViewer';
import { Plus, Edit2, Trash2, Layers, History, ArrowLeft, Save, X, Sparkles, ExternalLink } from 'lucide-react';

export default function AdminProgramlarPage() {
    const [programs, setPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [viewingRevisionsId, setViewingRevisionsId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/programs');
            const data = await res.json();
            if (data.success) {
                setPrograms(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = isCreating ? '/api/admin/programs' : `/api/admin/programs/${editingItem.id}`;
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
                await fetchPrograms();
            } else {
                alert(data.message || 'Hata oluştu');
            }
        } catch {
            alert('Bağlantı hatası oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(`/api/admin/programs/${deleteTarget.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setDeleteTarget(null);
                await fetchPrograms();
            }
        } catch {
            alert('Silme işlemi başarısız');
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'name',
            header: 'Program Adı',
            render: (item) => (
                <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{item.tagline || item.slug}</div>
                </div>
            ),
        },
        {
            key: 'programType',
            header: 'Tür',
            render: (item) => <span className="text-purple-400 font-mono">{item.programType || 'Kuluçka'}</span>,
        },
        {
            key: 'duration',
            header: 'Süre / Kontenjan',
            render: (item) => (
                <span className="text-gray-300 font-mono">
                    {item.duration || '-'} / {item.quota || '-'}
                </span>
            ),
        },
        {
            key: 'applyStatus',
            header: 'Başvuru Durumu',
            render: (item) => <StatusBadge status={item.applyStatus || 'OPEN'} />,
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Program Yönetimi</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        ANTSPARK, ANTSFire, Ideathon ve yeni açılacak kuluçka programlarının yönetimi
                    </p>
                </div>

                {!editingItem && !isCreating && (
                    <button
                        onClick={() => {
                            setEditingItem({
                                name: '',
                                programType: 'PRE_INCUBATION',
                                tagline: '',
                                shortDesc: '',
                                duration: '12 Hafta',
                                quota: '20 Girişim',
                                mentorHours: '70+ Saat',
                                applyStatus: 'OPEN',
                                ctaText: 'HEMEN BAŞVUR',
                                ctaLink: '/basvuru',
                                isFeatured: true,
                                sortOrder: 0,
                            });
                            setIsCreating(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Program Ekle
                    </button>
                )}
            </div>

            {/* Edit / Create Form */}
            {(editingItem || isCreating) && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-primary" />
                            <h2 className="font-orbitron font-bold text-lg text-white">
                                {isCreating ? 'Yeni Program Oluştur' : `Düzenle: ${editingItem.name}`}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Program Adı *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingItem.name || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                    placeholder="Örn: ANTSPARK Ön Kuluçka"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Slogan / Kısa Başlık</label>
                                <input
                                    type="text"
                                    value={editingItem.tagline || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, tagline: e.target.value })}
                                    placeholder="Örn: Fikirden Ticarileşmeye Hızlı Başlangıç"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Kısa Açıklama</label>
                            <textarea
                                rows={2}
                                value={editingItem.shortDesc || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, shortDesc: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Program Süresi</label>
                                <input
                                    type="text"
                                    value={editingItem.duration || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                                    placeholder="12 Hafta"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Kontenjan</label>
                                <input
                                    type="text"
                                    value={editingItem.quota || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, quota: e.target.value })}
                                    placeholder="20 Girişim"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Mentorluk Süresi</label>
                                <input
                                    type="text"
                                    value={editingItem.mentorHours || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, mentorHours: e.target.value })}
                                    placeholder="70+ Saat"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Başvuru Durumu</label>
                                <select
                                    value={editingItem.applyStatus || 'OPEN'}
                                    onChange={(e) => setEditingItem({ ...editingItem, applyStatus: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none [&>option]:bg-[#0e0e18]"
                                >
                                    <option value="OPEN">Başvuruya Açık</option>
                                    <option value="UPCOMING">Yakında Açılacak</option>
                                    <option value="CLOSED">Başvurular Kapandı</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">CTA Buton Metni</label>
                                <input
                                    type="text"
                                    value={editingItem.ctaText || 'HEMEN BAŞVUR'}
                                    onChange={(e) => setEditingItem({ ...editingItem, ctaText: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">CTA Buton Yönlendirme Linki</label>
                                <input
                                    type="text"
                                    value={editingItem.ctaLink || '/basvuru'}
                                    onChange={(e) => setEditingItem({ ...editingItem, ctaLink: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
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

            {/* Revision Viewer Modal */}
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
                        entityType="Program"
                        entityId={viewingRevisionsId}
                        onRollbackSuccess={() => {
                            fetchPrograms();
                        }}
                    />
                </div>
            )}

            {/* Programs Data Table */}
            {!viewingRevisionsId && (
                <DataTable
                    data={programs}
                    columns={columns}
                    searchPlaceholder="Program adı veya türü ara..."
                    exportFileName="ikuants-programlar"
                />
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Programı Arşivle"
                description={`"${deleteTarget?.name}" programını arşivlemek istediğinize emin misiniz?`}
                confirmText="Arşivle"
                isDestructive={true}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
