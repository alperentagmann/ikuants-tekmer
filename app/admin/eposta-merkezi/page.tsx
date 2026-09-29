"use client";

import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send, AlertTriangle, CheckCircle2, Clock, XCircle, Search, Filter } from 'lucide-react';

interface OutboxItem {
    id: string;
    to: string;
    subject: string;
    templateKey?: string | null;
    status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';
    retryCount: number;
    maxRetries: number;
    error?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    createdAt: string;
    sentAt?: string | null;
}

interface OutboxStats {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
}

export default function EmailOutboxPage() {
    const [emails, setEmails] = useState<OutboxItem[]>([]);
    const [stats, setStats] = useState<OutboxStats>({ total: 0, pending: 0, processing: 0, sent: 0, failed: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchOutbox = async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
            if (searchQuery) queryParams.append('search', searchQuery);

            const res = await fetch(`/api/admin/email-outbox?${queryParams.toString()}`);
            const data = await res.json();
            if (data.emails) {
                setEmails(data.emails);
            }
            if (data.stats) {
                setStats(data.stats);
            }
        } catch {
            setMessage({ type: 'error', text: 'E-posta kuyruğu yüklenirken hata oluştu' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOutbox();
    }, [statusFilter]);

    const handleProcessQueue = async () => {
        setIsProcessing(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/email-outbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'process_queue' }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({
                    type: 'success',
                    text: `Kuyruk işlendi. Başarılı: ${data.result?.sent || 0}, Başarısız: ${data.result?.failed || 0}`,
                });
                fetchOutbox();
            } else {
                setMessage({ type: 'error', text: data.error || 'Kuyruk işlenemedi' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Sunucu hatası oluştu' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRetry = async (id: string) => {
        try {
            const res = await fetch('/api/admin/email-outbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'retry', id }),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'E-posta tekrar kuyruğa alındı' });
                fetchOutbox();
            }
        } catch {
            setMessage({ type: 'error', text: 'İşlem başarısız' });
        }
    };

    const handleCancel = async (id: string) => {
        try {
            const res = await fetch('/api/admin/email-outbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel', id }),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'E-posta gönderimi iptal edildi' });
                fetchOutbox();
            }
        } catch {
            setMessage({ type: 'error', text: 'İşlem başarısız' });
        }
    };

    const getStatusBadge = (status: OutboxItem['status']) => {
        switch (status) {
            case 'SENT':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Gönderildi
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Beklemede
                    </span>
                );
            case 'PROCESSING':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" /> İşleniyor
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" /> Başarısız
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30 flex items-center gap-1.5">
                        <XCircle className="w-3 h-3" /> İptal Edildi
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-orbitron text-white tracking-wide flex items-center gap-3">
                        <Mail className="w-7 h-7 text-primary" />
                        E-Posta Teslimat Merkezi (Outbox)
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Tüm giden e-posta kuyruğunu izleyin, teslimat durumunu takip edin ve başarısız gönderimleri yönetin.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchOutbox}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 text-xs font-semibold flex items-center gap-2 transition"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Yenile
                    </button>
                    <button
                        onClick={handleProcessQueue}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                        {isProcessing ? 'Kuyruk İşleniyor...' : 'Kuyruğu Şimdi İşle'}
                    </button>
                </div>
            </div>

            {/* Alert Message */}
            {message && (
                <div
                    className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
                        message.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl">
                    <div className="text-[11px] font-mono text-gray-400">Toplam Kuyruk</div>
                    <div className="text-2xl font-bold font-orbitron text-white mt-1">{stats.total}</div>
                </div>
                <div className="p-4 bg-[#090912]/80 border border-amber-500/20 rounded-2xl backdrop-blur-xl">
                    <div className="text-[11px] font-mono text-amber-400">Bekleyen</div>
                    <div className="text-2xl font-bold font-orbitron text-amber-300 mt-1">{stats.pending}</div>
                </div>
                <div className="p-4 bg-[#090912]/80 border border-blue-500/20 rounded-2xl backdrop-blur-xl">
                    <div className="text-[11px] font-mono text-blue-400">İşlenen</div>
                    <div className="text-2xl font-bold font-orbitron text-blue-300 mt-1">{stats.processing}</div>
                </div>
                <div className="p-4 bg-[#090912]/80 border border-emerald-500/20 rounded-2xl backdrop-blur-xl">
                    <div className="text-[11px] font-mono text-emerald-400">Başarılı</div>
                    <div className="text-2xl font-bold font-orbitron text-emerald-300 mt-1">{stats.sent}</div>
                </div>
                <div className="p-4 bg-[#090912]/80 border border-rose-500/20 rounded-2xl backdrop-blur-xl">
                    <div className="text-[11px] font-mono text-rose-400">Başarısız</div>
                    <div className="text-2xl font-bold font-orbitron text-rose-300 mt-1">{stats.failed}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-72">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchOutbox()}
                            placeholder="Alıcı e-posta veya konu ara..."
                            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-primary focus:outline-none"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <Filter className="w-4 h-4 text-gray-400" />
                    {['ALL', 'PENDING', 'SENT', 'FAILED', 'CANCELLED'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                statusFilter === st
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {st === 'ALL'
                                ? 'Tümü'
                                : st === 'PENDING'
                                ? 'Bekleyen'
                                : st === 'SENT'
                                ? 'Gönderilen'
                                : st === 'FAILED'
                                ? 'Hatalı'
                                : 'İptal'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#090912]/80 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-gray-400 border-b border-white/10 font-mono uppercase text-[10px]">
                            <tr>
                                <th className="p-4">Alıcı (To)</th>
                                <th className="p-4">Konu / Şablon</th>
                                <th className="p-4">Durum</th>
                                <th className="p-4">Tekrar</th>
                                <th className="p-4">Oluşturulma</th>
                                <th className="p-4">Hata</th>
                                <th className="p-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : emails.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                emails.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                                        <td className="p-4 font-mono font-semibold text-white">
                                            {item.to}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-white max-w-xs truncate">
                                                {item.subject}
                                            </div>
                                            {item.templateKey && (
                                                <div className="text-[10px] font-mono text-primary mt-0.5">
                                                    {item.templateKey}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">{getStatusBadge(item.status)}</td>
                                        <td className="p-4 font-mono text-gray-400">
                                            {item.retryCount} / {item.maxRetries}
                                        </td>
                                        <td className="p-4 font-mono text-gray-400 text-[11px]">
                                            {new Date(item.createdAt).toLocaleString('tr-TR')}
                                        </td>
                                        <td className="p-4 text-rose-400 text-[11px] max-w-xs truncate font-mono">
                                            {item.error || '—'}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            {item.status === 'FAILED' && (
                                                <button
                                                    onClick={() => handleRetry(item.id)}
                                                    className="px-2.5 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-lg text-[11px] font-semibold transition"
                                                >
                                                    Tekrar Dene
                                                </button>
                                            )}
                                            {item.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleCancel(item.id)}
                                                    className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg text-[11px] font-semibold transition"
                                                >
                                                    İptal Et
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
