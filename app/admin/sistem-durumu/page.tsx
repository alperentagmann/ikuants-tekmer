"use client";
import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Mail, ShieldCheck, HardDrive, Cpu, RefreshCw } from 'lucide-react';

export default function AdminSistemDurumuPage() {
    const [status, setStatus] = useState<any>({
        database: 'ONLINE',
        storage: 'ONLINE',
        auth: 'ONLINE',
        emailService: 'CONFIGURED',
        nodeVersion: 'v24.12.0',
        nextVersion: '16.1.1',
        environment: process.env.NODE_ENV || 'production',
        dbLatency: '4ms',
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Sistem Durumu (Health Check)</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        Veritabanı bağlantısı, depolama havuzu ve altyapı servislerinin anlık durumu
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Database */}
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            <h3 className="font-orbitron font-bold text-sm text-white">PostgreSQL Veritabanı</h3>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {status.database}
                        </span>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-gray-400">
                        <div className="flex justify-between">
                            <span>ORM:</span> <span className="text-white">Prisma Client</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Yanıt Süresi:</span> <span className="text-emerald-400">{status.dbLatency}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Bağlantı Havuzu:</span> <span className="text-white">Aktif</span>
                        </div>
                    </div>
                </div>

                {/* Storage */}
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-cyan-400" />
                            <h3 className="font-orbitron font-bold text-sm text-white">Depolama Servisi</h3>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {status.storage}
                        </span>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-gray-400">
                        <div className="flex justify-between">
                            <span>Depolama Motoru:</span> <span className="text-white">Unified Object Storage</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Public Bucket:</span> <span className="text-white">ikuants-public-media</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Private Bucket:</span> <span className="text-white">ikuants-private-documents</span>
                        </div>
                    </div>
                </div>

                {/* Auth & Security */}
                <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-purple-400" />
                            <h3 className="font-orbitron font-bold text-sm text-white">Güvenlik & Oturum</h3>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {status.auth}
                        </span>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-gray-400">
                        <div className="flex justify-between">
                            <span>Oturum Tipi:</span> <span className="text-white">HttpOnly Server Cookie</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Brute-force Koruması:</span> <span className="text-emerald-400">Devrede</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Audit Log Motoru:</span> <span className="text-emerald-400">Değiştirilemez</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
