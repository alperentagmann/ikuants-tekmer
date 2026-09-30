"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Loader2 } from "lucide-react";

export default function IsbirliklerimizPage() {
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const res = await fetch('/api/public/partners');
                const data = await res.json();
                if (data.success && Array.isArray(data.partners)) {
                    setPartners(data.partners);
                }
            } catch (err) {
                console.error("Failed to load partners:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPartners();
    }, []);

    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 max-w-6xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">İŞ BİRLİKLERİMİZ</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mb-4">
                        İş Birliklerimiz
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        İKÜANTS TEKMER'in stratejik partnerleri ve çözüm ortakları
                    </p>
                </motion.div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-gray-500 font-mono text-sm">Partnerler yükleniyor...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {partners.map((partner, index) => (
                            <motion.div
                                key={partner.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative p-8 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 hover:border-secondary/40 transition-all hover:shadow-xl dark:hover:shadow-secondary/10 shadow-md dark:shadow-none flex flex-col items-center"
                            >
                                <div className="h-24 w-full flex items-center justify-center mb-6 p-4 bg-white rounded-xl">
                                    <img
                                        src={partner.logoUrl}
                                        alt={partner.altText || partner.name}
                                        className="max-h-full object-contain"
                                    />
                                </div>
                                <h3 className="font-orbitron text-xl text-black dark:text-white mb-3 text-center">
                                    {partner.name}
                                </h3>
                                {partner.description && (
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed text-center">
                                        {partner.description}
                                    </p>
                                )}
                                <div className="mt-auto flex gap-4 pt-4 border-t border-gray-100 dark:border-white/5 w-full justify-center">
                                    {partner.websiteUrl && (
                                        <a
                                            href={partner.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-secondary transition-colors"
                                        >
                                            Web Sitesi
                                        </a>
                                    )}
                                    {partner.websiteUrl && partner.linkedinUrl && (
                                        <span className="text-gray-300 dark:text-white/20">|</span>
                                    )}
                                    {partner.linkedinUrl && (
                                        <a
                                            href={partner.linkedinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-secondary transition-colors"
                                        >
                                            LinkedIn
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
