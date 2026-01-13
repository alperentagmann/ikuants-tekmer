"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Award, Briefcase, ChevronDown, ChevronUp } from "lucide-react";

const danismaKurulu = [
    {
        name: "Cengiz ULTAV",
        title: "İKÜ Mütevelli Heyet Üyesi, TTGV Yönetim Kurulu Başkanı, VESTEL Ventures Yönetim Kurulu Üyesi",
        image: "/images/cengiz-ultav.jpg"
    },
    {
        name: "Kadir TAMRAK",
        title: "AIVASOFT Kurucu Ortak",
        image: "/images/kadir-tamrak.jpg"
    },
    {
        name: "Cem UÇAR",
        title: "FUNEXAGON Kurucu Ortak",
        image: "/images/cem-ucar.jpg"
    },
    {
        name: "Elyar DAVARAN",
        title: "BLIZARD GAMES Gaming Art Director",
        image: "/images/elyar-davaran.jpg"
    },
    {
        name: "Emin Kağan KAYAK",
        title: "INCREA360 Tasarım Merkezi Teknoloji Yöneticisi",
        image: "/images/emin-kagan-kayak.jpg"
    },
    {
        name: "Onur YOLAY",
        title: "Boğaziçi Üniversitesi Hedefli Tedavi Teknolojileri Merkezi Proje ve IP Yöneticisi, INNOWAY R&G Kurucu Ortak",
        image: "/images/onur-yolay.jpg"
    },
    {
        name: "Serkan KAV",
        title: "Y İNOVASYON ve TEKNOLOJİ A.Ş.",
        image: "/images/serkan-kav.jpg"
    },
    {
        name: "Emrah CEBECİOĞLU",
        title: "CPA INTERNATIONAL TÜRKİYE Kurucu Ortak",
        image: "/images/emrah-cebecioglu.jpg"
    }
];

const yonetimKurulu = [
    {
        name: "Dr. Bahar Akıngüç Günver",
        title: "Yönetim Kurulu Başkanı",
        image: "/images/bahar-akinguc-gunver.jpg"
    },
    {
        name: "Prof. Dr. Gülce Öğrüç Martins Riberio da Silva Lourenço",
        title: "Yönetim Kurulu Başkan Vekili",
        image: "/images/gulce-ogruc-ildiz.jpg"
    },
    {
        name: "Cüneyt Genç",
        title: "Yönetim Kurulu Başkan Vekili",
        image: "/images/cuneyt-genc.png"
    },
    {
        name: "Yusuf Yılmaz",
        title: "Yönetim Kurulu Üyesi",
        image: "/images/yusuf-yilmaz.jpg"
    },
    {
        name: "Dr. Öğr. Üyesi Ceren Bilgici",
        title: "Yönetim Kurulu Üyesi",
        image: "/images/ceren-bilgici.jpg"
    },
    {
        name: "Dr. Öğr. Üyesi Ender Demir",
        title: "Yönetim Kurulu Üyesi",
        image: "/images/ender-demir.jpg"
    },
    {
        name: "Dr. Öğr. Üyesi Artür Yetvart Mumcu",
        title: "Yönetim Kurulu Üyesi",
        image: "/images/artur-yetvart-mumcu.jpg"
    }
];
const degerlendirmeKurulu = [
    {
        name: "Cüneyt Genç",
        title: "İKÜANTS TEKMER Yönetim Kurulu Başkan Vekili",
        image: "/images/cuneyt-genc.png"
    },
    {
        name: "Duygu Yücesoy Manyaslı",
        title: "KOSGEB İkitelli Müdürü",
        image: "/images/duygu-yucesoy-manyasli.jpg"
    },
    {
        name: "Dr. Artür Yetvart Mumcu",
        title: "İstanbul Kültür Üniversitesi",
        image: "/images/artur-yetvart-mumcu.jpg"
    },
    {
        name: "Prof. Dr. Akhan Akbulut",
        title: "İstanbul Kültür Üniversitesi",
        image: "/images/akhan-akbulut.jpg"
    },
    {
        name: "Dr. Zeynep Gergin",
        title: "İstanbul Kültür Üniversitesi",
        image: "/images/zeynep-gergin.jpg"
    },
    {
        name: "Gökhan Uluçay",
        title: "İstanbul Kültür Üniversitesi",
        image: "/images/gokhan-ulucay.jpg"
    }
];

