"use client";
import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { AuditDiffViewer } from '@/components/admin/AuditDiffViewer';
import { History, Shield, Eye, Filter, ArrowRight, User } from 'lucide-react';

export default function AdminAuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/audit-logs');
            const data = await res.json();
            if (data.success) {
                setLogs(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns: Column<any>[] = [
        {
            key: 'action',
            header: 'İşlem',
            render: (item) => (
                <span
                    className={`font-mono text-[10px] px-2.5 py-1 rounded-md font-bold uppercase border ${
                        item.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        item.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        item.action === 'DELETE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        item.action === 'LOGIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        item.action === 'PII_ACCESS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}
                >
                    {item.action}
                </span>
            ),
        },
        {
            key: 'entityType',
            header: 'Modül / Kayıt',
            render: (item) => (
                <div>
                    <div className="font-semibold text-white">{item.entityType}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{item.diff || item.fieldName || '-'}</div>
                </div>
            ),
        },
        {
            key: 'actor',
            header: 'Gerçekleştiren Admin',
            render: (item) => (
                <div className="text-xs">
                    <div className="text-gray-200">{item.actorName || item.actorEmail || 'Sistem'}</div>
                    <div className="text-[10px] font-mono text-gray-500">{item.ipAddress || '127.0.0.1'}</div>
                </div>
            ),
        },
        {
            key: 'createdAt',
            header: 'Tarih / Saat',
            render: (item) => (
                <span className="text-gray-400 font-mono text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Detay',
            sortable: false,
            render: (item) => (
                <button
                    onClick={() => setSelectedLog(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-primary text-xs font-semibold transition-colors"
                >
                    <Eye className="w-3.5 h-3.5" /> İncele
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-orbitron font-bold text-2xl text-white">Denetim Günlüğü (Audit Log)</h1>
                <p className="text-xs font-mono text-gray-400 mt-1">
                    Sistemde yapılan tüm veri ekleme, güncelleme, silme ve oturum hareketlerinin değiştirilemez güvenlik kaydı
                </p>
            </div>

            {/* Selected Log Diff Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-3xl bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-white space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div>
                                <h3 className="font-orbitron font-bold text-base">
                                    Log Detayı: {selectedLog.action} — {selectedLog.entityType}
                                </h3>
                                <div className="text-xs font-mono text-gray-400 mt-0.5">
                                    {selectedLog.actorName || selectedLog.actorEmail || 'Sistem'} • {selectedLog.ipAddress} • {new Date(selectedLog.createdAt).toLocaleString('tr-TR')}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-gray-300"
                            >
                                Kapat
                            </button>
                        </div>

                        <AuditDiffViewer
                            oldValues={selectedLog.oldValues}
                            newValues={selectedLog.newValues}
                            diff={selectedLog.diff}
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <DataTable
                data={logs}
                columns={columns}
                searchPlaceholder="İşlem, modül veya admin ara..."
                exportFileName="ikuants-audit-logs"
                filterOptions={[
                    {
                        key: 'action',
                        label: 'İşlem',
                        options: [
                            { value: 'CREATE', label: 'CREATE' },
                            { value: 'UPDATE', label: 'UPDATE' },
                            { value: 'DELETE', label: 'DELETE' },
                            { value: 'LOGIN', label: 'LOGIN' },
                            { value: 'PII_ACCESS', label: 'PII_ACCESS' },
                        ],
                    },
                ]}
            />
        </div>
    );
}
