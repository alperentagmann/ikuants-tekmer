"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Linkedin, Award, Briefcase, ChevronDown } from "lucide-react";
import Link from "next/link";

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
    const [mentorsList, setMentorsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const loadMentors = async () => {
            try {
                const res = await fetch('/api/public/mentors');
                const data = await res.json();
                if (data.success && Array.isArray(data.mentors)) {
                    setMentorsList(data.mentors.map((m: any) => ({
                        id: m.id,
                        name: m.fullName || `${m.name} ${m.surname}`.trim(),
                        company: m.company,
                        title: m.title,
                        image: m.imageUrl || '',
                        linkedin: m.linkedin || ''
                    })));
                } else {
                    setMentorsList([]);
                }
            } catch {
                setMentorsList([]);
            } finally {
                setLoading(false);
            }
        };
        loadMentors();
    }, []);

    const displayedMentors = showAll ? mentorsList : mentorsList.slice(0, 12);

    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
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
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mb-4">
                        Mentörlerimiz
                    </h1>
                    <p className="text-gray-700 dark:text-gray-400 max-w-2xl mx-auto">
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
                            className="group p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-all shadow-md dark:shadow-none"
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
                            <h3 className="font-semibold text-black dark:text-white text-lg mb-1 leading-tight">
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
                {mentorsList.length > 12 && !showAll && (
                    <div className="text-center mb-16">
                        <button
                            onClick={() => setShowAll(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:border-primary/50 transition-all shadow-sm"
                        >
                            Tümünü Göster ({mentorsList.length - 12} daha)
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Become a Mentor CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center p-8 md:p-12 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-gray-200 dark:border-white/10 shadow-lg"
                >
                    <Award className="w-14 h-14 text-primary mx-auto mb-4" />
                    <h2 className="font-orbitron text-2xl md:text-3xl text-gray-900 dark:text-white mb-4">
                        Mentör Olmak İster Misiniz?
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
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
