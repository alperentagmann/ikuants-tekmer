"use client";
import React, { useState, useEffect } from 'react';
import {
    ShieldAlert, CheckCircle2, XCircle, Clock, User, FileText,
    ExternalLink, MessageSquare, AlertCircle
} from 'lucide-react';

interface ApprovalItem {
    id: string;
    entityType: string;
    entityId: string;
    entityTitle: string;
    submittedAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestNote?: string;
    requester?: { name: string; email: string };
    reviewer?: { name: string; email: string };
}

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/approvals');
            const data = await res.json();
            if (data.success) {
                setApprovals(data.approvals);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        if (!selectedApproval) return;
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approvalId: selectedApproval.id,
                    action,
                    reviewNote,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedApproval(null);
                setReviewNote('');
                fetchApprovals();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold font-orbitron text-white flex items-center gap-3">
                    <ShieldAlert className="w-7 h-7 text-primary" />
                    Onay Bekleyen İçerikler
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                    Editörler ve içerik üreticileri tarafından hazırlanan haber, banner ve duyuruların yayın onay kuyruğu.
                </p>
            </div>

            {/* Approvals List */}
            {loading ? (
                <div className="text-center py-20 text-xs font-mono text-gray-400">Onay kuyruğu yükleniyor...</div>
            ) : approvals.length === 0 ? (
                <div className="text-center py-20 bg-[#090912] border border-white/10 rounded-2xl space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <div className="text-sm font-semibold text-white">Bekleyen onay talebi bulunmuyor</div>
                    <p className="text-xs text-gray-500">Tüm editoryal içerikler incelendi ve güncel durumda.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {approvals.map((item) => (
                        <div
                            key={item.id}
                            className="bg-[#090912] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all"
                        >
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                        {item.entityType}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {new Date(item.submittedAt).toLocaleString('tr-TR')}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-sm text-white">{item.entityTitle}</h3>
                                {item.requestNote && (
                                    <p className="text-xs text-gray-400 bg-white/5 p-2 rounded-xl">
                                        <span className="text-gray-500 font-semibold">Talep Notu: </span>
                                        {item.requestNote}
                                    </p>
                                )}
                                <div className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
                                    <User className="w-3.5 h-3.5" />
                                    <span>Talep Eden: {item.requester?.name || 'Anonim Editör'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => setSelectedApproval(item)}
                                    className="px-4 py-2 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/30 rounded-xl text-xs font-semibold transition-all"
                                >
                                    İncele & Karar Ver
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {selectedApproval && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
                        <div className="flex items-start justify-between border-b border-white/10 pb-3">
                            <div>
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    {selectedApproval.entityType} Onayı
                                </span>
                                <h3 className="font-orbitron font-bold text-white text-base mt-1">{selectedApproval.entityTitle}</h3>
                            </div>
                            <button onClick={() => setSelectedApproval(null)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        {selectedApproval.requestNote && (
                            <div className="bg-white/5 p-3 rounded-xl">
                                <span className="text-gray-500 block text-[10px]">Editörün Açıklaması:</span>
                                <p className="text-gray-300 mt-0.5">{selectedApproval.requestNote}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-gray-400 mb-1">İnceleme Notu (Opsiyonel)</label>
                            <textarea
                                rows={3}
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                placeholder="Onaylama veya ret gerekçesini belirtin..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-primary"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleAction('REJECT')}
                                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-semibold transition-all flex items-center gap-1.5"
                            >
                                <XCircle className="w-4 h-4" />
                                Reddet
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleAction('APPROVE')}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Onayla & Canlıya Al
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
