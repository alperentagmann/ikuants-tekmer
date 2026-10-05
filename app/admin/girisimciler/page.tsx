"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { RevisionViewer } from '@/components/admin/RevisionViewer';
import { TRACK_OTHER, trackOptions, trackToAssignment } from '@/lib/program-track';
import {
    Plus, Edit2, Trash2, Rocket, History, Globe, Linkedin,
    ArrowLeft, Save, X, ExternalLink, Eye, EyeOff, Layers,
    Building2, Users, Calendar, DollarSign, CheckCircle2, ShieldCheck
} from 'lucide-react';

export default function AdminGirisimcilerPage() {
    const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
    const [programsList, setProgramsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [viewingRevisionsId, setViewingRevisionsId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    // Program Assignment Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<any | null>(null);
    const [savingAssignment, setSavingAssignment] = useState(false);
    const [assignForm, setAssignForm] = useState({
        programId: '',
        otherProgram: '',
        cohort: '',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString().split('T')[0],
        notes: '',
        isPublic: true,
    });

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

    const fetchPrograms = async () => {
        try {
            const res = await fetch('/api/admin/programs');
            const data = await res.json();
            // The API returns the list as `items`
            const list = data.items || data.programs;
            if (Array.isArray(list)) setProgramsList(list);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchEntrepreneurs();
        fetchPrograms();
    }, []);

    const handleOpenAssignModal = (item: any) => {
        setAssignTarget(item);
        setAssignForm({
            programId: '',
            otherProgram: '',
            cohort: '',
            status: 'ACTIVE',
            joinedAt: new Date().toISOString().split('T')[0],
            notes: '',
            isPublic: true,
        });
        setAssignModalOpen(true);
    };

    const handleSaveAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        const { otherProgram, programId: track, ...rest } = assignForm;
        const target = trackToAssignment(track, otherProgram);
        if (!assignTarget || (!target.programId && !target.programLabel)) {
            alert(track === TRACK_OTHER ? 'Lütfen "Diğer" için program adını yazın.' : 'Lütfen atanacak bir program seçin.');
            return;
        }

        setSavingAssignment(true);
        try {
            const res = await fetch(`/api/admin/entrepreneurs/${assignTarget.id}/programs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...rest, ...target }),
            });
            const data = await res.json();
            if (data.success) {
                setAssignModalOpen(false);
                setAssignTarget(null);
                await fetchEntrepreneurs();
                // If currently editing this item, refresh its program info
                if (editingItem && editingItem.id === assignTarget.id) {
                    const selectedProg = programsList.find(p => p.id === target.programId);
                    setEditingItem((prev: any) => ({
                        ...prev,
                        program: selectedProg?.name || target.programLabel || prev.program,
                    }));
                }
            } else {
                alert(data.error || data.message || 'Program atama sırasında hata oluştu.');
            }
        } catch {
            alert('Bağlantı hatası oluştu.');
        } finally {
            setSavingAssignment(false);
        }
    };

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
            render: (item) => {
                const hasProgram = item.program && item.program !== 'Program Atanmamış';
                return (
                    <div className="flex flex-col gap-1 items-start" onClick={(e) => e.stopPropagation()}>
                        {hasProgram ? (
                            <>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 font-mono bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
                                    <Rocket className="w-3 h-3 text-purple-400" />
                                    {item.program}
                                </span>
                                <button
                                    onClick={() => handleOpenAssignModal(item)}
                                    className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
                                >
                                    Değiştir / Yeni Program
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="text-xs text-gray-500 italic">Program Atanmamış</span>
                                <button
                                    onClick={() => handleOpenAssignModal(item)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-light hover:underline bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded border border-primary/20 transition-all cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> Program Ata
                                </button>
                            </>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'İşlemler',
            sortable: false,
            render: (item) => (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => handleOpenAssignModal(item)}
                        className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Program Ata"
                    >
                        <Rocket className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setEditingItem({
                                ...item,
                                keywords: item.keywords?.join(', ') || '',
                            });
                            setIsCreating(false);
                        }}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="Düzenle"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewingRevisionsId(item.id)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                        title="Sürüm Geçmişi"
                    >
                        <History className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
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
                    <button data-intent="create"
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

                        {/* PROGRAM & EKOSİSTEM SECTION (Section 193) */}
                        {!isCreating && (
                            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Rocket className="w-4 h-4 text-purple-400" />
                                        <h3 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                                            Program & Ekosistem
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenAssignModal(editingItem)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold border border-purple-500/40 transition-colors cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Program Ata / Değiştir
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-black/40 p-3 rounded-lg border border-purple-500/20">
                                    <div>
                                        <span className="text-gray-400 block text-[10px] font-mono">Aktif Program:</span>
                                        <span className="font-semibold text-purple-300">
                                            {editingItem.program || 'Program Atanmamış'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] font-mono">Program Durumu:</span>
                                        <span className="font-semibold text-emerald-400">{editingItem.program ? 'Programa atanmış' : '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] font-mono">Dönem / Cohort:</span>
                                        <span className="font-mono text-gray-300">{editingItem.programAssignments?.[0]?.cohort || 'Bilgi girilmemiş'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FİZİKSEL ALAN & TEKMER SECTION (Section 202) */}
                        {!isCreating && (
                            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-cyan-400" />
                                        <h3 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                                            Fiziksel Alan & TEKMER Yerleşimi
                                        </h3>
                                    </div>
                                    <a
                                        href="/admin/finans/kiralar"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition-colors cursor-pointer"
                                    >
                                        <DollarSign className="w-3.5 h-3.5" /> Kira & Sözleşme Detayları
                                    </a>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs bg-black/40 p-3 rounded-lg border border-cyan-500/20">
                                    <div>
                                        <span className="text-gray-400 block text-[10px] font-mono">Tahsisli Alan:</span>
                                        <span className="font-semibold text-cyan-300">Ofis 203 / Masa 12</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] font-mono">Sözleşme Tarafı:</span>
                                        <span className="font-semibold text-white">Tüzel Şirket (A.Ş.)</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] font-mono">Aylık Kira:</span>
                                        <span className="font-mono text-emerald-400 font-semibold">18.500 TL + KDV</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] font-mono">Kira Durumu:</span>
                                        <span className="font-semibold text-emerald-400">Güncel / Ödendi</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ŞİRKET & PERSONEL (EKİP) SECTION (Section 259) */}
                        {!isCreating && (
                            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-amber-400" />
                                        <h3 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                                            Şirket & Ekip (Personeller)
                                        </h3>
                                    </div>
                                    <a
                                        href="/admin/rehber"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-colors cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Personel / Kişi Ekle
                                    </a>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-black/40 p-3 rounded-lg border border-amber-500/20">
                                    <div>
                                        <span className="text-gray-400 block text-[10px] font-mono">Bağlı Şirket:</span>
                                        <span className="font-semibold text-amber-300">{editingItem.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] font-mono">Kayıtlı Personel:</span>
                                        <span className="font-semibold text-white">4 Çalışan (1 Kurucu, 1 Finans, 2 Geliştirici)</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] font-mono">İmza Yetkilisi:</span>
                                        <span className="font-mono text-gray-300">{editingItem.founders || 'Belirtilmedi'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingItem(null);
                                    setIsCreating(false);
                                }}
                                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 transition-all cursor-pointer"
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
                            className="text-xs text-gray-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer"
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

            {/* Program Assignment Modal (Section 195) */}
            {assignModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0e0e18] border border-purple-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Rocket className="w-5 h-5 text-purple-400" />
                                <h3 className="font-orbitron font-bold text-base text-white">
                                    Program Ata: {assignTarget?.name}
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setAssignModalOpen(false);
                                    setAssignTarget(null);
                                }}
                                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAssignment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-300 mb-1.5">Program Seçin *</label>
                                <select
                                    required
                                    value={assignForm.programId}
                                    onChange={(e) => setAssignForm({ ...assignForm, programId: e.target.value })}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500 outline-none [&>option]:bg-[#0e0e18]"
                                >
                                    <option value="" disabled>-- Bir Program Seçin --</option>
                                    {trackOptions(programsList).map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                {assignForm.programId === TRACK_OTHER && (
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        maxLength={120}
                                        value={assignForm.otherProgram}
                                        onChange={(e) => setAssignForm({ ...assignForm, otherProgram: e.target.value })}
                                        placeholder="Program / süreç adını yazın"
                                        className="mt-2 w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-mono text-gray-300 mb-1.5">Dönem / Cohort</label>
                                    <input
                                        type="text"
                                        value={assignForm.cohort}
                                        onChange={(e) => setAssignForm({ ...assignForm, cohort: e.target.value })}
                                        placeholder="Örn: 2026-1"
                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-300 mb-1.5">Katılım Durumu</label>
                                    <select
                                        value={assignForm.status}
                                        onChange={(e) => setAssignForm({ ...assignForm, status: e.target.value })}
                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none [&>option]:bg-[#0e0e18]"
                                    >
                                        <option value="ACTIVE">Aktif Katılımcı</option>
                                        <option value="COMPLETED">Tamamladı / Mezun</option>
                                        <option value="DROPPED">Ayrıldı</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-300 mb-1.5">Başlangıç Tarihi</label>
                                <input
                                    type="date"
                                    value={assignForm.joinedAt}
                                    onChange={(e) => setAssignForm({ ...assignForm, joinedAt: e.target.value })}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-300 mb-1.5">Atama Notu / Mentor Notları</label>
                                <textarea
                                    rows={2}
                                    value={assignForm.notes}
                                    onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                                    placeholder="Programa kabul koşulları, hedefler..."
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAssignModalOpen(false);
                                        setAssignTarget(null);
                                    }}
                                    className="px-4 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingAssignment}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-primary text-white text-xs font-semibold shadow-lg shadow-purple-600/30 disabled:opacity-50 cursor-pointer"
                                >
                                    <Rocket className="w-4 h-4" />
                                    {savingAssignment ? 'Atanıyor...' : 'Programı Ata'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
