"use client";
import React from "react";
import { motion } from "framer-motion";
import { Shield, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function KVKKPage() {
    return (
        <div className="py-24 relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">KVKK</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-3xl md:text-4xl text-white mb-4">
                        Kişisel Verilerin Korunması
                    </h1>
                    <p className="text-gray-400">
                        İKÜANTS TEKMER olarak kişisel verilerinizin güvenliğine önem veriyoruz.
                    </p>
                </motion.div>

                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Link
                            href="/kvkk/aydinlatma-metni"
                            className="group flex items-center justify-between p-6 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <FileText className="w-8 h-8 text-primary" />
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Aydınlatma Metni</h3>
                                    <p className="text-gray-400 text-sm">Kişisel verilerin işlenmesi hakkında bilgilendirme</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link
                            href="/kvkk/acik-riza"
                            className="group flex items-center justify-between p-6 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <Shield className="w-8 h-8 text-secondary" />
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Açık Rıza Formu</h3>
                                    <p className="text-gray-400 text-sm">Kişisel verilerin işlenmesine ilişkin onay</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Link
                            href="/kvkk/ticari-ileti"
                            className="group flex items-center justify-between p-6 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <FileText className="w-8 h-8 text-green-500" />
                                <div>
                                    <h3 className="text-white font-semibold text-lg">Ticari Elektronik İleti Onayı</h3>
                                    <p className="text-gray-400 text-sm">E-posta ve SMS bildirimleri hakkında</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10"
                >
                    <h3 className="text-white font-semibold mb-2">İletişim</h3>
                    <p className="text-gray-400 text-sm">
                        KVKK ile ilgili talepleriniz için:<br />
                        <strong>Adres:</strong> Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. No: 14/A Bakırköy/İstanbul<br />
                        <strong>E-posta:</strong> <a href="mailto:bilgi@ikuantstekmer.com" className="text-primary hover:underline">bilgi@ikuantstekmer.com</a>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
