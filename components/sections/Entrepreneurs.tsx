"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { siteContent } from "@/data/content";
import { Rocket, Shield, Globe, Cpu, Zap, Activity } from "lucide-react";

export const Entrepreneurs = () => {
    const { entrepreneurs: defaultData } = siteContent;
    // Static list renders first and stays when the database is empty or unreachable
    // (e.g. production schema behind pending migrations), so the page is never blank.
    const [list, setList] = useState<any[]>(defaultData.list);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/public/entrepreneurs');
                const data = await res.json();
                if (data.success && Array.isArray(data.entrepreneurs) && data.entrepreneurs.length > 0) {
                    setList(data.entrepreneurs.map((ent: any, i: number) => ({
                        id: ent.id || `ent-${i}`,
                        name: ent.name,
                        type: ent.sector || 'Teknoloji',
                        level: ent.stage || ent.program || 'Girişim',
                        service: ent.shortDesc || ent.description || '',
                        keywords: ent.keywords || ent.tags || [],
                        icon: Rocket,
                        color: "text-primary",
                    })));
                }
            } catch {
                // Keep the static list
            }
        };
        load();
    }, []);

    return (
        <section id="entrepreneurs" className="py-24 relative overflow-hidden bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="font-orbitron font-bold text-4xl md:text-5xl mb-4 text-black dark:text-white"
                    >
                        {defaultData.header}
                    </motion.h2>
                    <p className="text-black/70 dark:text-gray-400 max-w-xl mx-auto">
                        {defaultData.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {list.map((startup: any, i: number) => (
                        <motion.div
                            key={startup.id || i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: (i % 6) * 0.05 }}
                            className="group relative h-56 bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-white/5 hover:border-primary/50 rounded-lg overflow-hidden transition-all duration-300 shadow-md dark:shadow-none"
                        >
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Front of the card */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 transition-transform duration-500 group-hover:-translate-y-full">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-secondary transition-all shadow-lg dark:shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                    {startup.icon ? (
                                        <startup.icon className={`w-8 h-8 ${startup.color || 'text-primary'}`} />
                                    ) : (
                                        <Rocket className="w-8 h-8 text-primary" />
                                    )}
                                </div>

                                <h3 className="font-orbitron font-bold text-center text-lg text-black dark:text-white tracking-widest group-hover:text-secondary transition-colors line-clamp-2 px-2">
                                    {startup.name}
                                </h3>

                                <div className="flex flex-col items-center gap-1 mt-3 text-xs font-mono font-bold text-center">
                                    <span className="text-black/50 dark:text-gray-500 line-clamp-1">{startup.type}</span>
                                    <span className="text-secondary">{startup.level}</span>
                                </div>
                            </div>

                            {/* Back of the card (Hover content) */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-white/95 dark:bg-[#0f0f1a]/95 backdrop-blur-md">
                                <h4 className="font-orbitron font-bold text-sm text-center text-black dark:text-white mb-3 line-clamp-2">
                                    {startup.name}
                                </h4>
                                {startup.service && (
                                    <p className="text-black/70 dark:text-gray-300 text-xs text-center line-clamp-4 mb-4">
                                        {startup.service}
                                    </p>
                                )}
                                {startup.keywords && startup.keywords.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                                        {startup.keywords.slice(0, 5).map((kw: string, idx: number) => (
                                            <span key={idx} className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary whitespace-nowrap">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-300 dark:border-white/30 group-hover:border-secondary transition-colors" />
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-300 dark:border-white/30 group-hover:border-secondary transition-colors" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-300 dark:border-white/30 group-hover:border-secondary transition-colors" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-300 dark:border-white/30 group-hover:border-secondary transition-colors" />

                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[200%] w-full animate-[scan_3s_linear_infinite] opacity-0 group-hover:opacity-100 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link href="/basvuru" className="inline-block px-8 py-3 rounded border border-dashed border-gray-300 dark:border-white/20 text-black/60 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-gray-500 dark:hover:border-white transition-all font-mono text-sm">
                        SİZ DE BURADA YER ALMAK İÇİN BAŞVURUN
                    </Link>
                </div>
            </div>
        </section>
    );
};
