"use client";
import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Shield, Plus, Edit2, Lock, UserCheck, Key, X, Save, AlertCircle } from 'lucide-react';

export default function AdminKullanicilarPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    // Form inputs
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        roleId: '',
        isSuperAdmin: false,
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [uRes, rRes] = await Promise.all([
                fetch('/api/admin/users'),
                fetch('/api/admin/roles'),
            ]);
            const uData = await uRes.json();
            const rData = await rRes.json();
            if (uData.success) setUsers(uData.users || []);
            if (rData.success) setRoles(rData.roles || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                setIsCreating(false);
                setFormData({ name: '', email: '', password: '', phone: '', roleId: '', isSuperAdmin: false });
                await fetchData();
            } else {
                alert(data.message || 'Kullanıcı oluşturulamadı');
            }
        } catch {
            alert('Hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (user: any) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchData();
            } else {
                alert(data.message || 'Güncellenemedi');
            }
        } catch {
            alert('Hata oluştu');
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'name',
            header: 'Yönetici Adı',
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary font-mono">
                        {item.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{item.email}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Rol / Yetki Seviyesi',
            render: (item) => (
                <span className="font-mono text-xs text-cyan-400 font-bold">
                    {item.isSuperAdmin ? 'Süper Yönetici (Full)' : item.userRoles?.[0]?.role?.name || 'Yetkisiz'}
                </span>
            ),
        },
        {
            key: 'sessions',
            header: 'Aktif Oturum',
            render: (item) => (
                <span className="text-gray-400 font-mono text-[11px]">
                    {item.sessions?.length || 0} cihaz
                </span>
            ),
        },
        {
            key: 'isActive',
            header: 'Durum',
            render: (item) => (
                <StatusBadge
                    status={item.isActive ? 'ACTIVE' : 'PASSIVE'}
                    label={item.isActive ? 'Aktif' : 'Devre Dışı'}
                />
            ),
        },
        {
            key: 'actions',
            header: 'İşlemler',
            sortable: false,
            render: (item) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            item.isActive
                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20'
                        }`}
                    >
                        {item.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Kullanıcı & Yönetici Yönetimi</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        Admin paneli kullanıcıları, oturumları ve role-based erişim denetimi
                    </p>
                </div>

                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Yönetici Hesabı Oluştur
                    </button>
                )}
            </div>

            {/* Create User Form */}
            {isCreating && (
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <h2 className="font-orbitron font-bold text-lg text-white">Yeni Admin Kullanıcısı</h2>
                        </div>
                        <button onClick={() => setIsCreating(false)} className="p-1 rounded-lg hover:bg-white/5 text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Ad Soyad *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Örn: Enes Kamacı"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">E-Posta Adresi *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="enes@ikuantstekmer.com"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Güçlü Parola *</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••••••"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Atanacak Rol</label>
                                <select
                                    value={formData.roleId}
                                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-primary outline-none [&>option]:bg-[#0e0e18]"
                                >
                                    <option value="">Rol Seçin...</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} ({r.description})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:text-white"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-semibold shadow-lg shadow-primary/25 disabled:opacity-50"
                            >
                                {saving ? 'Oluşturuluyor...' : 'Kullanıcıyı Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <DataTable
                data={users}
                columns={columns}
                searchPlaceholder="İsim veya e-posta ara..."
                exportFileName="ikuants-yoneticiler"
            />
        </div>
    );
}
