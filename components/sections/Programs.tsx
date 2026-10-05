"use client";
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, MapPin, Loader2 } from "lucide-react";
import { ProgramCard, type PublicProgram } from "@/components/programs/ProgramCard";

interface ProgramsProps {
    /** Server-provided programs (homepage block); otherwise loaded from the public API. */
    programs?: PublicProgram[];
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    showLocation?: boolean;
    limit?: number;
}

export const Programs = ({ programs: initial, title = "GELİŞİM PROGRAMLARI", subtitle = "Fikirden ürüne, girişimden başarıya uzanan yolculuğunda yanındayız. Sana en uygun programı seç ve ekosisteme katıl.", eyebrow = "// PROGRAMLARIMIZ", showLocation = true, limit }: ProgramsProps) => {
    const [programList, setProgramList] = React.useState<PublicProgram[] | null>(initial || null);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        if (initial) return;
        let cancelled = false;
        fetch("/api/public/programs")
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled) setProgramList(Array.isArray(data.programs) ? data.programs : []);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });
        return () => {
            cancelled = true;
        };
    }, [initial]);

    const list = (programList || []).slice(0, limit || undefined);

    return (
        <section id="programs" className="relative bg-gray-50 py-24 transition-colors duration-300 dark:bg-[#050510]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[100px]" />
            </div>

            <div className="container relative z-10 mx-auto max-w-7xl px-6">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                        <Sparkles className="h-4 w-4 text-purple-600 dark:text-secondary" />
                        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{eyebrow}</span>
                    </div>
                    <h2 className="mb-4 font-orbitron text-4xl font-bold md:text-5xl">
                        <span className="bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 bg-clip-text text-transparent dark:from-white dark:via-purple-200 dark:to-cyan-200">{title}</span>
                    </h2>
                    <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">{subtitle}</p>
                </motion.div>

                {programList === null && !error ? (
                    <div className="flex justify-center py-16 text-gray-500"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : error || list.length === 0 ? (
                    <p className="py-16 text-center text-gray-500">{error ? "Programlar şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin." : "Yayında program bulunmuyor."}</p>
                ) : (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                        {list.map((p, i) => <ProgramCard key={p.id} program={p} index={i} />)}
                    </div>
                )}

                {showLocation && (
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12 text-center">
                        <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Tüm programlar <span className="font-semibold text-gray-900 dark:text-white">İstanbul Kültür Üniversitesi, İKÜANTS TEKMER</span>&apos;de gerçekleştirilmektedir.
                            </span>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};
