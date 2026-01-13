"use client";
import React from "react";
import { motion } from "framer-motion";

const partners = [
    { name: "İKÜANTS TEKMER", logo: "/logo-main.png" },
    { name: "KOSGEB", logo: "/images/logo-kosgeb-updated.png" },
    { name: "İstanbul Kültür Üniversitesi", logo: "/images/logo-iku-updated-v2.png" },
    { name: "T.C. Sanayi ve Teknoloji Bakanlığı", logo: "/images/logo-bakanlik-updated.png" }
];

// Triple the array for seamless infinite scroll
const allPartners = [...partners, ...partners, ...partners];

export const PartnerLogos = () => {
    return (
        <section className="py-12 relative overflow-hidden">
            {/* Gradient overlays for fade effect */}
            <div className="absolute left-0 top-0 w-40 h-full bg-gradient-to-r from-gray-50 dark:from-[#050510] to-transparent z-10 pointer-events-none transition-colors duration-300" />
            <div className="absolute right-0 top-0 w-40 h-full bg-gradient-to-l from-gray-50 dark:from-[#050510] to-transparent z-10 pointer-events-none transition-colors duration-300" />

            {/* Marquee Container */}
            <div className="relative">
                <motion.div
                    className="flex gap-16 items-center"
                    animate={{
                        x: [0, -350 * partners.length],
                    }}
                    transition={{
                        x: {
                            duration: 18,
                            repeat: Infinity,
                            ease: "linear",
                        },
                    }}
                    style={{ width: "fit-content" }}
                >
                    {allPartners.map((partner, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0"
                        >
                            <div className="w-48 h-20 flex items-center justify-center px-6 py-3 rounded-2xl bg-white dark:bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-white/20 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-primary/20 hover:border-primary/40 transition-all">
                                <img
                                    src={partner.logo}
                                    alt={partner.name}
                                    className="max-h-14 max-w-full object-contain dark:brightness-100 opacity-80 hover:opacity-100 transition-all"
                                />
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

