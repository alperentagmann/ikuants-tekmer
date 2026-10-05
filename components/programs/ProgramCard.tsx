"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Info, CheckCircle2, Clock, Users, Sparkles } from "lucide-react";
import { resolveProgramTheme, themeButtonStyle, hexWithAlpha, type ProgramTheme } from "@/lib/program-theme";

export interface PublicProgram {
    id: string;
    name: string;
    slug: string;
    programType?: string | null;
    tagline?: string | null;
    shortDesc?: string | null;
    detailedDesc?: string | null;
    posterUrl?: string | null;
    heroUrl?: string | null;
    coverUrl?: string | null;
    logoUrl?: string | null;
    duration?: string | null;
    quota?: string | null;
    mentorHours?: string | null;
    features?: unknown[];
    ctaText?: string | null;
    applyUrl?: string | null;
    applyOpen?: boolean;
    applyStatus?: string | null;
    detailUrl?: string;
    theme?: ProgramTheme;
    themeJson?: string | null;
    colorCode?: string | null;
}

export const PROGRAM_TYPE_LABEL: Record<string, string> = {
    PRE_INCUBATION: "Ön Kuluçka Programı",
    INCUBATION: "Kuluçka Programı",
    ACCELERATION: "Hızlandırma Programı",
    IDEATHON: "Ideathon",
};

export function featureTitles(features: unknown[] | undefined): string[] {
    return (features || [])
        .map((f) => (typeof f === "string" ? f : f && typeof f === "object" ? String((f as { title?: string; desc?: string }).title || (f as { desc?: string }).desc || "") : ""))
        .filter(Boolean);
}

export function ProgramCard({ program, index = 0 }: { program: PublicProgram; index?: number }) {
    const theme = program.theme || resolveProgramTheme(program);
    const image = program.posterUrl || program.coverUrl || program.heroUrl;
    const stats = [
        program.duration ? { icon: Clock, label: "Süre", value: program.duration } : null,
        program.quota ? { icon: Users, label: "Kontenjan", value: program.quota } : null,
        program.mentorHours ? { icon: Sparkles, label: "Mentörlük", value: program.mentorHours } : null,
    ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];
    const features = featureTitles(program.features).slice(0, 4);
    const detailUrl = program.detailUrl || `/programlar/${program.slug}`;

    return (
        <motion.article
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12 }}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-[#0b0b16] dark:shadow-none"
            style={{ boxShadow: `0 20px 50px -25px ${hexWithAlpha(theme.primary, 0.55)}` }}
        >
            <div className="h-1.5 w-full" style={{ backgroundImage: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})` }} />

            {/* Visual: poster / banner, or a themed gradient when no image is uploaded */}
            <Link href={detailUrl} className="relative block aspect-[16/9] overflow-hidden" aria-label={`${program.name} detayları`}>
                {image ? (
                    <img src={image} alt={`${program.name} afişi`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ backgroundImage: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                        <span className="px-6 text-center font-orbitron text-3xl font-black tracking-wide text-white/95 drop-shadow">{program.name}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                        {PROGRAM_TYPE_LABEL[program.programType || ""] || program.programType || "Program"}
                    </span>
                    <span
                        className="rounded-full px-3 py-1 text-[11px] font-bold text-white backdrop-blur"
                        style={{ background: program.applyOpen ? hexWithAlpha("#10b981", 0.85) : hexWithAlpha("#f59e0b", 0.85) }}
                    >
                        {program.applyOpen ? "Başvurular açık" : "Başvurular yakında"}
                    </span>
                </div>
            </Link>

            <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h3 className="font-orbitron text-2xl font-bold text-gray-900 dark:text-white">{program.name}</h3>
                {program.tagline && (
                    <p className="mt-2 text-base font-semibold" style={{ color: theme.primary }}>
                        {program.tagline}
                    </p>
                )}
                {(program.shortDesc || program.detailedDesc) && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{program.shortDesc || program.detailedDesc}</p>
                )}

                {stats.length > 0 && (
                    <div className="mt-5 grid grid-cols-3 gap-2">
                        {stats.map((s) => (
                            <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-center dark:border-white/5 dark:bg-white/5">
                                <s.icon className="mx-auto mb-1 h-3.5 w-3.5" style={{ color: theme.primary }} />
                                <div className="font-orbitron text-sm font-bold text-gray-900 dark:text-white">{s.value}</div>
                                <div className="text-[10px] text-gray-500">{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {features.length > 0 && (
                    <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2">
                    {program.applyUrl && program.applyOpen ? (
                        <Link href={program.applyUrl} className="flex items-center justify-center gap-2 px-4 py-3.5 font-orbitron text-sm font-bold tracking-wide transition-opacity hover:opacity-90" style={themeButtonStyle(theme)}>
                            {program.ctaText || "Başvur"}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    ) : (
                        <span className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3.5 text-sm font-semibold text-gray-400 dark:border-white/15" aria-disabled="true">
                            Başvurular yakında
                        </span>
                    )}
                    <Link href={detailUrl} className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5" style={themeButtonStyle(theme, "secondary")}>
                        <Info className="h-4 w-4" />
                        Bilgi Al
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}
