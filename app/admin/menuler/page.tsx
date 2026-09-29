"use client";
import React, { useState, useEffect } from 'react';
import { Navigation, Plus, Edit2, Trash2, ExternalLink, RefreshCw, MoveUp, MoveDown, Layers } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface MenuItem {
    id: string;
    menuLocation: string;
    parentId: string | null;
    label: string;
    url: string;
    isExternal: boolean;
    openInNewTab: boolean;
    sortOrder: number;
    isActive: boolean;
    children?: MenuItem[];
}

export default function MenusPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState<string>('HEADER');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        label: '',
        url: '',
        menuLocation: 'HEADER',
        parentId: '',
        isExternal: false,
        openInNewTab: false,
        sortOrder: 0,
        isActive: true,
    });

    const fetchMenus = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/menus');
            const data = await res.json();
            if (data.success) {
                setMenuItems(data.menuItems);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, []);

    const handleOpenCreate = () => {
        setEditingItem(null);
        setForm({
            label: '',
            url: '',
            menuLocation: selectedLocation,
            parentId: '',
            isExternal: false,
            openInNewTab: false,
            sortOrder: menuItems.length * 10,
            isActive: true,
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: MenuItem) => {
        setEditingItem(item);
        setForm({
            label: item.label,
            url: item.url,
            menuLocation: item.menuLocation,
            parentId: item.parentId || '',
            isExternal: item.isExternal,
            openInNewTab: item.openInNewTab,
            sortOrder: item.sortOrder,
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

            const res = await fetch('/api/admin/menus', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setIsModalOpen(false);
                fetchMenus();
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
            const res = await fetch(`/api/admin/menus?id=${deleteId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchMenus();
            } else {
                alert(data.error || 'Silinemedi.');
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setDeleteId(null);
        }
    };

    const filtered = menuItems.filter(m => m.menuLocation === selectedLocation);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                        <Navigation className="w-7 h-7 text-primary" />
                        Menü & Navigasyon Yönetimi
                    </h1>
                    <p className="text-gray-400 text-xs mt-1">
                        Sitedeki Header, Footer ve yan menü hiyerarşisini, bağlantı linklerini ve sıralamayı yapılandırın.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchMenus}
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
                        Yeni Menü Öğesi Ekle
                    </button>
                </div>
            </div>

            {/* Location Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                {['HEADER', 'FOOTER', 'SIDEBAR'].map((loc) => (
                    <button
                        key={loc}
                        onClick={() => setSelectedLocation(loc)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            selectedLocation === loc
                                ? 'bg-primary/20 text-primary border border-primary/40'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {loc === 'HEADER' ? 'Header (Üst Menü)' : loc === 'FOOTER' ? 'Footer (Alt Menü)' : 'Yan Menü'}
                    </button>
                ))}
            </div>

            {/* Menu List */}
            {loading ? (
                <div className="p-12 text-center text-gray-400">Yükleniyor...</div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center bg-[#0d0e1a] border border-white/10 rounded-2xl text-gray-400">
                    Bu menü konumu için henüz öğe tanımlanmamış.
                </div>
            ) : (
                <div className="bg-[#0d0e1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="divide-y divide-white/5">
                        {filtered.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-md bg-white/5 text-gray-400 flex items-center justify-center font-mono text-xs">
                                            {item.sortOrder}
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white text-sm">{item.label}</span>
                                                <StatusBadge
                                                    status={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                    label={item.isActive ? 'Yayında' : 'Gizli'}
                                                    variant="dot"
                                                />
                                                {item.isExternal && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                                        Harici
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs font-mono text-gray-400 mt-0.5">{item.url}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(item)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(item.id)}
                                            className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Sub-items if any */}
                                {item.children && item.children.length > 0 && (
                                    <div className="mt-3 pl-8 space-y-2 border-l-2 border-primary/20 ml-3">
                                        {item.children.map((child) => (
                                            <div
                                                key={child.id}
                                                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-gray-300">{child.label}</span>
                                                    <span className="text-[10px] font-mono text-gray-500">{child.url}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleOpenEdit(child)}
                                                        className="p-1 text-gray-400 hover:text-white rounded"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(child.id)}
                                                        className="p-1 text-gray-400 hover:text-rose-400 rounded"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0d0e1a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-orbitron font-bold text-white">
                                {editingItem ? 'Menü Öğesini Düzenle' : 'Yeni Menü Öğesi'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Menü Başlığı *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.label}
                                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                    placeholder="Örn: Girişimcilerimiz"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Bağlantı URL *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.url}
                                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                    placeholder="Örn: /girisimciler veya https://..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Menü Konumu</label>
                                    <select
                                        value={form.menuLocation}
                                        onChange={(e) => setForm({ ...form, menuLocation: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#121324] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                    >
                                        <option value="HEADER">Header (Üst)</option>
                                        <option value="FOOTER">Footer (Alt)</option>
                                        <option value="SIDEBAR">Yan Menü</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Sıra No</label>
                                    <input
                                        type="number"
                                        value={form.sortOrder}
                                        onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Üst Menü Öğesi (Varsa)</label>
                                <select
                                    value={form.parentId}
                                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                                    className="w-full px-3 py-2 bg-[#121324] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                >
                                    <option value="">-- Ana Seviye Menü --</option>
                                    {menuItems.filter(m => !editingItem || m.id !== editingItem.id).map(m => (
                                        <option key={m.id} value={m.id}>{m.label} ({m.menuLocation})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2">
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.openInNewTab}
                                        onChange={(e) => setForm({ ...form, openInNewTab: e.target.checked })}
                                        className="w-4 h-4 rounded text-primary bg-white/5 border-white/10 focus:ring-0"
                                    />
                                    Yeni sekmede aç
                                </label>
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isExternal}
                                        onChange={(e) => setForm({ ...form, isExternal: e.target.checked })}
                                        className="w-4 h-4 rounded text-primary bg-white/5 border-white/10 focus:ring-0"
                                    />
                                    Harici bağlantı
                                </label>
                                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded text-primary bg-white/5 border-white/10 focus:ring-0"
                                    />
                                    Aktif
                                </label>
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
                title="Menü Öğesini Sil"
                message="Bu menü öğesini silmek istediğinize emin misiniz? Alt öğeleri varsa onlar da etkilenecektir."
                confirmText="Evet, Sil"
                type="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
