"use client";
import React from "react";
import { motion } from "framer-motion";
import { Users, Linkedin, Mail, Briefcase, Award, Phone } from "lucide-react";

const teamMembers = [
    {
        name: "Hatice Tuğsavul",
        title: "TEKMER Müdürü",
        description: "",
        linkedin: "https://www.linkedin.com/in/hatice-tugsavul-76729616/",
        email: "bilgi@ikuantstekmer.com",
        phone: "0212 498 41 62",
        initials: "HT",
        image: "/images/hatice-tugsavul.jpg",
        color: "from-primary to-purple-600"
    },
    {
        name: "Alperen Tağman",
        title: "Teknoloji Geliştirme Uzmanı",
        description: "RTTP (Registered Technology Transfer Professional). Girişimcilik ekosistemini güçlendirmek adına aktif çalışmalar yürütmektedir. Aynı zamanda TEKMER alanında bilgi birikimiyle akademik programlar, ön kuluçka ve kuluçka süreçleri kapsamında girişimcilere rehberlik ve organizasyonel yönetim desteği sağlamaktadır. Şirketlere danışmanlık sunmakta olup, teknoloji transferi ve inovasyon yönetimi alanında stratejik iş geliştirme ve proje süreçlerine liderlik etmektedir.",
        linkedin: "https://www.linkedin.com/in/alperentagmann/",
        email: "alperen.tagman@ikuantstekmer.com",
        phone: "0212 498 41 03",
        initials: "AT",
        image: "/images/alperen-tagman.jpg",
        color: "from-secondary to-teal-600"
    }
];

export default function EkibimizPage() {
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
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">BİZİ TANIYIN</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mb-4">
                        Ekibimiz
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Girişimcilik ekosistemini destekleyen ve girişimcilere rehberlik eden İKÜANTS TEKMER ekibi.
                    </p>
                </motion.div>

                {/* Team Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {teamMembers.map((member, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            className="group relative p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-all shadow-md dark:shadow-none"
                        >
                            {/* Avatar */}
                            <div className="flex items-start gap-6 mb-6">
                                {member.image ? (
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                                    />
                                ) : (
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                                        {member.initials}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="font-orbitron font-bold text-xl text-black dark:text-white mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-primary font-medium text-sm mb-2">
                                        {member.title}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-gray-700 dark:text-gray-400 text-sm leading-relaxed mb-6">
                                {member.description}
                            </p>

                            {/* LinkedIn */}
                            <div className="flex flex-wrap gap-2">
                                <a
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:border-primary/50 transition-all text-sm"
                                >
                                    <Linkedin className="w-4 h-4" />
                                    LinkedIn
                                </a>
                                <a
                                    href={`mailto:${member.email}`}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:border-primary/50 transition-all text-sm"
                                >
                                    <Mail className="w-4 h-4" />
                                    E-posta
                                </a>
                                <a
                                    href={`tel:${member.phone.replace(/\s/g, '')}`}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:border-primary/50 transition-all text-sm"
                                >
                                    <Phone className="w-4 h-4" />
                                    {member.phone}
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Contact CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-gray-200 dark:border-white/10 shadow-lg"
                >
                    <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="font-orbitron text-xl text-black dark:text-white mb-3">Ekibimizle İletişim Kurun</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
                        Sorularınız, önerileriniz veya iş birliği talepleriniz için ekibimizle iletişime geçebilirsiniz.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="mailto:bilgi@ikuantstekmer.com"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-all font-semibold"
                        >
                            <Mail className="w-4 h-4" />
                            bilgi@ikuantstekmer.com
                        </a>
                        <a
                            href="/iletisim"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/20 transition-all font-semibold"
                        >
                            <Briefcase className="w-4 h-4" />
                            İletişim Sayfası
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
