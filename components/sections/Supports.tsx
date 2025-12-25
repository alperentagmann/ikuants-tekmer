"use client";
import React from "react";
import { motion } from "framer-motion";
import { siteContent } from "@/data/content";

export const Supports = () => {
    const { supports } = siteContent;

    return (
        <section id="supports" className="py-24 relative bg-[#050510]">
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/5 -translate-x-1/2 hidden md:block" />

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                <div className="text-center mb-20">
                    <h2 className="font-orbitron font-bold text-4xl mb-4">
                        <span className="border-b-4 border-primary pb-2">{supports.header}</span>
                    </h2>
                    <p className="text-gray-400 mt-6">{supports.description}</p>
                </div>

                <div className="max-w-4xl mx-auto">
                    {supports.items.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className={`flex items-center gap-8 mb-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col`}
                        >
                            <div className="relative shrink-0">
                                <div className="w-20 h-20 rounded-full bg-[#111] border-2 border-primary flex items-center justify-center shadow-[0_0_20px_rgba(112,0,255,0.4)] relative z-20">
                                    <item.icon className="w-8 h-8 text-white" />
                                </div>
                                <div className="absolute inset-0 rounded-full border border-primary/50 animate-ping opacity-20" />
                            </div>

                            <div className={`text-center md:text-left flex-1 p-6 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/10 hover:border-primary/30 transition-colors ${index % 2 !== 0 && 'md:text-right'}`}>
                                <h3 className="text-xl font-bold text-white mb-2 font-orbitron">{item.title}</h3>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
};
