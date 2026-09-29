"use client";
import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Clock, User, Check } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface Revision {
    id: string;
    version: number;
    changeSummary: string | null;
    authorName: string | null;
    createdAt: string;
    data: string;
}

interface RevisionViewerProps {
    entityType: string;
    entityId: string;
    onRollbackSuccess?: () => void;
}

export const RevisionViewer: React.FC<RevisionViewerProps> = ({ entityType, entityId, onRollbackSuccess }) => {
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRev, setSelectedRev] = useState<Revision | null>(null);
    const [rollbackTarget, setRollbackTarget] = useState<Revision | null>(null);
    const [rollingBack, setRollingBack] = useState(false);

    const fetchRevisions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/revisions?entityType=${entityType}&entityId=${entityId}`);
            const data = await res.json();
            if (data.success) {
                setRevisions(data.revisions);
                if (data.revisions.length > 0) {
                    setSelectedRev(data.revisions[0]);
                }
            }
        } catch (e) {
            console.error('Failed to fetch revisions:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (entityId) {
            fetchRevisions();
        }
    }, [entityType, entityId]);

    const handleRollback = async () => {
        if (!rollbackTarget) return;
        setRollingBack(true);
        try {
            const res = await fetch('/api/admin/revisions/rollback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityType,
                    entityId,
                    targetVersion: rollbackTarget.version,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setRollbackTarget(null);
                await fetchRevisions();
                if (onRollbackSuccess) onRollbackSuccess();
            } else {
                alert(data.message || 'Geri yükleme başarısız');
            }
        } catch {
            alert('Geri yükleme sırasında hata oluştu');
        } finally {
            setRollingBack(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center text-gray-400 text-sm animate-pulse">
                Sürüm geçmişi yükleniyor...
            </div>
        );
    }

    if (revisions.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500 text-sm">
                Henüz kayıtlı bir sürüm geçmişi bulunmuyor.
            </div>
        );
    }

    return (
        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl overflow-hidden text-white">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    <h3 className="font-orbitron font-bold text-sm">Sürüm Geçmişi ({revisions.length} Versiyon)</h3>
                </div>
                {selectedRev && selectedRev.version !== revisions[0]?.version && (
                    <button
                        onClick={() => setRollbackTarget(selectedRev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/30 transition-all text-xs font-semibold"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Bu Sürüme Geri Dön (v{selectedRev.version})
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[300px]">
                {/* Revision List */}
                <div className="md:col-span-4 border-r border-white/10 p-3 space-y-2 max-h-96 overflow-y-auto">
                    {revisions.map((rev) => {
                        const isCurrent = rev.version === revisions[0]?.version;
                        const isSelected = selectedRev?.id === rev.id;

                        return (
                            <div
                                key={rev.id}
                                onClick={() => setSelectedRev(rev)}
                                className={`p-3 rounded-xl cursor-pointer transition-all border ${
                                    isSelected
                                        ? 'bg-primary/15 border-primary/40 text-white'
                                        : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-mono font-bold text-xs text-cyan-400">
                                        Versiyon {rev.version}
                                    </span>
                                    {isCurrent && (
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">
                                            Canlı Sürüm
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-300 font-medium line-clamp-1 mb-1.5">
                                    {rev.changeSummary || 'Güncelleme'}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(rev.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {rev.authorName && (
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {rev.authorName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Revision Snapshot Viewer */}
                <div className="md:col-span-8 p-4 max-h-96 overflow-y-auto">
                    {selectedRev ? (
                        <div>
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                                <span className="text-xs font-mono text-gray-400">
                                    v{selectedRev.version} Anlık Görüntü (Snapshot)
                                </span>
                            </div>
                            <pre className="text-xs font-mono bg-black/60 p-4 rounded-xl border border-white/5 text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(JSON.parse(selectedRev.data), null, 2)}
                            </pre>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Rollback Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!rollbackTarget}
                title={`v${rollbackTarget?.version} Sürümüne Geri Dönüş`}
                description={`Bu işlem mevcut canlı içeriği v${rollbackTarget?.version} sürümündeki durumuna geri yükleyecektir. Bu işlem de yeni bir sürüm kaydı olarak saklanacaktır.`}
                confirmText="Sürümü Geri Yükle"
                isDestructive={false}
                onConfirm={handleRollback}
                onCancel={() => setRollbackTarget(null)}
            />
        </div>
    );
};
