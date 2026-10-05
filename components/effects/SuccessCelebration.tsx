'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { FORM_SUCCESS_EVENT, type FormSuccessDetail } from '@/lib/celebrate';
import type { AnimationSettings } from '@/lib/site-settings';

/** Deterministic pseudo-random numbers so render stays pure. */
const rand = (i: number, salt: number) => {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
};
const CONFETTI_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#3b82f6'];
const STARS = Array.from({ length: 18 }, (_, i) => ({ left: rand(i, 1) * 100, top: rand(i, 2) * 100, size: 2 + rand(i, 3) * 3, delay: rand(i, 4) * 1.2 }));
const CONFETTI = Array.from({ length: 46 }, (_, i) => ({ x: (rand(i, 5) - 0.5) * 900, y: -(220 + rand(i, 6) * 360), r: rand(i, 7) * 720 - 360, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], w: 6 + rand(i, 8) * 6, delay: rand(i, 9) * 0.25 }));

function Rocket() {
    return (
        <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-[0_0_24px_rgba(124,58,237,0.8)]" aria-hidden>
            <defs>
                <linearGradient id="rk-body" x1="0" x2="1">
                    <stop offset="0" stopColor="#f8fafc" />
                    <stop offset="1" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="rk-flame" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fde047" />
                    <stop offset="0.5" stopColor="#f97316" />
                    <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d="M28 46 L32 62 L36 46 Z" fill="url(#rk-flame)">
                <animate attributeName="d" dur="0.18s" repeatCount="indefinite" values="M28 46 L32 62 L36 46 Z;M27 46 L32 58 L37 46 Z;M28 46 L32 62 L36 46 Z" />
            </path>
            <path d="M32 2 C42 10 44 24 42 40 L22 40 C20 24 22 10 32 2 Z" fill="url(#rk-body)" />
            <path d="M22 30 L12 42 L22 42 Z" fill="#7c3aed" />
            <path d="M42 30 L52 42 L42 42 Z" fill="#7c3aed" />
            <rect x="24" y="40" width="16" height="6" rx="2" fill="#475569" />
            <circle cx="32" cy="20" r="6" fill="#06b6d4" stroke="#0e7490" strokeWidth="2" />
            <circle cx="30" cy="18" r="1.6" fill="#e0f2fe" />
        </svg>
    );
}

/**
 * Celebration shown after any public form is sent successfully. Style, texts and duration
 * come from Admin › Ayarlar › Animasyonlar; reduced-motion visitors see a calm confirmation.
 */
export function SuccessCelebration({ settings }: { settings: AnimationSettings | null }) {
    const [detail, setDetail] = useState<FormSuccessDetail | null>(null);
    const prefersReduced = useReducedMotion();
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const close = useCallback(() => setDetail(null), []);

    useEffect(() => {
        const onSuccess = (e: Event) => {
            if (settings && !settings.successEnabled) return;
            setDetail((e as CustomEvent<FormSuccessDetail>).detail || {});
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setDetail(null), (settings?.successSeconds || 4) * 1000);
        };
        window.addEventListener(FORM_SUCCESS_EVENT, onSuccess);
        return () => {
            window.removeEventListener(FORM_SUCCESS_EVENT, onSuccess);
            if (timer.current) clearTimeout(timer.current);
        };
    }, [settings]);

    useEffect(() => {
        if (!detail) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [detail, close]);

    const calm = prefersReduced || settings?.motion === 'off';
    const style = settings?.successStyle || 'rocket';
    const title = settings?.successTitle || 'Başarıyla alınmıştır!';
    const text = detail?.message || settings?.successText || 'Talebiniz bize ulaştı.';

    return (
        <AnimatePresence>
            {detail && (
                <motion.div
                    key="celebration"
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={close}
                    data-testid="success-celebration"
                >
                    {!calm && style === 'rocket' && (
                        <>
                            {STARS.map((s, i) => (
                                <motion.span key={i} className="pointer-events-none absolute rounded-full bg-white" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0.3], scale: [0, 1, 0.8] }} transition={{ duration: 1.6, delay: s.delay, repeat: Infinity, repeatType: 'reverse' }} />
                            ))}
                            <motion.div
                                className="pointer-events-none absolute h-24 w-24 sm:h-32 sm:w-32"
                                initial={{ x: '-45vw', y: '45vh', rotate: 45, scale: 0.6 }}
                                animate={{ x: ['-45vw', '-5vw', '55vw'], y: ['45vh', '-4vh', '-60vh'], scale: [0.6, 1.1, 0.7] }}
                                transition={{ duration: 2.6, ease: 'easeInOut', times: [0, 0.45, 1] }}
                            >
                                <Rocket />
                            </motion.div>
                        </>
                    )}
                    {!calm && style === 'confetti' &&
                        CONFETTI.map((c, i) => (
                            <motion.span key={i} className="pointer-events-none absolute left-1/2 top-1/2 rounded-sm" style={{ width: c.w, height: c.w * 0.45, background: c.color }} initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }} animate={{ x: c.x, y: [0, c.y, c.y + 520], rotate: c.r, opacity: [1, 1, 0] }} transition={{ duration: 2.4, delay: c.delay, ease: 'easeOut' }} />
                        ))}

                    <motion.div
                        role="status"
                        aria-live="polite"
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/95 p-8 text-center shadow-2xl dark:bg-[#0c0c1a]/95"
                        initial={calm ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.92 }}
                        animate={calm ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: calm ? 0 : style === 'rocket' ? 0.5 : 0.1 }}
                    >
                        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
                        <button type="button" onClick={close} className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Kapat">
                            <X className="h-4 w-4" />
                        </button>
                        <motion.div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-lg shadow-emerald-500/30" initial={calm ? false : { scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 15, delay: calm ? 0 : 0.7 }}>
                            <CheckCircle2 className="h-9 w-9" />
                        </motion.div>
                        <h2 className="relative mb-2 font-orbitron text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                        <p className="relative text-sm leading-relaxed text-gray-600 dark:text-gray-300">{text}</p>
                        {detail.reference && (
                            <p className="relative mt-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-xs font-semibold text-primary">Referans: {detail.reference}</p>
                        )}
                        <div className="relative mt-6">
                            <button type="button" onClick={close} className="rounded-xl bg-gradient-to-r from-primary to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:opacity-90">Harika!</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
