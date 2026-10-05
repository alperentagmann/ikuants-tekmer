"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Clock, ArrowRight, CheckCircle2, Sparkles, Target, MessageCircle, X, ChevronLeft, ChevronRight, Images, ClipboardList } from "lucide-react";
import Link from "next/link";
import { ProgramBlockRenderer } from "./ProgramBlockRenderer";
import { PROGRAM_TYPE_LABEL, featureTitles, type PublicProgram } from "./ProgramCard";
import { resolveProgramTheme, themeButtonStyle, hexWithAlpha, type ProgramTheme } from "@/lib/program-theme";
import { InlineFormCenterForm } from "@/components/forms/InlineFormCenterForm";
import type { PublicPlacement } from "@/lib/services/form-placement-service";

type DetailProgram = PublicProgram & {
    [key: string]: unknown;
    gallery?: string[];
    targetAudience?: string | null;
    whoCanApply?: string | null;
    applicationCriteria?: string | null;
    applyStartDate?: string | Date | null;
    applyEndDate?: string | Date | null;
    startDate?: string | Date | null;
    contentBlocksJson?: { type: string; id?: string }[];
    benefitsJson?: unknown[];
    timelineJson?: unknown[];
    faqsJson?: unknown[];
    ctaTitle?: string | null;
    ctaDescription?: string | null;
};

const fmt = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric" }) : null);

function ApplyButton({ program, theme, big = false, onColor = false }: { program: PublicProgram; theme: ProgramTheme; big?: boolean; onColor?: boolean }) {
    if (program.applyUrl && program.applyOpen) {
        // On the colored banner a white button keeps contrast; elsewhere the program button style is used
        const style = onColor ? { ...themeButtonStyle(theme), backgroundImage: "none", background: "#ffffff", color: theme.primary, border: "none" } : { ...themeButtonStyle(theme), boxShadow: `0 15px 35px -15px ${hexWithAlpha(theme.primary, 0.8)}` };
        return (
            <Link href={program.applyUrl} className={`inline-flex items-center justify-center gap-2 font-orbitron font-bold tracking-wide shadow-xl transition-transform hover:scale-[1.03] ${big ? "px-8 py-4 text-sm" : "px-5 py-3 text-xs"}`} style={style}>
                {program.ctaText || "Hemen Başvur"} <ArrowRight className="h-4 w-4" />
            </Link>
        );
    }
    return <span className={`inline-flex items-center justify-center gap-2 rounded-xl border border-dashed font-semibold ${onColor ? "border-white/50 text-white/90" : "border-gray-300 text-gray-500 dark:border-white/20 dark:text-gray-400"} ${big ? "px-8 py-4 text-sm" : "px-5 py-3 text-xs"}`}>Başvurular yakında açılacak</span>;
}

