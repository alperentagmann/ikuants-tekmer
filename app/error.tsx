"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

/** Friendly error page for unexpected failures on public pages. */
export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-6 py-20 text-center dark:bg-[#050510]">
            <div className="max-w-lg">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-500"><AlertTriangle className="h-8 w-8" /></div>
                <h1 className="mb-3 font-orbitron text-3xl font-bold text-black dark:text-white">Bir şeyler ters gitti</h1>
                <p className="mb-8 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin; sorun devam ederse bizimle iletişime geçin.{error.digest ? ` (Hata kodu: ${error.digest})` : ""}</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25"><RefreshCw className="h-4 w-4" /> Tekrar dene</button>
                    <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/5"><Home className="h-4 w-4" /> Ana sayfa</Link>
                </div>
            </div>
        </div>
    );
}
