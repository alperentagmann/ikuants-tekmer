"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, ExternalLink, Scale, Loader2 } from "lucide-react";

export default function MevzuatPage() {
    const [regulations, setRegulations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLegislations = async () => {
            try {
                const res = await fetch('/api/public/legislations');
                const data = await res.json();
                if (data.success && Array.isArray(data.legislations)) {
                    setRegulations(data.legislations);
                }
            } catch (err) {
                console.error("Failed to load legislations:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLegislations();
    }, []);

    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-5xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Scale className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">YASAL DÜZENLEMELER</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mb-4">
                        Mevzuat
                    </h1>
                    <p className="text-black/70 dark:text-gray-400 max-w-2xl mx-auto">
                        Teknoloji Geliştirme Merkezleri ve Ar-Ge faaliyetlerine ilişkin yasal düzenlemeler ve yönetmelikler.
                    </p>
                </motion.div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-gray-500 font-mono text-sm">Mevzuat belgeleri yükleniyor...</p>
                    </div>
                ) : (
                    /* Regulations List */
                    <div className="space-y-4">
                        {regulations.map((reg, index) => (
                            <motion.a
                                key={reg.id || index}
                                href={reg.externalUrl || reg.fileUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group flex items-start gap-4 p-6 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/40 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all shadow-md dark:shadow-none"
                            >
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                                    <FileText className="w-6 h-6 text-red-400" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-black dark:text-white font-semibold text-lg group-hover:text-primary transition-colors">
                                            {reg.title}
                                        </h3>
                                        {reg.category && (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold">
                                                {reg.category}
                                            </span>
                                        )}
                                    </div>
                                    {reg.description && (
                                        <p className="text-black/60 dark:text-gray-500 text-sm">
                                            {reg.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 group-hover:text-primary transition-colors shrink-0">
                                    <span className="text-xs font-mono hidden sm:block">PDF / GÖRÜNTÜLE</span>
                                    <ExternalLink className="w-5 h-5" />
                                </div>
                            </motion.a>
                        ))}
                    </div>
                )}

                {/* Info Box */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 p-6 rounded-xl bg-primary/10 border border-primary/30"
                >
                    <div className="flex items-start gap-4">
                        <Scale className="w-6 h-6 text-primary shrink-0 mt-1" />
                        <div>
                            <h3 className="text-black dark:text-white font-semibold mb-2">Bilgilendirme</h3>
                            <p className="text-black/70 dark:text-gray-300 text-sm">
                                Yukarıdaki dökümanlar, Teknoloji Geliştirme Merkezleri ve Ar-Ge faaliyetlerine ilişkin güncel mevzuatı içermektedir.
                                Resmi Gazete'de yayımlanan son değişiklikler için ilgili kurumların web sitelerini takip etmenizi öneririz.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
