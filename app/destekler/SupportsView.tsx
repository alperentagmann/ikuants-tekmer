"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileCheck, DollarSign, Shield, Globe, GraduationCap, Building2, ArrowRight, MessageCircle, ExternalLink, Lightbulb, CheckCircle2, ClipboardList } from "lucide-react";
import { InlineFormCenterForm } from "@/components/forms/InlineFormCenterForm";
import { MaybeStudioBlock } from "@/components/home/StudioFrame";
import { pageText } from "@/lib/homepage-layout";
import type { PublicPlacement } from "@/lib/services/form-placement-service";

export interface SupportItem {
    id: string;
    title: string;
    description: string;
    example: string;
    iconName: string;
    color: string;
    ctaText: string | null;
    ctaLink: string | null;
    sourceUrl: string | null;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = { FileCheck, DollarSign, Shield, Globe, GraduationCap, Building2 };

const infoHref = (title: string) => `/iletisim?konu=${encodeURIComponent(title)}#iletisim-formu`;

export type SupportSlot = { id: string; key: string; label: string; config?: Record<string, unknown>; node?: React.ReactNode };

export function SupportsView({ supports, placements, slots, studio = false }: { supports: SupportItem[]; placements: PublicPlacement[]; slots: SupportSlot[]; studio?: boolean }) {
    const [sent, setSent] = useState<Record<string, string>>({});
    const text = (key: "supportsIntro" | "supportsCta", field: string) => pageText(key, slots.find((s) => s.key === key)?.config, field);
    const container = (children: React.ReactNode) => <div className="container relative z-10 mx-auto max-w-7xl px-6">{children}</div>;

    const parts: Record<string, React.ReactNode> = {
        supportsIntro: container(
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm text-primary">{text("supportsIntro", "eyebrow")}</span>
                    </div>
                    <h1 className="mb-4 font-orbitron text-4xl font-bold text-black dark:text-white md:text-5xl">{text("supportsIntro", "title")}</h1>
                    <p className="mx-auto max-w-3xl text-gray-600 dark:text-gray-400">
                        {text("supportsIntro", "text")}
                    </p>
                    <p className="mt-4 text-xs italic text-gray-500 opacity-70">{text("supportsIntro", "note")}</p>
                </motion.div>
        ),
        supportsGrid: container(
                <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-2">
                    {supports.map((item, index) => {
                        const Icon = ICONS[item.iconName] || FileCheck;
                        const href = item.ctaLink || infoHref(item.title);
                        return (
                            <motion.article key={item.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="group h-full">
                                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-md transition-all hover:border-primary/40 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 transition-opacity duration-500 group-hover:opacity-5`} />
                                    <div className="relative z-10 flex flex-1 flex-col">
                                        <div className="flex items-start gap-5">
                                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                                                <Icon className="h-7 w-7 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="mb-3 font-orbitron text-xl font-bold text-black transition-colors group-hover:text-primary dark:text-white">{item.title}</h3>
                                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{item.description}</p>
                                            </div>
                                        </div>

                                        {item.example && (
                                            <div className="mt-6 rounded-xl border-l-4 border-primary/60 bg-gray-100 p-5 dark:bg-black/25">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-primary" />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Örnek Senaryo</span>
                                                </div>
                                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{item.example}</p>
                                            </div>
                                        )}

                                        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                                            <Link href={href} className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${item.color} px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03]`}>
                                                <MessageCircle className="h-4 w-4" />
                                                {item.ctaText || "Detaylı bilgi almak için tıklayın"}
                                            </Link>
                                            {item.sourceUrl && (
                                                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-primary dark:text-gray-300">
                                                    Mevzuat <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
        ),
        supportsForms: placements.length ? container(<>
                {placements.map((p) => (
                    <section key={p.id} className="mb-16 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-white/5 md:p-10">
                        <h2 className="mb-2 flex items-center gap-2 font-orbitron text-2xl font-bold text-black dark:text-white"><ClipboardList className="h-6 w-6 text-primary" />{p.title}</h2>
                        {p.description && <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{p.description}</p>}
                        {sent[p.id] ? (
                            <p className="flex items-center gap-2 font-semibold text-emerald-600"><CheckCircle2 className="h-5 w-5" /> Formunuz alındı. Referans: {sent[p.id]}</p>
                        ) : (
                            <InlineFormCenterForm slug={p.slug} themeKey={p.themeKey} onSubmitted={(ref) => setSent((s) => ({ ...s, [p.id]: ref }))} />
                        )}
                    </section>
                ))}
        </>) : null,
        supportsCta: container(
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-r from-primary/10 to-secondary/10 p-12 text-center shadow-lg dark:border-white/10">
                    <div className="relative z-10">
                        <h3 className="mb-4 font-orbitron text-2xl text-black dark:text-white">{text("supportsCta", "title")}</h3>
                        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">{text("supportsCta", "text")}</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link href={text("supportsCta", "primaryLink")} className="inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-bold text-black shadow-xl transition-all hover:-translate-y-1 hover:bg-gray-100">
                                {text("supportsCta", "primaryText")} <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link href={infoHref("TEKMER destekleri")} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-4 font-bold text-gray-800 hover:bg-white/50 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
                                <MessageCircle className="h-5 w-5" /> {text("supportsCta", "secondaryText")}
                            </Link>
                        </div>
                    </div>
                </motion.div>
        ),
    };

    return (
        <div className="relative min-h-screen bg-gray-50 py-24 transition-colors duration-300 dark:bg-[#050510]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
            {slots.map((slot) => {
                const node = slot.key in parts ? parts[slot.key] : slot.node;
                if (!node) return null;
                return <MaybeStudioBlock key={slot.id} enabled={studio} id={slot.id} label={slot.label}>{node}</MaybeStudioBlock>;
            })}
        </div>
    );
}
