'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    CheckCircle2,
    Clock,
    Activity,
    ChevronRight,
    TrendingUp,
    Shield,
    Calendar,
    Search
} from 'lucide-react';

export default function KullaniciRaporPage() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchUsersReport = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                if (data.success && Array.isArray(data.users)) {
                    setUsers(data.users);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchUsersReport();
    }, []);

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                        <Link href="/admin/raporlar" className="hover:text-white transition-colors">
                            Rapor Merkezi
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-primary font-bold">Kullanıcı & Bireysel Rapor</span>
                    </div>
                    <h1 className="text-2xl font-bold font-orbitron text-white mt-1 flex items-center gap-2.5">
                        <Users className="w-6 h-6 text-primary" />
                        Kullanıcı Faaliyet & Verimlilik Raporu
                    </h1>
                </div>

                <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Personel ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                    />
                </div>
            </div>

            <div className="bg-[#0e0e18] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                    <thead className="bg-black/40 text-gray-400 font-mono uppercase text-[10px] border-b border-white/10">
                        <tr>
                            <th className="p-4">Kullanıcı</th>
                            <th className="p-4">Rol / Yetki</th>
                            <th className="p-4">Durum</th>
                            <th className="p-4">Son Giriş</th>
                            <th className="p-4">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 font-mono">
                                    Kullanıcı verileri yükleniyor...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 font-mono">
                                    Kayıt bulunamadı.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-white">{u.name}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                            u.isSuperAdmin ? 'bg-purple-500/20 text-purple-300' : 'bg-primary/20 text-primary'
                                        }`}>
                                            {u.isSuperAdmin ? 'SUPER ADMIN' : (u.userRoles?.[0]?.role?.name || 'Yönetici')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                            u.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                        }`}>
                                            {u.isActive ? 'AKTİF' : 'PASİF'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 font-mono">
                                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('tr-TR') : 'Kayıtlı giriş yok'}
                                    </td>
                                    <td className="p-4">
                                        <Link
                                            href={`/admin/kullanicilar`}
                                            className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-primary text-xs font-semibold"
                                        >
                                            Detay
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
