"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { APPLICATION_STATUSES } from '@/lib/constants/application';
import {
    FileText, LayoutGrid, List, Filter, Search, User,
    Calendar, ArrowRight, Clock, MessageSquare, AlertTriangle
} from 'lucide-react';

export default function AdminBasvurularPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/applications');
            const data = await res.json();
            if (data.success) {
                setApplications(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleStatusChange = async (appId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/applications/${appId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                // Update locally
                setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const columns: Column<any>[] = [
        {
            key: 'applicationNumber',
            header: 'Başvuru No',
            render: (item) => (
                <div className="font-mono font-bold text-cyan-400">
                    {item.applicationNumber}
                    {item.duplicateWarning && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-400 font-sans mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Yinelenen Olasılığı
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'applicantName',
            header: 'Başvuran Kişi / Firma',
            render: (item) => (
                <div>
                    <div className="font-semibold text-white">{item.applicantName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{item.companyName || 'Bireysel Başvuru'}</div>
                </div>
            ),
        },
        {
            key: 'program',
            header: 'Program',
            render: (item) => (
                <span className="text-purple-400 font-mono text-[11px]">
                    {item.program?.name || 'ANTSPARK'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Durum',
            render: (item) => <StatusBadge status={item.status} />,
        },
        {
            key: 'createdAt',
            header: 'Tarih',
            render: (item) => (
                <span className="text-gray-400 font-mono text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'İncele',
            sortable: false,
            render: (item) => (
                <Link
                    href={`/admin/basvurular/${item.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/30 text-xs font-semibold transition-all"
                >
                    Detay <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header with View Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-orbitron font-bold text-2xl text-white">Başvuru Pipeline (CRM)</h1>
                    <p className="text-xs font-mono text-gray-400 mt-1">
                        Girişim ve program başvurularının çok aşamalı değerlendirme ve durum yönetimi
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-[#0e0e18] p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            viewMode === 'kanban' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" /> Kanban
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            viewMode === 'table' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <List className="w-4 h-4" /> Tablo
                    </button>
                </div>
            </div>

            {/* Kanban Board View */}
            {viewMode === 'kanban' ? (
                <div className="overflow-x-auto pb-6">
                    <div className="flex gap-4 min-w-[1300px]">
                        {APPLICATION_STATUSES.slice(0, 7).map((status) => {
                            const columnApps = applications.filter((a) => a.status === status.key);

                            return (
                                <div
                                    key={status.key}
                                    className="w-72 flex-shrink-0 bg-[#0c0c16] border border-white/10 rounded-2xl p-3.5 flex flex-col max-h-[75vh]"
                                >
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <span className="font-orbitron font-bold text-xs text-white">
                                                {status.label}
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                                            {columnApps.length}
                                        </span>
                                    </div>

                                    {/* Cards list */}
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                                        {columnApps.length === 0 ? (
                                            <div className="p-6 text-center text-gray-600 text-xs font-mono italic">
                                                Bu aşamada başvuru yok
                                            </div>
                                        ) : (
                                            columnApps.map((app) => (
                                                <div
                                                    key={app.id}
                                                    onClick={() => router.push(`/admin/basvurular/${app.id}`)}
                                                    className="p-3.5 rounded-xl bg-[#141422] border border-white/5 hover:border-primary/40 transition-all cursor-pointer shadow-lg hover:shadow-primary/5 group"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[11px] font-mono font-bold text-cyan-400">
                                                            {app.applicationNumber}
                                                        </span>
                                                        <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                                            {app.program?.name || 'ANTSPARK'}
                                                        </span>
                                                    </div>

                                                    <div className="font-semibold text-xs text-white group-hover:text-primary transition-colors line-clamp-1 mb-1">
                                                        {app.applicantName}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 line-clamp-1 mb-2 font-mono">
                                                        {app.companyName || 'Bireysel Girişimci'}
                                                    </div>

                                                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(app.createdAt).toLocaleDateString('tr-TR')}
                                                        </span>
                                                        {app._count?.notes > 0 && (
                                                            <span className="flex items-center gap-1 text-primary">
                                                                <MessageSquare className="w-3 h-3" />
                                                                {app._count.notes}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <DataTable
                    data={applications}
                    columns={columns}
                    searchPlaceholder="Başvuru no, ad soyad veya firma ara..."
                    exportFileName="ikuants-basvurular"
                    onRowClick={(item) => router.push(`/admin/basvurular/${item.id}`)}
                />
            )}
        </div>
    );
}