export const DynamicProgramDetail: React.FC<{ program: DetailProgram | null; placements?: PublicPlacement[] }> = ({ program, placements = [] }) => {
    const [lightbox, setLightbox] = useState<number | null>(null);
    const [sentForms, setSentForms] = useState<Record<string, string>>({});

    if (!program) {
        return (
            <div className="container mx-auto px-6 py-32 text-center">
                <h1 className="mb-4 font-orbitron text-3xl font-bold text-black dark:text-white">Program Bulunamadı</h1>
                <p className="mb-8 text-gray-500">Aradığınız program mevcut değil veya yayından kaldırılmış olabilir.</p>
                <Link href="/programlar" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white">Tüm Programlara Dön</Link>
            </div>
        );
    }

    const theme = program.theme || resolveProgramTheme(program);
    const banner = program.heroUrl || program.coverUrl;
    const gallery = (Array.isArray(program.gallery) ? program.gallery : []).filter((g): g is string => typeof g === "string" && g.length > 0);
    const blocks = (program.contentBlocksJson || []) as { type: string; id?: string }[];
    const features = featureTitles(program.features);
    const infoHref = `/iletisim?konu=${encodeURIComponent(program.name)}#iletisim-formu`;
    const stats = [
        program.duration ? { icon: Clock, label: "Süre", value: program.duration } : null,
        program.quota ? { icon: Users, label: "Kontenjan", value: program.quota } : null,
        program.mentorHours ? { icon: Sparkles, label: "Mentörlük", value: program.mentorHours } : null,
        fmt(program.applyEndDate) ? { icon: Calendar, label: "Son başvuru", value: fmt(program.applyEndDate) as string } : fmt(program.startDate) ? { icon: Calendar, label: "Başlangıç", value: fmt(program.startDate) as string } : null,
    ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];

    // Program colors drive every "primary" utility on this page (blocks included)
    const scopeStyle = { "--primary": theme.primary, "--secondary": theme.secondary } as React.CSSProperties;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-[#050510] dark:text-white" style={scopeStyle}>
            {/* HERO / BANNER */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0">
                    {banner ? (
                        <img src={banner} alt="" className="h-full w-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(120deg, ${hexWithAlpha(theme.primary, banner ? 0.92 : 1)} 0%, ${hexWithAlpha(theme.secondary, banner ? 0.75 : 1)} 60%, ${hexWithAlpha("#050510", banner ? 0.55 : 0.35)} 100%)` }} />
                </div>
                <div className="container relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-28 md:pt-36 lg:grid-cols-[1.25fr_0.75fr]">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="mb-5 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white backdrop-blur">{PROGRAM_TYPE_LABEL[program.programType || ""] || program.programType || "Program"}</span>
                            <span className="rounded-full px-3 py-1.5 text-xs font-bold text-white backdrop-blur" style={{ background: program.applyOpen ? hexWithAlpha("#10b981", 0.9) : hexWithAlpha("#000000", 0.35) }}>{program.applyOpen ? "Başvurular açık" : "Başvurular yakında"}</span>
                        </div>
                        <h1 className="mb-5 font-orbitron text-4xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">{program.name}</h1>
                        {program.tagline && <p className="mb-5 text-lg font-semibold text-white/90 md:text-xl">{program.tagline}</p>}
                        {program.shortDesc && <p className="mb-8 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">{program.shortDesc}</p>}
                        <div className="flex flex-wrap items-center gap-3">
                            <ApplyButton program={program} theme={theme} big onColor />
                            <Link href={infoHref} className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20">
                                <MessageCircle className="h-4 w-4" /> Bilgi Al
                            </Link>
                        </div>
                    </motion.div>
                    {program.posterUrl && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="mx-auto w-full max-w-sm">
                            <button type="button" onClick={() => setLightbox(-1)} className="block w-full overflow-hidden rounded-3xl border-4 border-white/20 shadow-2xl" aria-label="Afişi büyüt">
                                <img src={program.posterUrl} alt={`${program.name} afişi`} className="w-full object-cover transition-transform duration-500 hover:scale-105" />
                            </button>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* STATS */}
            {stats.length > 0 && (
                <div className="container relative z-20 mx-auto -mt-8 max-w-6xl px-6">
                    <div className={`grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#0c0c18] grid-cols-2 ${stats.length >= 4 ? "md:grid-cols-4" : stats.length === 3 ? "md:grid-cols-3" : ""}`}>
                        {stats.map((s) => (
                            <div key={s.label} className="flex items-center gap-3">
                                <div className="rounded-xl p-2.5" style={{ background: hexWithAlpha(theme.primary, 0.12), color: theme.primary }}><s.icon className="h-5 w-5" /></div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-gray-500">{s.label}</div>
                                    <div className="font-orbitron text-base font-bold text-black dark:text-white">{s.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="container mx-auto max-w-6xl px-6 py-12">
                {(program.detailedDesc || features.length > 0) && (
                    <section className="grid gap-10 border-b border-gray-200 py-8 dark:border-white/5 lg:grid-cols-[1.4fr_1fr]">
                        {program.detailedDesc && (
                            <div>
                                <h2 className="mb-5 font-orbitron text-2xl font-bold text-black dark:text-white md:text-3xl">Program Hakkında</h2>
                                <div className="whitespace-pre-line text-base leading-relaxed text-gray-700 dark:text-gray-300">{program.detailedDesc}</div>
                            </div>
                        )}
                        {features.length > 0 && (
                            <div className="rounded-2xl border p-6" style={{ borderColor: hexWithAlpha(theme.primary, 0.3), background: hexWithAlpha(theme.primary, 0.05) }}>
                                <h3 className="mb-4 font-orbitron text-lg font-bold text-black dark:text-white">Programda neler var?</h3>
                                <ul className="space-y-3">
                                    {features.map((f) => (
                                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.primary }} />{f}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                )}

                {(program.targetAudience || program.whoCanApply || program.applicationCriteria) && (
                    <section className="border-b border-gray-200 py-12 dark:border-white/5">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {[
                                { v: program.targetAudience, t: "Hedef Kitle", i: Target },
                                { v: program.whoCanApply, t: "Kimler Başvurabilir?", i: Users },
                                { v: program.applicationCriteria, t: "Başvuru Kriterleri", i: CheckCircle2 },
                            ].filter((x) => x.v).map((x) => (
                                <div key={x.t} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-white/10 dark:bg-[#0c0c18]">
                                    <div className="mb-4 w-fit rounded-xl p-3" style={{ background: hexWithAlpha(theme.primary, 0.12), color: theme.primary }}><x.i className="h-5 w-5" /></div>
                                    <h3 className="mb-2 font-orbitron text-lg font-bold text-black dark:text-white">{x.t}</h3>
                                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-400">{x.v as string}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {gallery.length > 0 && (
                    <section className="border-b border-gray-200 py-12 dark:border-white/5">
                        <h2 className="mb-6 flex items-center gap-2 font-orbitron text-2xl font-bold text-black dark:text-white"><Images className="h-6 w-6" style={{ color: theme.primary }} /> Galeri</h2>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                            {gallery.map((g, i) => (
                                <button key={g + i} type="button" onClick={() => setLightbox(i)} className={`group overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2" : ""}`} aria-label={`Galeri görseli ${i + 1}`}>
                                    <img src={g} alt="" loading="lazy" className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {blocks.map((block, idx) => <ProgramBlockRenderer key={block.id || idx} block={block} program={program} />)}
                {!blocks.some((b) => b.type === "benefits") && (program.benefitsJson?.length || 0) > 0 && <ProgramBlockRenderer block={{ type: "benefits", isVisible: true }} program={program} />}
                {!blocks.some((b) => b.type === "timeline") && (program.timelineJson?.length || 0) > 0 && <ProgramBlockRenderer block={{ type: "timeline", isVisible: true }} program={program} />}
                {!blocks.some((b) => b.type === "faq") && (program.faqsJson?.length || 0) > 0 && <ProgramBlockRenderer block={{ type: "faq", isVisible: true }} program={program} />}

                {placements.map((p) => (
                    <section key={p.id} id={`form-${p.slug}`} className="my-12 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-[#0c0c18] md:p-10">
                        <h2 className="mb-2 flex items-center gap-2 font-orbitron text-2xl font-bold text-black dark:text-white"><ClipboardList className="h-6 w-6" style={{ color: theme.primary }} />{p.title}</h2>
                        {p.description && <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{p.description}</p>}
                        {sentForms[p.id] ? (
                            <div className="rounded-2xl p-6 text-center" style={{ background: hexWithAlpha(theme.primary, 0.08) }}>
                                <CheckCircle2 className="mx-auto mb-2 h-8 w-8" style={{ color: theme.primary }} />
                                <p className="font-semibold text-black dark:text-white">Formunuz alındı.</p>
                                <p className="text-sm text-gray-500">Referans: {sentForms[p.id]}</p>
                            </div>
                        ) : (
                            <InlineFormCenterForm slug={p.slug} themeKey={p.themeKey} context={{ entityType: "Program", entityId: program.id, label: program.name }} onSubmitted={(ref) => setSentForms((s) => ({ ...s, [p.id]: ref }))} />
                        )}
                    </section>
                ))}

                {/* Closing CTA */}
                <section className="relative my-16 overflow-hidden rounded-3xl p-8 text-center text-white md:p-12" style={{ backgroundImage: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                    <h2 className="mb-3 font-orbitron text-2xl font-bold md:text-4xl">{program.ctaTitle || `${program.name} için hazır mısın?`}</h2>
                    {program.ctaDescription && <p className="mx-auto mb-6 max-w-2xl text-white/90">{program.ctaDescription}</p>}
                    <div className="flex flex-wrap justify-center gap-3">
                        {program.applyUrl && program.applyOpen ? (
                            <Link href={program.applyUrl} className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-orbitron text-sm font-bold shadow-xl transition-transform hover:scale-105" style={{ color: theme.primary }}>
                                {program.ctaText || "Hemen Başvur"} <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <span className="rounded-xl bg-white/15 px-8 py-4 text-sm font-semibold">Başvurular yakında açılacak</span>
                        )}
                        <Link href={infoHref} className="inline-flex items-center gap-2 rounded-xl border border-white/50 px-6 py-4 text-sm font-bold transition-colors hover:bg-white/10"><MessageCircle className="h-4 w-4" /> Bilgi Al</Link>
                    </div>
                </section>
            </div>

            {/* Mobile sticky action bar */}
            <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-gray-200 bg-white/95 p-3 backdrop-blur dark:border-white/10 dark:bg-[#0b0b16]/95 md:hidden">
                <div className="flex-1 [&>*]:w-full"><ApplyButton program={program} theme={theme} /></div>
                <Link href={infoHref} className="flex items-center justify-center gap-1.5 px-4 text-xs font-bold" style={themeButtonStyle(theme, "secondary")}><MessageCircle className="h-4 w-4" /> Bilgi Al</Link>
            </div>

            {/* Lightbox: -1 = poster, otherwise gallery index */}
            {lightbox !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
                    <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Kapat" onClick={() => setLightbox(null)}><X className="h-6 w-6" /></button>
                    {lightbox >= 0 && gallery.length > 1 && (
                        <>
                            <button type="button" className="absolute left-4 rounded-full bg-white/10 p-2 text-white" aria-label="Önceki" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}><ChevronLeft className="h-6 w-6" /></button>
                            <button type="button" className="absolute right-4 rounded-full bg-white/10 p-2 text-white" aria-label="Sonraki" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}><ChevronRight className="h-6 w-6" /></button>
                        </>
                    )}
                    <img src={lightbox === -1 ? (program.posterUrl as string) : gallery[lightbox]} alt="" className="max-h-[88vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};
