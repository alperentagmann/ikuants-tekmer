"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, LayoutDashboard, RefreshCw } from "lucide-react";

/** Error boundary inside the admin panel: keeps the sidebar and offers a retry. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="glass-card max-w-lg rounded-2xl border border-white/10 p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400"><AlertTriangle className="h-7 w-7" /></div>
                <h1 className="mb-2 text-xl font-semibold text-white">Bu ekran yüklenemedi</h1>
                <p className="mb-6 text-sm text-gray-400">Beklenmeyen bir hata oluştu. Yaptığınız kayıtlar etkilenmedi. Tekrar deneyin veya panele dönün.{error.digest ? ` Hata kodu: ${error.digest}` : ""}</p>
                <div className="flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"><RefreshCw className="h-4 w-4" /> Tekrar dene</button>
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"><LayoutDashboard className="h-4 w-4" /> Panele dön</Link>
                </div>
            </div>
        </div>
    );
}
