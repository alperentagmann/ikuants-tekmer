"use client";
import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { RevisionViewer } from '@/components/admin/RevisionViewer';
import { Plus, Edit2, Trash2, UserCheck, History, Linkedin, ArrowLeft, Save, X, Image as ImageIcon } from 'lucide-react';

export default function AdminMentorlerPage() {
    const [mentors, setMentors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [viewingRevisionsId, setViewingRevisionsId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/mentors');
            const data = await res.json();
            if (data.success) {
                setMentors(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMentors();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = isCreating ? '/api/admin/mentors' : `/api/admin/mentors/${editingItem.id}`;
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
                await fetchMentors();
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
            const res = await fetch(`/api/admin/mentors/${deleteTarget.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setDeleteTarget(null);
                await fetchMentors();
            }
        } catch {
            alert('Silme işlemi başarısız');
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'name',
            header: 'Mentör Ad Soyad',
            render: (item) => (
                <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-9 h-9 rounded-xl object-cover border border-white/10"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary font-mono">
                            {item.name?.[0]}{item.surname?.[0]}
                        </div>
                    )}
                    <div>
                        <div className="font-semibold text-white">
                            {item.name} {item.surname}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">{item.company}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'title',
            header: 'Unvan / Görev',
            render: (item) => <span className="text-gray-300">{item.title}</span>,
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
            key: 'linkedin',
            header: 'Bağlantı',
            sortable: false,
            render: (item) =>
                item.linkedin ? (
                    <a
                        href={item.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                        <Linkedin className="w-3.5 h-3.5" /> Profil
                    </a>
                ) : (
                    <span className="text-gray-600">-</span>
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Mentör Kadrosu Yönetimi</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        /mentorler sayfasında listelenen mentör havuzunun yönetimi
                    </p>
                </div>

                {!editingItem && !isCreating && (
                    <button data-intent="create"
                        onClick={() => {
                            setEditingItem({
                                name: '',
                                surname: '',
                                company: '',
                                title: '',
                                bio: '',
                                imageUrl: '',
                                linkedin: '',
                                email: '',
                                phone: '',
                                isActive: true,
                                isFeatured: false,
                                sortOrder: 0,
                            });
                            setIsCreating(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Mentör Ekle
                    </button>
                )}
            </div>

            {/* Edit / Create Modal Form */}
            {(editingItem || isCreating) && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-primary" />
                            <h2 className="font-orbitron font-bold text-lg text-white">
                                {isCreating ? 'Yeni Mentör Ekle' : `Düzenle: ${editingItem.name} ${editingItem.surname}`}
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
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Ad *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingItem.name || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                    placeholder="Örn: Zico Ufuk"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Soyad *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingItem.surname || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, surname: e.target.value })}
                                    placeholder="Örn: Batum"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Kurum / Şirket *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingItem.company || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, company: e.target.value })}
                                    placeholder="Örn: Ventures & Mentors League"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Unvan / Pozisyon *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingItem.title || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                    placeholder="Örn: Founder & Baş Danışman"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Fotoğraf URL</label>
                                <input
                                    type="text"
                                    value={editingItem.imageUrl || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                                    placeholder="/images/zico-ufuk-batum.jpg veya Medya URL"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">LinkedIn Profili</label>
                                <input
                                    type="url"
                                    value={editingItem.linkedin || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, linkedin: e.target.value })}
                                    placeholder="https://www.linkedin.com/in/..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editingItem.isActive ?? true}
                                    onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                                    className="rounded border-white/20 bg-black/40 text-primary focus:ring-0"
                                />
                                Sitede Aktif Olarak Göster
                            </label>

                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editingItem.isFeatured ?? false}
                                    onChange={(e) => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                                    className="rounded border-white/20 bg-black/40 text-primary focus:ring-0"
                                />
                                Ana Sayfada Öne Çıkar
                            </label>
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
                        entityType="Mentor"
                        entityId={viewingRevisionsId}
                        onRollbackSuccess={() => {
                            fetchMentors();
                        }}
                    />
                </div>
            )}

            {/* Mentors Data Table */}
            {!viewingRevisionsId && (
                <DataTable
                    data={mentors}
                    columns={columns}
                    searchPlaceholder="Mentör adı, soyadı veya kurum ara..."
                    exportFileName="ikuants-mentorler"
                />
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Mentörü Arşivle"
                description={`"${deleteTarget?.name} ${deleteTarget?.surname}" kaydını arşivlemek istediğinize emin misiniz?`}
                confirmText="Arşivle"
                isDestructive={true}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
