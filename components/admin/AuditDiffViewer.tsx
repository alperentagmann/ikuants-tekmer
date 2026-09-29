"use client";
import React, { useState } from 'react';
import { ArrowRight, Code, Eye, FileText } from 'lucide-react';

interface AuditDiffViewerProps {
    oldValues?: string | null; // JSON string
    newValues?: string | null; // JSON string
    diff?: string | null;
}

export const AuditDiffViewer: React.FC<AuditDiffViewerProps> = ({ oldValues, newValues, diff }) => {
    const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

    const oldObj = oldValues ? JSON.parse(oldValues) : null;
    const newObj = newValues ? JSON.parse(newValues) : null;

    const allKeys = Array.from(new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]));

    const changedKeys = allKeys.filter((key) => {
        if (['updatedAt', 'createdAt'].includes(key)) return false;
        const v1 = oldObj ? oldObj[key] : undefined;
        const v2 = newObj ? newObj[key] : undefined;
        return JSON.stringify(v1) !== JSON.stringify(v2);
    });

    return (
        <div className="bg-[#0b0b14] border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-white">Değişiklik Detayı (Diff)</span>
                </div>
                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                    <button
                        onClick={() => setViewMode('visual')}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                            viewMode === 'visual' ? 'bg-primary text-white font-medium' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Eye className="w-3 h-3 inline mr-1" />
                        Görsel Diff
                    </button>
                    <button
                        onClick={() => setViewMode('json')}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                            viewMode === 'json' ? 'bg-primary text-white font-medium' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Code className="w-3 h-3 inline mr-1" />
                        Ham JSON
                    </button>
                </div>
            </div>

            {viewMode === 'visual' ? (
                <div className="space-y-2">
                    {changedKeys.length === 0 ? (
                        <div className="text-gray-500 italic py-2">{diff || 'Doğrudan alan değişikliği tespit edilmedi.'}</div>
                    ) : (
                        changedKeys.map((key) => {
                            const oldVal = oldObj ? oldObj[key] : undefined;
                            const newVal = newObj ? newObj[key] : undefined;

                            return (
                                <div key={key} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 rounded-lg bg-black/30 border border-white/5 items-center">
                                    <div className="md:col-span-3 text-cyan-400 font-bold truncate">
                                        {key}
                                    </div>
                                    <div className="md:col-span-4 bg-rose-500/10 text-rose-300 p-2 rounded border border-rose-500/20 break-all line-through opacity-80">
                                        {oldVal !== undefined ? (typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal || 'null')) : '<yok>'}
                                    </div>
                                    <div className="md:col-span-1 flex justify-center text-gray-500">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                    <div className="md:col-span-4 bg-emerald-500/10 text-emerald-300 p-2 rounded border border-emerald-500/20 break-all font-semibold">
                                        {newVal !== undefined ? (typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal || 'null')) : '<silindi>'}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <div className="text-[10px] text-rose-400 mb-1 font-bold">ESKİ DEĞER</div>
                        <pre className="bg-black/60 p-3 rounded-lg border border-white/5 overflow-x-auto max-h-60 text-[11px] text-rose-300">
                            {oldValues ? JSON.stringify(JSON.parse(oldValues), null, 2) : 'null'}
                        </pre>
                    </div>
                    <div>
                        <div className="text-[10px] text-emerald-400 mb-1 font-bold">YENİ DEĞER</div>
                        <pre className="bg-black/60 p-3 rounded-lg border border-white/5 overflow-x-auto max-h-60 text-[11px] text-emerald-300">
                            {newValues ? JSON.stringify(JSON.parse(newValues), null, 2) : 'null'}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};
