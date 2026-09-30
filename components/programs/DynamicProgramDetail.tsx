"use client";
import React from "react";
import { motion } from "framer-motion";
import {
    Calendar, Users, Clock, ArrowRight, CheckCircle2,
    Sparkles, Shield, Rocket, Target, Award, Globe, FileText, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { ProgramBlockRenderer } from "./ProgramBlockRenderer";

interface DynamicProgramDetailProps {
    program: any;
}

export const DynamicProgramDetail: React.FC<DynamicProgramDetailProps> = ({ program }) => {
    if (!program) {
        return (
            <div className="py-32 text-center container mx-auto px-6">
                <h1 className="text-3xl font-bold font-orbitron text-black dark:text-white mb-4">Program Bulunamadı</h1>
                <p className="text-gray-500 mb-8">Aradığınız program mevcut değil veya yayından kaldırılmış olabilir.</p>
                <Link href="/programlar" className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm">
                    Tüm Programlara Dön
                </Link>
            </div>
        );
    }

    const blocks = program.contentBlocksJson || program.contentBlocks || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white transition-colors duration-300">
            {/* 1. Hero Section */}
            <div className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
                {/* Background Image / Gradient */}
                {program.heroUrl || program.coverUrl ? (
                    <div className="absolute inset-0 z-0">
                        <img
                            src={program.heroUrl || program.coverUrl}
                            alt={program.name}
                            className="w-full h-full object-cover opacity-20 dark:opacity-25 filter blur-xs"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/80 to-gray-50 dark:via-[#050510]/80 dark:to-[#050510]" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-purple-600/5 to-transparent z-0" />
                )}

                <div className="container relative z-10 mx-auto px-6 max-w-6xl">
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase">
                            {program.programType || 'KULUÇKA PROGRAMI'}
                        </span>
                        {program.applyStatus && (
                            <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full ${
                                program.applyStatus === 'OPEN'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                                {program.applyStatus === 'OPEN' ? 'BAŞVURULAR AÇIK' : 'YAKINDA'}
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron font-black tracking-tight text-black dark:text-white mb-6 max-w-4xl leading-tight">
                        {program.name}
                    </h1>

                    {program.tagline && (
                        <p className="text-lg md:text-xl text-primary font-medium mb-6 max-w-3xl">
                            {program.tagline}
                        </p>
                    )}

                    {program.shortDesc && (
                        <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed mb-10">
                            {program.shortDesc}
                        </p>
                    )}

                    {/* Stats & Metadata Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-xl mb-8">
                        <div>
                            <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-primary" /> SÜRE
                            </div>
                            <div className="text-base md:text-lg font-bold font-orbitron text-black dark:text-white">
                                {program.duration || '12 Hafta'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-primary" /> KONTENJAN
                            </div>
                            <div className="text-base md:text-lg font-bold font-orbitron text-black dark:text-white">
                                {program.quota || '20 Girişim'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-primary" /> MENTÖRLÜK
                            </div>
                            <div className="text-base md:text-lg font-bold font-orbitron text-black dark:text-white">
                                {program.mentorHours || '70+ Saat'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-primary" /> DURUM
                            </div>
                            <div className="text-base md:text-lg font-bold font-orbitron text-emerald-500 dark:text-emerald-400">
                                {program.applyStatus === 'OPEN' ? 'Aktif' : 'Planlanan'}
                            </div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-4">
                        <Link
                            href={program.ctaLink || '/basvuru'}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold text-sm tracking-wide shadow-xl shadow-primary/30 transition-all hover:scale-105"
                        >
                            <span>{program.ctaText || 'HEMEN BAŞVUR'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Body & Target Audience */}
            <div className="container mx-auto px-6 max-w-6xl py-8">
                {/* Detailed Description */}
                {program.detailedDesc && (
                    <section className="py-8 border-b border-gray-200 dark:border-white/5">
                        <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-black dark:text-white mb-6">
                            Program Hakkında
                        </h2>
                        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-base whitespace-pre-line">
                            {program.detailedDesc}
                        </div>
                    </section>
                )}

                {/* Target Audience & Criteria Grid */}
                {(program.targetAudience || program.whoCanApply || program.applicationCriteria) && (
                    <section className="py-12 border-b border-gray-200 dark:border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {program.targetAudience && (
                                <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c18] border border-gray-200 dark:border-white/10 shadow-md">
                                    <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold font-orbitron text-black dark:text-white mb-2">Hedef Kitle</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{program.targetAudience}</p>
                                </div>
                            )}
                            {program.whoCanApply && (
                                <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c18] border border-gray-200 dark:border-white/10 shadow-md">
                                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-4">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold font-orbitron text-black dark:text-white mb-2">Kimler Başvurabilir?</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{program.whoCanApply}</p>
                                </div>
                            )}
                            {program.applicationCriteria && (
                                <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c18] border border-gray-200 dark:border-white/10 shadow-md">
                                    <div className="p-3 rounded-xl bg-secondary/10 text-secondary w-fit mb-4">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold font-orbitron text-black dark:text-white mb-2">Başvuru Kriterleri</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{program.applicationCriteria}</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* 3. Render Dynamic Content Blocks */}
                {blocks.map((block: any, idx: number) => (
                    <ProgramBlockRenderer key={block.id || idx} block={block} program={program} />
                ))}

                {/* 4. Fallback Benefits, Timeline, FAQ if not configured as explicit blocks */}
                {(!blocks.some((b: any) => b.type === 'benefits') && (program.benefitsJson?.length > 0 || program.benefits?.length > 0)) && (
                    <ProgramBlockRenderer block={{ type: 'benefits', isVisible: true }} program={program} />
                )}

                {(!blocks.some((b: any) => b.type === 'timeline') && (program.timelineJson?.length > 0 || program.timeline?.length > 0)) && (
                    <ProgramBlockRenderer block={{ type: 'timeline', isVisible: true }} program={program} />
                )}

                {(!blocks.some((b: any) => b.type === 'faq') && (program.faqsJson?.length > 0 || program.faqs?.length > 0)) && (
                    <ProgramBlockRenderer block={{ type: 'faq', isVisible: true }} program={program} />
                )}

                {(!blocks.some((b: any) => b.type === 'cta')) && (
                    <ProgramBlockRenderer block={{ type: 'cta', isVisible: true }} program={program} />
                )}
            </div>
        </div>
    );
};
