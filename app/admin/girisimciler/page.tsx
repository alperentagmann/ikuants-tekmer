"use client";
import React, { useState, useEffect, useTransition } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { RevisionViewer } from '@/components/admin/RevisionViewer';
import { Plus, Edit2, Trash2, Rocket, History, Globe, Linkedin, ArrowLeft, Save, X, ExternalLink, Eye, EyeOff } from 'lucide-react';

export default function AdminGirisimcilerPage() {
    const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [viewingRevisionsId, setViewingRevisionsId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchEntrepreneurs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/entrepreneurs');
            const data = await res.json();
            if (data.success) {
                setEntrepreneurs(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntrepreneurs();
    }, []);

    const handleToggleVisibility = async (item: any) => {
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${item.id}/toggle-visibility`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: item.isPublished === false ? true : false }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchEntrepreneurs();
            } else {
                alert(data.message || 'Görünürlük güncellenemedi');
            }
        } catch {
            alert('Bağlantı hatası oluştu');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = isCreating ? '/api/admin/entrepreneurs' : `/api/admin/entrepreneurs/${editingItem.id}`;
            const method = isCreating ? 'POST' : 'PUT';

            const payload = {
                ...editingItem,
                keywords: typeof editingItem.keywords === 'string'
                    ? editingItem.keywords.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : editingItem.keywords,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                setIsCreating(false);
                setEditingItem(null);
                await fetchEntrepreneurs();
            } else {
                alert(data.message || 'Kayıt sırasında hata oluştu');
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
            const res = await fetch(`/api/admin/entrepreneurs/${deleteTarget.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setDeleteTarget(null);
                await fetchEntrepreneurs();
            }
        } catch {
            alert('Silme işlemi başarısız');
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'name',
            header: 'Girişim / Firma Adı',
            render: (item) => (
                <div className="font-semibold text-white">
                    {item.name}
                    {item.founders && <div className="text-[10px] text-gray-400 font-mono">Kurucu: {item.founders}</div>}
                </div>
            ),
        },
        {
            key: 'sector',
            header: 'Sektör',
            render: (item) => <span className="text-cyan-400 font-mono">{item.sector}</span>,
        },
        {
            key: 'isPublished',
            header: 'Public Görünürlük',
            render: (item) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(item);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all border ${
                        item.isPublished !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                    title="Görünürlüğü değiştirmek için tıklayın"
                >
                    {item.isPublished !== false ? (
                        <>
                            <Eye className="w-3.5 h-3.5 text-emerald-400" /> Yayında
                        </>
                    ) : (
                        <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-400" /> Yayından Kaldırıldı (Gizli)
                        </>
                    )}
                </button>
            ),
        },
        {
            key: 'status',
            header: 'Durum',
            render: (item) => <StatusBadge status={item.status} />,
        },
        {
            key: 'program',
            header: 'Program',
            render: (item) => (
                <span className="text-purple-400 font-mono">{item.program || 'ANTSPARK'}</span>
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
                            setEditingItem({
                                ...item,
                                keywords: item.keywords?.join(', ') || '',
                            });
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
                    <h1 className="font-orbitron font-bold text-2xl text-white">Girişimci Yönetimi</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        /girisimciler sayfasında ve kuluçka dizininde listelenen girişimcilerin yönetimi
                    </p>
                </div>

                {!editingItem && !isCreating && (
                    <button
                        onClick={() => {
                            setEditingItem({
                                name: '',
                                sector: 'Yazılım / Yapay Zekâ',
                                shortDesc: '',
                                founders: '',
                                website: '',
                                linkedin: '',
                                keywords: '',
                                status: 'ACTIVE',
                                isFeatured: false,
                                sortOrder: 0,
                            });
                            setIsCreating(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Girişimci Ekle
                    </button>
                )}
            </div>

            {/* Create / Edit Form Modal or View */}
            {(editingItem || isCreating) && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-primary" />
                            <h2 className="font-orbitron font-bold text-lg text-white">
                                {isCreating ? 'Yeni Girişimci Oluştur' : `Düzenle: ${editingItem.name}`}
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
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Firma / Girişim Adı *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingItem.name || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                    placeholder="Örn: Palmiye Bilgi Teknolojileri Ltd. Şti."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Sektör / Faaliyet Alanı *</label>
                                <input
                                    type="text"
                                    required
                                    value={editingItem.sector || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, sector: e.target.value })}
                                    placeholder="Örn: Sağlık Teknolojileri / Yapay Zekâ"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-1.5">Kısa Açıklama / Hizmet Tanımı</label>
                            <textarea
                                rows={3}
                                value={editingItem.shortDesc || ''}
                                onChange={(e) => setEditingItem({ ...editingItem, shortDesc: e.target.value })}
                                placeholder="Girişimin geliştirdiği ürün, teknoloji veya sunduğu hizmetin özeti..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Kurucu Bilgisi</label>
                                <input
                                    type="text"
                                    value={editingItem.founders || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, founders: e.target.value })}
                                    placeholder="Örn: Kenan Keleş"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Web Sitesi</label>
                                <input
                                    type="url"
                                    value={editingItem.website || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, website: e.target.value })}
                                    placeholder="https://example.com"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">LinkedIn</label>
                                <input
                                    type="url"
                                    value={editingItem.linkedin || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, linkedin: e.target.value })}
                                    placeholder="https://linkedin.com/company/..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Durum</label>
                                <select
                                    value={editingItem.status || 'ACTIVE'}
                                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none [&>option]:bg-[#0e0e18]"
                                >
                                    <option value="ACTIVE">Aktif</option>
                                    <option value="GRADUATED">Mezun</option>
                                    <option value="PASSIVE">Pasif</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Anahtar Kelimeler (Virgülle ayırın)</label>
                                <input
                                    type="text"
                                    value={editingItem.keywords || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, keywords: e.target.value })}
                                    placeholder="ai, b2b, saas, sağlık"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Sıralama Önceliği (Sort Order)</label>
                                <input
                                    type="number"
                                    value={editingItem.sortOrder ?? 0}
                                    onChange={(e) => setEditingItem({ ...editingItem, sortOrder: Number(e.target.value) })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <div className="text-xs font-semibold text-white">Public Sitede Göster (isPublished)</div>
                                    <div className="text-[10px] text-gray-400">/girisimciler sayfasında ve arama sonuçlarında görünürlük</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={editingItem.isPublished !== false}
                                    onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                                    className="w-4 h-4 rounded bg-black/40 border-white/10 text-primary cursor-pointer"
                                />
                            </label>

                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <div className="text-xs font-semibold text-white">Öne Çıkarılan Girişim (isFeatured)</div>
                                    <div className="text-[10px] text-gray-400">Ana sayfada vitrin kartı olarak gösterim</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={editingItem.isFeatured || false}
                                    onChange={(e) => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                                    className="w-4 h-4 rounded bg-black/40 border-white/10 text-primary cursor-pointer"
                                />
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
                        entityType="Entrepreneur"
                        entityId={viewingRevisionsId}
                        onRollbackSuccess={() => {
                            fetchEntrepreneurs();
                        }}
                    />
                </div>
            )}

            {/* Entrepreneurs Data Table */}
            {!viewingRevisionsId && (
                <DataTable
                    data={entrepreneurs}
                    columns={columns}
                    searchPlaceholder="Girişimci adı, sektör veya kurucu ara..."
                    exportFileName="ikuants-girisimciler"
                    filterOptions={[
                        {
                            key: 'status',
                            label: 'Durum',
                            options: [
                                { value: 'ACTIVE', label: 'Aktif' },
                                { value: 'GRADUATED', label: 'Mezun' },
                                { value: 'PASSIVE', label: 'Pasif' },
                            ],
                        },
                    ]}
                />
            )}

            {/* Confirm Delete / Archive Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Girişimciyi Arşivle"
                description={`"${deleteTarget?.name}" girişimini arşivlemek istediğinize emin misiniz? Arşivlenen girişimler public siteden gizlenir ancak geçmiş başvurular ve audit log kayıtları korunur.`}
                confirmText="Arşivle"
                isDestructive={true}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
