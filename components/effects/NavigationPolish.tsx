'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';

/**
 * Small finishing touches for public pages: a thin progress line on page changes and a
 * "back to top" button after scrolling. Both respect reduced-motion via CSS.
 */
export function NavigationPolish() {
    const pathname = usePathname();
    const [progress, setProgress] = useState(0);
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const start = setTimeout(() => setProgress(70), 0);
        const done = setTimeout(() => setProgress(100), 350);
        const hide = setTimeout(() => setProgress(0), 700);
        return () => {
            clearTimeout(start);
            clearTimeout(done);
            clearTimeout(hide);
        };
    }, [pathname]);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 900);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5">
                <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(124,58,237,0.7)] transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${progress}%`, opacity: progress > 0 && progress < 100 ? 1 : 0 }} />
            </div>
            <button
                type="button"
                aria-label="Sayfanın başına dön"
                onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
                className={`fixed bottom-24 right-5 z-[55] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-primary to-purple-600 text-white shadow-xl shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 motion-reduce:transition-none ${showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
            >
                <ArrowUp className="h-5 w-5" />
            </button>
        </>
    );
}
