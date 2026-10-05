"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, X, Maximize2 } from 'lucide-react';
import { AiConsole } from './ai/AiConsole';

interface AiAssistantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const DRAWER_SUGGESTIONS = ['Bugünkü işlerim', 'Bekleyen program başvuruları', 'Geciken kiraları göster', 'Bunun için görev oluştur'];

/** Global AI drawer. Uses the same server-side engine, permissions and confirmation flow as the command center. */
export function AiAssistantDrawer({ isOpen, onClose }: AiAssistantDrawerProps) {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby="ai-drawer-title" className="flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#0d0d18] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-white/10 bg-black/40 p-4">
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-xl bg-gradient-to-tr from-primary to-purple-600 p-2 text-white shadow-lg shadow-primary/25">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 id="ai-drawer-title" className="font-orbitron text-sm font-bold text-white">İKÜANTS AI Asistanı</h2>
                            <p className="text-[11px] text-gray-400">Bulunduğunuz sayfanın bağlamıyla çalışır. Değişiklikler onayınız olmadan yapılmaz.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Link href="/admin/ai" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white" title="Komuta Merkezi'nde aç">
                            <Maximize2 className="h-4 w-4" />
                        </Link>
                        <button id="close-ai-drawer-btn" type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white" title="Kapat">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="min-h-0 flex-1 p-4">
                    <AiConsole variant="drawer" suggestions={DRAWER_SUGGESTIONS} />
                </div>
            </div>
        </div>
    );
}
