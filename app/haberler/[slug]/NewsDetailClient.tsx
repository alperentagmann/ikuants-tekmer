"use client";

import React, { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Link2, Linkedin, MessageCircle, X } from "lucide-react";

/** Photo grid with a keyboard-friendly lightbox. */
export function NewsGallery({ images, title }: { images: string[]; title: string }) {
    const [open, setOpen] = useState<number | null>(null);
    useEffect(() => {
        if (open === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(null);
            if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
            if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, images.length]);

    return (
        <section className="mt-10">
            <h2 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Fotoğraflar ({images.length})</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((src, i) => (
                    <button key={src} type="button" onClick={() => setOpen(i)} className="group overflow-hidden rounded-xl border border-gray-200 dark:border-white/10" aria-label={`${title} — fotoğraf ${i + 1}`}>
                        <img src={src} alt={`${title} — fotoğraf ${i + 1}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </button>
                ))}
            </div>
            {open !== null && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Fotoğraf görüntüleyici" onClick={() => setOpen(null)}>
                    <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Kapat" onClick={() => setOpen(null)}><X className="h-6 w-6" /></button>
                    {images.length > 1 && (
                        <>
                            <button type="button" className="absolute left-4 rounded-full bg-white/10 p-2 text-white" aria-label="Önceki" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + images.length) % images.length); }}><ChevronLeft className="h-6 w-6" /></button>
                            <button type="button" className="absolute right-4 rounded-full bg-white/10 p-2 text-white" aria-label="Sonraki" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % images.length); }}><ChevronRight className="h-6 w-6" /></button>
                        </>
                    )}
                    <figure onClick={(e) => e.stopPropagation()}>
                        <img src={images[open]} alt={`${title} — fotoğraf ${open + 1}`} className="max-h-[82vh] w-auto rounded-xl object-contain" />
                        <figcaption className="mt-2 text-center text-sm text-white/70">{open + 1} / {images.length}</figcaption>
                    </figure>
                </div>
            )}
        </section>
    );
}

/** Share on LinkedIn / X / WhatsApp or copy the link. */
export function ShareButtons({ title }: { title: string }) {
    const [copied, setCopied] = useState(false);
    const [url, setUrl] = useState("");
    useEffect(() => {
        const t = setTimeout(() => setUrl(window.location.href), 0);
        return () => clearTimeout(t);
    }, []);
    const enc = encodeURIComponent;
    const btn = "inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-primary/50 hover:text-primary dark:border-white/10 dark:text-gray-200";
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Paylaş:</span>
            <a className={btn} href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</a>
            <a className={btn} href={`https://x.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`} target="_blank" rel="noopener noreferrer">𝕏 X</a>
            <a className={btn} href={`https://wa.me/?text=${enc(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
            <button type="button" className={btn} onClick={() => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}>{copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link2 className="h-3.5 w-3.5" />} {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}</button>
        </div>
    );
}