type BoardType = 'danisma' | 'yonetim' | 'degerlendirme';

export default function KurullarPage() {
    const [activeBoard, setActiveBoard] = useState<BoardType>('danisma');

    const boards = [
        { id: 'danisma' as BoardType, name: 'Danışma Kurulu', icon: Users, members: danismaKurulu, color: 'from-purple-500 to-pink-500' },
        { id: 'yonetim' as BoardType, name: 'Yönetim Kurulu', icon: Briefcase, members: yonetimKurulu, color: 'from-cyan-500 to-blue-500' },
        { id: 'degerlendirme' as BoardType, name: 'Değerlendirme Kurulu', icon: Award, members: degerlendirmeKurulu, color: 'from-orange-500 to-red-500' }
    ];

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
                        <span className="text-sm text-primary font-mono">KURULLARIMIZ</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mb-4">
                        Kurullarımız
                    </h1>
                    <p className="text-black/70 dark:text-gray-400 max-w-2xl mx-auto">
                        İKÜANTS TEKMER'in stratejik kararlarına yön veren değerli kurul üyelerimiz
                    </p>
                </motion.div>

                {/* Board Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap justify-center gap-4 mb-12"
                >
                    {boards.map((board) => (
                        <button
                            key={board.id}
                            onClick={() => setActiveBoard(board.id)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${activeBoard === board.id
                                ? `bg-gradient-to-r ${board.color} text-white shadow-lg`
                                : 'bg-gray-200 dark:bg-white/5 text-black dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-white/10 hover:text-black dark:hover:text-white border border-gray-300 dark:border-white/10'
                                }`}
                        >
                            <board.icon className="w-5 h-5" />
                            <span className="font-semibold">{board.name}</span>
                            {board.members.length > 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${activeBoard === board.id ? 'bg-white/20' : 'bg-white/10'
                                    }`}>
                                    {board.members.length}
                                </span>
                            )}
                        </button>
                    ))}
                </motion.div>

                {/* Board Members */}
                {boards.map((board) => (
                    activeBoard === board.id && (
                        <motion.div
                            key={board.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {board.members.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {board.members.map((member, index) => (
                                        <motion.div
                                            key={member.name}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + index * 0.05 }}
                                            className="group"
                                        >
                                            <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-all hover:shadow-lg dark:hover:shadow-primary/10 shadow-md dark:shadow-none">
                                                <div className="flex items-start gap-4">
                                                    {(member as any).image ? (
                                                        <img
                                                            src={(member as any).image}
                                                            alt={member.name}
                                                            className={`w-16 h-16 rounded-xl object-cover flex-shrink-0 ${(member as any).imageStyle || ''}`}
                                                        />
                                                    ) : (
                                                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${board.color} flex items-center justify-center flex-shrink-0`}>
                                                            <span className="text-white font-bold text-xl">
                                                                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-semibold text-black dark:text-white mb-1 group-hover:text-primary transition-colors">
                                                            {member.name}
                                                        </h3>
                                                        <p className="text-gray-400 text-sm leading-relaxed">
                                                            {member.title}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <board.icon className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 text-lg">Bu kurul bilgileri yakında eklenecektir.</p>
                                </div>
                            )}
                        </motion.div>
                    )
                ))}
                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-600/5 to-secondary/10 border border-gray-200 dark:border-white/10 shadow-lg"
                >
                    <h3 className="font-orbitron text-xl text-black dark:text-white mb-4">Kurullarımız Hakkında</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-black/80 dark:text-gray-400">
                        <div>
                            <h4 className="text-black dark:text-white font-semibold mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-400" />
                                Danışma Kurulu
                            </h4>
                            <p>Stratejik yönlendirme ve sektörel danışmanlık sağlayan uzman kadromuz.</p>
                        </div>
                        <div>
                            <h4 className="text-black dark:text-white font-semibold mb-2 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-cyan-400" />
                                Yönetim Kurulu
                            </h4>
                            <p>TEKMER'in yönetim kararlarını alan ve uygulayan üst düzey yönetim kadrosu.</p>
                        </div>
                        <div>
                            <h4 className="text-black dark:text-white font-semibold mb-2 flex items-center gap-2">
                                <Award className="w-4 h-4 text-orange-400" />
                                Değerlendirme Kurulu
                            </h4>
                            <p>Başvuruları ve projeleri değerlendiren bağımsız uzman jüri üyelerimiz.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
