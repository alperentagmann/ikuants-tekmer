"use client";
import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
    Shield, Plus, Edit2, Lock, UserCheck, Key, X, Save, AlertCircle,
    Mail, Phone, Building2, UserX, Trash2, Smartphone, History, CheckCircle2,
    RefreshCw, Send
} from 'lucide-react';

export default function AdminKullanicilarPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'sessions' | 'security' | 'activity'>('profile');
    const [userSessions, setUserSessions] = useState<any[]>([]);
    const [userActivities, setUserActivities] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Filter states
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Create form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        title: '',
        department: 'TEKMER Yönetimi',
        phone: '',
        roleId: '',
        isSuperAdmin: false,
        passwordMethod: 'INVITE' as 'INVITE' | 'TEMP_PASSWORD',
        tempPassword: '',
        notes: '',
    });

    const departments = [
        'TEKMER Yönetimi',
        'Operasyon',
        'TTO',
        'İletişim & Pazarlama',
        'Program & Kuluçka Yönetimi',
        'Finans & İdari İşler',
        'Mentörlük & Girişim İlişkileri',
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (departmentFilter) params.append('department', departmentFilter);
            if (roleFilter) params.append('role', roleFilter);
            if (statusFilter) params.append('status', statusFilter);

            const [uRes, rRes] = await Promise.all([
                fetch(`/api/admin/users?${params.toString()}`),
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
    }, [departmentFilter, roleFilter, statusFilter]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setActionMessage(null);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                setIsCreating(false);
                setFormData({
                    name: '',
                    email: '',
                    title: '',
                    department: 'TEKMER Yönetimi',
                    phone: '',
                    roleId: '',
                    isSuperAdmin: false,
                    passwordMethod: 'INVITE',
                    tempPassword: '',
                    notes: '',
                });
                setActionMessage({ type: 'success', text: data.message || 'Kullanıcı başarıyla oluşturuldu.' });
                await fetchData();
            } else {
                setActionMessage({ type: 'error', text: data.message || 'Kullanıcı oluşturulamadı.' });
            }
        } catch {
            setActionMessage({ type: 'error', text: 'Sunucuyla iletişim kurulurken bir hata oluştu.' });
        } finally {
            setSaving(false);
        }
    };

    const openUserDetails = async (user: any) => {
        setSelectedUser(user);
        setActiveTab('profile');
        setLoadingDetails(true);
        try {
            const [sessRes, actRes] = await Promise.all([
                fetch(`/api/admin/users/${user.id}/sessions`),
                fetch(`/api/admin/users/${user.id}/activity`),
            ]);
            const sessData = await sessRes.json();
            const actData = await actRes.json();
            if (sessData.success) setUserSessions(sessData.sessions || []);
            if (actData.success) setUserActivities(actData.activities || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleRevokeSession = async (sessionId?: string) => {
        if (!selectedUser) return;
        try {
            const url = sessionId
                ? `/api/admin/users/${selectedUser.id}/sessions?sessionId=${sessionId}`
                : `/api/admin/users/${selectedUser.id}/sessions`;

            const res = await fetch(url, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                const sessRes = await fetch(`/api/admin/users/${selectedUser.id}/sessions`);
                const sessData = await sessRes.json();
                if (sessData.success) setUserSessions(sessData.sessions || []);
                setActionMessage({ type: 'success', text: data.message });
            } else {
                setActionMessage({ type: 'error', text: data.message });
            }
        } catch {
            setActionMessage({ type: 'error', text: 'İşlem başarısız.' });
        }
    };

    const handleSendPasswordReset = async () => {
        if (!selectedUser) return;
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: 'LINK' }),
            });
            const data = await res.json();
            if (data.success) {
                setActionMessage({ type: 'success', text: data.message });
            } else {
                setActionMessage({ type: 'error', text: data.message });
            }
        } catch {
            setActionMessage({ type: 'error', text: 'Şifre sıfırlama bağlantısı gönderilemedi.' });
        }
    };

    const handleToggleStatus = async (user: any, newStatus: 'ACTIVE' | 'DISABLED') => {
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    isActive: newStatus === 'ACTIVE',
                }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchData();
                if (selectedUser?.id === user.id) {
                    setSelectedUser({ ...selectedUser, status: newStatus, isActive: newStatus === 'ACTIVE' });
                }
                setActionMessage({ type: 'success', text: `Kullanıcı durumu ${newStatus === 'ACTIVE' ? 'Aktif' : 'Pasif'} olarak güncellendi.` });
            } else {
                setActionMessage({ type: 'error', text: data.message || 'Durum değiştirilemedi.' });
            }
        } catch {
            setActionMessage({ type: 'error', text: 'Hata oluştu.' });
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'name',
            header: 'Yönetici / Kullanıcı',
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/30 to-purple-500/30 border border-primary/40 flex items-center justify-center font-bold text-xs text-white font-mono shadow-sm">
                        {item.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="font-semibold text-white text-sm flex items-center gap-2">
                            {item.name}
                            {item.isSuperAdmin && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                                    SUPER ADMIN
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{item.email}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'title',
            header: 'Unvan & Departman',
            render: (item) => (
                <div>
                    <div className="text-xs font-medium text-gray-200">{item.title || 'Belirtilmedi'}</div>
                    <div className="text-[11px] text-gray-400 font-mono">{item.department || 'Genel'}</div>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Rol',
            render: (item) => (
                <span className="font-mono text-xs text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {item.isSuperAdmin ? 'Süper Yönetici' : item.userRoles?.[0]?.role?.name || 'Yetkisiz'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Durum',
            render: (item) => {
                let badgeStatus = 'ACTIVE';
                let label = 'Aktif';
                if (item.status === 'INVITED') {
                    badgeStatus = 'PENDING';
                    label = 'Davet Edildi';
                } else if (item.status === 'DISABLED' || !item.isActive) {
                    badgeStatus = 'PASSIVE';
                    label = 'Devre Dışı';
                } else if (item.status === 'LOCKED') {
                    badgeStatus = 'REJECTED';
                    label = 'Kilitli';
                }
                return <StatusBadge status={badgeStatus as any} label={label} />;
            },
        },
        {
            key: 'sessions',
            header: 'Aktif Oturum',
            render: (item) => (
                <span className="text-gray-300 font-mono text-xs flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                    {item.sessions?.length || 0} cihaz
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'İşlemler',
            sortable: false,
            render: (item) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openUserDetails(item)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-medium border border-white/10 transition-colors"
                    >
                        Yönet & Detay
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white flex items-center gap-2.5">
                        <Shield className="w-6 h-6 text-primary" />
                        Kullanıcı & Yönetici Yönetimi
                    </h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        İKÜANTS TEKMER çoklu yönetici hesapları, davet akışları, oturum kontrolü ve rol hiyerarşisi
                    </p>
                </div>

                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Yönetici Ekle / Davet Et
                    </button>
                )}
            </div>

            {actionMessage && (
                <div
                    className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
                        actionMessage.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {actionMessage.text}
                    </div>
                    <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0e0e18] border border-white/10 p-3.5 rounded-xl">
                <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">Departman Filtresi</label>
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none [&>option]:bg-[#0e0e18]"
                    >
                        <option value="">Tüm Departmanlar</option>
                        {departments.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">Rol Filtresi</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none [&>option]:bg-[#0e0e18]"
                    >
                        <option value="">Tüm Roller</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.slug}>{r.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">Durum Filtresi</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none [&>option]:bg-[#0e0e18]"
                    >
                        <option value="">Tüm Durumlar</option>
                        <option value="ACTIVE">Aktif</option>
                        <option value="INVITED">Davet Edildi</option>
                        <option value="DISABLED">Devre Dışı</option>
                        <option value="LOCKED">Kilitli</option>
                    </select>
                </div>
            </div>

            {/* Create Admin Form */}
            {isCreating && (
                <div className="bg-[#0e0e18] border border-primary/30 rounded-2xl p-6 shadow-2xl animate-in fade-in">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <h2 className="font-orbitron font-bold text-lg text-white">Yeni Yönetici Hesabı Oluştur</h2>
                        </div>
                        <button onClick={() => setIsCreating(false)} className="p-1 rounded-lg hover:bg-white/5 text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Ad Soyad *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Örn: Dr. Hatice Tuğsavul"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">E-Posta Adresi *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="h.tugsavul@iku.edu.tr"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Telefon Numarası</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+90 5XX XXX XX XX"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Unvan / Pozisyon</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Örn: TEKMER Müdürü"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Departman</label>
                                <select
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-primary outline-none [&>option]:bg-[#0e0e18]"
                                >
                                    {departments.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-1.5">Atanacak Rol *</label>
                                <select
                                    required
                                    value={formData.roleId}
                                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-primary outline-none [&>option]:bg-[#0e0e18]"
                                >
                                    <option value="">Rol Seçiniz...</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Password Method Selection */}
                        <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
                            <label className="block text-xs font-mono text-gray-300 font-bold">Şifre Belirleme Yöntemi</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-all ${
                                    formData.passwordMethod === 'INVITE'
                                        ? 'bg-primary/10 border-primary text-white'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'
                                }`}>
                                    <input
                                        type="radio"
                                        name="passwordMethod"
                                        checked={formData.passwordMethod === 'INVITE'}
                                        onChange={() => setFormData({ ...formData, passwordMethod: 'INVITE' })}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                            <Send className="w-3.5 h-3.5 text-primary" />
                                            Güvenli Davet Bağlantısı Gönder (Önerilen)
                                        </div>
                                        <div className="text-[11px] text-gray-400 mt-1">
                                            Kullanıcıya tek kullanımlık, 24 saat geçerli bir link gönderilir ve kendi şifresini kendisi belirler.
                                        </div>
                                    </div>
                                </label>

                                <label className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-all ${
                                    formData.passwordMethod === 'TEMP_PASSWORD'
                                        ? 'bg-primary/10 border-primary text-white'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'
                                }`}>
                                    <input
                                        type="radio"
                                        name="passwordMethod"
                                        checked={formData.passwordMethod === 'TEMP_PASSWORD'}
                                        onChange={() => setFormData({ ...formData, passwordMethod: 'TEMP_PASSWORD' })}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                            <Key className="w-3.5 h-3.5 text-amber-400" />
                                            Geçici Şifre Belirle
                                        </div>
                                        <div className="text-[11px] text-gray-400 mt-1">
                                            Yönetici geçici parola belirler; kullanıcı ilk girişte parolasını zorunlu olarak değiştirir.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {formData.passwordMethod === 'TEMP_PASSWORD' && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <label className="block text-xs font-mono text-gray-400 mb-1.5">Geçici Parola</label>
                                    <input
                                        type="text"
                                        value={formData.tempPassword}
                                        onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                                        placeholder="Boş bırakılırsa sistem otomatik rastgele parola üretir"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-primary outline-none"
                                    />
                                </div>
                            )}
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
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {formData.passwordMethod === 'INVITE' ? 'Davet E-postası Gönder' : 'Kullanıcıyı Oluştur'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <DataTable
                data={users}
                columns={columns}
                searchPlaceholder="İsim, unvan veya e-posta ara..."
                exportFileName="ikuants-yoneticiler"
            />

            {/* User Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0e0e18] border border-white/15 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-sm text-primary font-mono">
                                    {selectedUser.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                                        {selectedUser.name}
                                        {selectedUser.isSuperAdmin && (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                                                SUPER ADMIN
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-mono">{selectedUser.email}</p>
                                </div>
                            </div>

                            <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg hover:bg-white/5 text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-white/10 bg-black/20 px-5">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                                    activeTab === 'profile'
                                        ? 'border-primary text-white'
                                        : 'border-transparent text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                Profil & Bilgiler
                            </button>
                            <button
                                onClick={() => setActiveTab('sessions')}
                                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                                    activeTab === 'sessions'
                                        ? 'border-primary text-white'
                                        : 'border-transparent text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                Aktif Oturumlar ({userSessions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                                    activeTab === 'security'
                                        ? 'border-primary text-white'
                                        : 'border-transparent text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <Lock className="w-3.5 h-3.5" />
                                Güvenlik & Şifre
                            </button>
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                                    activeTab === 'activity'
                                        ? 'border-primary text-white'
                                        : 'border-transparent text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <History className="w-3.5 h-3.5" />
                                Aktivite Günlüğü
                            </button>
                        </div>

                        {/* Tab Contents */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            {activeTab === 'profile' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                            <div className="text-gray-400 font-mono text-[10px]">UNVAN</div>
                                            <div className="font-semibold text-white mt-1">{selectedUser.title || 'Belirtilmedi'}</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                            <div className="text-gray-400 font-mono text-[10px]">DEPARTMAN</div>
                                            <div className="font-semibold text-white mt-1">{selectedUser.department || 'Genel'}</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                            <div className="text-gray-400 font-mono text-[10px]">TELEFON</div>
                                            <div className="font-semibold text-white mt-1">{selectedUser.phone || 'Belirtilmedi'}</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                            <div className="text-gray-400 font-mono text-[10px]">MFA DURUMU</div>
                                            <div className="font-semibold text-emerald-400 mt-1">
                                                {selectedUser.isMfaEnabled ? '✅ Aktif (TOTP)' : '⚪ Pasif'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-bold text-white">Hesap Durumu</div>
                                            <div className="text-[11px] text-gray-400">Kullanıcının sisteme erişim iznini kontrol edin</div>
                                        </div>

                                        {selectedUser.status === 'ACTIVE' ? (
                                            <button
                                                onClick={() => handleToggleStatus(selectedUser, 'DISABLED')}
                                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-xs font-medium transition-colors"
                                            >
                                                Hesabı Devre Dışı Bırak
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleToggleStatus(selectedUser, 'ACTIVE')}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-xs font-medium transition-colors"
                                            >
                                                Hesabı Yeniden Aktifleştir
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sessions' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono text-gray-400">Aktif Giriş Yapılmış Cihazlar</span>
                                        {userSessions.length > 0 && (
                                            <button
                                                onClick={() => handleRevokeSession()}
                                                className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-xs font-medium"
                                            >
                                                Tüm Cihazlardan Çıkış Yap
                                            </button>
                                        )}
                                    </div>

                                    {userSessions.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-xs font-mono">
                                            Şu anda açık oturum bulunmuyor.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {userSessions.map((s) => (
                                                <div key={s.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Smartphone className="w-4 h-4 text-primary" />
                                                        <div>
                                                            <div className="text-xs font-semibold text-white">{s.ipAddress || 'Bilinmeyen IP'}</div>
                                                            <div className="text-[10px] text-gray-400 font-mono truncate max-w-md">{s.userAgent || 'Web Tarayıcı'}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRevokeSession(s.id)}
                                                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 text-[11px]"
                                                    >
                                                        Kapat
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-white">Şifre Sıfırlama Bağlantısı</div>
                                                <div className="text-[11px] text-gray-400">Kullanıcının e-posta adresine güvenli şifre sıfırlama linki gönderir.</div>
                                            </div>
                                            <button
                                                onClick={handleSendPasswordReset}
                                                className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow"
                                            >
                                                Şifre Sıfırlama Linki Gönder
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <div className="space-y-3">
                                    {userActivities.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-xs font-mono">
                                            Kayıtlı aktivite bulunamadı.
                                        </div>
                                    ) : (
                                        userActivities.map((act) => (
                                            <div key={act.id} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-start gap-3">
                                                <div className="p-1.5 rounded-lg bg-primary/20 text-primary mt-0.5">
                                                    <History className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs font-semibold text-white">{act.diff || `${act.action} on ${act.entityType}`}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                        {new Date(act.createdAt).toLocaleString('tr-TR')} • IP: {act.ipAddress || 'Dahili'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
