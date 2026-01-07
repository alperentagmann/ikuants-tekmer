"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Linkedin, Award, Briefcase, GraduationCap, ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";

const mentors = [
    { name: "Zico Ufuk Batum", company: "Ventures & Mentors League", title: "Founder", image: "/images/zico-ufuk-batum.jpg", linkedin: "https://www.linkedin.com/in/zico-ufuk-batum-51238950/" },
    { name: "Onur Yolay", company: "Innoway R&D Kft.", title: "Co-Founder", image: "/images/onur-yolay.jpg", linkedin: "https://www.linkedin.com/in/onuryolay/" },
    { name: "Nizamettin Sami Harputlu", company: "Startup Centrum", title: "Co-Founder", image: "/images/nizamettin-harputlu.jpg", linkedin: "https://www.linkedin.com/in/nizamettinsamiharputlu/" },
    { name: "Abdulsamet Ekşi", company: "Türk Havacılık ve Uzay Sanayii", title: "Technology and Innovation Management", image: "/images/abdulsamet-eksi.jpg", linkedin: "https://www.linkedin.com/in/abdulsameteksi/" },
    { name: "Bikem İnce İnanç", company: "Malogra Danışmanlık", title: "Founder", image: "/images/bikem-ince.jpg", linkedin: "https://www.linkedin.com/in/bikeminceinanc/" },
    { name: "Büşra Altınsoy", company: "Pexa Boru Sanayi", title: "Yönetim Kurulu Üyesi", image: "/images/busra-altinsoy.jpg", linkedin: "https://www.linkedin.com/in/busraaltinsoy/" },
    { name: "Sıla Dinçer", company: "Ödeal", title: "R&D Manager", image: "/images/sila-dincer.jpg", linkedin: "https://www.linkedin.com/in/siladincer/" },
    { name: "Filiz Aksoy", company: "Bilişim Teknolojileri", title: "Proje ve Ürün Yöneticisi", image: "/images/filiz-aksoy.png", linkedin: "https://www.linkedin.com/in/filiz-aksoy/" },
    { name: "Pelin Özkuzey", company: "Satış & Pazarlama", title: "Danışman", image: "/images/pelin-ozkuzey.jpg", linkedin: "https://www.linkedin.com/in/pelin-ozkuzey-71223712/" },
    { name: "Belma Tost", company: "Pluxee Türkiye", title: "Senior Service & Experience Designer", image: "/images/belma-tost.jpg", linkedin: "https://www.linkedin.com/in/belma-tost" },
    { name: "Dr. Öğr. Üyesi Burçin Ataseven Doğru", company: "İstanbul Kültür Üniversitesi", title: "İktisadi ve İdari Bilimler Fakültesi", image: "/images/burcin-ataseven.jpg", linkedin: "https://www.linkedin.com/in/dr-bur%C3%A7in-ataseven-do%C4%9Fru-689800250/" },
    { name: "Öğr. Gör. Ezgi Delen", company: "İzmir Bakırçay Üniversitesi", title: "Girişimcilik Atölyesi ve Yarışmalar Koordinatörlüğü", image: "/images/ezgi-delen.jpg", linkedin: "https://www.linkedin.com/in/ezgi-delen" },
    { name: "Kenan Keleş", company: "Palmiye Yazılım Teknolojileri Tic. Ltd. Şti.", title: "Co-Founder", image: "/images/kenan-keles.jpg", linkedin: "https://www.linkedin.com/in/mak-m%C3%BCh-kenan-kele%C5%9F-b4336a38/" },
    { name: "Süleyman Bayramoğlu", company: "Pexa Boru Sanayi Anonim Şirketi", title: "CEO", image: "/images/suleyman-bayramoglu.jpg", linkedin: "https://www.linkedin.com/in/suleyman-bayramoglu/" },
    { name: "Günalp Uysal", company: "Beezsoft", title: "Founder", image: "/images/gunalp-uysal.jpg", linkedin: "https://www.linkedin.com/in/gunalpuysal/" },
    { name: "Emre Gül", company: "FiProduct – VRHistoria", title: "Product Manager", image: "/images/emre-gul.jpg", linkedin: "https://www.fiproduct.com/" },
    { name: "Melis Dünya Sezer Türker", company: "FiProduct - VRHistoria", title: "Kreatif Direktör", image: "/images/melis-dunya-sezer.jpg", linkedin: "https://www.fiproduct.com/" },
    { name: "Müge Bezgin", company: "Startup Centrum", title: "Co-Founder", image: "/images/muge-bezgin.jpg", linkedin: "https://www.linkedin.com/in/mugebezgin/" },
    { name: "Doç. Dr. Meri Taksi Deveciyan", company: "İstanbul Kültür Üniversitesi", title: "İktisadi ve İdari Bilimler Fakültesi", image: "/images/meri-taksi.jpg", linkedin: "https://www.linkedin.com/in/meritaksideveciyan/" },
    { name: "Doğukan Gözalp", company: "Startup Centrum", title: "Business Developer & Start-up Mentor", image: "/images/dogukan-gozalp.jpg", linkedin: "https://www.linkedin.com/in/dogukanozalp/" },
    { name: "Tuncay Işıkçı", company: "Malogra Danışmanlık", title: "Finansal Yönetim Ekip Lideri", image: "/images/tuncay-isikci.jpg", linkedin: "https://www.linkedin.com/in/tuncay-i%C5%9F%C4%B1k%C3%A7%C4%B1-20b978222/" },
    { name: "Yusuf Kelpetin", company: "AtakDx", title: "Founder", image: "/images/yusuf-yilmaz-mentor.jpg", linkedin: "https://www.linkedin.com/in/yusuf-kelpetin-a016533a/" }
];

