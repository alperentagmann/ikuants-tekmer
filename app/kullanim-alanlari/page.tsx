"use client";
import React from "react";
import { motion } from "framer-motion";
import {
    Building2, Monitor, Gamepad2, Video, Users,
    Laptop, Coffee, MessageSquare, Wifi, Clock
} from "lucide-react";

const studios = [
    {
        title: "Broadcasting Stüdyosu",
        description: "Profesyonel yayın ve podcast kayıtları için tam donanımlı stüdyo. Yüksek kaliteli ses ve görüntü ekipmanları ile içerik üreticilerine hizmet vermektedir.",
        icon: Monitor,
        features: ["Profesyonel kamera sistemi", "Ses yalıtımı", "Canlı yayın altyapısı"]
    },
    {
        title: "AR/VR Stüdyosu",
        description: "Artırılmış ve sanal gerçeklik projelerinin geliştirilmesi için özel donanımlı laboratuvar. VR headset'ler ve geliştirme araçları mevcuttur.",
        icon: Gamepad2,
        features: ["VR Headset'ler", "Motion capture", "3D modelleme istasyonları"]
    },
    {
        title: "Sanal Çekim Stüdyosu",
        description: "Green screen ve sanal set teknolojileri ile profesyonel video prodüksiyon imkanı sunan çekim stüdyosu.",
        icon: Video,
        features: ["Green screen", "Profesyonel aydınlatma", "Sanal set yazılımları"]
    }
];

const workAreas = [
    {
        title: "Ortak Genel Çalışma Alanları",
        description: "Girişimcilerin ve takımların birlikte çalışabileceği açık ofis alanları. Modern mobilyalar ve yüksek hızlı internet altyapısı.",
        icon: Laptop
    },
    {
        title: "Tematik Çalışma Alanları",
        description: "Belirli sektörlere ve projelere odaklanan özel çalışma alanları. Yaratıcı endüstrilere yönelik projeler için ideal ortam.",
        icon: Coffee
    },
    {
        title: "Toplantı Odası",
        description: "Profesyonel görüşmeler, yatırımcı sunumları ve takım toplantıları için donanımlı toplantı odaları.",
        icon: MessageSquare
    }
];

const features = [
    { icon: Wifi, text: "Yüksek Hızlı İnternet" },
    { icon: Clock, text: "7/24 Erişim" },
    { icon: Users, text: "Networking İmkanı" },
    { icon: Building2, text: "Modern Altyapı" }
];

export default function KullanimAlanlariPage() {
    return (
        <div className="py-24 relative min-h-screen">
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
                    <h1 className="font-orbitron font-bold text-4xl md:text-5xl text-white mb-4">
                        Kullanım Alanları
                    </h1>
                    <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed">
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
                        <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <feature.icon className="w-5 h-5 text-secondary" />
                            <span className="text-gray-300 text-sm">{feature.text}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Studios Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-16"
                >
                    <h2 className="font-orbitron text-2xl text-white mb-8 flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-secondary" />
                        Stüdyolar
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {studios.map((studio, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className="group p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-primary/40 transition-all"
                            >
                                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                                    <studio.icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="font-semibold text-white text-lg mb-2">{studio.title}</h3>
                                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{studio.description}</p>
                                <ul className="space-y-2">
                                    {studio.features.map((feature, fi) => (
                                        <li key={fi} className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Work Areas Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-16"
                >
                    <h2 className="font-orbitron text-2xl text-white mb-8 flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-secondary" />
                        Çalışma Alanları
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {workAreas.map((area, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-secondary/40 transition-all"
                            >
                                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4 group-hover:bg-secondary/30 transition-colors">
                                    <area.icon className="w-6 h-6 text-secondary" />
                                </div>
                                <h3 className="font-semibold text-white text-lg mb-2">{area.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{area.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-center p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/10"
                >
                    <h3 className="font-orbitron text-xl text-white mb-3">Alanlarımızı Kullanmak İster Misiniz?</h3>
                    <p className="text-gray-400 mb-6 max-w-xl mx-auto">
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
