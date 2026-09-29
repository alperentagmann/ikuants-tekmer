'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Send, MessageSquare } from 'lucide-react';

interface StickyMobileCtaProps {
    phoneNumber?: string;
    applyUrl?: string;
    contactUrl?: string;
}

export function StickyMobileCta({
    phoneNumber = '02124984162',
    applyUrl = '/programlar',
    contactUrl = '/iletisim',
}: StickyMobileCtaProps) {
    return (
        <aside
            aria-label="Hızlı Erişim Aksiyonları"
            className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-2.5 md:hidden"
        >
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                <a
                    href={`tel:${phoneNumber}`}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 active:scale-95 transition-all text-xs font-medium"
                    id="mobile-cta-call"
                >
                    <Phone className="w-4 h-4 mb-1 text-cyan-400" />
                    <span>Ara</span>
                </a>

                <Link
                    href={applyUrl}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50 active:scale-95 transition-all text-xs font-semibold"
                    id="mobile-cta-apply"
                >
                    <Send className="w-4 h-4 mb-1" />
                    <span>Başvur</span>
                </Link>

                <Link
                    href={contactUrl}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 active:scale-95 transition-all text-xs font-medium"
                    id="mobile-cta-contact"
                >
                    <MessageSquare className="w-4 h-4 mb-1 text-blue-400" />
                    <span>İletişim</span>
                </Link>
            </div>
        </aside>
    );
}