const getInitials = (name: string) => {
    const parts = name.replace(/Dr\.|Öğr\.|Gör\.|Üyesi|Doç\./g, '').trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].substring(0, 2);
};

const getColor = (index: number) => {
    const colors = [
        "from-purple-500 to-pink-500",
        "from-cyan-500 to-blue-500",
        "from-green-500 to-teal-500",
        "from-orange-500 to-red-500",
        "from-indigo-500 to-purple-500",
        "from-pink-500 to-rose-500"
    ];
    return colors[index % colors.length];
};

export default function MentorlerPage() {
    const [showAll, setShowAll] = useState(false);
    const displayedMentors = showAll ? mentors : mentors.slice(0, 12);

    return (
        <div className="py-24 relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">MENTÖRLER</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-white mb-4">
                        Mentörlerimiz
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Alanında uzman mentörlerimiz, girişimcilik yolculuğunuzda size rehberlik etmek için hazır.
                    </p>
                </motion.div>

                {/* Mentors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                    {displayedMentors.map((mentor, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-primary/40 transition-all"
                        >
                            {mentor.image ? (
                                <img
                                    src={mentor.image}
                                    alt={mentor.name}
                                    className="w-16 h-16 rounded-xl object-cover mb-4 group-hover:scale-105 transition-transform"
                                />
                            ) : (
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getColor(index)} flex items-center justify-center text-white font-bold text-xl mb-4 group-hover:scale-105 transition-transform`}>
                                    {getInitials(mentor.name)}
                                </div>
                            )}
                            <h3 className="font-semibold text-white text-lg mb-1 leading-tight">
                                {mentor.name}
                            </h3>
                            <p className="text-primary text-sm font-medium mb-1">
                                {mentor.company}
                            </p>
                            <p className="text-gray-500 text-xs mb-3">
                                {mentor.title}
                            </p>
                            {mentor.linkedin && (
                                <a
                                    href={mentor.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                                >
                                    <Linkedin className="w-3 h-3" />
                                    LinkedIn
                                </a>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Show More Button */}
                {mentors.length > 12 && !showAll && (
                    <div className="text-center mb-16">
                        <button
                            onClick={() => setShowAll(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-primary/50 transition-all"
                        >
                            Tümünü Göster ({mentors.length - 12} daha)
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Become a Mentor CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center p-8 md:p-12 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/10"
                >
                    <Award className="w-14 h-14 text-primary mx-auto mb-4" />
                    <h2 className="font-orbitron text-2xl md:text-3xl text-white mb-4">
                        Mentör Olmak İster Misiniz?
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                        Deneyimlerinizi paylaşarak girişimcilik ekosistemine katkıda bulunun.
                        Genç girişimcilere rehberlik edin ve geleceği birlikte şekillendirin.
                    </p>
                    <Link
                        href="/mentor-basvuru"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-all font-semibold shadow-lg shadow-primary/30"
                    >
                        <Briefcase className="w-5 h-5" />
                        Mentör Başvuru Formu
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
