"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Award, Briefcase, Loader2 } from "lucide-react";

type BoardType = 'yonetim' | 'degerlendirme' | 'danisma';

export default function KurullarPage() {
    const [activeBoard, setActiveBoard] = useState<BoardType>('yonetim');
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch('/api/public/board-members');
                const data = await res.json();
                if (data.success && Array.isArray(data.members)) {
                    setMembers(data.members);
                }
            } catch (err) {
                console.error("Failed to load board members:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, []);

    const yonetimMembers = members.filter(m => m.boardType === 'YONETIM');
    const degerlendirmeMembers = members.filter(m => m.boardType === 'DEGERLENDIRME');
    const danismaMembers = members.filter(m => m.boardType === 'DANISMA');

    const boards = [
        { id: 'yonetim' as BoardType, name: 'Yönetim Kurulu', icon: Briefcase, members: yonetimMembers, color: 'from-cyan-500 to-blue-500' },
        { id: 'degerlendirme' as BoardType, name: 'Değerlendirme Kurulu', icon: Award, members: degerlendirmeMembers, color: 'from-orange-500 to-red-500' },
        { id: 'danisma' as BoardType, name: 'Danışma Kurulu', icon: Users, members: danismaMembers, color: 'from-purple-500 to-pink-500' }
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

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-gray-500 font-mono text-sm">Kurul üyeleri yükleniyor...</p>
                    </div>
                ) : (
                    boards.map((board) => (
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
                                                key={member.id || member.fullName}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.05 * index }}
                                                className="group"
                                            >
                                                <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-all hover:shadow-lg dark:hover:shadow-primary/10 shadow-md dark:shadow-none">
                                                    <div className="flex items-start gap-4">
                                                        {member.imageUrl ? (
                                                            <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-white/5`}>
                                                                <img
                                                                    src={member.imageUrl}
                                                                    alt={member.fullName}
                                                                    className={`w-full h-full object-cover ${member.imageStyle || ''}`}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${board.color} flex items-center justify-center flex-shrink-0`}>
                                                                <span className="text-white font-bold text-xl">
                                                                    {member.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-lg font-semibold text-black dark:text-white mb-1 group-hover:text-primary transition-colors">
                                                                {member.fullName}
                                                            </h3>
                                                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                                                {member.title}
                                                            </p>
                                                            {member.organization && member.organization !== 'İKÜANTS TEKMER' && (
                                                                <span className="inline-block mt-2 text-xs px-2.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-mono">
                                                                    {member.organization}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <board.icon className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-lg">Bu kurul bilgileri güncellenmektedir.</p>
                                    </div>
                                )}
                            </motion.div>
                        )
                    ))
                )}

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
                        <div>
                            <h4 className="text-black dark:text-white font-semibold mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-400" />
                                Danışma Kurulu
                            </h4>
                            <p>Stratejik yönlendirme ve sektörel danışmanlık sağlayan uzman kadromuz.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
