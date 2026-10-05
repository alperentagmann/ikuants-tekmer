"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit2, Trash2, ExternalLink, RefreshCw, Layers } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface Partner {
    id: string;
    name: string;
    logoUrl: string;
    websiteUrl: string | null;
    altText: string | null;
    partnerGroup: string;
    sortOrder: number;
    isActive: boolean;
}

export default function PartnersPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        logoUrl: '',
        websiteUrl: '',
        altText: '',
        partnerGroup: 'STAKEHOLDER',
        sortOrder: 0,
        isActive: true,
    });

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/partners');
            const data = await res.json();
            if (data.success) {
                setPartners(data.partners);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    const handleOpenCreate = () => {
        setEditingPartner(null);
        setForm({
            name: '',
            logoUrl: '',
            websiteUrl: '',
            altText: '',
            partnerGroup: 'STAKEHOLDER',
            sortOrder: partners.length * 10,
            isActive: true,
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (partner: Partner) => {
        setEditingPartner(partner);
        setForm({
            name: partner.name,
            logoUrl: partner.logoUrl,
            websiteUrl: partner.websiteUrl || '',
            altText: partner.altText || '',
            partnerGroup: partner.partnerGroup,
            sortOrder: partner.sortOrder,
            isActive: partner.isActive,
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const method = editingPartner ? 'PUT' : 'POST';
            const body = editingPartner ? { id: editingPartner.id, ...form } : form;

            const res = await fetch('/api/admin/partners', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setIsModalOpen(false);
                fetchPartners();
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
            const res = await fetch(`/api/admin/partners/${deleteId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchPartners();
            } else {
                alert(data.error || 'Silinemedi.');
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setDeleteId(null);
        }
    };

    const filtered = partners.filter(p => selectedGroup === 'ALL' || p.partnerGroup === selectedGroup);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                        <Sparkles className="w-7 h-7 text-primary" />
                        Partner & Paydaş Yönetimi
                    </h1>
                    <p className="text-gray-400 text-xs mt-1">
                        Ana sayfa ve sayfalarda listelenen üniversite, kamu ve ekosistem partner logoları.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchPartners}
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
                        Yeni Partner Ekle
                    </button>
                </div>
            </div>

            {/* Group Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
                {['ALL', 'STAKEHOLDER', 'SUPPORTER', 'SPONSOR', 'ECOSYSTEM'].map((grp) => (
                    <button
                        key={grp}
                        onClick={() => setSelectedGroup(grp)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedGroup === grp
                                ? 'bg-primary/20 text-primary border border-primary/40'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {grp === 'ALL' ? 'Tümü' : grp === 'STAKEHOLDER' ? 'Ana Paydaşlar' : grp === 'SUPPORTER' ? 'Destekçiler' : grp === 'SPONSOR' ? 'Sponsorlar' : 'Ekosistem'}
                        <span className="ml-1.5 opacity-60">
                            ({grp === 'ALL' ? partners.length : partners.filter(p => p.partnerGroup === grp).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Partner Grid */}
            {loading ? (
                <div className="p-12 text-center text-gray-400">Yükleniyor...</div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center bg-[#0d0e1a] border border-white/10 rounded-2xl text-gray-400">
                    Henüz bu kategoride partner bulunmuyor.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map((partner) => (
                        <div
                            key={partner.id}
                            className="bg-[#0d0e1a] border border-white/10 hover:border-primary/40 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-sm hover:shadow-lg hover:shadow-primary/5"
                        >
                            <div>
                                <div className="h-24 rounded-xl bg-white/5 p-3 flex items-center justify-center border border-white/5 mb-3 group-hover:bg-white/10 transition-colors">
                                    <img
                                        src={partner.logoUrl}
                                        alt={partner.altText || partner.name}
                                        className="max-h-full max-w-full object-contain filter brightness-95 group-hover:brightness-100"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className="font-semibold text-white text-sm truncate" title={partner.name}>
                                        {partner.name}
                                    </h3>
                                    <StatusBadge
                                        status={partner.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        label={partner.isActive ? 'Aktif' : 'Pasif'}
                                        variant="outline"
                                    />
                                </div>
                                <div className="text-[10px] font-mono text-gray-400 flex items-center gap-2 mb-2">
                                    <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                                        Sıra: {partner.sortOrder}
                                    </span>
                                    <span>{partner.partnerGroup}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
                                {partner.websiteUrl ? (
                                    <a
                                        href={partner.websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        Web Sitesi <ExternalLink className="w-3 h-3" />
                                    </a>
                                ) : (
                                    <span className="text-xs text-gray-600">Link yok</span>
                                )}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenEdit(partner)}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Düzenle"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(partner.id)}
                                        className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0d0e1a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-orbitron font-bold text-white">
                                {editingPartner ? 'Partner Düzenle' : 'Yeni Partner Ekle'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Kurum / Firma Adı *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                    placeholder="Örn: İstanbul Kültür Üniversitesi"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Logo URL *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.logoUrl}
                                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                    placeholder="https://... veya /assets/..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Web Sitesi URL</label>
                                <input
                                    type="url"
                                    value={form.websiteUrl}
                                    onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                    placeholder="https://example.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Kategori / Grup</label>
                                    <select
                                        value={form.partnerGroup}
                                        onChange={(e) => setForm({ ...form, partnerGroup: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#121324] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                    >
                                        <option value="STAKEHOLDER">Ana Paydaş</option>
                                        <option value="SUPPORTER">Destekçi</option>
                                        <option value="SPONSOR">Sponsor</option>
                                        <option value="ECOSYSTEM">Ekosistem</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Sıralama</label>
                                    <input
                                        type="number"
                                        value={form.sortOrder}
                                        onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActivePartner"
                                    checked={form.isActive}
                                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded text-primary bg-white/5 border-white/10 focus:ring-0"
                                />
                                <label htmlFor="isActivePartner" className="text-xs text-gray-300 cursor-pointer">
                                    Aktif olarak yayında göster
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
                title="Partner Sil"
                message="Bu partner kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Evet, Sil"
                type="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
