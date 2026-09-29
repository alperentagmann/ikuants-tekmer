"use client";
import React, { useState, useEffect } from 'react';
import { Shield, Plus, Lock, Check, X, Key } from 'lucide-react';

export default function AdminRollerPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/roles');
            const data = await res.json();
            if (data.success) {
                setRoles(data.roles || []);
                setPermissions(data.permissions || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-orbitron font-bold text-2xl text-white">Rol & İzin Mimarisi (RBAC)</h1>
                <p className="text-xs font-mono text-gray-400 mt-1">
                    Sistemdeki rollerin modül ve kaynak bazlı granüler yetki dağılımı
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                    <div
                        key={role.id}
                        className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary" />
                                    <h3 className="font-orbitron font-bold text-sm text-white">{role.name}</h3>
                                </div>
                                <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                                    {role._count?.userRoles || 0} Kullanıcı
                                </span>
                            </div>

                            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                {role.description || 'Açıklama belirtilmemiş.'}
                            </p>

                            <div className="text-[11px] font-mono text-gray-500 mb-2 font-bold uppercase">
                                Tanımlı İzinler ({role.slug === 'super-admin' ? 'TÜMÜ (*)' : role.permissions?.length || 0})
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                                {role.slug === 'super-admin' ? (
                                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono">
                                        Tam Yetki (*:*)
                                    </span>
                                ) : (
                                    role.permissions?.map((rp: any) => (
                                        <span
                                            key={rp.id}
                                            className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5 text-[10px] font-mono"
                                        >
                                            {rp.permission.resource}:{rp.permission.action}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
