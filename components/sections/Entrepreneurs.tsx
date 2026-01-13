"use client";
import React from "react";
import { motion } from "framer-motion";
import { siteContent } from "@/data/content";

export const Entrepreneurs = () => {
    const { entrepreneurs } = siteContent;

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
                        {entrepreneurs.header}
                    </motion.h2>
                    <p className="text-black/70 dark:text-gray-400 max-w-xl mx-auto">
                        {entrepreneurs.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {entrepreneurs.list.map((startup, i) => (
                        <motion.div
                            key={startup.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative h-48 bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-white/5 hover:border-primary/50 rounded-lg overflow-hidden transition-all duration-300 shadow-md dark:shadow-none"
                        >
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-secondary transition-all shadow-lg dark:shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                    <startup.icon className={`w-8 h-8 ${startup.color}`} />
                                </div>

                                <h3 className="font-orbitron font-bold text-xl text-black dark:text-white tracking-widest group-hover:text-secondary transition-colors">
                                    {startup.name}
                                </h3>

                                <div className="flex items-center gap-3 mt-2 text-xs font-mono font-bold">
                                    <span className="text-black/50 dark:text-gray-500">{startup.type}</span>
                                    <span className="text-black/20 dark:text-white/20">|</span>
                                    <span className="text-secondary">{startup.level}</span>
                                </div>
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
                    <button className="px-8 py-3 rounded border border-dashed border-gray-300 dark:border-white/20 text-black/60 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-gray-500 dark:hover:border-white transition-all font-mono text-sm">
                        LOAD_MORE_STARTUPS...
                    </button>
                </div>

            </div>
        </section>
    );
};
