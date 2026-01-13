"use client";
import React from "react";
import { motion } from "framer-motion";
import { FileText, Download, ExternalLink, Scale } from "lucide-react";

const regulations = [
    {
        title: "KOSGEB Destek Programları Yönetmeliği",
        url: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/kosgeb-destek-programlari-yonetmeligi.pdf",
        description: "Küçük ve Orta Ölçekli İşletmeleri Geliştirme ve Destekleme İdaresi Başkanlığı destek programları"
    },
    {
        title: "Cumhurbaşkanlığı Kararnamesi",
        url: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/cumhurbaskanligi-kararnamesi.pdf",
        description: "Teknoloji geliştirme bölgelerine ilişkin Cumhurbaşkanlığı kararnamesi"
    },
    {
        title: "7263 Sayılı Kanun",
        url: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/7263-sayili-kanun.pdf",
        description: "Teknoloji Geliştirme Bölgeleri Kanunu ile bazı kanunlarda değişiklik yapılmasına dair kanun"
    },
    {
        title: "5746 Ar-Ge Faaliyetlerinin Desteklenmesi Kanunu Yönetmeliği",
        url: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/5746-arge-faaliyetlerinin-desteklenmesi-kanunu-yonetmeligi.pdf",
        description: "Araştırma, geliştirme ve tasarım faaliyetlerinin desteklenmesine ilişkin yönetmelik"
    },
    {
        title: "4691 Sayılı Teknoloji Geliştirme Bölgeleri Yönetmeliği",
        url: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/4691-sayili-teknoloji-gelistirme-bolgeleri-yonetmeligi.pdf",
        description: "Teknoloji geliştirme bölgelerinin kuruluşu, işleyişi ve denetimine ilişkin yönetmelik"
    },
    {
        title: "4691-5746 Kanunlarında Değişiklik Düzenlemesi",
        url: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/4691-5746-kanunlarinda-degisiklik-duzenlenmesi.pdf",
        description: "İlgili kanunlarda yapılan değişiklik ve düzenlemeler"
    },
    {
        title: "4691 Sayılı Teknoloji Geliştirme Bölgeleri Kanunu",
        url: "https://ikuantstekmer.com/sites/default/files/portfolio/tekmer/4691-sayili-teknoloji-gelistirme-bolgeleri-kanunu.pdf",
        description: "Teknoloji geliştirme bölgelerinin kuruluşu, yönetimi ve çalışmalarına ilişkin ana kanun"
    }
];

export default function MevzuatPage() {
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

                {/* Regulations List */}
                <div className="space-y-4">
                    {regulations.map((reg, index) => (
                        <motion.a
                            key={index}
                            href={reg.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group flex items-start gap-4 p-6 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/40 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all shadow-md dark:shadow-none"
                        >
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                                <FileText className="w-6 h-6 text-red-400" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-black dark:text-white font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                                    {reg.title}
                                </h3>
                                <p className="text-black/60 dark:text-gray-500 text-sm">
                                    {reg.description}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 group-hover:text-primary transition-colors shrink-0">
                                <span className="text-xs font-mono hidden sm:block">PDF</span>
                                <ExternalLink className="w-5 h-5" />
                            </div>
                        </motion.a>
                    ))}
                </div>

                {/* Info Box */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
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
