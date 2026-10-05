"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X, ShieldCheck } from "lucide-react";
import type { CookieSettings } from "@/lib/site-settings";

type Consent = { version: string; necessary: true; analytics: boolean; marketing: boolean; decidedAt: string };
const STORAGE_KEY = "ikuants_cookie_consent";
const COOKIE_NAME = "ikuants_consent";

function readConsent(): Consent | null {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Consent) : null;
    } catch {
        return null;
    }
}

function saveConsent(c: Consent) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    } catch {
        /* storage blocked: the cookie below still records the choice */
    }
    const value = encodeURIComponent(`v${c.version}:a${c.analytics ? 1 : 0}:m${c.marketing ? 1 : 0}`);
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: c }));
}

/** KVKK-friendly cookie notice. Texts and on/off come from Admin › Site Ayarları › Çerez Uyarısı. */
export function CookieConsent() {
    const [settings, setSettings] = useState<CookieSettings | null>(null);
    const [open, setOpen] = useState(false);
    const [details, setDetails] = useState(false);
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/public/settings")
            .then((r) => r.json())
            .then((d) => {
                if (cancelled || !d?.settings?.cookie) return;
                const c = d.settings.cookie as CookieSettings;
                setSettings(c);
                const existing = readConsent();
                // Never cover the design studio canvas
                const q = new URLSearchParams(window.location.search);
                const inStudio = q.get("studio") === "1" || q.get("embed") === "1";
                if (c.enabled && !inStudio && (!existing || existing.version !== c.version)) setOpen(true);
                if (existing) {
                    setAnalytics(existing.analytics);
                    setMarketing(existing.marketing);
                }
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const reopen = () => {
            setDetails(true);
            setOpen(true);
        };
        window.addEventListener("open-cookie-preferences", reopen);
        return () => window.removeEventListener("open-cookie-preferences", reopen);
    }, []);

    const decide = useCallback(
        (a: boolean, m: boolean) => {
            saveConsent({ version: settings?.version || "1", necessary: true, analytics: a, marketing: m, decidedAt: new Date().toISOString() });
            setAnalytics(a);
            setMarketing(m);
            setOpen(false);
            setDetails(false);
        },
        [settings]
    );

    if (!open || !settings) return null;

    return (
        <div role="dialog" aria-modal="false" aria-labelledby="cookie-title" className="fixed inset-x-3 bottom-3 z-[60] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[420px]">
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0b16]/85">
                <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-secondary" />
                <div className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary"><Cookie className="h-5 w-5" /></span>
                            <h2 id="cookie-title" className="font-orbitron text-base font-bold text-gray-900 dark:text-white">{settings.title}</h2>
                        </div>
                        <button type="button" onClick={() => decide(false, false)} className="rounded-lg p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white" aria-label="Sadece zorunlu çerezlerle kapat"><X className="h-4 w-4" /></button>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        {settings.text}{" "}
                        {settings.policyUrl && <Link href={settings.policyUrl} className="font-semibold text-primary hover:underline">Çerez politikası</Link>}
                    </p>

                    {details && (
                        <div className="mt-4 space-y-2">
                            <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/60 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5">
                                <span><span className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Zorunlu</span><span className="text-xs text-gray-500">Sitenin çalışması için gereklidir; kapatılamaz.</span></span>
                                <input type="checkbox" checked disabled className="h-4 w-4" aria-label="Zorunlu çerezler" />
                            </label>
                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/60 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5">
                                <span><span className="font-semibold text-gray-900 dark:text-white">Analiz</span><span className="block text-xs text-gray-500">Ziyaret istatistikleri (şu anda kullanılmıyor).</span></span>
                                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" aria-label="Analiz çerezleri" />
                            </label>
                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/60 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5">
                                <span><span className="font-semibold text-gray-900 dark:text-white">Pazarlama</span><span className="block text-xs text-gray-500">Reklam ve yeniden hedefleme (şu anda kullanılmıyor).</span></span>
                                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" aria-label="Pazarlama çerezleri" />
                            </label>
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                        {details ? (
                            <button type="button" onClick={() => decide(analytics, marketing)} className="flex-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg">Seçimi kaydet</button>
                        ) : (
                            <button type="button" onClick={() => decide(true, true)} className="flex-1 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg">{settings.acceptText}</button>
                        )}
                        <button type="button" onClick={() => decide(false, false)} className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/5">{settings.rejectText}</button>
                        {!details && (
                            <button type="button" onClick={() => setDetails(true)} className="w-full rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 hover:text-primary">{settings.settingsText}</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
