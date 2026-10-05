"use client";
import React from "react";
import { motion } from "framer-motion";
import {
    CheckCircle2, HelpCircle, ChevronDown, ChevronRight, FileText,
    Download, Rocket, Users, Building, Shield, Zap, Award, DollarSign,
    Sparkles, Globe, Calendar, Clock, Layers, ArrowRight
} from "lucide-react";
import Link from "next/link";

interface BlockProps {
    block: any;
    program: any;
}

const iconMap: Record<string, any> = {
    Rocket, Users, Building, Shield, Zap, Award, DollarSign, Sparkles, Globe, Calendar, Clock, Layers
};

export const ProgramBlockRenderer: React.FC<BlockProps> = ({ block, program }) => {
    const [faqOpenIndex, setFaqOpenIndex] = React.useState<number | null>(0);

    if (block.isVisible === false) return null;

    switch (block.type) {
        case 'richText':
            return (
                <section className="py-12 border-b border-gray-200 dark:border-white/5">
                    {block.title && (
                        <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-black dark:text-white mb-6">
                            {block.title}
                        </h2>
                    )}
                    {block.content && (
                        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-base whitespace-pre-line">
                            {block.content}
                        </div>
                    )}
                </section>
            );

        case 'textImage':
            return (
                <section className="py-16 border-b border-gray-200 dark:border-white/5">
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${block.layout === 'right' ? 'lg:grid-flow-dense' : ''}`}>
                        <div className={block.layout === 'right' ? 'lg:col-start-2' : ''}>
                            {block.title && (
                                <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-black dark:text-white mb-6">
                                    {block.title}
                                </h2>
                            )}
                            {block.content && (
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base whitespace-pre-line mb-6">
                                    {block.content}
                                </p>
                            )}
                        </div>
                        {block.imageUrl && (
                            <div className={`rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 ${block.layout === 'right' ? 'lg:col-start-1' : ''}`}>
                                <img src={block.imageUrl} alt={block.title || 'Program'} className="w-full h-80 object-cover" />
                            </div>
                        )}
                    </div>
                </section>
            );

        case 'benefits':
            const benefitsList = block.items || program.benefitsJson || program.benefits || [];
            if (!benefitsList.length) return null;
            return (
                <section className="py-16 border-b border-gray-200 dark:border-white/5">
                    <div className="text-center mb-12">
                        <span className="text-xs font-mono px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                            KAZANIMLAR
                        </span>
                        <h2 className="text-2xl md:text-4xl font-orbitron font-bold text-black dark:text-white mt-3">
                            {block.title || 'Programa Özel Avantajlar ve Destekler'}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {benefitsList.map((item: any, idx: number) => {
                            const IconComponent = (item.icon && iconMap[item.icon]) || Sparkles;
                            return (
                                <div
                                    key={idx}
                                    className="p-6 rounded-2xl bg-white dark:bg-[#0c0c18] border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none hover:border-primary/50 transition-all flex flex-col justify-between group"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                                            <IconComponent className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-black dark:text-white mb-2">{item.title}</h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            );

        case 'timeline':
            const timelineList = block.items || program.timelineJson || program.timeline || [];
            if (!timelineList.length) return null;
            return (
                <section className="py-16 border-b border-gray-200 dark:border-white/5">
                    <div className="text-center mb-12">
                        <span className="text-xs font-mono px-3 py-1 rounded-full bg-secondary/10 text-secondary uppercase tracking-wider">
                            SÜREÇ & YOL HARİTASI
                        </span>
                        <h2 className="text-2xl md:text-4xl font-orbitron font-bold text-black dark:text-white mt-3">
                            {block.title || 'Program Aşamaları ve Takvim'}
                        </h2>
                    </div>
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {timelineList.map((step: any, idx: number) => (
                            <div
                                key={idx}
                                className="flex flex-col md:flex-row items-start gap-6 p-6 rounded-2xl bg-white dark:bg-[#0c0c18] border border-gray-200 dark:border-white/10 shadow-md relative overflow-hidden"
                            >
                                <div className="flex items-center gap-3 md:flex-col md:items-center shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-primary text-white font-bold font-mono flex items-center justify-center text-lg shadow-lg">
                                        {step.stepNumber || idx + 1}
                                    </div>
                                    {step.period && (
                                        <span className="text-[11px] font-mono text-primary px-2.5 py-1 rounded bg-primary/10">
                                            {step.period}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-black dark:text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{step.description}</p>
                                    {Array.isArray(step.details) && (
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                            {step.details.map((d: string, dIdx: number) => (
                                                <li key={dIdx} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                                                    <span>{d}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            );

        case 'faq':
            const faqList = block.items || program.faqsJson || program.faqs || [];
            if (!faqList.length) return null;
            return (
                <section className="py-16 border-b border-gray-200 dark:border-white/5">
                    <div className="text-center mb-12">
                        <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 uppercase tracking-wider">
                            SSS
                        </span>
                        <h2 className="text-2xl md:text-4xl font-orbitron font-bold text-black dark:text-white mt-3">
                            {block.title || 'Sıkça Sorulan Sorular'}
                        </h2>
                    </div>
                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqList.map((faq: any, idx: number) => (
                            <div
                                key={idx}
                                className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#0c0c18] transition-colors"
                            >
                                <button
                                    onClick={() => setFaqOpenIndex(faqOpenIndex === idx ? null : idx)}
                                    className="w-full flex items-center justify-between p-5 text-left font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <span className="pr-4 text-sm md:text-base">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-primary transition-transform ${faqOpenIndex === idx ? 'rotate-180' : ''}`} />
                                </button>
                                {faqOpenIndex === idx && (
                                    <div className="px-5 pb-5 pt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-white/5">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            );

        case 'documents':
            const docList = block.items || program.documentsJson || program.documents || [];
            if (!docList.length) return null;
            return (
                <section className="py-12 border-b border-gray-200 dark:border-white/5">
                    <h2 className="text-xl md:text-2xl font-orbitron font-bold text-black dark:text-white mb-6">
                        {block.title || 'İndirilebilir Dokümanlar'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {docList.map((doc: any, idx: number) => (
                            <a
                                key={idx}
                                href={doc.fileUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c0c18] hover:border-primary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-black dark:text-white group-hover:text-primary transition-colors">
                                            {doc.title}
                                        </div>
                                        <div className="text-[11px] text-gray-500 font-mono">
                                            {doc.type || 'PDF'} {doc.size ? `• ${doc.size}` : ''}
                                        </div>
                                    </div>
                                </div>
                                <Download className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                            </a>
                        ))}
                    </div>
                </section>
            );

        case 'cta':
            return (
                <section className="my-16 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/15 via-purple-600/10 to-secondary/15 border border-primary/30 relative overflow-hidden text-center">
                    <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                        <h2 className="text-2xl md:text-4xl font-orbitron font-bold text-black dark:text-white">
                            {block.title || program.ctaTitle || 'Hemen Başvurun'}
                        </h2>
                        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                            {block.content || program.ctaDescription || 'Kontenjanlar dolmadan yerinizi ayırtın.'}
                        </p>
                        <div className="pt-4">
                            <Link
                                href={program.applyUrl || program.detailUrl || '/programlar'}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-primary/30 hover:scale-105 transition-all"
                            >
                                <span>{program.ctaText || 'HEMEN BAŞVUR'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            );

        default:
            return null;
    }
};
