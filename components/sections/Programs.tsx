"use client";
import React from "react";
import { motion } from "framer-motion";
import { Rocket, Lightbulb, Calendar, Users, MapPin, Trophy, CheckCircle, ArrowRight, Sparkles, Zap, Flame } from "lucide-react";
import Link from "next/link";

const programs = [
    {
        id: "antsfire",
        title: "ANTSFire",
        subtitle: "Kuluçka Programı",
        tagline: "Kıvılcımı ateşe dönüştür, şirketini ölçekle!",
        description: "ANTSPARK mezunu veya Ar-Ge odaklı şirketleşmiş girişimler için kişiselleştirilmiş 8 aylık ileri seviye kuluçka programı.",
        icon: Flame,
        color: "from-orange-500 to-red-600",
        glowColor: "rgba(234, 88, 12, 0.4)",
        stats: [
            { label: "Süre", value: "8 Ay" },
            { label: "Kontenjan", value: "10 Girişim" },
            { label: "Mentorluk", value: "Uygulamalı" },
        ],
        features: [
            "Kişiselleştirilmiş Eğitim Modülleri",
            "KPI Bazlı Performans Takibi",
            "Satış & Pilot Odaklı Mentorluk",
            "Yatırım & Data Room Hazırlığı",
            "Ofis & Altyapı Desteği",
            "Hukuk & Finans Danışmanlığı"
        ],
        cta: "Programa Göz At",
        link: "/antsfire"
    },
    {
        id: "antspark",
        title: "ANTSPARK",
        subtitle: "Ön Kuluçka Programı",
        tagline: "Fikrini büyüt, işine dönüştür, geleceğe imzanı at!",
        description: "Yenilikçi iş fikirlerine sahip girişimcileri fikir aşamasından ticarileşme sürecine taşıyan kapsamlı bir gelişim yolculuğu.",
        icon: Rocket,
        color: "from-purple-500 to-pink-500",
        glowColor: "rgba(168, 85, 247, 0.4)",
        stats: [
            { label: "Eğitim Süresi", value: "12 Hafta" },
            { label: "Katılımcı", value: "20 Girişim" },
            { label: "Mentorluk", value: "70+ Saat" },
        ],
        features: [
            "Kapsamlı Eğitimler & Atölyeler",
            "Birebir Mentorluk Desteği",
            "Yatırımcı Buluşmaları",
            "Co-Working & Prototipleme Alanı",
            "TÜBİTAK & KOSGEB Hazırlık",
            "DEMODAY Final Sunumu"
        ],
        cta: "Programa Göz At",
        link: "/antspark"
    },
    {
        id: "glowup",
        title: "GLOW UP",
        subtitle: "Ideathon",
        tagline: "2 günde fikrini iş modeline dönüştür!",
        description: "Yenilikçi fikirlerin ortaya çıkarılması, geliştirilmesi ve girişimcilik ekosistemine kazandırılması amacıyla gerçekleştirilen yoğun bir fikir geliştirme programı.",
        icon: Lightbulb,
        color: "from-cyan-500 to-blue-500",
        glowColor: "rgba(6, 182, 212, 0.4)",
        stats: [
            { label: "Süre", value: "2 Gün" },
            { label: "Katılım", value: "Ücretsiz" },
            { label: "Format", value: "Takım" },
        ],
        features: [
            "İş Modeli Geliştirme Eğitimi",
            "Sunum Teknikleri Workshop",
            "Uzman Mentorluk Desteği",
            "Jüri Önünde Final Sunumu",
            "Ödüller & Networking",
            "ANTSPARK'a Direkt Başvuru Hakkı"
        ],
        cta: "Etkinliğe Başvur",
        link: "/glowup-basvuru"
    }
];

export const Programs = () => {
    return (
        <section id="programs" className="py-24 relative bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 mb-6 shadow-sm dark:shadow-none">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-secondary" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">// PROGRAMLARIMIZ</span>
                    </div>
                    <h2 className="font-orbitron font-bold text-4xl md:text-5xl mb-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 dark:from-white dark:via-purple-200 dark:to-cyan-200">
                            GELİŞİM PROGRAMLARI
                        </span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Fikirden ürüne, girişimden başarıya uzanan yolculuğunda yanındayız.
                        Sana en uygun programı seç ve ekosisteme katıl.
                    </p>
                </motion.div>

                {/* Programs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {programs.map((program, index) => (
                        <motion.div
                            key={program.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="group relative"
                        >
                            {/* Card Glow Effect */}
                            <div
                                className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                                style={{ background: `linear-gradient(135deg, ${program.glowColor}, transparent)` }}
                            />

                            {/* Card */}
                            <div className="relative bg-white dark:bg-[#0a0a0a]/80 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden group-hover:border-purple-300 dark:group-hover:border-white/20 transition-all duration-300 shadow-xl dark:shadow-none">
                                {/* Gradient Top Bar */}
                                <div className={`h-1 w-full bg-gradient-to-r ${program.color}`} />

                                <div className="p-8">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${program.color} flex items-center justify-center shadow-lg`}>
                                                    <program.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-orbitron font-bold text-2xl text-gray-900 dark:text-white">
                                                        {program.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{program.subtitle}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tagline */}
                                    <p className={`text-lg font-semibold bg-gradient-to-r ${program.color} bg-clip-text text-transparent mb-3`}>
                                        {program.tagline}
                                    </p>

                                    {/* Description */}
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                                        {program.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        {program.stats.map((stat) => (
                                            <div key={stat.label} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                                <div className="text-gray-900 dark:text-white font-bold font-orbitron">{stat.value}</div>
                                                <div className="text-xs text-gray-500">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Features */}
                                    <div className="grid grid-cols-2 gap-2 mb-8">
                                        {program.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0" />
                                                <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    {program.link.startsWith('/') ? (
                                        <Link
                                            href={program.link}
                                            className={`w-full py-4 rounded-xl bg-gradient-to-r ${program.color} text-white font-orbitron font-bold tracking-wide flex items-center justify-center gap-2 group/btn hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 dark:shadow-none`}
                                        >
                                            {program.cta}
                                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    ) : (
                                        <a
                                            href={program.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`w-full py-4 rounded-xl bg-gradient-to-r ${program.color} text-white font-orbitron font-bold tracking-wide flex items-center justify-center gap-2 group/btn hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 dark:shadow-none`}
                                        >
                                            {program.cta}
                                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-12 text-center"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 shadow-sm dark:shadow-none">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                            Tüm programlar <span className="text-gray-900 dark:text-white font-semibold">İstanbul Kültür Üniversitesi, İKÜANTS TEKMER</span>'de gerçekleştirilmektedir.
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
