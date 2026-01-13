"use client";
import React from "react";
import { motion } from "framer-motion";
import { siteContent } from "@/data/content";

export const Differences = () => {
    const { differences } = siteContent;

    return (
        <section id="differences" className="py-24 relative bg-gray-100 dark:bg-black/50 transition-colors duration-300">
            <div className="container mx-auto px-6 max-w-7xl">

                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-sm font-bold text-secondary tracking-[0.3em] mb-2 uppercase">
                            {differences.subheader}
                        </h2>
                        <h3 className="text-4xl md:text-5xl font-orbitron font-bold text-gray-900 dark:text-white leading-tight">
                            {typeof differences.header === 'string' ? differences.header : "NEDEN BİZİ SEÇMELİSİN?"}
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md text-sm md:text-base border-l-2 border-primary/30 pl-4">
                        {differences.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    {differences.features.map((feature, i) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative p-1 rounded-2xl bg-white dark:bg-white/5 hover:from-secondary/50 hover:to-primary/50 transition-all duration-500 shadow-md dark:shadow-none"
                        >
                            <div className="absolute inset-0 bg-secondary/5 blur-xl group-hover:bg-secondary/20 transition-all duration-500 opacity-0 group-hover:opacity-100" />

                            <div className="relative h-full bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 border border-gray-200 dark:border-white/5 flex flex-col overflow-hidden">
                                <span className="absolute -top-4 -right-4 text-4xl font-black font-orbitron text-gray-200 dark:text-white/5 group-hover:text-gray-300 dark:group-hover:text-white/10 transition-colors pointer-events-none select-none">
                                    {feature.id}
                                </span>

                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-5 h-5 text-white" />
                                </div>

                                <h4 className="text-sm font-orbitron font-bold text-gray-900 dark:text-white mb-2 group-hover:text-secondary transition-colors">
                                    {feature.title}
                                </h4>

                                <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                                    {feature.desc}
                                </p>

                                <div className="mt-auto pt-6 flex gap-1">
                                    <div className="h-1 w-12 bg-gray-200 dark:bg-white/10 rounded group-hover:bg-primary transition-colors" />
                                    <div className="h-1 w-2 bg-gray-200 dark:bg-white/10 rounded group-hover:bg-secondary transition-colors delay-75" />
                                    <div className="h-1 w-2 bg-gray-200 dark:bg-white/10 rounded group-hover:bg-white transition-colors delay-100" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
};
