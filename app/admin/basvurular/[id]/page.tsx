"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { APPLICATION_STATUSES } from '@/lib/constants/application';
import {
    ArrowLeft, User, Building2, Mail, Phone, Shield, FileText,
    Calendar, CheckCircle, Clock, MessageSquare, Star, Upload,
    ExternalLink, AlertTriangle, Send, Paperclip
} from 'lucide-react';

export default function ApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [app, setApp] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [newStatus, setNewStatus] = useState('');
    const [statusReason, setStatusReason] = useState('');
    const [noteText, setNoteText] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);
    const [evalScore, setEvalScore] = useState<Record<string, number>>({});

    const [revealedTcNumber, setRevealedTcNumber] = useState<string | null>(null);
    const [isRevealing, setIsRevealing] = useState(false);
    const [piiError, setPiiError] = useState<string | null>(null);

    const fetchAppDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/applications/${id}`);
            const data = await res.json();
            if (data.success) {
                setApp(data.application);
                setNewStatus(data.application.status);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRevealPii = async () => {
        if (!confirm('T.C. Kimlik Numarasını görüntülemek üzeresiniz. Bu işlem RBAC yetki kontrolünden geçirilecek ve Audit Log sistemine kaydedilecektir. Devam etmek istiyor musunuz?')) {
            return;
        }
        setIsRevealing(true);
        setPiiError(null);
        try {
            const res = await fetch(`/api/admin/applications/${id}/reveal-pii`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Yönetici detay incelemesi' }),
            });
            const data = await res.json();
            if (data.success) {
                setRevealedTcNumber(data.tcNumber);
            } else {
                setPiiError(data.message || 'Yetkisiz işlem');
            }
        } catch (e: any) {
            setPiiError(e.message || 'Sunucu hatası');
        } finally {
            setIsRevealing(false);
        }
    };

    useEffect(() => {
        if (id) fetchAppDetails();
    }, [id]);

    const handleStatusUpdate = async () => {
        if (!newStatus || newStatus === app.status) return;
        try {
            const res = await fetch(`/api/admin/applications/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, reason: statusReason }),
            });
            const data = await res.json();
            if (data.success) {
                setStatusReason('');
                await fetchAppDetails();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteText.trim()) return;
        setSubmittingNote(true);
        try {
            const res = await fetch(`/api/admin/applications/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ noteText }),
            });
            const data = await res.json();
            if (data.success) {
                setNoteText('');
                await fetchAppDetails();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmittingNote(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400 font-mono animate-pulse">Başvuru detayları yükleniyor...</div>;
    }

    if (!app) {
        return <div className="p-8 text-center text-rose-400">Başvuru bulunamadı.</div>;
    }

    const answers = app.submission?.answers || [];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href="/admin/basvurular"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-mono"
                >
                    <ArrowLeft className="w-4 h-4" /> Başvuru Pipeline&apos;ına Dön
                </Link>
                <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                        {app.applicationNumber}
                    </span>
                </div>
            </div>

            {/* Header Card */}
            <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-orbitron font-bold text-2xl text-white">
                            {app.applicantName}
                        </h1>
                        <div className="text-xs text-gray-400 font-mono mt-1 flex flex-wrap items-center gap-4">
                            <span>{app.companyName || 'Bireysel Girişim'}</span>
                            <span>•</span>
                            <span>{app.email}</span>
                            <span>•</span>
                            <span>{app.phone || 'Telefon belirtilmedi'}</span>
                            <span>•</span>
                            <span className="text-purple-400 font-bold">{app.program?.name || 'ANTSPARK'}</span>
                        </div>
                    </div>

                    {/* Quick Status Changer */}
                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="bg-transparent text-xs text-white focus:outline-none px-2 py-1 [&>option]:bg-[#0e0e18]"
                        >
                            {APPLICATION_STATUSES.map((st) => (
                                <option key={st.key} value={st.key}>
                                    {st.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleStatusUpdate}
                            disabled={newStatus === app.status}
                            className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-30 transition-all"
                        >
                            Güncelle
                        </button>
                    </div>
                </div>

                {app.duplicateWarning && (
                    <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-400 text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{app.duplicateWarning}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Form Answers (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 shadow-xl">
                        <h2 className="font-orbitron font-bold text-sm text-white pb-3 mb-4 border-b border-white/10 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Başvuru Formu Cevapları (Form v{app.formVersion?.versionNumber || 1})
                        </h2>

                        <div className="space-y-4">
                            {answers.length === 0 ? (
                                <div className="text-xs text-gray-500 italic">Cevap kaydı bulunamadı.</div>
                            ) : (
                                answers.map((ans: any) => (
                                    <div key={ans.id} className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                                        <div className="text-[11px] font-mono text-gray-400 font-bold mb-1">
                                            {ans.fieldLabel || ans.fieldKey}
                                        </div>
                                        <div className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                                            {ans.textValue || ans.jsonValue || ans.numValue || '-'}
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Masked Sensitive T.C. with Audit-protected Reveal */}
                            {app.tcNumber && (
                                <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="text-[11px] font-mono text-purple-400 font-bold flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5" />
                                            T.C. Kimlik Numarası ({revealedTcNumber ? 'PII Açıldı (Denetim Kaydedildi)' : 'Hassas Veri / Maskeli'})
                                        </div>
                                        {!revealedTcNumber ? (
                                            <button
                                                type="button"
                                                onClick={handleRevealPii}
                                                disabled={isRevealing}
                                                className="px-2.5 py-1 text-[11px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-mono rounded-lg border border-purple-500/40 transition-all disabled:opacity-50"
                                            >
                                                {isRevealing ? 'Açılıyor...' : 'Kilidi Aç (Reveal)'}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setRevealedTcNumber(null)}
                                                className="px-2.5 py-1 text-[11px] bg-white/5 hover:bg-white/10 text-gray-400 font-mono rounded-lg border border-white/10 transition-all"
                                            >
                                                Gizle
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-xs font-mono font-bold text-white tracking-wider">
                                        {revealedTcNumber || app.tcNumber}
                                    </div>
                                    {piiError && (
                                        <div className="mt-2 text-[11px] text-rose-400 font-mono">
                                            {piiError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Notes, Timeline & Evaluation (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Internal Notes */}
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <h3 className="font-orbitron font-bold text-sm text-white pb-3 mb-4 border-b border-white/10 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Dahili Notlar & Mention ({app.notes?.length || 0})
                        </h3>

                        <form onSubmit={handleAddNote} className="mb-4">
                            <textarea
                                rows={2}
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Dahili not yazın (@mention yapabilirsiniz)..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-primary outline-none"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={submittingNote || !noteText.trim()}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    Not Ekle
                                </button>
                            </div>
                        </form>

                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {app.notes?.map((n: any) => (
                                <div key={n.id} className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mb-1">
                                        <span className="font-bold text-primary">{n.authorName || 'Yönetici'}</span>
                                        <span>{new Date(n.createdAt).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    <div className="text-gray-300 leading-relaxed">{n.noteText}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status History Timeline */}
                    <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-5 shadow-xl">
                        <h3 className="font-orbitron font-bold text-sm text-white pb-3 mb-4 border-b border-white/10 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            Durum Geçmişi & Süreç
                        </h3>

                        <div className="space-y-3">
                            {app.statusHistory?.map((h: any) => (
                                <div key={h.id} className="flex items-start gap-2.5 text-xs">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                    <div>
                                        <div className="text-gray-200">
                                            <span className="text-gray-400">{h.fromStatus}</span> → <span className="font-bold text-primary">{h.toStatus}</span>
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-500">
                                            {h.changedByName || 'Yönetici'} • {new Date(h.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
