"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Building2, Monitor, Gamepad2, Video, Users,
    Laptop, Coffee, MessageSquare, Wifi, Clock, Loader2
} from "lucide-react";

export default function KullanimAlanlariPage() {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const iconMap: Record<string, any> = {
        Monitor,
        Gamepad2,
        Video,
        Laptop,
        Coffee,
        MessageSquare,
        Building2,
    };

    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                const res = await fetch('/api/public/facilities');
                const data = await res.json();
                if (data.success && Array.isArray(data.facilities)) {
                    setFacilities(data.facilities);
                }
            } catch (err) {
                console.error("Failed to load facilities:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFacilities();
    }, []);

    const studios = facilities.filter(f => f.facilityType === 'STUDIO');
    const workAreas = facilities.filter(f => f.facilityType === 'WORK_AREA');

    const features = [
        { icon: Wifi, text: "Yüksek Hızlı İnternet" },
        { icon: Clock, text: "7/24 Erişim" },
        { icon: Users, text: "Networking İmkanı" },
        { icon: Building2, text: "Modern Altyapı" }
    ];

    return (
        <div className="py-24 relative min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 max-w-6xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-mono">TESİSLERİMİZ</span>
                    </div>
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-black dark:text-white mb-4">
                        Kullanım Alanları
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        İKÜANTS TEKMER, girişimcilere ve profesyonellere birlikte üretim ve öğrenme süreçlerini
                        gerçekleştirebilecekleri modern bir çalışma ortamı sunmaktadır. Yeni iş birliklerinin
                        oluşturulması, fikir alışverişi yapılması ve ortak projelerin hayata geçirilmesi için
                        ideal bir ekosistem sağlıyoruz.
                    </p>
                </motion.div>

                {/* Features Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
                >
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-md dark:shadow-none">
                            <feature.icon className="w-5 h-5 text-secondary" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{feature.text}</span>
                        </div>
                    ))}
                </motion.div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-gray-500 font-mono text-sm">Tesisler yükleniyor...</p>
                    </div>
                ) : (
                    <>
                        {/* Studios Section */}
                        {studios.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mb-16"
                            >
                                <h2 className="font-orbitron text-2xl text-black dark:text-white mb-8 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-secondary" />
                                    Stüdyolar
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {studios.map((studio, index) => {
                                        const IconComp = (studio.iconName && iconMap[studio.iconName]) || Building2;
                                        let featuresList: string[] = [];
                                        try {
                                            if (studio.featuresJson) featuresList = JSON.parse(studio.featuresJson);
                                        } catch { }

                                        return (
                                            <motion.div
                                                key={studio.id || index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 * index }}
                                                className="group p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/40 transition-all shadow-md dark:shadow-none"
                                            >
                                                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                                                    <IconComp className="w-7 h-7 text-primary" />
                                                </div>
                                                <h3 className="font-semibold text-black dark:text-white text-lg mb-2">{studio.title}</h3>
                                                <p className="text-gray-700 dark:text-gray-400 text-sm mb-4 leading-relaxed">{studio.description}</p>
                                                {featuresList.length > 0 && (
                                                    <ul className="space-y-2">
                                                        {featuresList.map((feat: string, fi: number) => (
                                                            <li key={fi} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-500">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                                                {feat}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Work Areas Section */}
                        {workAreas.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mb-16"
                            >
                                <h2 className="font-orbitron text-2xl text-black dark:text-white mb-8 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-secondary" />
                                    Çalışma Alanları
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {workAreas.map((area, index) => {
                                        const IconComp = (area.iconName && iconMap[area.iconName]) || Laptop;
                                        return (
                                            <motion.div
                                                key={area.id || index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 * index }}
                                                className="group p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-secondary/40 transition-all shadow-md dark:shadow-none"
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4 group-hover:bg-secondary/30 transition-colors">
                                                    <IconComp className="w-6 h-6 text-secondary" />
                                                </div>
                                                <h3 className="font-semibold text-black dark:text-white text-lg mb-2">{area.title}</h3>
                                                <p className="text-gray-700 dark:text-gray-400 text-sm leading-relaxed">{area.description}</p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </>
                )}

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-gray-200 dark:border-white/10 shadow-lg"
                >
                    <h3 className="font-orbitron text-xl text-black dark:text-white mb-3">Alanlarımızı Kullanmak İster Misiniz?</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto">
                        Tüm alanlar rezervasyon yöntemiyle kullanıma sunulmaktadır. Başvuru yaparak TEKMER ekosisteminin bir parçası olabilirsiniz.
                    </p>
                    <a
                        href="/basvuru"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-all font-semibold"
                    >
                        Başvuru Yap
                    </a>
                </motion.div>
            </div>
        </div>
    );
}
